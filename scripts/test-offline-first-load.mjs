import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import vm from "node:vm";
import { currentEdition } from "./edition-policy.mjs";
import { currentProfile } from "./profile-policy.mjs";

const root = process.cwd();
const output = join(root, "out");
const origin = "https://offline.brave-blocks.test";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/brave-blocks-dac";
const edition = currentEdition();
const profile = currentProfile();
const handlers = new Map();
const cacheStores = new Map();
let online = true;
let networkRequests = 0;

function absoluteUrl(value) {
  if (typeof value === "string") return new URL(value, origin).href;
  if (value instanceof URL) return value.href;
  if (value instanceof Request) return value.url;
  if (value && typeof value.url === "string") return new URL(value.url, origin).href;
  throw new Error(`Unsupported request value: ${String(value)}`);
}

function outputPath(value) {
  const url = new URL(absoluteUrl(value));
  if (url.origin !== origin || !url.pathname.startsWith(`${basePath}/`)) return null;
  const relative = decodeURIComponent(url.pathname.slice(basePath.length + 1));
  return join(output, relative || "index.html");
}

function contentType(path) {
  return {
    ".css": "text/css",
    ".html": "text/html",
    ".js": "text/javascript",
    ".json": "application/json",
    ".mp3": "audio/mpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webmanifest": "application/manifest+json",
  }[extname(path)] ?? "application/octet-stream";
}

class MemoryCache {
  entries = new Map();

  async put(value, response) {
    this.entries.set(absoluteUrl(value), response.clone());
  }

  async match(value) {
    return this.entries.get(absoluteUrl(value))?.clone();
  }
}

const caches = {
  async open(name) {
    if (!cacheStores.has(name)) cacheStores.set(name, new MemoryCache());
    return cacheStores.get(name);
  },
  async delete(name) {
    return cacheStores.delete(name);
  },
  async keys() {
    return [...cacheStores.keys()];
  },
  async match(value) {
    for (const cache of cacheStores.values()) {
      const response = await cache.match(value);
      if (response) return response;
    }
    return undefined;
  },
};

async function mockFetch(value) {
  networkRequests += 1;
  if (!online) throw new Error(`Network request attempted offline: ${absoluteUrl(value)}`);
  const path = outputPath(value);
  if (!path) return new Response("Not found", { status: 404 });
  try {
    return new Response(await readFile(path), {
      status: 200,
      headers: { "Content-Type": contentType(path) },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

const self = {
  location: { origin, href: `${origin}${basePath}/sw.js?edition=${edition}&profile=${profile}` },
  navigator: { get onLine() { return online; } },
  clients: { claim: async () => undefined },
  skipWaiting: async () => undefined,
  addEventListener(type, handler) {
    handlers.set(type, handler);
  },
};

const context = vm.createContext({
  self,
  caches,
  fetch: mockFetch,
  URL,
  Request,
  Response,
  Headers,
  console,
  setTimeout,
  clearTimeout,
});
vm.runInContext(await readFile(join(output, "sw.js"), "utf8"), context, { filename: "sw.js" });

async function dispatchExtendable(type, event = {}) {
  let completion;
  handlers.get(type)({
    ...event,
    waitUntil(promise) {
      completion = Promise.resolve(promise);
    },
  });
  await completion;
}

async function offlineFetch(path, mode = "same-origin") {
  let responsePromise;
  handlers.get("fetch")({
    request: {
      method: "GET",
      mode,
      url: new URL(path, origin).href,
    },
    respondWith(promise) {
      responsePromise = Promise.resolve(promise);
    },
  });
  assert(responsePromise, `Service worker did not handle ${path}`);
  const response = await responsePromise;
  assert(response?.ok, `Offline response failed for ${path}`);
  return response;
}

assert(handlers.has("install"), "Service worker install handler is missing.");
assert(handlers.has("fetch"), "Service worker fetch handler is missing.");
assert(handlers.has("message"), "Service worker readiness handler is missing.");

await dispatchExtendable("install");
const installRequestCount = networkRequests;
assert(installRequestCount > 0, "The online install did not fetch any assets.");

let readinessReply;
await dispatchExtendable("message", {
  data: { type: "BRAVE_BLOCKS_OFFLINE_STATUS" },
  ports: [{ postMessage(value) { readinessReply = value; } }],
});
assert.equal(readinessReply?.status, "ready", "Readiness must only report after the complete install.");
assert.equal(readinessReply?.edition, edition, "Readiness must match the edition being tested.");
assert.equal(readinessReply?.profile, profile, "Readiness must match the player profile being tested.");
assert(
  readinessReply?.revision && readinessReply.revision !== "__BRAVE_BLOCKS_BUILD_REVISION__",
  "Readiness must identify the finalized build revision.",
);
assert.equal(readinessReply?.fonts, "device-local", "Readiness must confirm the offline-safe font strategy.");

online = false;
await offlineFetch(`${basePath}/`, "navigate");
await offlineFetch(`${basePath}/manifest.webmanifest`);
await offlineFetch(`${basePath}/favicon.svg`);
await offlineFetch(`${basePath}/icon-192.png`);
await offlineFetch(`${basePath}/icon-512.png`);
await offlineFetch(`${basePath}/og.png`);

const markup = await readFile(join(output, "index.html"), "utf8");
const shellUrls = [...markup.matchAll(/(?:src|href)=["']([^"'#]+)["']/gi)]
  .map((match) => new URL(match[1], origin))
  .filter((url) => url.origin === origin && url.pathname.startsWith(`${basePath}/`));
for (const url of new Map(shellUrls.map((item) => [item.href, item])).values()) {
  await offlineFetch(url.pathname);
}
const nestedAssetUrls = [];
for (const url of shellUrls.filter((item) => item.pathname.endsWith(".css"))) {
  const stylesheet = await readFile(outputPath(url), "utf8");
  nestedAssetUrls.push(...[...stylesheet.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)]
    .map((match) => match[1])
    .filter((value) => !value.startsWith("data:"))
    .map((value) => new URL(value, url))
    .filter((item) => item.origin === origin && item.pathname.startsWith(`${basePath}/`)));
}
for (const url of new Map(nestedAssetUrls.map((item) => [item.href, item])).values()) {
  await offlineFetch(url.pathname);
}

const iconNames = JSON.parse(await readFile(join(output, "pixel-icons", "index.json"), "utf8"));
for (const name of iconNames) await offlineFetch(`${basePath}/pixel-icons/${name}.png`);

const narrationIndex = JSON.parse(await readFile(join(output, "audio", "narration", "index.json"), "utf8"));
for (const filename of new Set(Object.values(narrationIndex))) {
  await offlineFetch(`${basePath}/audio/narration/${filename}`);
}

const pageSource = await readFile(join(root, "app", "page.tsx"), "utf8");
const childQuestNames = [...pageSource.matchAll(/(?:if|else if) \(quest === "([^"]+)"\)/g)]
  .map((match) => match[1])
  .filter((name) => name !== "grownups");
assert.equal(new Set(childQuestNames).size, 10, "All 10 child-facing quests must remain in the single offline app shell.");

const questInstructions = [...pageSource.matchAll(/<QuestShell title="([^"]+)" subtitle="([^"]+)"/g)]
  .map((match) => `${match[1]}. ${match[2]}`)
  .filter((instruction) => edition === "REVIEW" || !instruction.startsWith("Grown-up Guide."));
questInstructions.push("Music Power-Up. Pick the kind of power your body needs, then choose music with a trusted grown-up.");
questInstructions.push("Feeling Machine. Pick a pretend Chaos Crew story, or keep your own vibe private.");
for (const instruction of questInstructions) {
  assert(narrationIndex[instruction], `HEAR IT narration is missing from the offline index: ${instruction}`);
  await offlineFetch(`${basePath}/audio/narration/${narrationIndex[instruction]}`);
}

const pauseNarration = [
  "AXO BUBBLES. Slow in. Longer out. No rush.",
  "WALL POWER. Push the wall with safe hands.",
  "GET MY GROWN-UP. Go to your safe grown-up now. You do not have to explain first.",
  "Pass unlocked. No explaining needed.",
];
for (const line of pauseNarration) {
  assert(narrationIndex[line], `Pause Portal narration is missing from the offline index: ${line}`);
  await offlineFetch(`${basePath}/audio/narration/${narrationIndex[line]}`);
}

assert.match(pageSource, /window\.AudioContext/, "Built-in game sounds must use the offline Web Audio API.");
assert.match(pageSource, /createOscillator/, "Beat and feedback sounds must be generated on-device.");
assert.equal(networkRequests, installRequestCount, "Offline play attempted to use the network after one online install.");

console.log(`One-load install requests: ${installRequestCount}`);
console.log(`Offline quest modules: ${new Set(childQuestNames).size}`);
console.log(`Offline HEAR IT instructions checked: ${questInstructions.length}`);
console.log(`Offline Pause Portal narration checked: ${pauseNarration.length}`);
console.log(`Offline icons checked: ${iconNames.length}`);
console.log(`Offline narration files checked: ${new Set(Object.values(narrationIndex)).size}`);
console.log(`Offline stylesheet/font assets checked: ${new Set(nestedAssetUrls.map((item) => item.href)).size}`);
console.log(`${edition}/${profile} first-load → offline lifecycle test passed with zero offline network requests.`);
