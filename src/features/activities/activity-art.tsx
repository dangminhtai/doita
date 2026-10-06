"use client";

import Image from "next/image";
import { useState } from "react";
import { THEME } from "@/config/themes";

export function ActivityArt({ id }: { id: string }) {
  const source = THEME.activityArt[id];
  const [failed, setFailed] = useState(false);
  // Keep the activity text and controls usable without a misleading illustration.
  if (!source || failed) return null;
  return (
    <Image
      unoptimized
      src={source}
      width={180}
      height={180}
      alt=""
      className="theme-art activity-art"
      onError={() => setFailed(true)}
    />
  );
}
