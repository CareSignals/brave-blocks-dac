const requestedEdition = new URL(self.location.href).searchParams.get("edition")?.trim().toUpperCase();
const EDITION = requestedEdition === "CHILD" ? "CHILD" : "REVIEW";
const requestedProfile = new URL(self.location.href).searchParams.get("profile")?.trim().toUpperCase();
const PROFILE = /^[A-Z][A-Z0-9_-]{0,31}$/.test(requestedProfile || "")
  ? requestedProfile
  : "DEFAULT";
const BUILD_REVISION = "__BRAVE_BLOCKS_BUILD_REVISION__";
const CACHE_PREFIX = "brave-blocks-dac-";
const CACHE = `${CACHE_PREFIX}${EDITION.toLowerCase()}-${PROFILE.toLowerCase()}-v13-${BUILD_REVISION}`;
const BASE = new URL(".", self.location.href).pathname.replace(/\/$/, "");
const READY_URL = `${BASE}/offline-ready.json`;
const CORE = [
  `${BASE}/`,
  `${BASE}/manifest.webmanifest`,
  `${BASE}/favicon.svg`,
  `${BASE}/icon-192.png`,
  `${BASE}/icon-512.png`,
  `${BASE}/og.png`,
];
const REQUIRED_BATCH_SIZE = 8;

function localGameUrl(value, base = self.location.origin) {
  const url = new URL(value, base);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(`${BASE}/`)) return null;
  url.hash = "";
  return url.href;
}

async function fetchRequired(cache, value) {
  const url = localGameUrl(value);
  if (!url) throw new Error(`Not a Brave Blocks asset: ${value}`);
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Offline asset failed (${response.status}): ${url}`);
  await cache.put(url, response.clone());
  return response;
}

async function cacheRequiredInBatches(cache, values) {
  const urls = [...new Set(values.map((value) => localGameUrl(value)).filter(Boolean))];
  for (let index = 0; index < urls.length; index += REQUIRED_BATCH_SIZE) {
    await Promise.all(urls.slice(index, index + REQUIRED_BATCH_SIZE).map((url) => fetchRequired(cache, url)));
  }
  return urls.length;
}

function markupAssetUrls(markup, base) {
  return [...markup.matchAll(/(?:src|href)=["']([^"'#]+)["']/gi)]
    .map((match) => localGameUrl(match[1], base))
    .filter(Boolean);
}

function stylesheetAssetUrls(stylesheet, base) {
  return [...stylesheet.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)]
    .map((match) => match[1])
    .filter((value) => !value.startsWith("data:"))
    .map((value) => localGameUrl(value, base))
    .filter(Boolean);
}

async function cacheAppShell(cache) {
  const homeUrl = localGameUrl(`${BASE}/`);
  const homeResponse = await fetchRequired(cache, homeUrl);
  const markup = await homeResponse.text();
  const shellUrls = [...new Set(markupAssetUrls(markup, homeUrl))];
  const shellResponses = [];

  for (let index = 0; index < shellUrls.length; index += REQUIRED_BATCH_SIZE) {
    const batch = shellUrls.slice(index, index + REQUIRED_BATCH_SIZE);
    shellResponses.push(...await Promise.all(batch.map(async (url) => ({
      url,
      response: await fetchRequired(cache, url),
    }))));
  }

  const nestedUrls = [];
  for (const { url, response } of shellResponses) {
    if (new URL(url).pathname.endsWith(".css")) {
      nestedUrls.push(...stylesheetAssetUrls(await response.text(), url));
    }
  }
  const nestedCount = await cacheRequiredInBatches(cache, nestedUrls);
  return shellUrls.length + nestedCount;
}

async function fetchJsonRequired(cache, value) {
  const response = await fetchRequired(cache, value);
  return response.json();
}

async function buildOfflinePack() {
  await caches.delete(CACHE);
  const cache = await caches.open(CACHE);

  try {
    await cacheRequiredInBatches(cache, CORE);
    const shellCount = await cacheAppShell(cache);
    const iconNames = await fetchJsonRequired(cache, `${BASE}/pixel-icons/index.json`);
    const narrationIndex = await fetchJsonRequired(cache, `${BASE}/audio/narration/index.json`);
    const iconCount = await cacheRequiredInBatches(
      cache,
      iconNames.map((name) => `${BASE}/pixel-icons/${name}.png`),
    );
    const narrationCount = await cacheRequiredInBatches(
      cache,
      Object.values(narrationIndex).map((filename) => `${BASE}/audio/narration/${filename}`),
    );

    const ready = {
      status: "ready",
      edition: EDITION,
      profile: PROFILE,
      revision: BUILD_REVISION,
      cache: CACHE,
      shellCount,
      iconCount,
      narrationCount,
      fonts: "device-local",
    };
    await cache.put(READY_URL, new Response(JSON.stringify(ready), {
      headers: { "Content-Type": "application/json" },
    }));
  } catch (error) {
    await caches.delete(CACHE);
    throw error;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(buildOfflinePack().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "BRAVE_BLOCKS_OFFLINE_STATUS") return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await cache.match(READY_URL);
    const status = response
      ? await response.json()
      : {
          status: "caching",
          edition: EDITION,
          profile: PROFILE,
          revision: BUILD_REVISION,
          cache: CACHE,
        };
    event.ports[0]?.postMessage(status);
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      if (self.navigator.onLine !== false) {
        try {
          const response = await fetch(event.request, { cache: "no-cache" });
          if (response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put(localGameUrl(`${BASE}/`), response.clone());
            return response;
          }
        } catch {
          // A weak connection can still fall back to the complete offline shell.
        }
      }
      const cached = await caches.match(`${BASE}/`);
      if (cached) return cached;
      return new Response("Brave Blocks needs one online visit before offline play.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).then((response) => {
        if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
        return response;
      }),
    ),
  );
});
