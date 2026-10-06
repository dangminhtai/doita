"use client";

import { useEffect, useRef, useState } from "react";
import { MOTION } from "@/config/motion";
import { CONTENT as C } from "@/config/content.vi";

const rhythm =
  "M8 32H24Q28 32 31 24L36 16L43 46L50 26L55 32H105L110 26L117 46L124 16L129 24Q132 32 136 32H152";

// The same SVG path drives the line and the moving heart at every viewport size.
export function SpaceConnection() {
  const svg = useRef<SVGSVGElement>(null);
  const [hidden, setHidden] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setHidden(document.visibilityState === "hidden");
      setReduced(preference.matches);
    };
    update();
    document.addEventListener("visibilitychange", update);
    preference.addEventListener("change", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      preference.removeEventListener("change", update);
    };
  }, []);
  useEffect(() => {
    if (hidden || paused || reduced) svg.current?.pauseAnimations();
    else svg.current?.unpauseAnimations();
  }, [hidden, paused, reduced]);
  return (
    <button
      type="button"
      className="public-space-connection"
      aria-label={C.publicSpace.pauseConnection}
      aria-pressed={paused}
      disabled={reduced}
      onClick={() => setPaused((value) => !value)}
      data-paused={hidden || paused || reduced}
      data-reduced={reduced}
    >
      <svg
        ref={svg}
        viewBox="0 0 160 64"
        fill="none"
        focusable="false"
        aria-hidden="true"
      >
        <path className="connection-track" d={rhythm} />
        <path className="connection-wave" pathLength="100" d={rhythm} />
        <g transform={reduced ? "translate(80 32)" : undefined}>
          {!reduced && (
            <animateMotion
              path={rhythm}
              dur={`${MOTION.cinematic}ms`}
              repeatCount="indefinite"
              rotate="0"
              calcMode="paced"
            />
          )}
          <path
            className="connection-heart"
            d="M0 8C-3 5-11 0-11-6C-11-12-4-14 0-8C4-14 11-12 11-6C11 0 3 5 0 8Z"
          />
        </g>
      </svg>
    </button>
  );
}
