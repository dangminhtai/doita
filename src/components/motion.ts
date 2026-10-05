"use client";

import { useEffect, useRef, type RefObject } from "react";
import { MOTION } from "@/config/motion";

export function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function canAnimate() {
  return !reducedMotion() && document.visibilityState !== "hidden";
}

// Effects never hide the default DOM or participate in request/pending state.
export function usePageMotion(
  node: RefObject<HTMLDivElement | null>,
  page: string,
  scope: string,
) {
  const seen = useRef(new Set<string>());
  const previousScope = useRef(scope);
  useEffect(() => {
    const root = node.current;
    if (!root) return;
    if (previousScope.current !== scope) {
      seen.current.clear();
      previousScope.current = scope;
    }
    const animations = new Set<Animation>();
    const play = (element: Element, frames: Keyframe[], duration: number) => {
      if (!canAnimate() || !element.animate || animations.size >= 3) return;
      const animation = element.animate(frames, {
        duration,
        easing: MOTION.ease,
      });
      animations.add(animation);
      animation.finished.then(
        () => animations.delete(animation),
        () => animations.delete(animation),
      );
    };
    play(
      root,
      [
        { opacity: 0.6, transform: `translateY(${MOTION.distanceSmall}px)` },
        { opacity: 1, transform: "none" },
      ],
      MOTION.normal,
    );
    const observed = new WeakSet<Element>();
    const imageSources = new WeakMap<HTMLImageElement, string>();
    const intersection =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              let arrivals = 0;
              for (const entry of entries) {
                const element = entry.target as HTMLElement;
                if (!element.isConnected) {
                  intersection?.unobserve(element);
                  continue;
                }
                if (element.classList.contains("river")) {
                  element.dataset.motionVisible = String(entry.isIntersecting);
                  continue;
                }
                if (!entry.isIntersecting) continue;
                intersection?.unobserve(element);
                const key = `${page}:${element.dataset.motionItem}`;
                if (seen.current.has(key)) continue;
                seen.current.add(key);
                // Keep simultaneous arrivals bounded; never stagger a refreshed page.
                if (arrivals++ >= 3) continue;
                const memory = element.classList.contains("memory-card");
                play(
                  element,
                  [
                    {
                      opacity: 0.5,
                      transform: `translateY(${memory ? MOTION.distanceMemory : MOTION.distanceSmall}px)`,
                    },
                    { opacity: 1, transform: "none" },
                  ],
                  memory ? MOTION.slow : MOTION.normal,
                );
              }
            },
            { threshold: 0.08 },
          );
    const revealImage = (image: HTMLImageElement) => {
      if (
        !image.matches(".memory-photo,.upload-preview,.member-avatar") ||
        !image.complete ||
        !image.naturalWidth
      )
        return;
      const source = new URL(image.currentSrc || image.src, location.origin)
        .pathname;
      if (imageSources.get(image) === source) return;
      imageSources.set(image, source);
      play(image, [{ opacity: 0.5 }, { opacity: 1 }], MOTION.normal);
    };
    const scan = () => {
      root.querySelectorAll("[data-motion-item],.river").forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);
        intersection?.observe(element);
      });
      root
        .querySelectorAll<HTMLImageElement>(
          "img.memory-photo,img.upload-preview,img.member-avatar",
        )
        .forEach(revealImage);
    };
    const loaded = (event: Event) => {
      if (event.target instanceof HTMLImageElement) revealImage(event.target);
    };
    const preferences = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancel = () => {
      if (canAnimate()) return;
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const mutations = new MutationObserver(scan);
    mutations.observe(root, { childList: true, subtree: true });
    root.addEventListener("load", loaded, true);
    preferences.addEventListener("change", cancel);
    document.addEventListener("visibilitychange", cancel);
    scan();
    return () => {
      intersection?.disconnect();
      mutations.disconnect();
      root.removeEventListener("load", loaded, true);
      preferences.removeEventListener("change", cancel);
      document.removeEventListener("visibilitychange", cancel);
      animations.forEach((animation) => animation.cancel());
    };
  }, [node, page, scope]);
}

// Only a brief, inert visual remains after unmount. Focus and mutations proceed
// immediately; no outgoing dialog or toast stays interactive or gets announced.
export function exitSnapshot(node: HTMLElement, backdrop = false) {
  if (!canAnimate() || !node.isConnected || !node.animate) return;
  const bounds = node.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const overlay = document.createElement("div");
  overlay.className = "motion-exit-layer";
  overlay.setAttribute("aria-hidden", "true");
  overlay.inert = true;
  const copy = document.createElement("div");
  copy.className = `${node.className} motion-exit-copy`;
  node.childNodes.forEach((child) => copy.append(child.cloneNode(true)));
  copy
    .querySelectorAll("[id]")
    .forEach((element) => element.removeAttribute("id"));
  Object.assign(copy.style, {
    position: "fixed",
    top: `${bounds.top}px`,
    left: `${bounds.left}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    margin: "0",
    maxWidth: "none",
    animation: "none",
  });
  if (backdrop) overlay.classList.add("motion-exit-backdrop");
  overlay.append(copy);
  document.body.append(overlay);
  const animation = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: MOTION.instant,
    easing: MOTION.ease,
  });
  const remove = () => overlay.remove();
  animation.finished.then(remove, remove);
  // Background tabs may not dispatch finish promptly.
  setTimeout(remove, MOTION.fast);
}

export function useStreakMotion(
  node: RefObject<HTMLDivElement | null>,
  count: number,
  scope: string,
) {
  const previous = useRef({ count, scope });
  useEffect(() => {
    const old = previous.current;
    previous.current = { count, scope };
    if (
      old.scope !== scope ||
      old.count < 0 ||
      count <= old.count ||
      !canAnimate()
    )
      return;
    const root = node.current;
    const icon = root?.querySelector(".doita-icon");
    const label = root?.querySelector("span");
    const pulse = icon?.animate?.(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.1)", offset: 0.45 },
        { transform: "scale(1)" },
      ],
      { duration: MOTION.feedback, easing: MOTION.ease },
    );
    const fade = label?.animate?.([{ opacity: 0.4 }, { opacity: 1 }], {
      duration: MOTION.slow,
      easing: MOTION.ease,
    });
    if (root && (MOTION.milestones as readonly number[]).includes(count))
      root.setAttribute("data-milestone", "true");
    const timer = setTimeout(
      () => root?.removeAttribute("data-milestone"),
      MOTION.feedback,
    );
    const preferences = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => {
      if (canAnimate()) return;
      pulse?.cancel();
      fade?.cancel();
      root?.removeAttribute("data-milestone");
    };
    preferences.addEventListener("change", stop);
    document.addEventListener("visibilitychange", stop);
    return () => {
      clearTimeout(timer);
      root?.removeAttribute("data-milestone");
      pulse?.cancel();
      fade?.cancel();
      preferences.removeEventListener("change", stop);
      document.removeEventListener("visibilitychange", stop);
    };
  }, [node, count, scope]);
}
