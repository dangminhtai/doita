import type { CSSProperties } from "react";

export type ThemeAsset =
  | "heroDesktop"
  | "heroMobile"
  | "avatarA"
  | "avatarB"
  | "envelope"
  | "mascots"
  | "heart"
  | "flowers"
  | "emptyNotes"
  | "emptyMemories"
  | "emptyPrayer"
  | "emptyNotifications";
export type ThemeDefinition = {
  id: string;
  colors: {
    page: string;
    paper: string;
    text: string;
    muted: string;
    primary: string;
    soft: string;
    border: string;
    note: string;
    river: string;
    success: string;
    error: string;
    focus: string;
  };
  assets: Record<ThemeAsset, string>;
};
export const THEMES = {
  sunset: {
    id: "sunset",
    colors: {
      page: "#fff7fa",
      paper: "#ffffff",
      text: "#302630",
      muted: "#74616b",
      primary: "#bc3156",
      soft: "#ffe8f0",
      border: "#ecd5df",
      note: "#fff0f5",
      river: "#fff0f5",
      success: "#276449",
      error: "#9e293b",
      focus: "#a72b50",
    },
    assets: {
      heroDesktop: "/themes/sunset/hero-desktop.webp",
      heroMobile: "/themes/sunset/hero-mobile.webp",
      avatarA: "/themes/sunset/avatar-a.webp",
      avatarB: "/themes/sunset/avatar-b.webp",
      envelope: "/themes/sunset/envelope.webp",
      mascots: "/themes/sunset/mascots.webp",
      heart: "/themes/sunset/heart.webp",
      flowers: "/themes/sunset/flowers.webp",
      emptyNotes: "/themes/sunset/empty-notes.webp",
      emptyMemories: "/themes/sunset/empty-memories.webp",
      emptyPrayer: "/themes/sunset/empty-prayer.webp",
      emptyNotifications: "/themes/sunset/empty-notifications.webp",
    },
  },
} satisfies Record<string, ThemeDefinition>;
// Add another definition with the same roles, then change this ID to select it.
export const DEFAULT_THEME: keyof typeof THEMES = "sunset";
export const THEME = THEMES[DEFAULT_THEME];
export function themeStyle(theme: ThemeDefinition): CSSProperties {
  return Object.fromEntries(
    Object.entries(theme.colors).map(([key, value]) => [
      `--theme-${key}`,
      value,
    ]),
  ) as CSSProperties;
}
