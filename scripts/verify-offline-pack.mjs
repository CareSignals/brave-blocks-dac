import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { currentEdition } from "./edition-policy.mjs";

const root = process.cwd();
const output = join(root, "out");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/brave-blocks-dac";
const origin = "https://offline.brave-blocks.test";
const edition = currentEdition();

async function exists(path) {
  await access(path);
  return path;
}

function localAssetUrl(value, base = `${origin}${basePath}/`) {
  const url = new URL(value, base);
  if (url.origin !== origin || !url.pathname.startsWith(`${basePath}/`)) return null;
  url.hash = "";
  return url;
}

function outputPath(url) {
  const relative = decodeURIComponent(url.pathname.slice(basePath.length + 1));
  return join(output, relative || "index.html");
}

function markupAssetUrls(markup) {
  return [...markup.matchAll(/(?:src|href)=["']([^"'#]+)["']/gi)]
    .map((match) => localAssetUrl(match[1]))
    .filter(Boolean);
}

function stylesheetAssetUrls(stylesheet, base) {
  return [...stylesheet.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)]
    .map((match) => match[1])
    .filter((value) => !value.startsWith("data:"))
    .map((value) => localAssetUrl(value, base))
    .filter(Boolean);
}

const coreFiles = [
  "index.html",
  "manifest.webmanifest",
  "favicon.svg",
  "icon-192.png",
  "icon-512.png",
  "og.png",
  "sw.js",
];
await Promise.all(coreFiles.map((file) => exists(join(output, file))));

const markup = await readFile(join(output, "index.html"), "utf8");
assert.doesNotMatch(
  markup,
  /Ready for offline play/,
  "Offline readiness must stay out of the child-facing initial screen.",
);
const shellUrls = [...new Map(markupAssetUrls(markup).map((url) => [url.href, url])).values()];
await Promise.all(shellUrls.map((url) => exists(outputPath(url))));

const stylesheetUrls = shellUrls.filter((url) => url.pathname.endsWith(".css"));
const nestedUrls = [];
for (const url of stylesheetUrls) {
  const stylesheet = await readFile(outputPath(url), "utf8");
  nestedUrls.push(...stylesheetAssetUrls(stylesheet, url));
}
const uniqueNestedUrls = [...new Map(nestedUrls.map((url) => [url.href, url])).values()];
await Promise.all(uniqueNestedUrls.map((url) => exists(outputPath(url))));

const iconNames = JSON.parse(await readFile(join(output, "pixel-icons", "index.json"), "utf8"));
const indexedIconFiles = new Set(iconNames.map((name) => `${name}.png`));
const builtIconFiles = new Set((await readdir(join(output, "pixel-icons"))).filter((name) => name.endsWith(".png")));
assert.deepEqual(builtIconFiles, indexedIconFiles, "Pixel-icon index and built PNG files must match exactly.");

const narrationIndex = JSON.parse(await readFile(join(output, "audio", "narration", "index.json"), "utf8"));
const sourceNarrationIndex = JSON.parse(await readFile(
  join(root, "app", edition === "CHILD" ? "narration-index.child.json" : "narration-index.json"),
  "utf8",
));
assert.deepEqual(narrationIndex, sourceNarrationIndex, "The public and application narration indexes must match.");
const indexedNarrationFiles = new Set(Object.values(narrationIndex));
const builtNarrationFiles = new Set(
  (await readdir(join(output, "audio", "narration"))).filter((name) => name.endsWith(".mp3")),
);
assert.deepEqual(
  builtNarrationFiles,
  indexedNarrationFiles,
  "Narration index and built MP3 files must match exactly.",
);

const serviceWorker = await readFile(join(output, "sw.js"), "utf8");
assert.match(serviceWorker, /cacheAppShell/, "Service worker must discover the hashed app shell on first load.");
assert.match(serviceWorker, /BRAVE_BLOCKS_OFFLINE_STATUS/, "Service worker must expose offline readiness.");
assert.match(serviceWorker, /offline-ready\.json/, "Service worker must write its readiness marker.");
assert.doesNotMatch(
  serviceWorker,
  /Promise\.allSettled/,
  "Required offline assets must fail installation instead of being silently skipped.",
);

const fontAssets = uniqueNestedUrls.filter((url) => /\.(?:woff2?|ttf|otf|eot)$/i.test(url.pathname));
const externalFontReferences = [...markup.matchAll(/https?:\/\/[^"'()\s]+/gi)]
  .map((match) => match[0])
  .filter((value) => /font/i.test(value));
assert.equal(externalFontReferences.length, 0, "The game must not require an external font host.");

console.log(`Offline shell: ${shellUrls.length} HTML assets + ${uniqueNestedUrls.length} stylesheet assets`);
console.log(`Pixel icons: ${indexedIconFiles.size}`);
console.log(`Narration: ${Object.keys(narrationIndex).length} phrases → ${indexedNarrationFiles.size} unique MP3 files`);
console.log(fontAssets.length
  ? `Local font files: ${fontAssets.length}`
  : "Fonts: device-local system stack (zero network font requests)");
console.log(`${edition} offline pack verification passed.`);
