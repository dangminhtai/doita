"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useApp } from "./app-context";
import { db } from "@/lib/supabase/browser";
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
export function ProfileAvatar({
  userId,
  index = 0,
  size = 48,
  defaultOnly = false,
}: {
  userId?: string;
  index?: number;
  size?: number;
  defaultOnly?: boolean;
}) {
  const { data, user } = useApp();
  const profile = data.profiles.find((p) => p.id === userId);
  const memberIndex = data.members.findIndex((m) => m.user_id === userId);
  const fallbackIndex = memberIndex >= 0 ? memberIndex : index;
  const path = defaultOnly
    ? undefined
    : (profile?.avatar_path as string | undefined);
  const scope = `${user?.id}:${data.couple?.id}:${userId}:${path}`;
  const [image, setImage] = useState<{ scope: string; url: string } | null>(
    null,
  );
  useEffect(() => {
    if (!path) return;
    let active = true;
    const refresh = async () => {
      const result = await db()
        .storage.from("avatars")
        .createSignedUrl(path, 300);
      if (active)
        setImage(result.error ? null : { scope, url: result.data.signedUrl });
    };
    void refresh().catch(() => {
      if (active) setImage(null);
    });
    const timer = setInterval(
      () =>
        void refresh().catch(() => {
          if (active) setImage(null);
        }),
      240000,
    );
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [path, scope]);
  return (
    <Image
      unoptimized
      src={
        image?.scope === scope
          ? image.url
          : THEME.assets[fallbackIndex % 2 ? "avatarB" : "avatarA"]
      }
      width={size}
      height={size}
      alt=""
      className="member-avatar"
      style={{ width: size, height: size }}
      onError={() => setImage(null)}
    />
  );
}
