import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  publicIdValid,
  readPublicSnapshot,
  publicProjection,
  allowPublicRead,
} from "@/lib/public-space";
import { PublicFrame } from "@/features/public-space/frame";
import { PublicSpace } from "@/features/public-space/screen";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Trang giới thiệu",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  if (!publicIdValid(publicId)) notFound();
  let snapshot;
  try {
    if (!(await allowPublicRead(new Headers(await headers()), "metadata")))
      return (
        <PublicFrame>
          <PublicSpace
            key={publicId}
            publicId={publicId}
            initial={null}
            initialError="public_rate"
          />
        </PublicFrame>
      );
    snapshot = await readPublicSnapshot(publicId);
  } catch {
    return (
      <PublicFrame>
        <PublicSpace
          key={publicId}
          publicId={publicId}
          initial={null}
          initialError="public_load"
        />
      </PublicFrame>
    );
  }
  if (!snapshot) notFound();
  return (
    <PublicFrame>
      <PublicSpace
        key={publicId}
        publicId={publicId}
        initial={publicProjection(snapshot)}
      />
    </PublicFrame>
  );
}
