import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { narrationLines } from "../scripts/narration-lines.mjs";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
const packageFile = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const narrationIndex = JSON.parse(await readFile(new URL("../app/narration-index.json", import.meta.url), "utf8"));
const childNarrationIndex = JSON.parse(await readFile(new URL("../app/narration-index.child.json", import.meta.url), "utf8"));

test("Feeling Machine is the eleventh Brave Blocks quest", () => {
  assert.match(page, /id: "machine" as Quest[\s\S]*?title: "Feeling Machine"/);
  assert.match(page, /tag: "MACHINE MODE"/);
  assert.match(page, /aria-valuemax=\{11\}/);
  assert.match(page, /\[0,1,2,3,4,5,6,7,8,9,10\]\.map/);
  assert.match(page, /All 11 quests/);
});

test("Feeling Machine keeps the full DBT-informed cycle inside five child-facing stages", () => {
  for (const stage of [
    "WHAT HIT?",
    "BRAIN + BODY SCAN",
    "FEELING BOSS",
    "MOVE LOADING…",
    "PLOT-TWIST PORTAL",
  ]) {
    assert.match(page, new RegExp(stage.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(page, /vulnerability/);
  assert.match(page, /event/);
  assert.match(page, /thought/);
  assert.match(page, /body/);
  assert.match(page, /urge/);
  assert.match(page, /signal/);
  assert.match(page, /ending/);
});

test("pretend play is primary and personal disclosure stays optional", () => {
  for (const crew of ["AXO MAXXO", "CAPY BAPPY", "DUMPLING SUPREME", "DJ GLORP"]) {
    assert.match(page, new RegExp(crew));
  }
  assert.match(page, /MY OWN VIBE/);
  assert.match(page, /Pretend stories first\. Your own details stay optional\./);
  assert.match(page, /You never have to tell what happened\./);
  assert.doesNotMatch(page, /localStorage|sessionStorage|fetch\(/);
});

test("shame is named safely and does not become an identity label", () => {
  assert.match(page, /name: "SHAME"/);
  assert.match(page, /BRAIN-SAYS-I’M-BAD/);
  assert.match(page, /turning a mistake or rejection into an identity/);
});

test("pass and completion use the same positive reward pathway", () => {
  assert.match(page, /<FeelingMachine earn=\{earn\} skip=\{skipQuest\}/);
  assert.match(page, /const skipQuest = \(\) => completeQuest\(SKIP_AFFIRMATION\)/);
  assert.match(page, /<RegulationSkip onSkip=\{pass\}/);
  assert.doesNotMatch(page, /streak|countdown|game over|lose a heart/i);
});

test("emotion labels and controls remain readable for early readers", () => {
  assert.match(css, /\.machine-feeling-grid button strong\{display:block;font-size:23px/);
  assert.match(css, /\.machine-feeling-grid button small\{display:block;margin-top:5px;font-size:15px/);
  assert.match(css, /\.machine-controls button\{[\s\S]*?min-height:60px/);
  assert.match(css, /@media\(max-width:520px\)\{[\s\S]*?\.machine-story-grid\{grid-template-columns:1fr\}/);
});

test("the DAC review and child builds both use the generic profile", () => {
  assert.match(packageFile.scripts["pages:build:review"], /PROFILE=GENERIC/);
  assert.match(packageFile.scripts["pages:build:child"], /PROFILE=GENERIC/);
  assert.match(page, /PLAYER NAME · STAYS ON THIS SCREEN/);
});

test("Power-Up Pals remains in the gated adult companion route", () => {
  assert.match(page, /className="adult-companion-link"/);
  assert.match(page, /https:\/\/caresignals\.github\.io\/power-up-pals-dbt\//);
  assert.match(page, /OPEN POWER-UP PALS/);
});

test("every Feeling Machine narration line has a generated offline voice clip", () => {
  const machineLines = narrationLines.filter((line) =>
    line.startsWith("Feeling Machine.")
    || line.startsWith("Step one.")
    || line.startsWith("Step two.")
    || line.startsWith("Step three.")
    || line.startsWith("Step four.")
    || line.startsWith("Step five.")
    || /VOLCANO MODE|WHAT-IF SPAM|IMPOSSIBLE LEVEL|KICKED-FROM-THE-SQUAD|BRAIN-SAYS-I’M-BAD|RAIN-CLOUD MODE|BRAIN BUFFERING|WHOLE COMBO/.test(line)
  );
  assert(machineLines.length >= 40);
  for (const line of machineLines) {
    assert(narrationIndex[line], `Review narration is missing: ${line}`);
    assert(childNarrationIndex[line], `Child narration is missing: ${line}`);
  }
});
