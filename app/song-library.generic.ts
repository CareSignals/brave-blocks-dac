import type { PowerNeedId, SongLibrary, SongTrack } from "./song-library.types";

const approvedExample = {
  title: "Choose a power song",
  artist: "With a trusted grown-up",
  url: "https://music.youtube.com/",
  icon: "🎵",
  launchLabel: "OPEN APPROVED MUSIC",
} as const;

function exampleFor(category: PowerNeedId, prompt: string): SongTrack {
  return {
    ...approvedExample,
    id: `approved-example-${category}`,
    category,
    prompt,
  };
}

// Neutral starting point: a trusted grown-up chooses the music after the link opens.
const songs: SongLibrary = {
  calm: [exampleFor("calm", "You can take one slow breath during the chorus.")],
  brave: [exampleFor("brave", "You can stand tall while you listen.")],
  comfort: [exampleFor("comfort", "You can sit close to a trusted grown-up.")],
  joy: [exampleFor("joy", "You can shake out your hands while you listen.")],
  sleep: [exampleFor("sleep", "You can let your shoulders drop while you listen.")],
};

export default songs;
