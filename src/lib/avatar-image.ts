export const AVATAR_SIZE = 256;
export const AVATAR_MAX_BYTES = 80 * 1024;

export async function compressAvatar(canvas: HTMLCanvasElement): Promise<Blob> {
  for (const quality of [0.88, 0.75, 0.6, 0.45]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (blob?.type === "image/webp" && blob.size <= AVATAR_MAX_BYTES)
      return blob;
  }
  throw new Error("invalid_avatar");
}
