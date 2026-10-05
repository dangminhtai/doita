// Exercise the real route and Sharp decoder with mocked Supabase HTTP only.
import assert from "node:assert/strict";
import sharp from "sharp";
import { POST } from "../src/app/api/profile/route";
import { cleanupAvatars } from "../src/lib/assets/avatar-cleanup";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://profile-fixture.invalid";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fixture-anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fixture-service";
const uid = "00000000-0000-0000-0000-000000000001";
const rid = "90000000-0000-4000-8000-000000000001";
const current = {
  display_name: "Tài",
  gender: "male",
  avatar_path: `${uid}/${rid}.webp`,
  resurfacing: true,
};
let digest = "",
  duplicate = false,
  rpcError = "",
  uploadBytes: Uint8Array | null = null;
let registered = 0,
  uploads = 0,
  updates = 0;
let assetState = "current",
  renewals = 0;
let cleaning = false;
let queued = Array.from({ length: 61 }, (_, n) => ({
  path: `${uid}/${n}.webp`,
  user_id: uid,
}));
const removedPaths = new Set<string>();
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  const path = new URL(request.url).pathname;
  if (path === "/auth/v1/user") return Response.json({ id: uid });
  if (path === "/rest/v1/avatar_assets") {
    if (cleaning) {
      if (request.method === "DELETE") {
        assert.equal(
          new URL(request.url).searchParams.get("state"),
          "eq.deleting",
        );
        const target = new URL(request.url).searchParams.get("path")!.slice(3);
        queued = queued.filter((row) => row.path !== target);
        return new Response(null, { status: 204 });
      }
      return Response.json(queued.slice(0, 50));
    }
    if (request.method === "PATCH") {
      renewals++;
      return Response.json({ path: current.avatar_path });
    }
    if (request.method === "POST") {
      registered++;
      if (duplicate)
        return Response.json(
          { code: "23505", message: "duplicate" },
          { status: 409 },
        );
      digest = (await request.json()).digest;
      return new Response(null, { status: 201 });
    }
    return Response.json({ digest, state: assetState });
  }
  if (cleaning && path === "/rest/v1/rpc/claim_avatar_cleanup") {
    const { p_path } = await request.json();
    return Response.json(p_path !== `${uid}/0.webp`);
  }
  if (cleaning && path === "/storage/v1/object/avatars") {
    for (const value of (await request.json()).prefixes)
      removedPaths.add(value);
    return Response.json([]);
  }
  if (path.startsWith("/storage/v1/object/avatars/")) {
    uploads++;
    uploadBytes = new Uint8Array(await request.arrayBuffer());
    return duplicate
      ? Response.json(
          { message: "The resource already exists" },
          { status: 400 },
        )
      : Response.json({ Key: current.avatar_path });
  }
  if (path === "/rest/v1/rpc/update_profile") {
    updates++;
    return rpcError
      ? Response.json({ message: rpcError }, { status: 400 })
      : Response.json(current);
  }
  if (path === "/rest/v1/profiles") return Response.json(current);
  throw new Error(`Unexpected fixture request: ${path}`);
};
function request(
  bytes?: Uint8Array,
  fields: Record<string, unknown> = {},
  authorized = true,
) {
  const body = new FormData();
  body.set(
    "profile",
    JSON.stringify({
      requestId: rid,
      name: "Tài",
      gender: "male",
      resurface: true,
      avatarMode: bytes ? "new" : "keep",
      ...fields,
    }),
  );
  if (bytes) body.set("avatar", new Blob([bytes as BlobPart]), "avatar.webp");
  return new Request("http://localhost/api/profile", {
    method: "POST",
    body,
    headers: authorized ? { Authorization: "Bearer fixture" } : {},
  });
}
try {
  assert.equal((await POST(request(undefined, {}, false))).status, 401);
  assert.equal((await POST(request(undefined, { name: " " }))).status, 400);
  const image = await sharp({
    create: { width: 256, height: 256, channels: 3, background: "#bc3156" },
  })
    .webp()
    .toBuffer();
  const wrongSize = await sharp(image).resize(255, 256).toBuffer();
  for (const bytes of [
    wrongSize,
    Buffer.from("not an image"),
    Buffer.alloc(150000),
  ]) {
    const response = await POST(request(bytes));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "invalid_avatar");
  }
  assert.equal(registered, 0);
  assert.equal(uploads, 0);
  assert.equal(updates, 0);
  const accepted = await POST(request(image));
  assert.equal(accepted.status, 200);
  assert.equal(accepted.headers.get("cache-control"), "no-store");
  assert.deepEqual((await accepted.json()).profile, current);
  const meta = await sharp(uploadBytes!).metadata();
  assert.equal(meta.width, 256);
  assert.equal(meta.height, 256);
  assert.equal(meta.format, "webp");
  assert.ok(uploadBytes!.length <= 81920);
  duplicate = true;
  assert.equal((await POST(request(image))).status, 200);
  assert.equal(
    uploads,
    1,
    "committed retries must not recreate retired image files",
  );
  assetState = "pending";
  assert.equal((await POST(request(image))).status, 200);
  assert.equal(renewals, 1);
  assert.equal(uploads, 2);
  assetState = "deleting";
  assert.equal((await POST(request(image))).status, 409);
  assert.equal(uploads, 2);
  assetState = "current";
  assert.equal(
    (await POST(request(await sharp(image).negate().webp().toBuffer()))).status,
    409,
  );
  rpcError = "gender_locked";
  const locked = await POST(request());
  assert.equal(locked.status, 409);
  assert.equal((await locked.json()).error, "gender_locked");
  console.log(
    "PASS profile API auth, validation, bounded multipart, real WebP dimensions, retry digest and gender errors",
  );
  cleaning = true;
  assert.equal(await cleanupAvatars(uid), 60);
  assert.equal(removedPaths.size, 60);
  assert.equal(removedPaths.has(`${uid}/0.webp`), false);
  assert.deepEqual(
    queued.map((row) => row.path),
    [`${uid}/0.webp`],
  );
  console.log(
    "PASS avatar cleanup drains multiple batches, preserves current file and acknowledges claimed state only",
  );
} finally {
  globalThis.fetch = originalFetch;
}
