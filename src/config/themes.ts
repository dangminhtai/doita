import type { CSSProperties } from "react";
import { DOODLE_ICONS } from "./ui-icons";
import { ACTIVITY_ART } from "./activity-art";

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
  icons: typeof DOODLE_ICONS;
  activityArt: Record<string, string>;
};
export const THEMES = {
  sunset: {
    id: "sunset",
    icons: DOODLE_ICONS,
    activityArt: ACTIVITY_ART,
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
      heroDesktop: "/themes/sunset/doodle-art/hero-desktop.webp?v=49c2fe2e60",
      heroMobile: "/themes/sunset/doodle-art/hero-mobile.webp?v=a155d4fa56",
      avatarA: "/themes/sunset/doodle-art/avatar-a.webp?v=a163d7b957",
      avatarB: "/themes/sunset/doodle-art/avatar-b.webp?v=cc0528a2db",
      envelope: "/themes/sunset/doodle-art/envelope.webp?v=280c53b7d4",
      mascots: "/themes/sunset/doodle-art/mascots.webp?v=99be457e41",
      heart: "/themes/sunset/doodle-art/heart.webp?v=5159e903a7",
      flowers: "/themes/sunset/doodle-art/flowers.webp?v=9a1ad581be",
      emptyNotes: "/themes/sunset/doodle-art/empty-notes.webp?v=5d0ff106e1",
      emptyMemories:
        "/themes/sunset/doodle-art/empty-memories.webp?v=a46b34bb76",
      emptyPrayer: "/themes/sunset/doodle-art/empty-prayer.webp?v=5c1013797c",
      emptyNotifications:
        "/themes/sunset/doodle-art/empty-notifications.webp?v=92401fd67e",
    },
  },
} satisfies Record<string, ThemeDefinition>;
// Add another definition with the same roles, then change this ID to select it.
export const DEFAULT_THEME: keyof typeof THEMES = "sunset";
export const THEME = THEMES[DEFAULT_THEME];
export function themeStyle(theme: ThemeDefinition): CSSProperties {
  return {
    "--icon-chevron-down": `url("${theme.icons.ChevronDown}")`,
    "--icon-chevron-up": `url("${theme.icons.ChevronUp}")`,
    ...Object.fromEntries(
      Object.entries(theme.colors).map(([key, value]) => [
        `--theme-${key}`,
        value,
      ]),
    ),
  } as CSSProperties;
}
