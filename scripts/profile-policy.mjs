export function currentProfile() {
  const profile = (process.env.NEXT_PUBLIC_BRAVE_BLOCKS_PROFILE || "GENERIC").trim().toUpperCase();
  if (profile !== "GENERIC") {
    throw new Error(`NEXT_PUBLIC_BRAVE_BLOCKS_PROFILE must be GENERIC, received "${profile}".`);
  }
  return profile;
}
