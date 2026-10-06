import { THEME } from "@/config/themes";

export function defaultAvatarUrl(
  gender?: string | null,
  index = 0,
  partnerGender?: string | null,
) {
  if (gender === "male") return THEME.assets.avatarA;
  if (gender === "female") return THEME.assets.avatarB;
  // Infer artwork only for an unset gender; never change profile data.
  if (!gender) {
    if (partnerGender === "male") return THEME.assets.avatarB;
    if (partnerGender === "female") return THEME.assets.avatarA;
  }
  return index % 2 ? THEME.assets.avatarB : THEME.assets.avatarA;
}
