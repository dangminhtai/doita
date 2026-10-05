import type { Metadata, Viewport } from "next";
import { CONTENT as C } from "@/config/content.vi";
import "@/styles/globals.css";
import "@/styles/redesign.css";
import { THEME, themeStyle } from "@/config/themes";
import { APP_ICONS } from "@/config/app-icons";
export const metadata: Metadata = {
  title: C.brand.name,
  description: C.brand.description,
  manifest: "/manifest.webmanifest",
  icons: { icon: APP_ICONS.favicon, apple: APP_ICONS.small },
  appleWebApp: {
    capable: true,
    title: C.brand.name,
    statusBarStyle: "default",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: THEME.colors.page,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" data-theme={THEME.id} style={themeStyle(THEME)}>
      <body>{children}</body>
    </html>
  );
}
