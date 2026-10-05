"use client";

import { useEffect, useRef } from "react";
import { MOTION } from "@/config/motion";
import { THEME } from "@/config/themes";
import { reducedMotion } from "./motion";

const excluded = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  "form",
  "fieldset",
  "dialog",
  "[role='button']",
  "[role='link']",
  "[role='dialog']",
  "[role='alertdialog']",
  "[role='combobox']",
  "[role='listbox']",
  "[contenteditable]:not([contenteditable='false'])",
  "[data-no-heart]",
  "[data-destructive]",
  ".danger-button",
  ".toast",
  ".topbar",
  ".bottom-nav",
  ".sidebar",
  ".notification-wrap",
].join(",");

export function ClickHearts({ scope }: { scope: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const layer = host.current;
    if (!layer) return;
    const particles = new Set<() => void>();
    let tap: { id: number; x: number; y: number; target: Element } | null =
      null;
    const allowed = (target: EventTarget | null): target is Element =>
      target instanceof Element && !target.closest(excluded);
    const clear = () => {
      tap = null;
      [...particles].forEach((remove) => remove());
    };
    const down = (event: PointerEvent) => {
      tap = null;
      if (
        !event.isPrimary ||
        event.button !== 0 ||
        !allowed(event.target) ||
        reducedMotion()
      )
        return;
      tap = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        target: event.target,
      };
    };
    const up = (event: PointerEvent) => {
      const start = tap;
      tap = null;
      if (
        !start ||
        start.id !== event.pointerId ||
        event.button !== 0 ||
        !event.isPrimary ||
        !allowed(event.target) ||
        start.target !== event.target ||
        Math.hypot(event.clientX - start.x, event.clientY - start.y) >
          MOTION.clickHeart.tapSlop ||
        reducedMotion() ||
        window.getSelection()?.isCollapsed === false ||
        document.visibilityState === "hidden" ||
        document.querySelector("dialog[open],.sidebar.open") ||
        particles.size >= MOTION.clickHeart.limit ||
        !layer.animate
      )
        return;
      const heart = document.createElement("img");
      heart.src = THEME.icons.Heart;
      heart.alt = "";
      heart.draggable = false;
      heart.className = "click-heart";
      heart.width = heart.height = MOTION.clickHeart.size;
      heart.style.left = `${event.clientX}px`;
      heart.style.top = `${event.clientY}px`;
      layer.append(heart);
      const drift = Math.random() * 16 - 8;
      const rise = 24 + Math.random() * 18;
      const rotation = Math.random() * 24 - 12;
      const animation = heart.animate(
        [
          { opacity: 0, transform: "translate(-50%, -50%) scale(0.7)" },
          {
            opacity: 0.85,
            offset: 0.2,
            transform: "translate(-50%, calc(-50% - 6px)) scale(1)",
          },
          {
            opacity: 0,
            transform: `translate(calc(-50% + ${drift}px), calc(-50% - ${rise}px)) rotate(${rotation}deg) scale(0.85)`,
          },
        ],
        { duration: MOTION.clickHeart.duration, easing: "ease-out" },
      );
      const remove = () => {
        if (!particles.delete(remove)) return;
        clearTimeout(timer);
        if (animation.playState !== "finished") animation.cancel();
        heart.remove();
      };
      const timer = setTimeout(
        remove,
        MOTION.clickHeart.duration + MOTION.fast,
      );
      particles.add(remove);
      animation.finished.then(remove, remove);
    };
    const cancelTap = () => {
      tap = null;
    };
    const move = (event: PointerEvent) => {
      if (
        tap &&
        event.pointerId === tap.id &&
        Math.hypot(event.clientX - tap.x, event.clientY - tap.y) >
          MOTION.clickHeart.tapSlop
      )
        cancelTap();
    };
    const preferences = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointercancel", cancelTap, { passive: true });
    document.addEventListener("scroll", cancelTap, {
      passive: true,
      capture: true,
    });
    document.addEventListener("visibilitychange", clear);
    preferences.addEventListener("change", clear);
    return () => {
      clear();
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointercancel", cancelTap);
      document.removeEventListener("scroll", cancelTap, true);
      document.removeEventListener("visibilitychange", clear);
      preferences.removeEventListener("change", clear);
    };
  }, [scope]);
  return <div ref={host} className="click-hearts" aria-hidden="true" inert />;
}
