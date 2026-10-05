import type { CSSProperties } from "react";

export const MOTION = {
  instant: 120,
  fast: 160,
  normal: 240,
  slow: 440,
  cinematic: 4200,
  feedback: 560,
  ambient: 8000,
  distanceSmall: 8,
  distanceMemory: 20,
  clickHeart: { duration: 650, size: 24, limit: 6, tapSlop: 8 },
  ease: "cubic-bezier(0.16, 1, 0.3, 1)",
  milestones: [7, 30, 100, 365, 500, 1000],
} as const;

export const motionStyle = {
  "--motion-instant": `${MOTION.instant}ms`,
  "--motion-fast": `${MOTION.fast}ms`,
  "--motion-normal": `${MOTION.normal}ms`,
  "--motion-slow": `${MOTION.slow}ms`,
  "--motion-cinematic": `${MOTION.cinematic}ms`,
  "--motion-feedback": `${MOTION.feedback}ms`,
  "--motion-ambient": `${MOTION.ambient}ms`,
  "--motion-ease": MOTION.ease,
  "--motion-distance-small": `${MOTION.distanceSmall}px`,
  "--motion-distance-memory": `${MOTION.distanceMemory}px`,
  "--motion-press-scale": "0.98",
} as CSSProperties;
