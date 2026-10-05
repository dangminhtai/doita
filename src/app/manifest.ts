import { CONTENT as C } from "@/config/content.vi";
import { THEME } from "@/config/themes";
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
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
