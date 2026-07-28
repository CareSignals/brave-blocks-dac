export type ComfortTool = {
  id: string;
  icon: string;
  label: string;
};

export type EasterEgg = {
  id: string;
  icon: string;
  title: string;
  line: string;
};

export type BraveBlocksProfile = {
  id: "generic";
  modeLabel: string;
  playerLabel: string;
  displayName: string | null;
  avatarIcon: string;
  avatarName: string;
  stationTitle: string;
  stationSubtitle: string;
  musicName: string;
  stationIntro: string;
  favoriteColors: readonly [string, string];
  favoriteComfortTools: readonly ComfortTool[];
  trustedGrownupLabels: readonly string[];
  preferredPhrases: readonly string[];
  animalCompanion: { icon: string; name: string } | null;
  easterEggs: readonly EasterEgg[];
};
