import { PublicFrame } from "@/features/public-space/frame";
import { SpaceUnavailable } from "@/features/public-space/unavailable";
export default function NotFound() {
  return (
    <PublicFrame>
      <SpaceUnavailable />
    </PublicFrame>
  );
}
