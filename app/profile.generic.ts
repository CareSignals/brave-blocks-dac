import type { BraveBlocksProfile } from "./profile.types";

const profile: BraveBlocksProfile = {
  id: "generic",
  modeLabel: "CORE MODE",
  playerLabel: "PLAYER",
  displayName: null,
  avatarIcon: "🦎",
  avatarName: "Axo Maxxo",
  stationTitle: "Music Power-Up",
  stationSubtitle: "Music Power Station",
  musicName: "power song",
  stationIntro: "DJ Glorp found power tracks for every kind of signal.",
  favoriteColors: ["#6ef3ff", "#ff8fc7"],
  favoriteComfortTools: [
    { id: "music", icon: "🎵", label: "Favorite music" },
    { id: "soft-thing", icon: "🧸", label: "Soft thing" },
    { id: "drawing", icon: "🎨", label: "Drawing" },
    { id: "snack-water", icon: "🥤", label: "Snack or water" },
    { id: "near-grownup", icon: "💛", label: "Near a grown-up" },
  ],
  trustedGrownupLabels: ["Trusted grown-up", "My safe person"],
  preferredPhrases: ["I need a minute.", "Not yet is a real answer."],
  animalCompanion: { icon: "🦎", name: "Axo Maxxo" },
  easterEggs: [
    { id: "buddy-block", icon: "🐾", title: "RARE BUDDY BLOCK", line: "Cozy team unlocked." },
    { id: "courage-cup", icon: "🏆", title: "LOPSIDED COURAGE CUP", line: "Wobbly cup. Solid courage." },
  ],
};

export default profile;
