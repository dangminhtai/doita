import Image, { type ImageProps } from "next/image";
import { THEME } from "@/config/themes";
import type { IconName } from "@/config/ui-icons";

type IconProps = Omit<ImageProps, "src" | "alt" | "width" | "height"> & { size?: number };
function createIcon(name: IconName) {
  function DoodleIcon({ size = 24, className = "", ...props }: IconProps) {
    return (
      <Image
        {...props}
        unoptimized
        src={THEME.icons[name]}
        width={size}
        height={size}
        alt=""
        aria-hidden={props["aria-hidden"] ?? true}
        className={`doita-icon ${className}`}
        draggable={false}
      />
    );
  }
  DoodleIcon.displayName = name;
  return DoodleIcon;
}

export const House = createIcon("House");
export const NotebookPen = createIcon("NotebookPen");
export const Ship = createIcon("Ship");
export const Camera = createIcon("Camera");
export const Sparkles = createIcon("Sparkles");
export const Users = createIcon("Users");
export const Plus = createIcon("Plus");
export const Pin = createIcon("Pin");
export const Feather = createIcon("Feather");
export const Bell = createIcon("Bell");
export const Volume2 = createIcon("Volume2");
export const VolumeX = createIcon("VolumeX");
export const Menu = createIcon("Menu");
export const X = createIcon("X");
export const Check = createIcon("Check");
export const ChevronDown = createIcon("ChevronDown");
export const ChevronUp = createIcon("ChevronUp");
export const LogOut = createIcon("LogOut");
export const CircleCheck = createIcon("CircleCheck");
export const CircleAlert = createIcon("CircleAlert");
export const ShieldCheck = createIcon("ShieldCheck");
export const Trash2 = createIcon("Trash2");
export const Eye = createIcon("Eye");
export const EyeOff = createIcon("EyeOff");
export const Heart = createIcon("Heart");
export const Calendar = createIcon("Calendar");
export const Flame = createIcon("Flame");
export const Sun = createIcon("Sun");
export const Moon = createIcon("Moon");
export const CloudRain = createIcon("CloudRain");
export const Wind = createIcon("Wind");
export const Leaf = createIcon("Leaf");
export const Hourglass = createIcon("Hourglass");
export const ThumbsUp = createIcon("ThumbsUp");
export const ThumbsDown = createIcon("ThumbsDown");
