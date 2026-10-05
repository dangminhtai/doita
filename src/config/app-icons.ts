// Increment when replacing the app artwork so favicon/PWA caches see a new URL.
const version = "rose-heart-2";
export const APP_ICONS = {
  favicon: `/favicon.svg?v=${version}`,
  small: `/icons/icon-192.png?v=${version}`,
  large: `/icons/icon-512.png?v=${version}`,
  maskable: `/icons/icon-maskable.png?v=${version}`,
};
