import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import {
  childEditionBannedTerms,
  currentEdition,
  reviewOnlyNarrationLines,
} from "./edition-policy.mjs";
import { currentProfile } from "./profile-policy.mjs";

const root = process.cwd();
const output = join(root, "out");
const edition = currentEdition();
const profile = currentProfile();
const textExtensions = new Set([".css", ".html", ".js", ".json", ".svg", ".txt", ".webmanifest"]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

const files = await walk(output);
const textFiles = files.filter((path) => textExtensions.has(extname(path)));
const markup = await readFile(join(output, "index.html"), "utf8");
const manifest = JSON.parse(await readFile(join(output, "manifest.webmanifest"), "utf8"));
const narrationIndex = JSON.parse(
  await readFile(join(output, "audio", "narration", "index.json"), "utf8"),
);
const fullNarrationIndex = JSON.parse(
  await readFile(join(root, "app", "narration-index.json"), "utf8"),
);
const childNarrationIndex = JSON.parse(
  await readFile(join(root, "app", "narration-index.child.json"), "utf8"),
);

assert.match(
  markup,
  new RegExp(`data-profile="${profile.toLowerCase()}"`),
  `The export must identify itself as the ${profile} profile.`,
);

if (profile === "GENERIC") {
  assert.match(markup, /data-profile="generic"/, "The DAC build must use the generic profile.");
}

if (edition === "CHILD") {
  assert.match(markup, /data-edition="child"/, "The export must identify itself as CHILD.");
  assert.equal(manifest.name, "Brave Blocks", "The child manifest must use the child-safe name.");
  assert.deepEqual(
    narrationIndex,
    childNarrationIndex,
    "The child export must use only the child narration index.",
  );

  const violations = [];
  for (const path of textFiles) {
    const text = await readFile(path, "utf8");
    for (const { label, pattern } of childEditionBannedTerms) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) violations.push(`${relative(output, path)}: ${label}`);
    }
  }
  assert.deepEqual(
    violations,
    [],
    `Child-visible build contains adult clinical, legal, or review vocabulary:\n${violations.join("\n")}`,
  );

  for (const line of reviewOnlyNarrationLines) {
    assert.equal(narrationIndex[line], undefined, `Child narration still includes: ${line}`);
  }
  const builtNarrationFiles = new Set(
    files
      .filter((path) => path.startsWith(join(output, "audio", "narration")) && extname(path) === ".mp3")
      .map((path) => path.split("/").at(-1)),
  );
  const childFiles = new Set(Object.values(childNarrationIndex));
  const reviewOnlyFiles = [...new Set(Object.values(fullNarrationIndex))]
    .filter((filename) => !childFiles.has(filename));
  assert.equal(
    reviewOnlyFiles.some((filename) => builtNarrationFiles.has(filename)),
    false,
    "The child export still ships review-only narration audio.",
  );
} else {
  assert.match(markup, /data-edition="review"/, "The export must identify itself as REVIEW.");
  assert.equal(
    manifest.name,
    "Brave Blocks — Dependency Advocacy Center Review",
    "The review manifest must identify the review edition.",
  );
  assert.match(
    markup,
    /DEPENDENCY ADVOCACY CENTER REVIEW EDITION/,
    "The DAC review banner must remain visible.",
  );
  assert.deepEqual(
    narrationIndex,
    fullNarrationIndex,
    "The review export must keep the complete narration index.",
  );
  for (const line of reviewOnlyNarrationLines) {
    assert(narrationIndex[line], `Review narration is missing: ${line}`);
  }
}

console.log(`${edition}/${profile} audit passed across ${textFiles.length} text assets.`);
