"use client";
import { useEffect, useState } from "react";
import { useApp } from "./app-context";

export function useViewState(key: string, initial: string) {
  const { user, data } = useApp();
  const storageKey = `couple-view:${user?.id}:${data.couple?.id}:${key}`;
  const [value, setValue] = useState(initial);
  useEffect(() => {
    try {
      setValue(sessionStorage.getItem(storageKey) ?? initial);
    } catch {
      setValue(initial);
    }
  }, [storageKey, initial]);
  const update = (next: string) => {
    setValue(next);
    try {
      sessionStorage.setItem(storageKey, next);
    } catch {}
  };
  return [value, update] as const;
}
