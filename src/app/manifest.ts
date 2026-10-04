import { CONTENT as C } from "@/config/content.vi";
import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: C.brand.name,
    short_name: C.brand.short,
    description: C.brand.description,
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#f6f8f7",
    theme_color: "#153c46",
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
