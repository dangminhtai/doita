import sharp from "sharp";
import { createHash } from "node:crypto";
import { z } from "zod";
import { service, userClient } from "@/lib/supabase/server";
import { AVATAR_MAX_BYTES, AVATAR_SIZE } from "@/lib/avatar-image";

const input = z.object({
  requestId: z.uuid(),
  name: z.string().trim().min(1).max(60),
  bio: z
    .string()
    .refine((value) => Array.from(value).length <= 300)
    .optional(),
  gender: z.enum(["male", "female", "other", "undisclosed"]).nullable(),
  resurface: z.boolean(),
  avatarMode: z.enum(["keep", "default", "new"]),
});
export async function POST(request: Request) {
  try {
    const ctx = await userClient(request);
    if (!ctx)
      return Response.json({ error: "session_expired" }, { status: 401 });
    // Bound the multipart body too; clients only send the compressed image.
    const reader = request.body?.getReader();
    if (!reader) throw new Error("invalid");
    let length = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 128 * 1024) {
        await reader.cancel();
        throw new Error("invalid_avatar");
      }
      chunks.push(value);
    }
    const body = await new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: Buffer.concat(chunks),
    }).formData();
    const values = input.parse(JSON.parse(String(body.get("profile"))));
    const db = service();
    let path: string | null = null;
    if (values.avatarMode === "new") {
      const file = body.get("avatar");
      if (!(file instanceof File) || file.size > AVATAR_MAX_BYTES)
        throw new Error("invalid_avatar");
      const bytes = Buffer.from(await file.arrayBuffer());
      let encoded: Buffer;
      try {
        const metadata = await sharp(bytes, {
          limitInputPixels: AVATAR_SIZE ** 2,
        }).metadata();
        if (
          metadata.format !== "webp" ||
          metadata.width !== AVATAR_SIZE ||
          metadata.height !== AVATAR_SIZE ||
          (metadata.pages ?? 1) !== 1
        )
          throw new Error("invalid_avatar");
        // Re-encode to strip metadata and validate the complete image, not just its header.
        encoded = await sharp(bytes, { limitInputPixels: AVATAR_SIZE ** 2 })
          .webp({ quality: 90 })
          .toBuffer();
      } catch {
        throw new Error("invalid_avatar");
      }
      if (encoded.length > AVATAR_MAX_BYTES) throw new Error("invalid_avatar");
      path = `${ctx.user.id}/${values.requestId}.webp`;
      const digest = createHash("sha256").update(bytes).digest("hex");
      const registered = await db
        .from("avatar_assets")
        .insert({ path, user_id: ctx.user.id, digest });
      let needsUpload = true;
      if (registered.error) {
        if (registered.error.code !== "23505") throw registered.error;
        const existing = await db
          .from("avatar_assets")
          .select("digest,state")
          .eq("path", path)
          .single();
        if (existing.error) throw existing.error;
        if (
          existing.data.digest !== digest ||
          existing.data.state === "deleting"
        )
          throw new Error("request_conflict");
        needsUpload = existing.data.state === "pending";
        if (needsUpload) {
          // Renew an abandoned upload before retrying it. Cleanup can claim
          // the row first; its state predicate then prevents this retry.
          const renewed = await db
            .from("avatar_assets")
            .update({
              cleanup_after: new Date(Date.now() + 86400000).toISOString(),
            })
            .eq("path", path)
            .eq("state", "pending")
            .select("path")
            .maybeSingle();
          if (renewed.error) throw renewed.error;
          if (!renewed.data) throw new Error("request_conflict");
        }
      }
      if (needsUpload) {
        const upload = await db.storage
          .from("avatars")
          .upload(path, encoded, { contentType: "image/webp", upsert: false });
        if (
          upload.error &&
          !/already exists|duplicate/i.test(upload.error.message)
        )
          throw upload.error;
      }
    }
    const result = await ctx.client.rpc(
      values.bio === undefined ? "update_profile" : "update_profile_with_bio",
      {
        p_request_id: values.requestId,
        p_name: values.name,
        p_gender: values.gender,
        p_resurfacing: values.resurface,
        p_avatar_mode: values.avatarMode,
        p_avatar_path: path,
        ...(values.bio === undefined ? {} : { p_bio: values.bio }),
      },
    );
    if (result.error) {
      // Account deletion may finish while its last upload is in flight.
      if (path && result.error.message === "unauthorized")
        await db.storage.from("avatars").remove([path]);
      throw result.error;
    }
    const current = await ctx.client
      .from("profiles")
      .select("display_name,gender,bio,avatar_path,resurfacing,updated_at")
      .eq("id", ctx.user.id)
      .single();
    if (current.error) throw current.error;
    return Response.json(
      { ok: true, profile: current.data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : (error as { message?: string })?.message;
    const known = [
      "gender_locked",
      "invalid_avatar",
      "invalid",
      "request_conflict",
    ];
    const code = known.includes(message ?? "")
      ? message
      : error instanceof z.ZodError
        ? "invalid"
        : "profile_unavailable";
    return Response.json(
      { error: code },
      {
        status:
          code === "gender_locked" || code === "request_conflict"
            ? 409
            : code === "profile_unavailable"
              ? 503
              : 400,
      },
    );
  }
}
