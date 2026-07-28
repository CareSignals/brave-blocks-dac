"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import narrationIndex from "@edition-narration";
import editionContent from "@edition-content";
import activeProfile from "@active-profile";
import songLibrary from "@song-library";
import { BRAVE_BLOCKS_EDITION, IS_REVIEW_EDITION } from "./edition";
import {
  powerNeeds,
  safeExternalSongUrl,
  signalAffirmation,
  signalChanges,
  tracksForNeed,
  validateSongLibrary,
  type SignalChangeId,
} from "./music-power-up";
import type { EasterEgg } from "./profile.types";
import type { PowerNeedId, SongTrack } from "./song-library.types";

type Quest = "home" | "feelings" | "body" | "calm" | "loadout" | "meeting" | "base" | "safety" | "parkour" | "beats" | "stories" | "machine" | "grownups";
type Loot = { icon: string; name: string; line: string };
type AdultArea = "guide" | "install";
type OfflineStatus = "checking" | "caching" | "ready" | "error" | "unsupported";
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
const PUBLIC_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ADULT_HOLD_MS = 3000;
const SKIP_AFFIRMATION = "Skipping is a real move. Still a W.";
const emojiSegmenter = typeof Intl !== "undefined" && "Segmenter" in Intl
  ? new Intl.Segmenter("en", { granularity: "grapheme" })
  : null;
const pictograph = /\p{Extended_Pictographic}/u;

const avatars = [
  { icon: "🦎", name: "Axo Maxxo" },
  { icon: "🐹", name: "Capy Bappy" },
  { icon: "🥟", name: "Dumpling Supreme" },
  { icon: "🟢", name: "DJ Glorp" },
  { icon: "🐲", name: "Dragon Bro" },
  { icon: "🤖", name: "Beat Bot" },
];
const chaosCrew = [
  { icon: "🦎", name: "AXO MAXXO", line: "Glow-mode: ON", color: "pink" },
  { icon: "🐹", name: "CAPY BAPPY", line: "Chill aura: ELITE", color: "brown" },
  { icon: "🥟", name: "DUMPLING SUPREME", line: "Snack-sized courage", color: "gold" },
  { icon: "🟢", name: "DJ GLORP", line: "Slime beat unlocked", color: "slime" },
];
const lootDrops: Loot[] = [
  { icon: "💎", name: "Pixel Prism", line: "Tiny sparkle. Huge glow." },
  { icon: "🪄", name: "Pause Wand", line: "Need a break? Cast it." },
  { icon: "🧪", name: "Mixed-Feels Potion", line: "Two feelings can both be real." },
  { icon: "🛡️", name: "No-Cap Shield", line: "You never have to guess." },
  { icon: "🧭", name: "Body Compass", line: "Your body drops useful clues." },
  { icon: "🧸", name: "Home-Base Buddy", line: "Support squad: always equipped." },
  { icon: "🫧", name: "Axo Glow Bubbles", line: "Glow through every feeling." },
  { icon: "👑", name: "Capy Chill Crown", line: "Soft body. Strong heart." },
  { icon: "🥟", name: "Dumpling Boost", line: "Tiny snack. Huge courage." },
  { icon: "🟢", name: "Glorp Beat Blob", line: "Turn feelings into rhythm." },
  { icon: "👐", name: "Gentle Hands Glow", line: "Huge feeling. Safe body. Legendary." },
];

const feelings = [
  { name: "Happy", face: "😊", color: "#ffd166", clue: "light + bouncy" },
  { name: "Sad", face: "😢", color: "#55a7f3", clue: "heavy + slow" },
  { name: "Mad", face: "😠", color: "#ff6b62", clue: "hot + stompy" },
  { name: "Worried", face: "😟", color: "#9f86ff", clue: "jumpy + buzzy" },
  { name: "Scared", face: "😨", color: "#7467d8", clue: "shaky + fast" },
  { name: "Confused", face: "😕", color: "#79c9bd", clue: "foggy + unsure" },
  { name: "Loved", face: "🥰", color: "#ff8fbd", clue: "warm + safe" },
  { name: "Mixed", face: "🫨", color: "#ff9f43", clue: "a whole combo" },
];

type MachineFeeling = {
  id: string;
  name: string;
  nickname: string;
  face: string;
  color: string;
  message: string;
  body: string;
  urge: string;
};

type MachineChoice = {
  icon: string;
  label: string;
  signal: string;
  ending: string;
  spoken: string;
};

type MachineStory = {
  id: string;
  crew: string;
  icon: string;
  teaser: string;
  vulnerability: string;
  event: string;
  thought: string;
  emotionId: string;
  choices: MachineChoice[];
};

const machineFeelings: MachineFeeling[] = [
  {
    id: "mad",
    name: "MAD",
    nickname: "VOLCANO MODE",
    face: "😠",
    color: "#ff6b62",
    message: "Something feels unfair, blocked, or not okay.",
    body: "hot face, tight hands, fast heart",
    urge: "Yell, grab, smash, or push away",
  },
  {
    id: "worried",
    name: "WORRIED",
    nickname: "WHAT-IF SPAM",
    face: "😟",
    color: "#9f86ff",
    message: "The brain is trying extra hard to predict a problem.",
    body: "wobbly belly, fast questions, buzzy body",
    urge: "Run, cling, freeze, or ask again",
  },
  {
    id: "frustrated",
    name: "FRUSTRATED",
    nickname: "IMPOSSIBLE LEVEL",
    face: "😤",
    color: "#ff9f43",
    message: "A goal is blocked or something is not working yet.",
    body: "tight shoulders, hot hands, scrunched face",
    urge: "Quit, throw it, smash it, or blame",
  },
  {
    id: "hurt",
    name: "HURT",
    nickname: "KICKED-FROM-THE-SQUAD",
    face: "💔",
    color: "#ff8fbd",
    message: "Connection feels damaged, unfair, or far away.",
    body: "heavy chest, tears, hot cheeks",
    urge: "Hide, yell, reject first, or ruin the game",
  },
  {
    id: "shame",
    name: "SHAME",
    nickname: "BRAIN-SAYS-I’M-BAD",
    face: "🫥",
    color: "#6f65c7",
    message: "The brain is turning a mistake or rejection into an identity.",
    body: "sinking belly, quiet voice, looking away",
    urge: "Hide, blame, lie, or disappear",
  },
  {
    id: "sad",
    name: "SAD",
    nickname: "RAIN-CLOUD MODE",
    face: "😢",
    color: "#55a7f3",
    message: "Something important feels lost, changed, or far away.",
    body: "heavy chest, tears, low energy",
    urge: "Hide, curl up, quit, or push comfort away",
  },
  {
    id: "confused",
    name: "CONFUSED",
    nickname: "BRAIN BUFFERING",
    face: "😕",
    color: "#79c9bd",
    message: "The brain needs clearer words, fewer steps, or more time.",
    body: "foggy head, frozen face, restless hands",
    urge: "Guess, shut down, copy, or run away",
  },
  {
    id: "mixed",
    name: "MIXED",
    nickname: "WHOLE COMBO",
    face: "🫨",
    color: "#f5c84c",
    message: "More than one feeling can be here at the same time.",
    body: "a combo of fast, heavy, hot, or frozen clues",
    urge: "Do two opposite things at once",
  },
];

const genericMachineChoices: MachineChoice[] = [
  {
    icon: "🧠",
    label: "FREEZE + SPY",
    signal: "People see a pause instead of the first impulse.",
    ending: "The thinking brain gets a turn.",
    spoken: "Freeze and spy. Pause, check the level, then choose.",
  },
  {
    icon: "🤝",
    label: "GET BACKUP",
    signal: "A safe grown-up knows connection comes first.",
    ending: "The feeling is not a solo boss battle.",
    spoken: "Get backup. Real power means you do not have to handle it alone.",
  },
  {
    icon: "💬",
    label: "WORDS POWER",
    signal: "People hear one clear feeling and one clear ask.",
    ending: "The problem has a fair chance to change.",
    spoken: "Words power. Name the feeling and make one clear ask.",
  },
  {
    icon: "🛡️",
    label: "BOTH MODE",
    signal: "People see the feeling and a safe move together.",
    ending: "A huge feeling can be real while the body stays safe.",
    spoken: "Both mode. The feeling is real, and safe hands still matter.",
  },
];

const machineStories: MachineStory[] = [
  {
    id: "axo",
    crew: "AXO MAXXO",
    icon: "🦎",
    teaser: "The waiting level feels forever.",
    vulnerability: "Axo is tired, the plan changed, and nobody said how long.",
    event: "Axo has to wait while another player gets a turn.",
    thought: "They forgot me. I might never get a turn.",
    emotionId: "worried",
    choices: [
      {
        icon: "🛡️",
        label: "WIGGLE + FREEZE",
        signal: "People see Axo reset his zoomy body.",
        ending: "He can wait without handling the alarm alone.",
        spoken: "Wiggle and freeze. Move the zoomies, then notice the level.",
      },
      {
        icon: "🤝",
        label: "GROWN-UP STAYS",
        signal: "A safe grown-up knows Axo needs company.",
        ending: "Waiting becomes a team level.",
        spoken: "Grown-up stays. Connection power unlocked.",
      },
    ],
  },
  {
    id: "cappy",
    crew: "CAPY BAPPY",
    icon: "🐹",
    teaser: "The block bridge crashes again.",
    vulnerability: "Cappy is hungry, rushed, and already tried three times.",
    event: "The last block falls and the whole bridge breaks.",
    thought: "I cannot do anything. This level is impossible.",
    emotionId: "frustrated",
    choices: [
      {
        icon: "🤝",
        label: "ASK FOR BACKUP",
        signal: "People hear that Cappy wants teamwork.",
        ending: "The blocked goal gets another path.",
        spoken: "Ask for backup. Team build unlocked.",
      },
      {
        icon: "🧱",
        label: "ONE BLOCK",
        signal: "People see Cappy slow the level down.",
        ending: "One tiny move replaces the impossible-level story.",
        spoken: "One block at a time. Tiny move, real progress.",
      },
    ],
  },
  {
    id: "dumpling",
    crew: "DUMPLING SUPREME",
    icon: "🥟",
    teaser: "Another player gets picked first.",
    vulnerability: "Dumpling already missed the squad and hoped to be first.",
    event: "The team chooses somebody else to start.",
    thought: "They do not want me here.",
    emotionId: "hurt",
    choices: [
      {
        icon: "💬",
        label: "SAY LEFT OUT",
        signal: "People hear the hurt hiding under the heat.",
        ending: "The squad gets a chance to understand.",
        spoken: "Say left out. Brave words show the real signal.",
      },
      {
        icon: "🤝",
        label: "JOIN NEXT",
        signal: "People hear one clear ask.",
        ending: "Not first does not have to mean not wanted.",
        spoken: "Ask to join next. Clear ask, huge courage.",
      },
    ],
  },
  {
    id: "glorp",
    crew: "DJ GLORP",
    icon: "🟢",
    teaser: "The favorite beat gets interrupted.",
    vulnerability: "DJ Glorp is overstimulated and the room is already loud.",
    event: "The music stops in the middle of the best part.",
    thought: "They wrecked it on purpose.",
    emotionId: "mad",
    choices: [
      {
        icon: "🛡️",
        label: "SLOW THE BEAT",
        signal: "People see Glorp lower the body volume.",
        ending: "There is enough room to choose the next track.",
        spoken: "Slow the beat. Easy in, longer out.",
      },
      {
        icon: "🧠",
        label: "FACT CHECK",
        signal: "People hear a question instead of blame.",
        ending: "The Alarm Boss shrinks back to its real size.",
        spoken: "Fact check. What happened, and what is the brain guessing?",
      },
    ],
  },
  {
    id: "own",
    crew: "MY OWN VIBE",
    icon: "🧠",
    teaser: "Use a feeling—or keep the details private.",
    vulnerability: "A hard level can get harder when the body is tired, hungry, rushed, or already stressed.",
    event: "Something happened. The details can stay private.",
    thought: "A brain story showed up. You do not have to say it.",
    emotionId: "mixed",
    choices: genericMachineChoices,
  },
];

const bodySpots = [
  { id: "head", label: "Head", icon: "🧠", sensations: ["busy", "foggy", "achy"] },
  { id: "face", label: "Face", icon: "😶", sensations: ["hot", "teary", "tight"] },
  { id: "chest", label: "Chest", icon: "💓", sensations: ["fast", "tight", "fluttery"] },
  { id: "belly", label: "Belly", icon: "🌀", sensations: ["butterflies", "achy", "wobbly"] },
  { id: "hands", label: "Hands", icon: "🖐️", sensations: ["fists", "sweaty", "shaky"] },
  { id: "legs", label: "Legs", icon: "🦵", sensations: ["stompy", "jumpy", "heavy"] },
];

const meetingMoves = [
  { icon: "💬", words: "I feel...", tip: "Say any feeling." },
  { icon: "❓", words: "I don’t get it.", tip: "Ask for easier words." },
  { icon: "⏸️", words: "I need a break.", tip: "Pause the meeting." },
  { icon: "🤷", words: "I don’t know.", tip: "No guessing. No cap." },
  { icon: "🔒", words: "Who will you tell?", tip: "Ask what gets shared." },
  { icon: "🧱", words: "Not ready yet.", tip: "Take your time." },
];

const meetingRounds = [
  { icon: "🧑‍💼", words: "Hi! My job is to listen. How are you feeling?" },
  { icon: "🧠", words: "Your brain feels foggy. What move could help?" },
  { icon: "⏳", words: "You want more time. Pick your power move." },
];

const supportBlocks = [
  { icon: "🏠", label: "Home" },
  ...activeProfile.trustedGrownupLabels.map((label, index) => ({
    icon: index === 0 ? "💛" : "💚",
    label,
  })),
  { icon: "🧸", label: "Cozy thing" },
  { icon: "🐾", label: "Animal" },
  { icon: "🏫", label: "School helper" },
  { icon: "⭐", label: "My person" },
  ...editionContent.supportBlocks,
];
const songConfigurationErrors = validateSongLibrary(songLibrary);
if (songConfigurationErrors.length) {
  throw new Error(`Music Power-Up song configuration is invalid:\n${songConfigurationErrors.join("\n")}`);
}
const calmSteps = [
  { label: "BREATHE IN", time: 4000 }, { label: "HOLD", time: 2000 },
  { label: "BLOW OUT", time: 5000 }, { label: "RESET", time: 1500 },
  { label: "BREATHE IN", time: 4000 }, { label: "HOLD", time: 2000 },
  { label: "BLOW OUT", time: 5000 }, { label: "SHIELD MAXED!", time: 1000 },
];

const NARRATOR_SAMPLE = "Yo, Brave Builder! New quest unlocked. Every feeling is allowed—even the giant, messy ones. You can say it, point, draw, or pass. Gentle hands stay equipped, and your safe grown-ups are on your team. No rush. Choose your next power-up when you’re ready.";
const recordedNarration = narrationIndex as Record<string, string>;
let activeNarrationAudio: HTMLAudioElement | null = null;
let narrationIsMuted = false;

function stopNarration() {
  if (activeNarrationAudio) {
    activeNarrationAudio.pause();
    activeNarrationAudio.currentTime = 0;
    activeNarrationAudio = null;
  }
}

function setNarrationMuted(muted: boolean) {
  narrationIsMuted = muted;
  if (muted) stopNarration();
}

function waitForWorkerActivation(worker: ServiceWorker) {
  if (worker.state === "activated") return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Offline pack timed out.")), 8 * 60 * 1000);
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") {
        window.clearTimeout(timeout);
        resolve();
      } else if (worker.state === "redundant") {
        window.clearTimeout(timeout);
        reject(new Error("Offline pack could not be installed."));
      }
    });
  });
}

function requestOfflineStatus(worker: ServiceWorker) {
  return new Promise<{ status?: string; edition?: string; profile?: string; revision?: string }>((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => reject(new Error("Offline readiness check timed out.")), 15000);
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timeout);
      resolve(event.data);
    };
    worker.postMessage({ type: "BRAVE_BLOCKS_OFFLINE_STATUS" }, [channel.port2]);
  });
}

async function prepareOfflinePack(): Promise<OfflineStatus> {
  if (!("serviceWorker" in navigator)) return "unsupported";
  const controlledBeforeUpdate = Boolean(navigator.serviceWorker.controller);
  if (controlledBeforeUpdate) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    }, { once: true });
  }
  const registration = await navigator.serviceWorker.register(
    `${PUBLIC_BASE}/sw.js?edition=${BRAVE_BLOCKS_EDITION}&profile=${activeProfile.id.toUpperCase()}`,
    { updateViaCache: "none" },
  );
  await registration.update();
  const changingWorker = registration.installing ?? registration.waiting;
  if (changingWorker) await waitForWorkerActivation(changingWorker);
  const readyRegistration = await navigator.serviceWorker.ready;
  const activeWorker = registration.active ?? readyRegistration.active ?? navigator.serviceWorker.controller;
  if (!activeWorker) throw new Error("No active offline worker.");
  const reply = await requestOfflineStatus(activeWorker);
  if (
    reply.status !== "ready"
    || reply.edition !== BRAVE_BLOCKS_EDITION
    || reply.profile !== activeProfile.id.toUpperCase()
  ) {
    throw new Error("Offline pack is incomplete or belongs to another edition or player mode.");
  }
  return "ready";
}

function say(text: string) {
  if (typeof window === "undefined" || narrationIsMuted) return;
  stopNarration();
  const filename = recordedNarration[text];
  if (!filename) return;
  const audio = new Audio(`${PUBLIC_BASE}/audio/narration/${filename}`);
  activeNarrationAudio = audio;
  const release = () => {
    if (activeNarrationAudio === audio) activeNarrationAudio = null;
  };
  audio.addEventListener("ended", release, { once: true });
  audio.addEventListener("error", release, { once: true });
  audio.play().catch(release);
}

function useDialogFocus(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const firstControl = dialog.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      (firstControl ?? dialog).focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      returnFocusRef.current?.focus();
    };
  }, []);

  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeRef.current();
      return;
    }
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.getClientRects().length > 0);
    if (!controls.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return { dialogRef, onDialogKeyDown };
}

function playSound(kind: "tap" | "win" | "open", muted: boolean) {
  if (muted || typeof window === "undefined") return;
  const AudioCtor = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return;
  const audio = new AudioCtor();
  const notes = kind === "win" ? [392, 523, 659] : kind === "open" ? [220, 440] : [330];
  notes.forEach((note, i) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = note;
    gain.gain.setValueAtTime(0.055, audio.currentTime + i * .1);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + i * .1 + .09);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(audio.currentTime + i * .1);
    oscillator.stop(audio.currentTime + i * .1 + .1);
  });
  window.setTimeout(() => audio.close(), 700);
}

function pixelIconName(icon: string) {
  return Array.from(icon)
    .map((character) => character.codePointAt(0)?.toString(16))
    .filter((codePoint) => codePoint && codePoint !== "fe0f")
    .join("-");
}

function PixelIcon({ icon, label, className = "" }: { icon: string; label?: string; className?: string }) {
  return <Image
    className={`pixel-icon ${className}`.trim()}
    src={`${PUBLIC_BASE}/pixel-icons/${pixelIconName(icon)}.png`}
    width={20}
    height={20}
    unoptimized
    alt={label ?? ""}
    aria-hidden={label ? undefined : true}
    draggable={false}
  />;
}

function PixelText({ text }: { text: string }) {
  const parts = emojiSegmenter
    ? Array.from(emojiSegmenter.segment(text), ({ segment }) => segment)
    : [text];
  return <>{parts.map((part, index) => pictograph.test(part)
    ? <PixelIcon icon={part} key={`${part}-${index}`} />
    : part)}</>;
}

function PixelHeart({ filled }: { filled: boolean }) {
  return <span className={filled ? "heart filled" : "heart"} aria-hidden="true"><PixelIcon icon="♥" /></span>;
}

function XPBar({ xp }: { xp: number }) {
  return <div
    className="xp-wrap"
    role="progressbar"
    aria-label="Brave experience points"
    aria-valuemin={0}
    aria-valuemax={500}
    aria-valuenow={Math.min(xp, 500)}
    aria-valuetext={`${xp} brave experience points`}
  >
    <span><PixelIcon icon="⚡" /> {xp} XP</span>
    <div className="xp-track"><i style={{ width: `${Math.min(100, xp / 5)}%` }} /></div>
  </div>;
}

function OfflineReadinessIndicator({ status }: { status: OfflineStatus }) {
  const copy = {
    checking: ["Checking offline pack…", "Keep this page connected for a moment."],
    caching: ["Saving offline pack…", "Keep this page online until the ready message appears."],
    ready: ["Ready for offline play", "All 11 quests, HEAR IT narration, icons, and built-in sounds are saved."],
    error: ["Offline pack needs Wi-Fi", "Reconnect, reopen Brave Blocks, and wait for the ready message."],
    unsupported: ["Offline play is unavailable", "This browser does not support the offline game pack."],
  }[status];
  return <div className={`offline-readiness ${status}`} role="status" aria-live="polite">
    <span aria-hidden="true">●</span>
    <div><strong>{copy[0]}</strong><small>{copy[1]}</small></div>
  </div>;
}

function RegulationSkip({ onSkip }: { onSkip: () => void }) {
  return <button
    type="button"
    className="regulation-skip"
    onClick={onSkip}
    aria-label={`Not today, skip. ${SKIP_AFFIRMATION}`}
  >
    <span><PixelIcon icon="⏭️" /></span>
    <span>
      <strong>NOT TODAY — SKIP</strong>
      <small>{SKIP_AFFIRMATION}</small>
    </span>
  </button>;
}

function AdultGateButton({
  className,
  ariaLabel,
  onUnlock,
  onNeedKeyboardCheck,
  children,
}: {
  className: string;
  ariaLabel: string;
  onUnlock: () => void;
  onNeedKeyboardCheck: () => void;
  children: React.ReactNode;
}) {
  const holdTimer = useRef<number | null>(null);
  const unlockedByHold = useRef(false);
  const [holding, setHolding] = useState(false);

  const cancelHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
  };

  useEffect(() => () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
  }, []);

  const startHold = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    cancelHold();
    unlockedByHold.current = false;
    setHolding(true);
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      unlockedByHold.current = true;
      setHolding(false);
      onUnlock();
    }, ADULT_HOLD_MS);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (unlockedByHold.current) {
      unlockedByHold.current = false;
      return;
    }
    onNeedKeyboardCheck();
  };

  return <button
    type="button"
    className={`${className} adult-hold-button${holding ? " holding" : ""}`}
    aria-label={`${ariaLabel}. Press and hold for 3 seconds. Tap once for the keyboard or screen-reader check.`}
    onPointerDown={startHold}
    onPointerUp={cancelHold}
    onPointerCancel={cancelHold}
    onPointerLeave={cancelHold}
    onContextMenu={(event) => event.preventDefault()}
    onClick={handleClick}
  >
    <i className="adult-hold-progress" aria-hidden="true" />
    {children}
    <span className="sr-only" aria-live="polite">{holding ? "Keep holding. Grown-up check in progress." : ""}</span>
  </button>;
}

function AdultGateDialog({
  area,
  onClose,
  onUnlock,
}: {
  area: AdultArea;
  onClose: () => void;
  onUnlock: () => void;
}) {
  const { dialogRef, onDialogKeyDown } = useDialogFocus(onClose);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const areaName = area === "guide" ? editionContent.grownupGateName : "Fire Tablet Setup";
  const inputId = `adult-check-${area}`;

  const checkAnswer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (answer.trim() === "24") {
      setError("");
      onUnlock();
      return;
    }
    setAnswer("");
    setError("Not quite. Try again, or close this check.");
  };

  return <div
    ref={dialogRef}
    className="adult-gate-screen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="adult-gate-title"
    aria-describedby="adult-gate-help"
    tabIndex={-1}
    onKeyDown={onDialogKeyDown}
  >
    <section className="adult-gate-card">
      <button className="adult-gate-close" onClick={onClose} aria-label="Close grown-up check">×</button>
      <span className="adult-gate-icon"><PixelIcon icon="🔑" /></span>
      <small>GROWN-UP CHECK</small>
      <h2 id="adult-gate-title">Unlock {areaName}</h2>
      <p id="adult-gate-help">On a touch screen, close this box and hold the grown-up button for 3 seconds. Keyboard and screen-reader users can answer below.</p>
      <form className="adult-math-check" onSubmit={checkAnswer}>
        <label htmlFor={inputId}>Type the answer: What is 6 × 4?</label>
        <input
          id={inputId}
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
            setError("");
          }}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "adult-gate-error" : undefined}
        />
        <button type="submit">CHECK ANSWER →</button>
        {error && <p id="adult-gate-error" className="adult-gate-error" role="alert">{error}</p>}
      </form>
    </section>
  </div>;
}

function Victory({
  loot, avatar, reward, completionNote, onClose,
}: {
  loot: Loot;
  avatar: string;
  reward: number;
  completionNote: string;
  onClose: () => void;
}) {
  const { dialogRef, onDialogKeyDown } = useDialogFocus(onClose);
  return <div
    ref={dialogRef}
    className="victory-screen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="victory-title"
    aria-describedby="victory-loot"
    tabIndex={-1}
    onKeyDown={onDialogKeyDown}
  >
    <div className="confetti" aria-hidden="true">{["■","●","▲","★","■","●","▲","★","■","●","▲","★"].map((x, i) => <i key={i}>{x}</i>)}</div>
    <div className="loot-card">
      <span className="victory-avatar"><PixelIcon icon={avatar} /></span>
      <small>QUEST W · +{reward} XP</small>
      <h2 id="victory-title">YOU COOKED!</h2>
      {completionNote && <div className="skip-victory-note">
        <span><PixelIcon icon="⏭️" /></span>
        <div><strong>{completionNote}</strong><small>No explaining needed.</small></div>
      </div>}
      <p>Rare loot unlocked:</p>
      <div className="loot-drop" id="victory-loot"><span><PixelIcon icon={loot.icon} /></span><strong>{loot.name}</strong><em>{loot.line}</em></div>
      <button onClick={onClose}>EQUIP + KEEP PLAYING →</button>
    </div>
  </div>;
}

function VoiceLab({ onClose }: { onClose: () => void }) {
  const { dialogRef, onDialogKeyDown } = useDialogFocus(onClose);
  return <div
    ref={dialogRef}
    className="portal-screen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="voice-lab-title"
    tabIndex={-1}
    onKeyDown={onDialogKeyDown}
  >
    <section className="portal-card voice-lab">
      <button className="portal-close" onClick={onClose} aria-label="Close narrator choices">×</button>
      <small>ORIGINAL VOICE PACK</small>
      <h2 id="voice-lab-title"><PixelIcon icon="🎙️" /> QUEST HOST ONLINE</h2>
      <p>This original gaming-adventure narrator is prerecorded, so it sounds the same on the phone, computer, and Fire tablet.</p>
      <div className="voice-grid single">
        <button className="voice-card active" onClick={() => say(NARRATOR_SAMPLE)}>
          <span><PixelIcon icon="🎮" /></span><strong>PIXEL QUEST HOST</strong><small>Playful block-building quest energy + gentle support</small><i><PixelIcon icon="🔊" /> TAP TO HEAR</i>
        </button>
      </div>
      <div className="voice-note"><strong><PixelIcon icon="🔐" /> PRIVATE BY DESIGN</strong><p>The voice is already inside the game. The player’s taps and choices are never sent to a voice service.</p></div>
      <p className="device-voice-note">No robotic phone or tablet voice. No celebrity, influencer, or character imitation.</p>
      <button className="primary" onClick={onClose}>LOCK IT IN →</button>
    </section>
  </div>;
}

type PauseMove = { icon: string; name: string; line: string };

const pauseMoves: PauseMove[] = [
  { icon: "🫧", name: "AXO BUBBLES", line: "Slow in. Longer out. No rush." },
  { icon: "🧱", name: "WALL POWER", line: "Push the wall with safe hands." },
  { icon: "🕳️", name: "QUIET CAVE", line: "Less sound. Less talking. Just pause." },
  { icon: "🧑", name: "GET MY GROWN-UP", line: "Go to your safe grown-up now. You do not have to explain first." },
];

function PausePortal({ onClose }: { onClose: () => void }) {
  const { dialogRef, onDialogKeyDown } = useDialogFocus(onClose);
  const [move, setMove] = useState<PauseMove | null>(null);
  useEffect(() => {
    stopNarration();
    window.dispatchEvent(new Event("brave-blocks-pause"));
  }, []);

  const choose = (item: PauseMove) => {
    setMove(item);
    if (item.name !== "QUIET CAVE") say(`${item.name}. ${item.line}`);
    else stopNarration();
  };
  const skip = () => {
    stopNarration();
    setMove({ icon: "⏭️", name: "NOT TODAY — SKIP", line: SKIP_AFFIRMATION });
    say("Pass unlocked. No explaining needed.");
  };

  return <div
    ref={dialogRef}
    className="portal-screen pause-screen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="pause-portal-title"
    tabIndex={-1}
    onKeyDown={onDialogKeyDown}
  >
    <section className="portal-card pause-card">
      <button className="portal-close" onClick={onClose} aria-label="Close Pause Portal">×</button>
      <span className="portal-icon"><PixelIcon icon="⏸️" /></span>
      <small>PAUSE PORTAL UNLOCKED</small>
      <h2 id="pause-portal-title">NO EXPLAINING NEEDED</h2>
      <p>Pick one. Point to one. Or just hang here.</p>
      <div className="pause-grid">
        {pauseMoves.map((item) => <button aria-pressed={move?.name === item.name} className={move?.name === item.name ? "pause-move active" : "pause-move"} key={item.name} onClick={() => choose(item)}>
          <span><PixelIcon icon={item.icon} /></span><strong>{item.name}</strong><small>{item.line}</small>
        </button>)}
      </div>
      <RegulationSkip onSkip={skip} />
      {move && <div className="pause-result"><span><PixelIcon icon={move.icon} /></span><div><strong>{move.name}</strong><p>{move.line}</p></div></div>}
      <button className="primary" onClick={onClose}>I’M READY / GO BACK →</button>
    </section>
  </div>;
}

function Home({
  go, avatar, setAvatar, xp, collection, claimed, mysteryEgg, claimBonus,
  powerKitPicks, togglePowerKitChoice, playerName, setPlayerName,
  requestReset, openInstallSetup, requestInstallCheck,
}: {
  go: (quest: Quest) => void;
  avatar: string;
  setAvatar: (avatar: string) => void;
  xp: number;
  collection: Loot[];
  claimed: boolean;
  mysteryEgg: EasterEgg | null;
  claimBonus: () => void;
  powerKitPicks: string[];
  togglePowerKitChoice: (id: string, label: string) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  requestReset: () => void;
  openInstallSetup: () => void;
  requestInstallCheck: () => void;
}) {
  const quests = [
    { id: "feelings" as Quest, icon: "🧪", title: "Vibe Mixer", text: "Mix feeling energy", color: "yellow", tag: "COMBO MODE" },
    { id: "body" as Quest, icon: "📡", title: "Body Radar", text: "Scan secret clues", color: "blue", tag: "SCANNER MODE" },
    { id: "calm" as Quest, icon: "🐉", title: "Dragon Battle", text: "Charge your shield", color: "purple", tag: "BOSS MODE" },
    { id: "loadout" as Quest, icon: "🎒", title: "Meeting Loadout", text: "Pack choices + power words", color: "gold", tag: "PREP MODE" },
    { id: "meeting" as Quest, icon: "🛡️", title: "Talk Power-Up", text: "Choose your move", color: "orange", tag: "ROLE-PLAY MODE" },
    { id: "base" as Quest, icon: "🏰", title: "Build Mode", text: "Stack your squad", color: "green", tag: "CREATIVE MODE" },
    { id: "safety" as Quest, icon: "👐", title: "Safety Power-Ups", text: "Give your body a mission", color: "red", tag: "GENTLE MODE" },
    { id: "parkour" as Quest, icon: "☁️", title: "Pixel Parkour", text: "Jump the slime", color: "teal", tag: "ARCADE MODE" },
    { id: "beats" as Quest, icon: "🎵", title: activeProfile.stationTitle, text: activeProfile.stationSubtitle, color: "pink", tag: "MUSIC MODE" },
    { id: "stories" as Quest, icon: "✨", title: "Courage Campfire", text: "Tap a crew story", color: "gold", tag: "STORY MODE" },
    { id: "machine" as Quest, icon: "🌀", title: "Feeling Machine", text: "Run a feeling. Change the ending", color: "purple", tag: "MACHINE MODE" },
  ];

  return <>
    <section className="hero key-art-hero">
      <h1 className="sr-only" data-route-heading tabIndex={-1}>Brave Blocks: big feelings, brave words, wild quests</h1>
      <Image
        className="hero-art"
        src={`${PUBLIC_BASE}/og.png`}
        width={1672}
        height={941}
        priority
        alt="Brave Blocks voxel world with Axo Maxxo, Capy Bappy, Dumpling Supreme, DJ Glorp, a safe home, a story circle, and a music stage"
      />
      <div className="hero-status">
        <span className="status-avatar"><PixelIcon icon={avatar} /></span>
        <div><small>{(playerName.trim() || activeProfile.playerLabel).toUpperCase()} HAS ENTERED THE WORLD</small><strong>CHOOSE A PLAYER · PICK A QUEST · GET THE W</strong></div>
        <span className="status-live">● SAFE BASE ONLINE</span>
      </div>
      <div className="promise key-art-promise">
        <span><PixelIcon icon="💚" /></span>
        <p><strong>HOME-BASE BUFF</strong><br />Loved. Not alone. Grown-up problems = not your fault.</p>
      </div>
    </section>

    <section className="player-deck">
      <div>
        <small>CHOOSE YOUR PLAYER</small>
        <div className="avatar-row">{avatars.map((a) => <button key={a.name} title={a.name} aria-label={`Choose ${a.name}`} aria-pressed={avatar === a.icon} className={avatar === a.icon ? "avatar-pick active" : "avatar-pick"} onClick={() => { playSound("tap", false); say(`${a.name} selected`); setAvatar(a.icon); }}><PixelIcon icon={a.icon} /></button>)}</div>
        <label className="player-name-entry">
          <span>PLAYER NAME · STAYS ON THIS SCREEN</span>
          <input
            value={playerName}
            maxLength={16}
            autoComplete="off"
            spellCheck={false}
            placeholder="PLAYER 1"
            aria-label="Optional player name. It stays only on this screen."
            onChange={(event) => setPlayerName(event.target.value)}
          />
        </label>
      </div>
      <button className={claimed ? "mystery claimed" : "mystery"} onClick={claimBonus} disabled={claimed}>
        <span>{claimed ? <PixelIcon icon={mysteryEgg?.icon ?? "✨"} /> : "?"}</span>
        <strong>{claimed ? mysteryEgg?.title ?? "MYSTERY W CLAIMED" : "CRACK MYSTERY BLOCK"}</strong>
        <small>{claimed ? mysteryEgg?.line ?? "+25 XP · huge" : "tap for surprise XP"}</small>
      </button>
      <div className="mini-inventory"><small>YOUR LOOT</small><div>{collection.length ? collection.slice(-5).map((item, i) => <span title={item.name} key={`${item.name}-${i}`}><PixelIcon icon={item.icon} /></span>) : <p>win a quest →</p>}</div></div>
    </section>

    <details className="power-kit">
      <summary><span className="power-kit-icon"><PixelIcon icon="🎒" /></span><span className="power-kit-summary-copy"><small>{activeProfile.modeLabel}</small><strong>MY POWER KIT</strong><em>{powerKitPicks.length ? `${powerKitPicks.length} ready · ${activeProfile.favoriteComfortTools.length} choices` : `${activeProfile.favoriteComfortTools.length} choices inside`}</em></span><b>OPEN +</b></summary>
      <div className="power-kit-panel">
        <p><strong>I have choices when my signal gets big.</strong> I do not have to fix it fast.</p>
        <p className="power-kit-picker-help">Tap any that may help. Pick one, many, or none.</p>
        <ul aria-label="Power Kit choices">{activeProfile.favoriteComfortTools.map((tool) => {
          const picked = powerKitPicks.includes(tool.id);
          return <li key={tool.id}><button
            type="button"
            className="power-kit-choice"
            aria-pressed={picked}
            onClick={() => togglePowerKitChoice(tool.id, tool.label)}
          >
            <PixelIcon icon={tool.icon} />
            <span>{tool.label}</span>
            <b>{picked ? "READY ✓" : "PICK +"}</b>
          </button></li>;
        })}</ul>
        <div className="power-kit-buddy">
          <span><PixelIcon icon={activeProfile.animalCompanion?.icon ?? "🐾"} /></span>
          <p><small>POWER PHRASE</small><strong>“{activeProfile.preferredPhrases[0]}”</strong></p>
        </div>
        <button className="reset-play-button" onClick={requestReset}><PixelIcon icon="🔁" /> GROWN-UP · RESET THIS PLAY</button>
      </div>
    </details>

    <section className="crew-section">
      <div className="crew-title"><small>THE CHAOS CREW</small><strong>Original weird little legends</strong></div>
      <div className="crew-grid">{chaosCrew.map((friend) => <button key={friend.name} className={`crew-card ${friend.color}`} onClick={() => { playSound("tap", false); say(`${friend.name}. ${friend.line}`); }}>
        <span><PixelIcon icon={friend.icon} /></span><div><strong>{friend.name}</strong><small>{friend.line}</small></div>
      </button>)}</div>
    </section>

    <AdultGateButton
      className="install-banner"
      ariaLabel="Grown-ups: open Fire Tablet setup"
      onUnlock={openInstallSetup}
      onNeedKeyboardCheck={requestInstallCheck}
    >
      <span><PixelIcon icon="📲" /></span><div><small>GROWN-UP SETUP</small><strong>HOLD 3 SECONDS FOR FIRE TABLET SETUP</strong><em>or tap once for the accessible grown-up check</em></div><b>HOLD →</b>
    </AdultGateButton>

    <section className="quest-section">
      <div className="section-title"><span>✦</span><div><small>THE QUEST MAP</small><h2>Pick your next W</h2></div><span>✦</span></div>
      <div className="quest-grid">
        {quests.map((q) => {
          const titleId = `quest-${q.id}-title`;
          const descriptionId = `quest-${q.id}-description`;
          return <article className={`quest-card ${q.color}`} key={q.id}>
            <span className="quest-number">{q.tag}</span>
            <span className="quest-icon"><PixelIcon icon={q.icon} /></span>
            <h3 id={titleId}>{q.title}</h3>
            <p id={descriptionId}>{q.text}</p>
            <em aria-hidden="true">LOCK IN →</em>
            <button
              className="quest-card-action"
              onClick={() => go(q.id)}
              aria-labelledby={`${titleId} ${descriptionId}`}
            ><span className="sr-only">Open quest</span></button>
          </article>;
        })}
      </div>
      <p className="level-line"><PixelText text={xp >= 500 ? "🏆 MAX BRAVE AURA UNLOCKED" : `⚡ ${500 - Math.min(xp, 500)} XP TO MAX BRAVE AURA`} /></p>
    </section>
    <p className="privacy-note"><PixelIcon icon="🔐" /> No saves. No sending. Your picks stay on this screen.</p>
  </>;
}

function FeelingMachine({
  earn,
  skip,
  muted,
}: {
  earn: () => void;
  skip: () => void;
  muted: boolean;
}) {
  const [storyId, setStoryId] = useState<string | null>(null);
  const [ownFeelingId, setOwnFeelingId] = useState("mixed");
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<MachineChoice | null>(null);
  const completed = useRef(false);
  const story = machineStories.find((item) => item.id === storyId) ?? null;
  const feeling = machineFeelings.find((item) => item.id === (story?.id === "own" ? ownFeelingId : story?.emotionId))
    ?? machineFeelings.at(-1)!;

  const stageSpeech = (nextStep: number, activeStory = story, activeFeeling = feeling) => {
    if (!activeStory) return "Feeling Machine. Pick a pretend Chaos Crew story, or keep your own vibe private.";
    if (nextStep === 0) return `Step one. What hit? ${activeStory.vulnerability} Then, ${activeStory.event}`;
    if (nextStep === 1) return `Step two. Brain and body scan. The brain said, ${activeStory.thought} The body clue is ${activeFeeling.body}.`;
    if (nextStep === 2) return `Step three. Feeling boss. ${activeFeeling.name}. ${activeFeeling.nickname}. ${activeFeeling.message}`;
    if (nextStep === 3) return `Step four. Move loading. The first urge might be: ${activeFeeling.urge}. An urge is a clue, not a command.`;
    return "Step five. Plot twist portal. Pick a safe move to change what happens next.";
  };

  const startStory = (id: string) => {
    const nextStory = machineStories.find((item) => item.id === id);
    if (!nextStory) return;
    const nextFeeling = machineFeelings.find((item) => item.id === (id === "own" ? ownFeelingId : nextStory.emotionId))
      ?? machineFeelings.at(-1)!;
    setStoryId(id);
    setStep(0);
    setChoice(null);
    setStarted(id !== "own");
    completed.current = false;
    playSound("open", muted);
    if (id !== "own") say(stageSpeech(0, nextStory, nextFeeling));
  };

  const startPrivate = () => {
    if (!story) return;
    setStarted(true);
    playSound("open", muted);
    say(stageSpeech(0));
  };

  const moveTo = (nextStep: number) => {
    setStep(nextStep);
    setChoice(null);
    playSound("tap", muted);
    say(stageSpeech(nextStep));
  };

  const finish = () => {
    if (completed.current) return;
    completed.current = true;
    earn();
  };

  const pass = () => {
    if (completed.current) return;
    completed.current = true;
    skip();
  };

  if (!started) return <QuestShell
    title="Feeling Machine"
    subtitle="Run a feeling. Change the ending."
    icon="🌀"
    spokenInstructions="Feeling Machine. Pick a pretend Chaos Crew story, or keep your own vibe private."
  >
    <div className="machine-portal">
      <div className="machine-intro">
        <span><PixelIcon icon="🧪" /></span>
        <div><small>MACHINE MODE</small><h2>FEELINGS DROP CLUES</h2><p>Pretend stories first. Your own details stay optional.</p></div>
      </div>
      <div className="machine-story-grid" aria-label="Pick a story">
        {machineStories.map((item) => <button
          type="button"
          key={item.id}
          className={storyId === item.id ? "machine-story-card active" : "machine-story-card"}
          aria-pressed={storyId === item.id}
          onClick={() => startStory(item.id)}
        >
          <span><PixelIcon icon={item.icon} /></span>
          <strong>{item.crew}</strong>
          <small>{item.teaser}</small>
          <b>{item.id === "own" ? "PRIVATE MODE →" : "RUN STORY →"}</b>
        </button>)}
      </div>
      {story?.id === "own" && <section className="machine-own-picker" aria-labelledby="own-vibe-title">
        <small>MY OWN VIBE · NO STORY NEEDED</small>
        <h2 id="own-vibe-title">Pick a feeling boss</h2>
        <p>You can point. You never have to tell what happened.</p>
        <div className="machine-feeling-grid">
          {machineFeelings.map((item) => <button
            type="button"
            key={item.id}
            aria-pressed={ownFeelingId === item.id}
            className={ownFeelingId === item.id ? "active" : ""}
            style={{ "--feeling-color": item.color } as React.CSSProperties}
            onClick={() => {
              setOwnFeelingId(item.id);
              playSound("tap", muted);
              say(`${item.name}. ${item.nickname}. ${item.message}`);
            }}
          >
            <span><PixelIcon icon={item.face} /></span>
            <strong>{item.name}</strong>
            <small>{item.nickname}</small>
          </button>)}
        </div>
        <button type="button" className="primary machine-private-start" onClick={startPrivate}>START PRIVATE · DETAILS STAY MYSTERY →</button>
      </section>}
      <RegulationSkip onSkip={pass} />
    </div>
  </QuestShell>;

  if (!story) return null;

  return <QuestShell
    title="Feeling Machine"
    subtitle="Run a feeling. Change the ending."
    icon="🌀"
    spokenInstructions={stageSpeech(step)}
  >
    <div className="machine-shell">
      <div className="machine-progress" role="progressbar" aria-label="Feeling Machine steps" aria-valuemin={1} aria-valuemax={5} aria-valuenow={step + 1}>
        <strong>STAGE {step + 1} / 5</strong>
        <div>{[0, 1, 2, 3, 4].map((item) => <i key={item} className={item <= step ? "active" : ""} />)}</div>
      </div>

      <section className="machine-stage-card" style={{ "--machine-color": feeling.color } as React.CSSProperties}>
        {step === 0 && <>
          <span className="machine-stage-icon"><PixelIcon icon="⚡" /></span>
          <small className="machine-stage-kicker">WHAT HIT?</small>
          <h2 className="machine-stage-title">THE LEVEL CHANGED</h2>
          <div className="machine-clue"><b>BEFORE</b><p>{story.vulnerability}</p></div>
          <div className="machine-clue"><b>THEN</b><p>{story.event}</p></div>
        </>}
        {step === 1 && <>
          <span className="machine-stage-icon"><PixelIcon icon="🧠" /></span>
          <small className="machine-stage-kicker">BRAIN + BODY SCAN</small>
          <h2 className="machine-stage-title">THE ALARM MADE A STORY</h2>
          <div className="machine-clue brain"><b>BRAIN STORY</b><p>“{story.thought}”</p></div>
          <div className="machine-clue body"><b>BODY CLUES</b><p>{feeling.body}</p></div>
          <p className="machine-no-cap">A brain story can feel true. We can still spy for no-cap facts.</p>
        </>}
        {step === 2 && <>
          <span className="machine-stage-icon feeling" style={{ background: feeling.color }}><PixelIcon icon={feeling.face} /></span>
          <small className="machine-stage-kicker">FEELING BOSS</small>
          <h2 className="machine-feeling-name">{feeling.name}</h2>
          <strong className="machine-feeling-nickname">{feeling.nickname}</strong>
          <p className="machine-stage-copy">{feeling.message}</p>
          <div className="machine-signal"><b>MESSAGE TO ME</b><p>“Something matters. Slow down and get clues.”</p></div>
        </>}
        {step === 3 && <>
          <span className="machine-stage-icon"><PixelIcon icon="🎮" /></span>
          <small className="machine-stage-kicker">MOVE LOADING…</small>
          <h2 className="machine-stage-title">THE FIRST URGE</h2>
          <div className="machine-urge"><PixelIcon icon="🛡️" /><p>{feeling.urge}</p></div>
          <p className="machine-stage-copy"><strong>NO CAP:</strong> An urge is a clue, not a command. You still pick the move.</p>
        </>}
        {step === 4 && <>
          <span className="machine-stage-icon"><PixelIcon icon="🌀" /></span>
          <small className="machine-stage-kicker">PLOT-TWIST PORTAL</small>
          <h2 className="machine-stage-title">PICK THE NEXT MOVE</h2>
          <div className="machine-choice-grid">
            {story.choices.map((item) => <button
              type="button"
              key={item.label}
              className={choice?.label === item.label ? "machine-choice active" : "machine-choice"}
              aria-pressed={choice?.label === item.label}
              onClick={() => {
                setChoice(item);
                playSound("open", muted);
                say(item.spoken);
              }}
            >
              <span><PixelIcon icon={item.icon} /></span><strong>{item.label}</strong><small>{item.ending}</small>
            </button>)}
          </div>
          {choice && <div className="machine-ending" role="status">
            <span><PixelIcon icon="✨" /></span>
            <div><small>NEW SIGNAL TO OTHERS</small><p>{choice.signal}</p><strong>NEW ENDING: {choice.ending}</strong></div>
          </div>}
        </>}
      </section>

      <div className="machine-controls">
        <button type="button" className="secondary" onClick={() => step === 0 ? setStarted(false) : moveTo(step - 1)}>← BACK</button>
        <button type="button" className="secondary machine-hear" onClick={() => say(stageSpeech(step))}><PixelIcon icon="🔊" /> HEAR</button>
        {step < 4
          ? <button type="button" className="primary" onClick={() => moveTo(step + 1)}>NEXT →</button>
          : <button type="button" className="primary" disabled={!choice} onClick={finish}>PORTAL W · GET LOOT →</button>}
      </div>
      <RegulationSkip onSkip={pass} />
    </div>
  </QuestShell>;
}

function Feelings({ earn, muted }: { earn: () => void; muted: boolean }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [axoMove, setAxoMove] = useState("");
  const toggle = (name: string, clue: string) => {
    playSound("tap", muted);
    say(`${name}. ${clue}.`);
    setPicked((p) => p.includes(name) ? p.filter((x) => x !== name) : [...p, name]);
  };
  return <QuestShell title="Vibe Mixer" subtitle="Tap your whole feeling squad." icon="🧪">
    <div className={`mixer ${picked.length > 1 ? "ultra" : ""}`}>
      <div className="mixer-jar"><div>{picked.map((name) => <span key={name}><PixelIcon icon={feelings.find((f) => f.name === name)?.face ?? "🫨"} /></span>)}</div></div>
      <div><small>LIVE VIBE CHECK</small><h2>{picked.length === 0 ? "EMPTY MIX" : picked.length === 1 ? `${picked[0]} MODE` : `${picked.length}X COMBO!`}</h2><p>{picked.length > 1 ? <PixelText text="ULTRA RARE MIXED FEELINGS ✨" /> : "Choose what is here right now."}</p></div>
    </div>
    <div className="feeling-grid">
      {feelings.map((f) => <button key={f.name} aria-pressed={picked.includes(f.name)} onClick={() => toggle(f.name, f.clue)} className={`feeling-block ${picked.includes(f.name) ? "selected" : ""}`} style={{ "--block": f.color } as React.CSSProperties}>
        <span><PixelIcon icon={f.face} /></span><strong>{f.name}</strong><small>{f.clue}</small><i>{picked.includes(f.name) ? "IN THE MIX ✓" : "ADD +"}</i>
      </button>)}
    </div>
    <div className="axo-buddy">
      <div className={picked.length > 1 ? "axo-avatar rainbow" : "axo-avatar"}><PixelIcon icon="🦎" /></div>
      <div className="axo-copy">
        <small>AXO MAXXO’S VIBE CHECK</small>
        <h3>{picked.length ? `${picked.join(" + ")} CAN ALL BE HERE` : "NO VIBE HAS TO BE PICKED"}</h3>
        <p>{picked.length ? "Nothing to fix. Want wiggle energy or cozy energy?" : "Tap a feeling, point at one, or pass. Still a W."}</p>
        <div>
          <button aria-pressed={axoMove === "wiggle"} className={axoMove === "wiggle" ? "active" : ""} onClick={() => { setAxoMove("wiggle"); playSound("tap", muted); say("Wiggle mode. Shake, then freeze."); }}><PixelIcon icon="🕺" /> WIGGLE</button>
          <button aria-pressed={axoMove === "cozy"} className={axoMove === "cozy" ? "active" : ""} onClick={() => { setAxoMove("cozy"); playSound("open", muted); say("Cozy mode. Hold something soft."); }}><PixelIcon icon="🧸" /> COZY</button>
          <button aria-pressed={axoMove === "pass"} className={axoMove === "pass" ? "active" : ""} onClick={() => { setAxoMove("pass"); say("Pass unlocked. No explaining needed."); }}><PixelIcon icon="⏭️" /> PASS</button>
        </div>
      </div>
    </div>
    {(picked.length > 0 || axoMove) && <div className="quest-result" role="status"><span className="big"><PixelIcon icon={picked.length ? "🔥" : "⏭️"} /></span><div><strong>{picked.length ? "That mix is valid. Huge W." : "You made a choice. Huge W."}</strong><p>{picked.length ? "Opposite feelings can team up. Nothing weird about it." : "Passing, wiggling, or getting cozy all count."}</p></div><button onClick={earn}>CRAFT LOOT →</button></div>}
  </QuestShell>;
}

function BodyQuest({ earn, skip, muted }: { earn: () => void; skip: () => void; muted: boolean }) {
  const [spot, setSpot] = useState<(typeof bodySpots)[number] | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const scan = (label: string) => {
    playSound("open", muted);
    say(`${label}. Clue found.`);
    setFound((items) => items.includes(label) ? items : [...items, label]);
  };
  const power = Math.min(100, found.length * 25);
  return <QuestShell title="Body Radar" subtitle="Your body drops clues. Scan them." icon="📡">
    <div className="scanner-top" role="progressbar" aria-label="Radar power" aria-valuemin={0} aria-valuemax={100} aria-valuenow={power}><span>RADAR POWER</span><div><i style={{ width: `${power}%` }} /></div><strong>{power}%</strong></div>
    <div className="body-layout">
      <div className={`block-person ${spot ? "scanning" : ""}`} role="img" aria-label="Body map">
        <div className="scan-line" /><div className="bp-head"><PixelIcon icon="🙂" /></div><div className="bp-body"><PixelIcon icon="♥" /></div><div className="bp-arms">━　━</div><div className="bp-legs">▮　▮</div>
      </div>
      <div className="spot-grid">
        {bodySpots.map((s) => <button key={s.id} aria-pressed={spot?.id === s.id} className={spot?.id === s.id ? "spot active" : "spot"} onClick={() => { playSound("tap", muted); say(s.label); setSpot(s); }}><span><PixelIcon icon={s.icon} /></span>{s.label}</button>)}
      </div>
    </div>
    {spot && <div className="sensation-panel"><h3><PixelIcon icon="📡" /> WHAT’S THE CLUE?</h3><div>{spot.sensations.map((s) => {
      const clue = `${spot.label}: ${s}`;
      return <button key={s} aria-pressed={found.includes(clue)} className={found.includes(clue) ? "chip chosen" : "chip"} onClick={() => scan(clue)}>{s}</button>;
    })}<button aria-pressed={found.includes(`${spot.label}: something else`)} className={found.includes(`${spot.label}: something else`) ? "chip chosen" : "chip"} onClick={() => scan(`${spot.label}: something else`)}>something else</button></div></div>}
    {found.length > 0 && <div className="scan-log" role="status"><strong>CLUE LOG</strong>{found.map((x) => <span key={x}>✓ {x}</span>)}</div>}
    {found.length >= 2 && <button className="primary center" onClick={earn}>RADAR LOCKED IN · GET LOOT →</button>}
    <RegulationSkip onSkip={skip} />
  </QuestShell>;
}

function CalmQuest({ earn, skip, muted }: { earn: () => void; skip: () => void; muted: boolean }) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [won, setWon] = useState(false);
  const breathLabel = running ? calmSteps[step].label : won ? "MAX POWER" : "READY?";
  const dragonPhase = !running
    ? won ? "winner" : "rest"
    : breathLabel === "BREATHE IN"
      ? "inhale"
      : breathLabel === "HOLD"
        ? "hold"
        : breathLabel === "BLOW OUT"
          ? "exhale"
          : "reset";
  const dragonCue = {
    rest: "BELLY READY",
    inhale: "BELLY GROWS",
    hold: "KEEP IT BIG",
    exhale: "BELLY GETS SMALL",
    reset: "REST + RESET",
    winner: "DRAGON CHILL UNLOCKED",
  }[dragonPhase];

  useEffect(() => {
    if (!running) return;
    say(calmSteps[step].label);
    const timer = window.setTimeout(() => {
      if (step === calmSteps.length - 1) {
        setRunning(false); setWon(true); playSound("win", muted); say("Shield maxed. Huge W.");
      } else setStep((s) => s + 1);
    }, calmSteps[step].time);
    return () => window.clearTimeout(timer);
  }, [running, step, muted]);

  const start = () => { playSound("open", muted); setWon(false); setStep(0); setRunning(true); };
  const skipBattle = () => {
    setRunning(false);
    stopNarration();
    skip();
  };
  return <QuestShell title="Dragon Battle" subtitle="Slow breath = max shield power." icon="🐉">
    <div className={`breath-world ${running ? "breathing" : ""} ${won ? "won" : ""}`}>
      <div className="battle-hud" role="progressbar" aria-label="Dragon boss energy" aria-valuemin={0} aria-valuemax={100} aria-valuenow={won ? 0 : Math.round(100 - (step / calmSteps.length) * 100)}><span>DRAGON BOSS</span><div><i style={{ width: won ? "0%" : `${100 - (step / calmSteps.length) * 100}%` }} /></div></div>
      <div className={`dragon breathing-dragon phase-${dragonPhase}`} role="img" aria-label={`Friendly block dragon: ${dragonCue.toLowerCase()}`}>
        <span className="dragon-air dragon-air-in" aria-hidden="true"><PixelIcon icon="💨" />→</span>
        <span className="dragon-face" aria-hidden="true"><PixelIcon icon="🐲" /></span>
        <div className="dragon-body" aria-hidden="true">
          <span className="dragon-wing left">◢</span>
          <span className="dragon-belly"><b>✦</b><em /><em /><em /></span>
          <span className="dragon-wing right">◣</span>
        </div>
        <span className="dragon-feet" aria-hidden="true">▰　▰</span>
        <span className="dragon-air dragon-air-out" aria-hidden="true"><PixelIcon icon="🔥" />→</span>
        <strong className="dragon-cue" aria-live="polite">{dragonCue}</strong>
      </div>
      <div className="breath-orb" aria-live="polite" aria-atomic="true"><span>{breathLabel}</span></div>
      <div className="shield-charge" role="progressbar" aria-label="Shield charge" aria-valuemin={0} aria-valuemax={4} aria-valuenow={won ? 4 : Math.min(4, Math.ceil(step / 2))}><span>SHIELD</span>{[0,1,2,3].map((x) => <i className={won || step > x * 2 ? "charged" : ""} key={x}>◆</i>)}</div>
      <button className="primary" disabled={running} onClick={start}>{running ? "LOCKED IN..." : won ? <PixelText text="REMATCH 🔁" /> : "START BOSS BATTLE"}</button>
      {won && <button className="secondary" onClick={earn}>CLAIM BOSS LOOT →</button>}
      <RegulationSkip onSkip={skipBattle} />
    </div>
  </QuestShell>;
}

function SlimeDoodle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const stampIndexRef = useRef(0);
  const [color, setColor] = useState("#a9ff55");
  const [drawingStatus, setDrawingStatus] = useState("");

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  };
  const begin = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const next = point(event);
    context.beginPath();
    context.moveTo(next.x, next.y);
  };
  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    event.preventDefault();
    const next = point(event);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 28;
    context.strokeStyle = color;
    context.lineTo(next.x, next.y);
    context.stroke();
  };
  const finish = () => {
    drawingRef.current = false;
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    stampIndexRef.current = 0;
    setDrawingStatus("Drawing cleared.");
  };
  const stampKeyboardPixel = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const columns = 8;
    const index = stampIndexRef.current;
    const x = 45 + (index % columns) * 105;
    const y = 45 + (Math.floor(index / columns) % 3) * 95;
    context.fillStyle = color;
    context.fillRect(x - 24, y - 24, 48, 48);
    context.strokeStyle = "#090b2d";
    context.lineWidth = 6;
    context.strokeRect(x - 24, y - 24, 48, 48);
    stampIndexRef.current += 1;
    setDrawingStatus(`Slime pixel ${stampIndexRef.current} added.`);
  };

  return <div className="slime-doodle">
    <div className="slime-tools">
      <strong>DRAW THE VIBE</strong>
      <div>{["#a9ff55", "#ff58c8", "#4de8ff", "#ffe04b", "#9c72ff"].map((item) => <button aria-label={`Use ${item} slime`} aria-pressed={color === item} className={color === item ? "active" : ""} style={{ background: item }} key={item} onClick={() => setColor(item)} />)}</div>
      <button className="slime-stamp" onClick={stampKeyboardPixel}><PixelIcon icon="🟢" /> STAMP PIXEL</button>
      <button className="slime-clear" onClick={clear}><PixelIcon icon="🧽" /> CLEAR</button>
    </div>
    <canvas
      ref={canvasRef}
      width={900}
      height={300}
      onPointerDown={begin}
      onPointerMove={draw}
      onPointerUp={finish}
      onPointerCancel={finish}
      onPointerLeave={finish}
      role="img"
      aria-label="Slime drawing pad"
      aria-describedby="slime-doodle-help slime-doodle-status"
    />
    <p id="slime-doodle-help">Draw with a finger or mouse. Keyboard players can use STAMP PIXEL. It does not save or send.</p>
    <span className="sr-only" id="slime-doodle-status" role="status">{drawingStatus}</span>
  </div>;
}

function MeetingLoadout({ earn, muted }: { earn: () => void; muted: boolean }) {
  const groups = [
    {
      id: "comfort",
      title: "PACK A COZY",
      options: [{ icon: "🧸", label: "Soft thing" }, { icon: "🟢", label: "Slime" }, { icon: "🎧", label: "Headphones" }, { icon: "🥤", label: "Drink" }],
    },
    {
      id: "spot",
      title: "PICK A SPOT",
      options: [{ icon: "🚪", label: "Near door" }, { icon: "🪑", label: "My chair" }, { icon: "💚", label: "Near my person" }, { icon: "↔️", label: "More space" }],
    },
    {
      id: "signal",
      title: "PICK A SIGNAL",
      options: [{ icon: "✋", label: "Hand up" }, { icon: "🟨", label: "Yellow card" }, { icon: "⏸️", label: "Say pause" }, { icon: "👀", label: "Look at my person" }],
    },
  ];
  const people = editionContent.meeting.people;
  const modes = [
    { id: "say", icon: "🗣️", label: "SAY IT" },
    { id: "point", icon: "👉", label: "POINT" },
    { id: "draw", icon: "🎨", label: "DRAW" },
    { id: "pass", icon: "⏭️", label: "PASS" },
  ] as const;
  const landingMoves = [
    { icon: "🥟", label: "Snack" }, { icon: "🎵", label: "Music" }, { icon: "🧸", label: "Cozy" }, { icon: "💃", label: "Move" }, { icon: "☁️", label: "Quiet spot" },
  ];
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<(typeof modes)[number]["id"] | null>(null);
  const [practice, setPractice] = useState("");
  const [landing, setLanding] = useState("");
  const ready = Object.keys(picks).length >= 2 && Boolean(mode);

  const choosePack = (group: string, label: string) => {
    playSound("tap", muted);
    say(label);
    setPicks((items) => ({ ...items, [group]: label }));
  };

  return <QuestShell title="Meeting Loadout" subtitle="Pack choices. Keep your own words." icon="🎒">
    <div className="loadout-rule"><span><PixelIcon icon="🛡️" /></span><div><small>PLAYER RULE</small><h2>YOU CAN SAY IT, POINT, DRAW, OR PASS.</h2><p>No guessing. No choosing sides. No answer earns more points than another.</p></div></div>

    <section className="npc-intros">
      <div className="mini-title"><small>{editionContent.meeting.kicker}</small><h3>{editionContent.meeting.heading}</h3></div>
      <div className="npc-intro-grid">{people.map((person) => <article key={person.name}>
        <span><PixelIcon icon={person.icon} /></span><div><strong>{person.name}</strong><p>{person.line}</p><button onClick={() => say(person.spoken)}><PixelIcon icon="🔊" /> {editionContent.meeting.listenLabel}</button></div>
      </article>)}</div>
      {editionContent.meeting.note && <p className="pro-script-note">{editionContent.meeting.note}</p>}
    </section>

    <section className="loadout-builder">
      <div className="mini-title"><small>GEAR UP</small><h3>Pick what could help</h3></div>
      {groups.map((group) => <div className="loadout-row" key={group.id}>
        <strong>{group.title}</strong>
        <div>{group.options.map((item) => <button aria-pressed={picks[group.id] === item.label} className={picks[group.id] === item.label ? "active" : ""} key={item.label} onClick={() => choosePack(group.id, item.label)}>
          <span><PixelIcon icon={item.icon} /></span><b>{item.label}</b>
        </button>)}</div>
      </div>)}
    </section>

    <section className="choice-portal">
      <div className="mini-title"><small>COMMUNICATION PORTAL</small><h3>How do you want to answer?</h3></div>
      <div className="mode-grid">{modes.map((item) => <button aria-pressed={mode === item.id} className={mode === item.id ? "active" : ""} key={item.id} onClick={() => { setMode(item.id); playSound("open", muted); say(`${item.label} unlocked.`); }}>
        <span><PixelIcon icon={item.icon} /></span><strong>{item.label}</strong>
      </button>)}</div>
      {mode === "say" && <div className="power-phrases">{meetingMoves.slice(1).map((item) => <button aria-pressed={practice === item.words} className={practice === item.words ? "active" : ""} key={item.words} onClick={() => { setPractice(item.words); say(item.words); }}><span><PixelIcon icon={item.icon} /></span><strong>{item.words}</strong></button>)}</div>}
      {mode === "point" && <div className="point-board">{feelings.map((item) => <button aria-pressed={practice === item.name} className={practice === item.name ? "active" : ""} key={item.name} onClick={() => { setPractice(item.name); say(item.name); }}><span><PixelIcon icon={item.face} /></span><strong>{item.name}</strong></button>)}</div>}
      {mode === "draw" && <SlimeDoodle />}
      {mode === "pass" && <div className="pass-card"><span><PixelIcon icon="⏭️" /></span><div><strong>PASS IS A REAL CHOICE</strong><p>“I want to pass for now.” You can come back later—or not.</p><button onClick={() => say("I want to pass for now.")}><PixelIcon icon="🔊" /> HEAR THE WORDS</button></div></div>}
    </section>

    <section className="meeting-map">
      <div><span>1</span><b>FIRST</b><strong><PixelIcon icon="👋" /> Hello</strong></div>
      <i>→</i>
      <div><span>2</span><b>THEN</b><strong><PixelIcon icon="💬" /> Talk, point, draw, or pass</strong></div>
      <i>→</i>
      <div><span>3</span><b>AFTER</b><strong>{landing
        ? <><PixelIcon icon={landingMoves.find((item) => item.label === landing)?.icon ?? "🏠"} /> {landing}</>
        : <><PixelIcon icon="🏠" /> Home Base</>}</strong></div>
    </section>

    <section className="landing-pad">
      <div className="mini-title"><small>AFTER-MEETING LANDING PAD</small><h3>What might your body want?</h3></div>
      <div>{landingMoves.map((item) => <button aria-pressed={landing === item.label} className={landing === item.label ? "active" : ""} key={item.label} onClick={() => { setLanding(item.label); say(`${item.label} landing pad.`); }}><span><PixelIcon icon={item.icon} /></span><strong>{item.label}</strong></button>)}</div>
      <p>You still get care and connection after any answer—or no answer.</p>
    </section>

    {ready && <div className="loadout-ready" role="status"><span><PixelIcon icon="🎒" /><PixelIcon icon="✨" /></span><div><strong>LOADOUT READY</strong><p>You practiced making choices. That is the W.</p></div><button className="primary" onClick={earn}>CLAIM LOADOUT LOOT →</button></div>}
    <p className="loadout-privacy"><PixelIcon icon="🔐" /> Nothing picked, pointed to, or drawn here is saved or sent.</p>
  </QuestShell>;
}

function MeetingQuest({ earn, muted }: { earn: () => void; muted: boolean }) {
  const [round, setRound] = useState(0);
  const [played, setPlayed] = useState(false);
  const [lastMove, setLastMove] = useState<(typeof meetingMoves)[number] | null>(null);
  const complete = round >= meetingRounds.length;

  const move = (choice: (typeof meetingMoves)[number]) => {
    playSound("win", muted);
    say(`${choice.words}. Nice move. Your own words have power.`);
    setLastMove(choice);
    setPlayed(true);
  };
  const next = () => { setLastMove(null); setPlayed(false); setRound((r) => r + 1); };

  return <QuestShell title="Talk Power-Up" subtitle="Boss-level meeting? Choose your move." icon="🛡️">
    <div className="meeting-game">
      <div className="npc-zone">
        <div className="npc"><PixelIcon icon={complete ? "🏆" : meetingRounds[round].icon} /><i /></div>
        <div className="speech-bubble">
          <small>{complete ? "MISSION COMPLETE" : `ROUND ${round + 1} / 3`}</small>
          <p>{complete ? "You practiced using your own words. Main-character energy." : meetingRounds[round].words}</p>
          {!complete && <button onClick={() => say(meetingRounds[round].words)}><PixelIcon icon="🔊" /> HEAR</button>}
        </div>
      </div>
      {!complete && <div className="move-grid">{meetingMoves.map((m) => <button key={m.words} aria-pressed={lastMove?.words === m.words} disabled={played} className={lastMove?.words === m.words ? "move active" : "move"} onClick={() => move(m)}><span><PixelIcon icon={m.icon} /></span><strong>“{m.words}”</strong></button>)}</div>}
      {lastMove && <div className="move-win" role="status"><span>+1 BRAVE AURA</span><strong>“{lastMove.words}”</strong><p>{lastMove.tip} Your answer belongs to you.</p><button onClick={next}>{round === 2 ? "FINISH MISSION →" : "NEXT ROUND →"}</button></div>}
      {complete && <div className="meeting-finish" role="status"><p><PixelIcon icon="🛡️" /> You can use your own words. You can say “I don’t know.” You can ask for a break. You never have to choose sides.</p><button className="primary" onClick={earn}>OPEN POWER LOOT →</button></div>}
    </div>
    <div className="privacy-power"><span><PixelIcon icon="🔒" /></span><p><strong>SMART MOVE:</strong> Ask each grown-up what they will keep private and what they may share.</p></div>
  </QuestShell>;
}

function BaseQuest({ earn, muted }: { earn: () => void; muted: boolean }) {
  const [blocks, setBlocks] = useState<string[]>([]);
  const [coOpPrompt, setCoOpPrompt] = useState("Tap for a two-player mission.");
  const [coOpTurn, setCoOpTurn] = useState("PLAYER");
  const coOpMissions = [
    "Make a feeling face. The other player guesses.",
    "Each player picks one safe move to try.",
    "Build a tiny blanket or pillow base together.",
    "Take turns saying one thing that helps on a hard day.",
    "Do a ten-second freeze dance, then both get cozy.",
  ];
  const toggle = (label: string) => {
    playSound("open", muted); say(label);
    setBlocks((b) => b.includes(label) ? b.filter((x) => x !== label) : b.length < 5 ? [...b, label] : b);
  };
  return <QuestShell title="Build Mode" subtitle="Stack your support squad." icon="🏰">
    <div className="build-hud" role="status"><span>BLOCKS PLACED: {blocks.length}/5</span><strong>{blocks.length >= 3 ? <PixelText text="BASE AURA: ELITE ✨" /> : "TAP TO BUILD"}</strong></div>
    <div className="support-picker">{supportBlocks.map((b) => <button key={b.label} aria-pressed={blocks.includes(b.label)} onClick={() => toggle(b.label)} className={blocks.includes(b.label) ? "support selected" : "support"}><span><PixelIcon icon={b.icon} /></span><strong>{b.label}</strong><i>{blocks.includes(b.label) ? "PLACED ✓" : "+ BLOCK"}</i></button>)}</div>
    <div className={`base-build ${blocks.length >= 3 ? "base-party" : ""}`}>
      <h3><PixelIcon icon="🏳️" /> PLAYER’S SAFE BASE</h3>
      <div className="build-grid">{Array.from({ length: 9 }).map((_, i) => {
        const label = blocks[i % Math.max(blocks.length, 1)];
        const item = blocks.length && i >= 9 - blocks.length ? supportBlocks.find((x) => x.label === label) : null;
        return <div className={item ? "built" : ""} key={i}>{item ? <><span><PixelIcon icon={item.icon} /></span><small>{item.label}</small></> : <i />}</div>;
      })}</div>
      <p className="love-note"><PixelIcon icon="💚" /> I am loved. Easy days. Hard days. Every day.</p>
      {blocks.length >= 2 && <button className="primary" onClick={earn}>SAVE THE BASE · GET LOOT →</button>}
    </div>
    <div className="co-op-card">
      <span><PixelIcon icon="🤝" /></span>
      <div><small>HOME-BASE CO-OP</small><h3>{coOpTurn} TURN</h3><p>{coOpPrompt}</p></div>
      <div className="co-op-actions">
        <button aria-pressed={coOpTurn === "PLAYER"} onClick={() => { setCoOpTurn("PLAYER"); say("Player turn."); }}><PixelIcon icon="🧒" /> MY TURN</button>
        <button aria-pressed={coOpTurn === "GROWN-UP"} onClick={() => { setCoOpTurn("GROWN-UP"); say("Grown-up turn."); }}><PixelIcon icon="🧑" /> GROWN-UP</button>
        <button onClick={() => {
          const next = coOpMissions[Math.floor(Math.random() * coOpMissions.length)];
          setCoOpPrompt(next);
          playSound("open", muted);
          say(next);
        }}><PixelIcon icon="🎲" /> NEW MISSION</button>
      </div>
    </div>
  </QuestShell>;
}

function SafetyQuest({ earn, skip, muted }: { earn: () => void; skip: () => void; muted: boolean }) {
  const missions = [
    {
      icon: "👐", title: "HANDS MISSION", prompt: "Big mad energy! Give your hands a safe job.",
      moves: [
        { icon: "🛏️", words: "Squeeze a pillow" },
        { icon: "🧱", words: "Push the wall" },
        { icon: "🧸", words: "Hold something soft" },
        { icon: "🏗️", words: "Build with blocks" },
      ],
    },
    {
      icon: "🦶", title: "BODY MISSION", prompt: "Your body has zoomies. Move it safely.",
      moves: [
        { icon: "🐻", words: "Bear walk" },
        { icon: "💃", words: "Dance break" },
        { icon: "🫨", words: "Shake, then freeze" },
        { icon: "🚶", words: "Walk with a grown-up" },
      ],
    },
    {
      icon: "📢", title: "WORDS MISSION", prompt: "You need space. Power words unlocked.",
      moves: [
        { icon: "✋", words: "Space, please" },
        { icon: "🆘", words: "I need help" },
        { icon: "⏸️", words: "Break, please" },
        { icon: "😠", words: "I am super mad" },
      ],
    },
    {
      icon: "🛠️", title: "REPAIR MISSION", prompt: "Something went wrong. Repair is a power move.",
      moves: [
        { icon: "🧑", words: "Get my grown-up" },
        { icon: "🩹", words: "Check for hurts" },
        { icon: "🔧", words: "Help fix it" },
        { icon: "🔁", words: "Try again later" },
      ],
    },
  ];
  const [mission, setMission] = useState(0);
  const [chosen, setChosen] = useState<string[]>([]);
  const [move, setMove] = useState<{ icon: string; words: string } | null>(null);
  const complete = mission >= missions.length;

  const choose = (item: { icon: string; words: string }) => {
    playSound("win", muted);
    say(`${item.words}. Safe move. Huge W.`);
    setMove(item);
    setChosen((items) => [...items, item.words]);
  };
  const next = () => { setMove(null); setMission((value) => value + 1); };

  return <QuestShell title="Safety Power-Ups" subtitle="Huge feeling. Safe body. Both can be true." icon="👐">
    <div className="safety-rule"><span><PixelIcon icon="🛡️" /></span><div><small>THE LEGENDARY RULE</small><h2>FEELINGS CAN BE HUGE.<br />HANDS + FEET STAY SAFE.</h2><p>You are not bad. Your body needs a mission.</p></div></div>
    <div className="safety-meter" role="progressbar" aria-label="Safety shield" aria-valuemin={0} aria-valuemax={missions.length} aria-valuenow={chosen.length}><span>SAFETY SHIELD</span><div aria-hidden="true">{missions.map((item, index) => <i className={index < chosen.length ? "powered" : ""} key={item.title}><PixelIcon icon={item.icon} /></i>)}</div></div>
    {!complete && <div className="safety-mission">
      <div className="safety-boss"><span><PixelIcon icon={missions[mission].icon} /></span><div><small>MISSION {mission + 1} / {missions.length}</small><h3>{missions[mission].title}</h3><p>{missions[mission].prompt}</p></div></div>
      <div className="safe-moves">{missions[mission].moves.map((item) => <button key={item.words} aria-pressed={move?.words === item.words} disabled={Boolean(move)} className={move?.words === item.words ? "active" : ""} onClick={() => choose(item)}><span><PixelIcon icon={item.icon} /></span><strong>{item.words}</strong></button>)}</div>
      {move && <div className="safe-win" role="status"><span><PixelText text="✨ SAFE MOVE · +1 SHIELD ✨" /></span><strong><PixelIcon icon={move.icon} /> {move.words}</strong><p>That keeps you and other people safe. Legendary.</p><button onClick={next}>{mission === missions.length - 1 ? "MAX THE SHIELD →" : "NEXT MISSION →"}</button></div>}
      <RegulationSkip onSkip={skip} />
    </div>}
    {complete && <div className="safety-complete" role="status"><span><PixelIcon icon="👐" /><PixelIcon icon="🛡️" /></span><h2>GENTLE HANDS: LEGENDARY</h2><p>Big feelings are allowed. Safe hands, safe feet, and strong words protect everybody.</p><div>{chosen.map((item) => <i key={item}>✓ {item}</i>)}</div><button className="primary" onClick={earn}>CLAIM SAFETY LOOT →</button></div>}
    <div className="get-help-now"><span><PixelIcon icon="🚨" /></span><p>If you might hurt yourself or someone else, <strong>get a safe grown-up now.</strong> You do not have to handle it alone.</p></div>
  </QuestShell>;
}

function ParkourQuest({ earn, avatar, muted }: { earn: () => void; avatar: string; muted: boolean }) {
  const track = ["🏁", "⭐", "🟢", "🫧", "🧱", "💚", "🟢", "🥟", "⭐", "🏆"];
  const obstacles = new Set([2, 4, 6]);
  const [position, setPosition] = useState(0);
  const [jumping, setJumping] = useState(false);
  const [stars, setStars] = useState(0);
  const [bonk, setBonk] = useState(false);
  const finished = position === track.length - 1;

  const jump = () => {
    if (finished) return;
    playSound("open", muted);
    setJumping(true);
    setBonk(false);
    say("Jump ready!");
  };
  const move = () => {
    if (finished) return;
    const next = position + 1;
    if (obstacles.has(next) && !jumping) {
      setBonk(true);
      playSound("tap", muted);
      say("Boink! Tap jump first.");
      return;
    }
    if (track[next] === "⭐" || track[next] === "💚" || track[next] === "🥟") {
      setStars((value) => value + 1);
      playSound("win", muted);
    } else playSound("tap", muted);
    setPosition(next);
    setJumping(false);
    setBonk(false);
    if (next === track.length - 1) say("Parkour W. You made it!");
  };
  const reset = () => { setPosition(0); setJumping(false); setStars(0); setBonk(false); };

  return <QuestShell title="Pixel Parkour" subtitle="Jump slime. Grab snacks. Get the W." icon="☁️">
    <div className="parkour-hud" role="status" aria-atomic="true"><span><PixelIcon icon="⭐" /> LOOT {stars}</span><strong>{finished ? "LEVEL CLEARED!" : jumping ? "JUMP LOADED!" : bonk ? "BOINK! JUMP FIRST!" : "READY, PLAYER ONE?"}</strong></div>
    <div className="parkour-world" role="img" aria-label={`Pixel Parkour track. Player is on space ${position + 1} of ${track.length}, with ${stars} loot.`}>
      <div className="park-cloud pc1" /><div className="park-cloud pc2" />
      <div className="track">{track.map((item, index) => <div key={index} className={obstacles.has(index) ? "track-cell obstacle" : "track-cell"}>
        {index === position && <span className={jumping ? "runner jumping" : "runner"}><PixelIcon icon={avatar} /></span>}
        {index !== position && <i><PixelIcon icon={item} /></i>}
      </div>)}</div>
    </div>
    <div className="arcade-controls">
      <button onClick={jump} disabled={finished}><PixelIcon icon="⬆️" /><strong>JUMP</strong></button>
      <button onClick={move} disabled={finished}><PixelIcon icon="➡️" /><strong>GO</strong></button>
    </div>
    {finished && <div className="parkour-win"><span><PixelIcon icon="🥟" /></span><h3>DUMPLING SUPREME SAYS:</h3><p>“Tiny jumps still move you forward.”</p><button className="primary" onClick={earn}>CLAIM ARCADE LOOT →</button><button className="secondary" onClick={reset}>PLAY AGAIN</button></div>}
  </QuestShell>;
}

function MusicPowerUp({
  earn,
  skip,
  muted,
}: {
  earn: (affirmation: string) => void;
  skip: () => void;
  muted: boolean;
}) {
  const [need, setNeed] = useState<PowerNeedId | null>(null);
  const [song, setSong] = useState<SongTrack | null>(null);
  const [missionChoice, setMissionChoice] = useState<"try" | "listen" | null>(null);
  const [hasOpenedPlaylist, setHasOpenedPlaylist] = useState(false);
  const [signalChoice, setSignalChoice] = useState<SignalChangeId | null>(null);
  const [completed, setCompleted] = useState(false);
  const completionLocked = useRef(false);
  const selectedNeed = powerNeeds.find((item) => item.id === need);
  const songs = need ? tracksForNeed(songLibrary, need) : [];

  const chooseNeed = (id: PowerNeedId) => {
    playSound("tap", muted);
    const availableSongs = tracksForNeed(songLibrary, id);
    setNeed(id);
    setSong(availableSongs.length === 1 ? availableSongs[0] : null);
    setMissionChoice(null);
    setHasOpenedPlaylist(false);
    setSignalChoice(null);
    setCompleted(false);
    completionLocked.current = false;
  };
  const chooseSong = (track: SongTrack) => {
    playSound("open", muted);
    setSong(track);
    setMissionChoice(null);
    setHasOpenedPlaylist(false);
    setSignalChoice(null);
    setCompleted(false);
    completionLocked.current = false;
    say("Music landing pad.");
  };
  const finish = (id: SignalChangeId) => {
    if (completionLocked.current) return;
    completionLocked.current = true;
    setCompleted(true);
    setSignalChoice(id);
    earn(signalAffirmation(id));
  };

  return <QuestShell
    title={activeProfile.stationTitle}
    subtitle={activeProfile.stationSubtitle}
    icon="🎵"
    spokenInstructions="Music Power-Up. Pick the kind of power your body needs, then choose music with a trusted grown-up."
  >
    <div
      className="music-station"
      style={{
        "--profile-accent": activeProfile.favoriteColors[0],
        "--profile-glow": activeProfile.favoriteColors[1],
      } as React.CSSProperties}
    >
      <div className="music-dj">
        <div className="music-dj-avatar"><PixelIcon icon="🟢" /><span><PixelIcon icon="🎧" /></span></div>
        <div><small>DJ GLORP’S MUSIC PORTAL</small><h2>{activeProfile.stationSubtitle}</h2><p>{activeProfile.stationIntro}</p></div>
      </div>

      {!need && <section className="music-step" aria-labelledby="power-need-title">
        <div className="music-step-heading"><span>1</span><div><small>PICK A POWER</small><h3 id="power-need-title">What kind of power does your body need?</h3></div></div>
        <div className="power-need-grid">{powerNeeds.map((item) => <button
          key={item.id}
          className={`power-need ${item.id}`}
          onClick={() => chooseNeed(item.id)}
          aria-label={`${item.label}. ${item.clue}`}
        >
          <span><PixelIcon icon={item.icon} /></span>
          <small>{item.object}</small>
          <strong>{item.label}</strong>
          <p>{item.clue}</p>
          <b>CHOOSE →</b>
        </button>)}</div>
      </section>}

      {need && !song && <section className="music-step" aria-labelledby="song-pick-title">
        <button className="music-back" onClick={() => setNeed(null)}>← CHANGE POWER</button>
        <div className="music-step-heading"><span>2</span><div><small>{selectedNeed?.label.toUpperCase()}</small><h3 id="song-pick-title">Pick a {activeProfile.musicName}</h3></div></div>
        <div className="song-card-grid">{songs.map((track) => <button
          key={track.id}
          className="song-card"
          onClick={() => chooseSong(track)}
          aria-label={`Choose ${track.title} by ${track.artist}`}
        >
          <span><PixelIcon icon={track.icon ?? "🎵"} /></span>
          <div><small>FAMILY-APPROVED LINK</small><strong>{track.title}</strong><p>{track.artist}</p></div>
          <b>SELECT →</b>
        </button>)}</div>
        <p className="song-privacy-note"><PixelIcon icon="🔐" /> Nothing opens until you tap the music link.</p>
      </section>}

      {song && <section className="music-step" aria-labelledby="mission-title">
        <button className="music-back" onClick={() => {
          setSong(null);
          setMissionChoice(null);
          setHasOpenedPlaylist(false);
          setSignalChoice(null);
          setCompleted(false);
          completionLocked.current = false;
          if (songs.length === 1) setNeed(null);
        }}>{songs.length === 1 ? "← CHANGE POWER" : "← PICK ANOTHER SONG"}</button>

        <div className="tiny-mission">
          <div className="music-step-heading"><span>{songs.length === 1 ? "2" : "3"}</span><div><small>OPTIONAL SIDE QUEST</small><h3 id="mission-title">Your tiny mission</h3></div></div>
          <p><strong>{song.prompt}</strong><br />Pick one, or just listen. Both count.</p>
          <div>
            <button aria-pressed={missionChoice === "try"} className={missionChoice === "try" ? "active" : ""} onClick={() => setMissionChoice("try")}><PixelIcon icon="✨" /> I CAN TRY</button>
            <button aria-pressed={missionChoice === "listen"} className={missionChoice === "listen" ? "active" : ""} onClick={() => setMissionChoice("listen")}><PixelIcon icon="🎧" /> JUST LISTEN</button>
          </div>
        </div>

        {missionChoice && <div className="playlist-launch-card">
          <div className="music-step-heading"><span>{songs.length === 1 ? "3" : "4"}</span><div><small>TRUSTED-GROWN-UP MUSIC</small><h3>Ready to listen?</h3></div></div>
          <span><PixelIcon icon={song.icon ?? "🎵"} /></span>
          <div><strong>{song.title}</strong><p>{song.artist}</p></div>
          <a
            className="playlist-launch-button"
            href={safeExternalSongUrl(song.url)}
            target="_blank"
            rel="noopener noreferrer external"
            referrerPolicy="no-referrer"
            aria-label={`${song.launchLabel ?? `Play ${song.title}`} in a new tab`}
            onClick={() => {
              setHasOpenedPlaylist(true);
              playSound("open", muted);
            }}
          ><PixelIcon icon="▶️" /> {song.launchLabel ?? "PLAY FAMILY-APPROVED MUSIC"}</a>
          <p className="playlist-privacy-note"><PixelIcon icon="🔐" /> Opens a music site in a new tab. Brave Blocks cannot see which song you choose or what you do there.</p>
        </div>}

        {hasOpenedPlaylist && <div className="signal-check" role="group" aria-labelledby="signal-check-title">
          <div className="music-step-heading"><span>{songs.length === 1 ? "4" : "5"}</span><div><small>WELCOME BACK · CHECK AGAIN</small><h3 id="signal-check-title">Did your signal change?</h3></div></div>
          <div>{signalChanges.map((choice) => <button
            key={choice.id}
            disabled={completed}
            aria-pressed={signalChoice === choice.id}
            onClick={() => finish(choice.id)}
          ><span><PixelIcon icon={choice.icon} /></span><strong>{choice.label}</strong><small>{choice.affirmation}</small></button>)}</div>
          <p>Every answer gets the W. Feelings do not have to disappear.</p>
        </div>}
      </section>}

      <div className="music-safety-note"><PixelIcon icon="💛" /><p><strong>Every signal answer counts.</strong><br />Music may help a lot, a little, or not yet. All three are real answers.</p></div>
    </div>
    <RegulationSkip onSkip={skip} />
  </QuestShell>;
}

function CourageCampfire({ earn, muted }: { earn: () => void; muted: boolean }) {
  const stories = [
    { icon: "🦎", title: "Axo + First Day", story: "Axo felt shaky. He found a safe grown-up and took one tiny step.", gem: "Brave can be tiny." },
    { icon: "🐹", title: "Cappy + Missing", story: "Cappy missed someone and let a safe person stay nearby.", gem: "Missing and safe can both be true." },
    { icon: "🥟", title: "Dumpling + Mistake", story: "Dumpling made a mess, told the truth, and helped repair it.", gem: "Mistakes can be repaired." },
    { icon: "🤖", title: "Both-Bot + Big Mix", story: "Both-Bot felt mad and sad. Both feelings were allowed.", gem: "Two feelings can be true." },
  ];
  const [opened, setOpened] = useState<string[]>([]);
  const [story, setStory] = useState<(typeof stories)[number] | null>(null);
  const openStory = (item: (typeof stories)[number]) => {
    playSound("open", muted);
    setStory(item);
    setOpened((items) => items.includes(item.title) ? items : [...items, item.title]);
    say(`${item.title}. ${item.story} ${item.gem}`);
  };
  return <QuestShell title="Courage Campfire" subtitle="Tap a story. Find a courage gem." icon="✨">
    <div className="campfire">
      <div className="night-stars">✦　·　✧　　✦　·　✧　　✦</div>
      <div className="fire"><PixelIcon icon="🔥" /></div>
      <div className="camp-crew"><PixelIcon icon="🦎" /><PixelIcon icon="🐹" /><PixelIcon icon="🥟" /><PixelIcon icon="🟢" /></div>
      <h2>CHAOS CREW STORY CAMP</h2>
      <div className="camp-buttons">
        <button onClick={() => say("I matter on easy days and hard days. I can ask for help.")}><PixelIcon icon="🔊" /> HEAR THE CAMP RULE</button>
      </div>
    </div>
    <div className="story-grid">{stories.map((item) => <button key={item.title} aria-pressed={story?.title === item.title} className={story?.title === item.title ? "story-card active" : "story-card"} onClick={() => openStory(item)}>
      <span><PixelIcon icon={item.icon} /></span><strong>{item.title}</strong><small>{opened.includes(item.title) ? "GEM FOUND ✓" : "TAP STORY"}</small>
    </button>)}</div>
    {story && <div className="story-scroll" role="status"><small>HOPE GEM UNLOCKED</small><span><PixelIcon icon={story.icon} /></span><h3>{story.title}</h3><p>{story.story}</p><strong><PixelIcon icon="💎" /> {story.gem}</strong><button onClick={() => say(`${story.story} ${story.gem}`)}><PixelIcon icon="🔊" /> HEAR AGAIN</button></div>}
    <div className="story-affirmation"><span><PixelIcon icon="💛" /></span><p><strong>I matter on easy days and hard days.</strong><br />I can use my own words. I can ask for help. All my feelings can come to the story circle.</p></div>
    {opened.length >= 2 && <button className="primary center" onClick={earn}>COLLECT COURAGE LOOT →</button>}
  </QuestShell>;
}

function FireInstallGuide({
  onClose,
  onInstall,
  canInstall,
  offlineStatus,
}: {
  onClose: () => void;
  onInstall: () => void;
  canInstall: boolean;
  offlineStatus: OfflineStatus;
}) {
  const { dialogRef, onDialogKeyDown } = useDialogFocus(onClose);
  return <div
    ref={dialogRef}
    className="install-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="fire-install-title"
    tabIndex={-1}
    onKeyDown={onDialogKeyDown}
  >
    <div className="install-sheet">
      <button className="install-close" onClick={onClose} aria-label="Close">×</button>
      <span className="fire-tablet"><PixelIcon icon="📲" /></span>
      <small>GROWN-UP SETUP</small>
      <h2 id="fire-install-title">Fire Tablet Setup</h2>
      <OfflineReadinessIndicator status={offlineStatus} />
      <ol>
        <li><b>Open Amazon Silk</b><span>{editionContent.installLink}</span></li>
        <li><b>Use Install Now if it appears</b><span>That button uses the tablet’s own installation prompt.</span></li>
        <li><b>Use Install or Add to Home</b><span>If Silk shows that option, confirm it. Brave Blocks will get its own icon.</span></li>
        <li><b>If Silk has no install option</b><span>Bookmark Brave Blocks. Silk can reopen the last page, so it still works like a one-tap game.</span></li>
      </ol>
      <div className="offline-note"><strong>OFFLINE TIP</strong><p>Open the game online once and keep it open until the status says “Ready for offline play.” Then turn off Wi-Fi and test a quest, HEAR IT, and the Pause Portal.</p></div>
      <p className="install-private"><PixelIcon icon="🔐" /> {editionContent.installPrivacy}</p>
      {canInstall && <button className="primary" onClick={onInstall}>INSTALL BRAVE BLOCKS NOW →</button>}
      <button className="primary" onClick={onClose}>GOT IT ✓</button>
    </div>
  </div>;
}

function GrownupGuide({ offlineStatus }: { offlineStatus: OfflineStatus }) {
  const guide = editionContent.grownupGuide;
  if (!guide) return null;
  return <QuestShell title={guide.title} subtitle={guide.subtitle} icon="🔑">
    <OfflineReadinessIndicator status={offlineStatus} />
    <div className="review-checklist">
      <small>{guide.kicker}</small>
      <h2>{guide.heading}</h2>
      <ul>{guide.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
      <p>{guide.checklistNote}</p>
    </div>
    <div className="guide-grid">{guide.cards.map((card) => <article key={card.title}>
      <span><PixelIcon icon={card.icon} /></span><h3>{card.title}</h3><p>{card.body}</p>
    </article>)}</div>
    <a className="adult-companion-link" href="https://caresignals.github.io/power-up-pals-dbt/" target="_blank" rel="noopener noreferrer">
      <span><PixelIcon icon="🧭" /></span>
      <div><small>ADULT COMPANION</small><strong>OPEN POWER-UP PALS</strong><p>Caregiver pathways, DBT skill context, and co-regulation support.</p></div>
      <b>OPEN ↗</b>
    </a>
    <div className="professional-note"><strong>{guide.noticeLead}</strong> {guide.noticeBody}</div>
  </QuestShell>;
}

function ResetPlayDialog({
  onClose,
  onReset,
}: {
  onClose: () => void;
  onReset: () => void;
}) {
  const { dialogRef, onDialogKeyDown } = useDialogFocus(onClose);
  return <div
    ref={dialogRef}
    className="portal-screen reset-play-screen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="reset-play-title"
    aria-describedby="reset-play-copy"
    tabIndex={-1}
    onKeyDown={onDialogKeyDown}
  >
    <section className="portal-card reset-play-card">
      <button className="portal-close" onClick={onClose} aria-label="Close reset check">×</button>
      <span className="portal-icon"><PixelIcon icon="🔁" /></span>
      <small>GROWN-UP CHECK</small>
      <h2 id="reset-play-title">Reset this play?</h2>
      <p id="reset-play-copy">This clears XP, loot, picks, and the mystery block from this open session. Nothing is stored online.</p>
      <div className="reset-play-actions">
        <button className="secondary" onClick={onClose}>KEEP PLAYING</button>
        <button className="primary" onClick={onReset}>YES · START FRESH</button>
      </div>
    </section>
  </div>;
}

function QuestShell({
  title,
  subtitle,
  icon,
  spokenInstructions,
  children,
}: {
  title: string;
  subtitle: string;
  icon: string;
  spokenInstructions?: string;
  children: React.ReactNode;
}) {
  return <section className="quest-page">
    <div className="quest-heading"><span><PixelIcon icon={icon} /></span><div><small>BRAVE BLOCKS MINIGAME</small><h1 data-route-heading tabIndex={-1}>{title}</h1><p>{subtitle}</p></div><button className="read-button" aria-label={`Hear ${title} instructions`} onClick={() => say(spokenInstructions ?? `${title}. ${subtitle}`)}><PixelIcon icon="🔊" /><b>HEAR IT</b></button></div>
    {children}
  </section>;
}

export default function HomePage() {
  const [quest, setQuest] = useState<Quest>("home");
  const [badges, setBadges] = useState<string[]>([]);
  const [xp, setXp] = useState(0);
  const [avatar, setAvatar] = useState(activeProfile.avatarIcon);
  const [playerName, setPlayerName] = useState(activeProfile.displayName ?? "");
  const [collection, setCollection] = useState<Loot[]>([]);
  const [loot, setLoot] = useState<Loot | null>(null);
  const [completionReward, setCompletionReward] = useState(0);
  const [completionNote, setCompletionNote] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [muted, setMuted] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [mysteryEgg, setMysteryEgg] = useState<EasterEgg | null>(null);
  const [powerKitPicks, setPowerKitPicks] = useState<string[]>([]);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showVoiceLab, setShowVoiceLab] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [adultGateTarget, setAdultGateTarget] = useState<AdultArea | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>("caching");

  useEffect(() => {
    prepareOfflinePack().then(setOfflineStatus).catch(() => setOfflineStatus("error"));
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    return () => window.removeEventListener("beforeinstallprompt", capturePrompt);
  }, []);

  useEffect(() => {
    setNarrationMuted(muted);
  }, [muted]);

  const names: Record<Quest, string> = { home: "", feelings: "Vibe Gem", body: "Radar Chip", calm: "Dragon Shield", loadout: "Choice Pack", meeting: "Talk Shield", base: "Safe Base", safety: "Gentle Hands Glow", parkour: "Cloud Crown", beats: "Music Disc", stories: "Courage Gem", machine: "Plot-Twist Core", grownups: "" };
  const pageWords: Record<Quest, string> = {
    home: "Welcome back, player. Pick your character. Then pick your next W.",
    feelings: "Vibe Mixer. Tap every feeling in your mix.",
    body: "Body Radar. Tap a place. Then scan a clue.",
    calm: "Dragon Battle. Slow breaths power your shield.",
    loadout: "Meeting Loadout. Pack a cozy, choose a signal, and pick how you want to answer.",
    meeting: "Talk Power Up. Pick any words that tell the grown-up what you need.",
    base: "Build Mode. Tap your support blocks.",
    safety: "Safety Power Ups. Pick a safe mission for your hands, body, words, and repairs.",
    parkour: "Pixel Parkour. Tap jump before slime or blocks. Then tap go.",
    beats: "Music Power-Up. Pick a body signal, choose music with a trusted grown-up, and check the signal again.",
    stories: "Courage Campfire. Tap a Chaos Crew story and find a courage gem.",
    machine: "Feeling Machine. Pick a pretend story. Scan five steps. Change the ending. Your own details are optional.",
    grownups: editionContent.grownupRouteSpeech,
  };

  const focusRouteHeading = () => window.setTimeout(() => {
    document.querySelector<HTMLElement>("[data-route-heading]")?.focus();
  }, 0);
  const go = (next: Quest) => {
    playSound("tap", muted);
    setQuest(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
    focusRouteHeading();
  };
  const awardXp = (amount: number) => setXp((value) => value + Math.max(0, amount));
  const completeQuest = (note = "", narrationLine?: string) => {
    const badge = names[quest];
    const firstWin = badge && !badges.includes(badge);
    const reward = firstWin ? 100 : 25;
    if (firstWin) setBadges((b) => [...b, badge]);
    awardXp(reward);
    const prize = lootDrops[Math.floor(Math.random() * lootDrops.length)];
    setCompletionReward(reward);
    setCompletionNote(note);
    setLoot(prize);
    setAnnouncement(`Quest complete. ${reward} XP gained. Loot unlocked: ${prize.name}.${note ? ` ${note}` : ""} Total: ${xp + reward} XP.`);
    playSound("win", muted);
    say(narrationLine ?? (note ? "Pass unlocked. No explaining needed." : `Quest W. You unlocked ${prize.name}.`));
  };
  const earn = () => completeQuest();
  const skipQuest = () => completeQuest(SKIP_AFFIRMATION);
  const earnSignalCheck = (affirmation: string) => {
    completeQuest(affirmation, "Music check complete. Every answer counts.");
  };
  const closeLoot = () => {
    if (loot) setCollection((items) => [...items, loot]);
    setLoot(null); setCompletionReward(0); setCompletionNote(""); setQuest("home"); window.scrollTo({ top: 0, behavior: "smooth" });
    focusRouteHeading();
  };
  const claimBonus = () => {
    if (claimed) return;
    const eggs = activeProfile.easterEggs;
    setMysteryEgg(eggs[Math.floor(Math.random() * eggs.length)] ?? null);
    setClaimed(true);
    awardXp(25);
    setAnnouncement(`25 XP gained. Mystery block claimed. Total: ${xp + 25} XP.`);
    playSound("open", muted);
    say("Mystery block cracked. Plus twenty five X P. Huge W.");
  };
  const runInstallPrompt = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      playSound("win", muted);
      say("Brave Blocks installed. Huge W.");
      setInstallPrompt(null);
      setShowInstall(false);
    }
  };
  const openInstallSetup = () => {
    playSound("open", muted);
    setShowInstall(true);
  };
  const togglePowerKitChoice = (id: string, label: string) => {
    const wasPicked = powerKitPicks.includes(id);
    const nextCount = wasPicked ? powerKitPicks.length - 1 : powerKitPicks.length + 1;
    setPowerKitPicks((items) => wasPicked
      ? items.filter((item) => item !== id)
      : [...items, id]);
    setAnnouncement(`${label} ${wasPicked ? "removed from" : "added to"} your Power Kit. ${nextCount} ${nextCount === 1 ? "choice" : "choices"} ready.`);
    playSound(wasPicked ? "tap" : "open", muted);
  };
  const unlockAdultArea = (area: AdultArea) => {
    setAdultGateTarget(null);
    if (area === "guide" && IS_REVIEW_EDITION) go("grownups");
    else openInstallSetup();
  };
  const resetSession = () => {
    stopNarration();
    setQuest("home");
    setBadges([]);
    setXp(0);
    setAvatar(activeProfile.avatarIcon);
    setPlayerName(activeProfile.displayName ?? "");
    setCollection([]);
    setLoot(null);
    setCompletionReward(0);
    setCompletionNote("");
    setClaimed(false);
    setMysteryEgg(null);
    setPowerKitPicks([]);
    setShowPause(false);
    setShowVoiceLab(false);
    setShowReset(false);
    setAdultGateTarget(null);
    setAnnouncement("This play was reset. Your power kit is ready.");
    window.scrollTo({ top: 0, behavior: "smooth" });
    focusRouteHeading();
  };

  let content: React.ReactNode;
  if (quest === "feelings") content = <Feelings earn={earn} muted={muted} />;
  else if (quest === "body") content = <BodyQuest earn={earn} skip={skipQuest} muted={muted} />;
  else if (quest === "calm") content = <CalmQuest earn={earn} skip={skipQuest} muted={muted} />;
  else if (quest === "loadout") content = <MeetingLoadout earn={earn} muted={muted} />;
  else if (quest === "meeting") content = <MeetingQuest earn={earn} muted={muted} />;
  else if (quest === "base") content = <BaseQuest earn={earn} muted={muted} />;
  else if (quest === "safety") content = <SafetyQuest earn={earn} skip={skipQuest} muted={muted} />;
  else if (quest === "parkour") content = <ParkourQuest earn={earn} avatar={avatar} muted={muted} />;
  else if (quest === "beats") content = <MusicPowerUp earn={earnSignalCheck} skip={skipQuest} muted={muted} />;
  else if (quest === "stories") content = <CourageCampfire earn={earn} muted={muted} />;
  else if (quest === "machine") content = <FeelingMachine earn={earn} skip={skipQuest} muted={muted} />;
  else if (quest === "grownups" && IS_REVIEW_EDITION) content = <GrownupGuide offlineStatus={offlineStatus} />;
  else content = <Home
    go={go}
    avatar={avatar}
    setAvatar={setAvatar}
    xp={xp}
    collection={collection}
    claimed={claimed}
    mysteryEgg={mysteryEgg}
    claimBonus={claimBonus}
    powerKitPicks={powerKitPicks}
    togglePowerKitChoice={togglePowerKitChoice}
    playerName={playerName}
    setPlayerName={setPlayerName}
    requestReset={() => setShowReset(true)}
    openInstallSetup={() => unlockAdultArea("install")}
    requestInstallCheck={() => setAdultGateTarget("install")}
  />;
  const growthHearts = Math.min(11, badges.length + 1);

  return <main>
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    <header>
      <button className="brand" onClick={() => go("home")} aria-label="Brave Blocks home"><span><PixelIcon icon={avatar} /></span><strong>BRAVE<br />BLOCKS</strong></button>
      <div className="game-stats"><XPBar xp={xp} /><div
        className="badge-bar"
        role="progressbar"
        aria-label="Brave growth hearts. Hearts only fill and never go down."
        aria-valuemin={1}
        aria-valuemax={11}
        aria-valuenow={growthHearts}
        aria-valuetext={`${growthHearts} of 11 growth hearts filled. This meter only grows.`}
      ><small className="growth-label" aria-hidden="true">GROWTH</small>{[0,1,2,3,4,5,6,7,8,9,10].map((i) => <PixelHeart key={i} filled={i < growthHearts} />)}</div></div>
      <div className="header-actions">
        <button className="sound-button" aria-pressed={muted} onClick={() => setMuted((m) => !m)} aria-label={muted ? "Turn sound on" : "Turn sound off"}><PixelIcon icon={muted ? "🔇" : "🔊"} /></button>
        <button className="voice-button" onClick={() => setShowVoiceLab(true)} aria-label="Hear about the Pixel Quest Host narrator"><PixelIcon icon="🎮" /><span>VOICE</span></button>
        <button className="listen-button" aria-label="Read this page aloud" onClick={() => say(pageWords[quest])}><PixelIcon icon="🔊" /> <span>READ</span></button>
        <AdultGateButton
          className="guide-button"
          ariaLabel={editionContent.grownupButtonAriaLabel}
          onUnlock={() => unlockAdultArea(editionContent.grownupButtonTarget)}
          onNeedKeyboardCheck={() => setAdultGateTarget(editionContent.grownupButtonTarget)}
        >
          <PixelIcon icon="🔑" /> <span>GROWN-UPS · HOLD 3 SEC</span>
        </AdultGateButton>
      </div>
    </header>
    {editionContent.reviewBanner && <div className="review-mode" role="note"><strong>{editionContent.reviewBanner.title}</strong><span>{editionContent.reviewBanner.subtitle}</span></div>}
    {quest !== "home" && <button className="back" onClick={() => go("home")}>← QUEST MAP</button>}
    {content}
    {loot && <Victory loot={loot} avatar={avatar} reward={completionReward} completionNote={completionNote} onClose={closeLoot} />}
    {showInstall && <FireInstallGuide
      onClose={() => setShowInstall(false)}
      onInstall={runInstallPrompt}
      canInstall={Boolean(installPrompt)}
      offlineStatus={offlineStatus}
    />}
    {showPause && <PausePortal onClose={() => setShowPause(false)} />}
    {showVoiceLab && <VoiceLab onClose={() => setShowVoiceLab(false)} />}
    {showReset && <ResetPlayDialog onClose={() => setShowReset(false)} onReset={resetSession} />}
    {adultGateTarget && <AdultGateDialog
      area={adultGateTarget}
      onClose={() => setAdultGateTarget(null)}
      onUnlock={() => unlockAdultArea(adultGateTarget)}
    />}
    <button className="pause-portal-button" onClick={() => setShowPause(true)} aria-label="Open Pause Portal"><span><PixelIcon icon="⏸️" /></span><strong>PAUSE PORTAL</strong></button>
    <footer><span><PixelIcon icon="♥" /></span><strong>ALL FEELINGS = VALID · NO CAP</strong><span><PixelIcon icon="♥" /></span></footer>
  </main>;
}
