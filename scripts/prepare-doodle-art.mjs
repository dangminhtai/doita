import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";

// Keep the supplied PNGs intact; only write the web derivatives.
const source = new URL("../public/assets/doita/doodle-art/", import.meta.url);
const target = new URL("../public/themes/sunset/doodle-art/", import.meta.url);
await mkdir(target, { recursive: true });
const jobs = [
  ["hero-desktop", 1280, 720],
  ["hero-mobile", 640, 960],
  ["avatar-a", 192, 192],
  ["avatar-b", 192, 192],
  ["envelope", 480, 480],
  ["mascots", 480, 480],
  ["flowers", 480, 480],
  ["heart", 256, 256],
  ["empty-notes", 320, 320],
  ["empty-memories", 320, 320],
  ["empty-prayer", 320, 320],
  ["empty-notifications", 320, 320],
];
const versions = new Map();
for (const [name, width, height] of jobs) {
  const image = sharp(await readFile(new URL(`${name}.png`, source)));
  const data = await image
    .resize(width, height, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85, alphaQuality: 100 })
    .toBuffer();
  await writeFile(new URL(`${name}.webp`, target), data);
  versions.set(name, createHash("sha256").update(data).digest("hex").slice(0, 10));
  console.log(`${name}: ${data.length} bytes`);
}
const config = new URL("../src/config/themes.ts", import.meta.url);
const text = await readFile(config, "utf8");
await writeFile(
  config,
  text.replace(
    /\/themes\/sunset\/doodle-art\/([a-z-]+)\.webp(?:\?v=[a-f0-9]+)?/g,
    (url, name) => versions.has(name)
      ? `/themes/sunset/doodle-art/${name}.webp?v=${versions.get(name)}`
      : url,
  ),
);
