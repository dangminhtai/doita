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
      page: "#fff8f1",
      paper: "#fffcf8",
      text: "#432f34",
      muted: "#715b62",
      primary: "#a23f57",
      soft: "#fbe6ec",
      border: "#dfcbd0",
      note: "#f3e6bc",
      river: "#183f4a",
      success: "#276449",
      error: "#9e293b",
      focus: "#6a3d83",
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
