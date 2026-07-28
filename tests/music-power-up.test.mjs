import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  powerNeeds,
  safeExternalSongUrl,
  signalAffirmation,
  signalChanges,
  tracksForNeed,
  validateSongLibrary,
} from "../app/music-power-up.ts";
import genericProfile from "../app/profile.generic.ts";
import genericSongs from "../app/song-library.generic.ts";

const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const pixelIconNames = new Set(JSON.parse(
  await readFile(new URL("../public/pixel-icons/index.json", import.meta.url), "utf8"),
));

function pixelIconName(icon) {
  return Array.from(icon)
    .map((character) => character.codePointAt(0)?.toString(16))
    .filter((codePoint) => codePoint && codePoint !== "fe0f")
    .join("-");
}

test("all five power needs have a selectable, approved song", () => {
  assert.deepEqual(
    powerNeeds.map(({ id }) => id),
    ["calm", "brave", "comfort", "joy", "sleep"],
  );
  assert.deepEqual(validateSongLibrary(genericSongs), []);
  for (const need of powerNeeds) {
    const tracks = tracksForNeed(genericSongs, need.id);
    assert(tracks.length > 0, `${need.label} must have at least one song.`);
    for (const track of tracks) {
      assert.equal(track.category, need.id);
      assert(track.prompt?.trim(), `${track.id} needs an optional tiny mission.`);
      assert.equal(new URL(safeExternalSongUrl(track.url)).protocol, "https:");
    }
  }
});

test("song-link guard rejects insecure and child-response query data", () => {
  assert.throws(
    () => safeExternalSongUrl("http://example.com/song"),
    /must use HTTPS/,
  );
  assert.throws(
    () => safeExternalSongUrl("https://example.com/song?emotion=sad"),
    /cannot include child-response/,
  );
  assert.doesNotThrow(
    () => safeExternalSongUrl("https://music.youtube.com/playlist?list=PLc1GIP9de-As"),
  );
});

test("the generic music launch has no share-tracking token", () => {
  for (const need of powerNeeds) {
    const [playlist] = genericSongs[need.id];
    const url = new URL(playlist.url);
    assert.equal(url.origin, "https://music.youtube.com");
    assert.equal(url.pathname, "/");
    assert.equal(url.searchParams.has("si"), false);
    assert.equal(playlist.launchLabel, "OPEN APPROVED MUSIC");
  }
});

test("every signal check is affirmed, including Not yet", () => {
  assert.deepEqual(
    signalChanges.map(({ label }) => label),
    ["A lot", "A little", "Not yet"],
  );
  for (const choice of signalChanges) {
    assert.equal(signalAffirmation(choice.id), choice.affirmation);
    assert(choice.affirmation.length > 10);
  }
  assert.match(signalAffirmation("not-yet"), /okay/i);
  assert.doesNotMatch(signalAffirmation("not-yet"), /fail|wrong|try harder/i);
});

test("the DAC edition uses only the generic profile", () => {
  assert.equal(genericProfile.id, "generic");
  assert(genericProfile.favoriteComfortTools.length >= 5);
  assert(genericProfile.easterEggs.length >= 2);
});

test("all configurable icons use the existing pixel-art inventory", () => {
  const icons = [
    ...powerNeeds.map(({ icon }) => icon),
    ...signalChanges.map(({ icon }) => icon),
    ...[genericProfile].flatMap((profile) => [
      profile.avatarIcon,
      ...profile.favoriteComfortTools.map(({ icon }) => icon),
      ...profile.easterEggs.map(({ icon }) => icon),
      profile.animalCompanion?.icon,
    ]),
    ...[genericSongs].flatMap((library) =>
      Object.values(library).flatMap((tracks) => tracks.map(({ icon }) => icon))),
  ].filter(Boolean);
  for (const icon of icons) {
    assert(pixelIconNames.has(pixelIconName(icon)), `${icon} is missing a pixel-art PNG.`);
  }
});

test("Music Power-Up opens a deliberate external link without embeds or autoplay", () => {
  assert.match(pageSource, /target="_blank"/);
  assert.match(pageSource, /rel="noopener noreferrer external"/);
  assert.match(pageSource, /referrerPolicy="no-referrer"/);
  assert.match(pageSource, /playlist-launch-button/);
  assert.match(pageSource, /setHasOpenedPlaylist\(true\)/);
  assert.doesNotMatch(pageSource, /<iframe\b/i);
  assert.doesNotMatch(pageSource, /\bautoPlay\b|\bautoplay\b/i);
  assert.doesNotMatch(pageSource, /youtube\.com\/embed/i);
  assert.doesNotMatch(pageSource, /youtube\.com\/results|music\.youtube\.com\/search/i);
});

test("the flow supports pass, optional participation, single completion, and reset", () => {
  const missionPosition = pageSource.indexOf('className="tiny-mission"');
  const playlistPosition = pageSource.indexOf('className="playlist-launch-card"');
  const signalPosition = pageSource.indexOf('className="signal-check"');
  assert(missionPosition > -1 && missionPosition < playlistPosition);
  assert(playlistPosition < signalPosition);
  assert.match(pageSource, /OPTIONAL SIDE QUEST/);
  assert.match(pageSource, /I CAN TRY/);
  assert.match(pageSource, /JUST LISTEN/);
  assert.match(pageSource, /\{hasOpenedPlaylist && <div className="signal-check"/);
  assert.match(pageSource, /Every answer gets the W/);
  assert.match(pageSource, /RegulationSkip onSkip=\{skip\}/);
  assert.match(pageSource, /if \(completionLocked\.current\) return/);
  assert.match(pageSource, /completionLocked\.current = true/);
  assert.match(pageSource, /setBadges\(\[\]\)/);
  assert.match(pageSource, /setXp\(0\)/);
  assert.match(pageSource, /setCollection\(\[\]\)/);
  assert.match(pageSource, /Nothing is stored online/);
});

test("child choices stay in component memory and are not transmitted or analyzed", () => {
  assert.doesNotMatch(pageSource, /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/);
  assert.doesNotMatch(pageSource, /\bsendBeacon\b|\bfetch\s*\(|XMLHttpRequest|WebSocket/);
  assert.doesNotMatch(pageSource, /googleAnalytics|gtag\s*\(|analytics\.|telemetry|mixpanel|amplitude/i);
  assert.match(serviceWorker, /profile: PROFILE/);
  assert.match(serviceWorker, /revision: BUILD_REVISION/);
  assert.match(serviceWorker, /v13-\$\{BUILD_REVISION\}/);
  assert.match(serviceWorker, /PROFILE\.toLowerCase\(\)/);
  assert.match(pageSource, /updateViaCache: "none"/);
  assert.match(pageSource, /registration\.update\(\)/);
  assert.match(pageSource, /controllerchange/);
  assert.match(pageSource, /window\.location\.reload\(\)/);
  assert.match(serviceWorker, /fetch\(event\.request, \{ cache: "no-cache" \}\)/);
  assert.match(serviceWorker, /const cached = await caches\.match\(`\$\{BASE\}\/`\)/);
});

test("responsive and accessibility safeguards cover small screens and reduced motion", () => {
  assert.match(styles, /@media\(max-width:350px\)/);
  assert.match(styles, /@media\(max-width:620px\)/);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(styles, /\.power-kit summary:focus-visible/);
  assert.match(styles, /\.playlist-launch-button:focus-visible/);
  assert.match(styles, /min-height:52px/);
  assert.match(styles, /overflow-x:hidden/);
  assert.match(pageSource, /aria-labelledby="power-need-title"/);
  assert.match(pageSource, /role="group" aria-labelledby="signal-check-title"/);
});
