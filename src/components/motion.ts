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
  const imageSources = useRef(new Set<string>());
  const previousScope = useRef(scope);
  useEffect(() => {
    const root = node.current;
    if (!root) return;
    if (previousScope.current !== scope) {
      seen.current.clear();
      imageSources.current.clear();
      previousScope.current = scope;
    }
    const animations = new Set<Animation>();
    const pending = new Map<Element, () => void>();
    let stopped = false;
    const drain = () => {
      if (stopped || !canAnimate()) return;
      for (const [element, start] of pending) {
        if (animations.size >= 3) break;
        pending.delete(element);
        const bounds = element.getBoundingClientRect();
        if (
          element.isConnected &&
          bounds.bottom > 0 &&
          bounds.top < innerHeight
        )
          start();
      }
    };
    const play = (
      element: Element,
      frames: Keyframe[],
      duration: number,
      started = () => {},
    ) => {
      if (stopped || !canAnimate() || !element.animate) return false;
      if (animations.size >= 3) {
        // Bound deferred arrivals too; never choreograph all thirty list rows.
        if (pending.size >= 3 && !pending.has(element)) return false;
        pending.set(element, () => play(element, frames, duration, started));
        return true;
      }
      started();
      const animation = element.animate(frames, {
        duration,
        easing: MOTION.ease,
      });
      animations.add(animation);
      const finish = () => {
        animations.delete(animation);
        drain();
      };
      animation.finished.then(finish, finish);
      return true;
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
    const intersection =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
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
                  () => seen.current.add(key),
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
      const url = new URL(image.currentSrc || image.src, location.origin);
      const source = url.origin + url.pathname;
      if (imageSources.current.has(source)) return;
      play(image, [{ opacity: 0.5 }, { opacity: 1 }], MOTION.normal, () =>
        imageSources.current.add(source),
      );
    };
    const register = (branch: Element) => {
      const observe = (element: Element) => {
        if (observed.has(element)) return;
        observed.add(element);
        intersection?.observe(element);
      };
      if (branch.matches("[data-motion-item],.river")) observe(branch);
      branch.querySelectorAll("[data-motion-item],.river").forEach(observe);
      if (branch instanceof HTMLImageElement) revealImage(branch);
      branch
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
      pending.clear();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) register(node);
        });
        record.removedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          pending.delete(node);
          observed.delete(node);
          intersection?.unobserve(node);
          node
            .querySelectorAll("[data-motion-item],.river,img")
            .forEach((element) => {
              pending.delete(element);
              observed.delete(element);
              intersection?.unobserve(element);
            });
        });
      }
    });
    mutations.observe(root, { childList: true, subtree: true });
    root.addEventListener("load", loaded, true);
    preferences.addEventListener("change", cancel);
    document.addEventListener("visibilitychange", cancel);
    register(root);
    return () => {
      stopped = true;
      pending.clear();
      intersection?.disconnect();
      mutations.disconnect();
      root.removeEventListener("load", loaded, true);
      preferences.removeEventListener("change", cancel);
      document.removeEventListener("visibilitychange", cancel);
      animations.forEach((animation) => animation.cancel());
    };
  }, [node, page, scope]);
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
