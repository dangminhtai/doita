import type { Metadata, Viewport } from "next";
import { CONTENT as C } from "@/config/content.vi";
import "@/styles/globals.css";
export const metadata: Metadata = {
  title: C.brand.name,
  description: C.brand.description,
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg", apple: "/icons/icon-192.png" },
  appleWebApp: {
    capable: true,
    title: C.brand.name,
    statusBarStyle: "default",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#153c46",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
