import type { PowerNeedId, SongLibrary, SongTrack } from "./song-library.types";

export type SignalChangeId = "a-lot" | "a-little" | "not-yet";

export const powerNeeds = [
  { id: "calm", label: "Calm Power", clue: "Buzzy, tight, or too much.", icon: "☁️", object: "CLOUD RADIO" },
  { id: "brave", label: "Brave Power", clue: "Something hard is coming.", icon: "🛡️", object: "BRAVE SHIELD" },
  { id: "comfort", label: "Comfort Power", clue: "Sad, lonely, worried, or mixed.", icon: "💛", object: "GLOW HEART" },
  { id: "joy", label: "Joy Power", clue: "Shake out yucky feelings.", icon: "⚡", object: "JOY BOLT" },
  { id: "sleep", label: "Sleep Power", clue: "Slow all the way down.", icon: "⏳", object: "SLOW-DOWN TIMER" },
] as const satisfies readonly {
  id: PowerNeedId;
  label: string;
  clue: string;
  icon: string;
  object: string;
}[];

export const signalChanges = [
  { id: "a-lot", label: "A lot", icon: "✨", affirmation: "Your body found some power." },
  { id: "a-little", label: "A little", icon: "🌱", affirmation: "Even a tiny shift counts." },
  { id: "not-yet", label: "Not yet", icon: "💛", affirmation: "That’s okay. You still listened to your signal." },
] as const satisfies readonly {
  id: SignalChangeId;
  label: string;
  icon: string;
  affirmation: string;
}[];

const privateQueryKeys = /^(?:name|child|profile|emotion|feeling|signal|result|answer)$/i;

export function safeExternalSongUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error(`Song links must use HTTPS: ${value}`);
  }
  for (const key of url.searchParams.keys()) {
    if (privateQueryKeys.test(key)) {
      throw new Error(`Song links cannot include child-response query parameters: ${key}`);
    }
  }
  return url.href;
}

export function validateSongLibrary(library: SongLibrary) {
  const errors: string[] = [];
  for (const need of powerNeeds) {
    const tracks = library[need.id];
    if (!tracks?.length) errors.push(`${need.id} needs at least one song.`);
    for (const track of tracks ?? []) {
      if (track.category !== need.id) errors.push(`${track.id} is filed under the wrong power need.`);
      if (!track.title.trim() || !track.artist.trim()) errors.push(`${track.id} needs a title and artist.`);
      try {
        safeExternalSongUrl(track.url);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
  }
  return errors;
}

export function tracksForNeed(library: SongLibrary, need: PowerNeedId): readonly SongTrack[] {
  return library[need];
}

export function signalAffirmation(id: SignalChangeId) {
  const choice = signalChanges.find((item) => item.id === id);
  if (!choice) throw new Error(`Unknown signal choice: ${id}`);
  return choice.affirmation;
}
