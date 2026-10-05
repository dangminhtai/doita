import { CONTENT as C } from "@/config/content.vi";
import { THEME } from "@/config/themes";
import { APP_ICONS } from "@/config/app-icons";
import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: C.brand.name,
    short_name: C.brand.short,
    description: C.brand.description,
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: THEME.colors.page,
    theme_color: THEME.colors.page,
    icons: [
      {
        src: APP_ICONS.small,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: APP_ICONS.large,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: APP_ICONS.maskable,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
