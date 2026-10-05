import { THEME } from "../src/config/themes";
import { statSync } from "node:fs";
import assert from "node:assert/strict";

function luminance(hex: string) {
  const rgb = hex
    .replace("#", "")
    .match(/../g)!
    .map((part) => parseInt(part, 16) / 255);
  const linear = rgb.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
const colors = THEME.colors;
const pairs: [string, string, string][] = [
  ["body/paper", colors.text, colors.paper],
  ["body/page", colors.text, colors.page],
  ["body/note", colors.text, colors.note],
  ["auth/soft", colors.text, colors.soft],
  ["muted/paper", colors.muted, colors.paper],
  ["muted/note", colors.muted, colors.note],
  ["primary/soft", colors.primary, colors.soft],
  ["button", "#ffffff", colors.primary],
  ["river", colors.paper, colors.river],
  ["success", colors.success, "#e9f2ec"],
  ["error", colors.error, "#fff0f0"],
];
const contrast = pairs.map(([name, fg, bg]) => {
  const a = luminance(fg),
    b = luminance(bg);
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  assert.ok(ratio >= 4.5, `${name}: ${ratio.toFixed(2)} below 4.5`);
  return { name, ratio: Number(ratio.toFixed(2)) };
});
const assets = Object.entries(THEME.assets).map(([role, path]) => ({
  role,
  bytes: statSync(`public${path}`).size,
}));
console.log(
  JSON.stringify(
    {
      theme: THEME.id,
      contrast,
      assets,
      totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
    },
    null,
    2,
  ),
);
