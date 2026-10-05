"use client";
import Image from "next/image";
import { THEME, type ThemeAsset } from "@/config/themes";
export function ThemeArt({
  asset,
  className = "",
  size = 160,
}: {
  asset: ThemeAsset;
  className?: string;
  size?: number;
}) {
  return (
    <Image
      unoptimized
      src={THEME.assets[asset]}
      width={size}
      height={size}
      alt=""
      className={`theme-art ${className}`}
    />
  );
}
export function DefaultAvatar({ index = 0 }: { index?: number }) {
  return (
    <ThemeArt
      asset={index % 2 ? "avatarB" : "avatarA"}
      className="member-avatar"
      size={48}
    />
  );
}
