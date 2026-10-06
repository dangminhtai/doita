import {
  allowPublicRead,
  publicHeaders,
  publicIdValid,
  readPublicSnapshot,
} from "@/lib/public-space";
import { service } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  context: { params: Promise<{ publicId: string; memberRef: string }> },
) {
  const { publicId, memberRef } = await context.params;
  if (!publicIdValid(publicId) || !/^[0-9a-f-]{36}$/.test(memberRef))
    return new Response(null, { status: 404, headers: publicHeaders });
  try {
    if (!(await allowPublicRead(request.headers, "avatar")))
      return new Response(null, {
        status: 429,
        headers: { ...publicHeaders, "Retry-After": "60" },
      });
    const snapshot = await readPublicSnapshot(publicId);
    const member = snapshot?.members.find(
      (person) => person.memberRef === memberRef,
    );
    if (!member)
      return new Response(null, { status: 404, headers: publicHeaders });
    if (!member.avatarPath)
      return new Response(null, { status: 204, headers: publicHeaders });
    const { data, error } = await service()
      .storage.from("avatars")
      .download(member.avatarPath);
    if (error || !data) throw error;
    return new Response(data, {
      headers: { ...publicHeaders, "Content-Type": "image/webp" },
    });
  } catch {
    return new Response(null, { status: 503, headers: publicHeaders });
  }
}
