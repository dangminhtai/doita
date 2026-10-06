import {
  allowPublicRead,
  publicHeaders,
  publicIdValid,
  publicProjection,
  readPublicSnapshot,
} from "@/lib/public-space";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params;
  if (!publicIdValid(publicId))
    return Response.json(
      { error: "space_unavailable" },
      { status: 404, headers: publicHeaders },
    );
  try {
    if (!(await allowPublicRead(request.headers, "metadata")))
      return Response.json(
        { error: "public_rate" },
        { status: 429, headers: { ...publicHeaders, "Retry-After": "60" } },
      );
    const snapshot = await readPublicSnapshot(publicId);
    return snapshot
      ? Response.json(publicProjection(snapshot), { headers: publicHeaders })
      : Response.json(
          { error: "space_unavailable" },
          { status: 404, headers: publicHeaders },
        );
  } catch {
    return Response.json(
      { error: "public_load" },
      { status: 503, headers: publicHeaders },
    );
  }
}
