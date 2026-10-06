"use client";

import { useCallback, useEffect, useRef } from "react";
import { useConfirmation } from "./confirmation";
import { CONTENT as C } from "@/config/content.vi";

export function useUnsavedChanges(
  active: boolean,
  changed: boolean,
  message: string,
  pathname: string,
) {
  const ask = useConfirmation();
  const current = useRef({ active, changed, message });
  useEffect(() => {
    current.current = { active, changed, message };
  }, [active, changed, message]);
  const confirmLeave = useCallback(() => {
    const state = current.current;
    return location.pathname === pathname && state.active && state.changed
      ? ask(state.message, { action: C.common.continue })
      : Promise.resolve(true);
  }, [ask, pathname]);
  useEffect(() => {
    if (!active || !changed) return;
    const guard = (event: Event) => {
      if (
        location.pathname !== pathname ||
        !current.current.active ||
        !current.current.changed
      )
        return;
      event.preventDefault();
      void confirmLeave().then((accepted) => {
        if (accepted && location.pathname === pathname)
          (event as CustomEvent<{ resume: () => void }>).detail.resume();
      });
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (
        location.pathname !== pathname ||
        !current.current.active ||
        !current.current.changed
      )
        return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("couple-before-navigate", guard);
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("couple-before-navigate", guard);
      window.removeEventListener("beforeunload", unload);
    };
  }, [active, changed, confirmLeave, pathname]);
  return confirmLeave;
}
