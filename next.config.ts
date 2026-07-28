import type { NextConfig } from "next";
import { resolve } from "node:path";

const requestedEdition =
  process.env.NEXT_PUBLIC_BRAVE_BLOCKS_EDITION?.trim().toUpperCase() ||
  "REVIEW";
if (requestedEdition !== "REVIEW" && requestedEdition !== "CHILD") {
  throw new Error(
    `NEXT_PUBLIC_BRAVE_BLOCKS_EDITION must be REVIEW or CHILD, received "${requestedEdition}".`,
  );
}

const requestedProfile =
  process.env.NEXT_PUBLIC_BRAVE_BLOCKS_PROFILE?.trim().toUpperCase() ||
  "GENERIC";
if (requestedProfile !== "GENERIC") {
  throw new Error(
    `NEXT_PUBLIC_BRAVE_BLOCKS_PROFILE must be GENERIC, received "${requestedProfile}".`,
  );
}

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const publicBasePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (isGitHubPages ? "/brave-blocks-dac" : "");

const nextConfig: NextConfig = {
  output: isGitHubPages ? "export" : undefined,
  basePath: publicBasePath || undefined,
  assetPrefix: publicBasePath ? `${publicBasePath}/` : undefined,
  env: {
    NEXT_PUBLIC_BRAVE_BLOCKS_EDITION: requestedEdition,
    NEXT_PUBLIC_BRAVE_BLOCKS_PROFILE: requestedProfile,
    NEXT_PUBLIC_BASE_PATH: publicBasePath,
  },
  images: {
    unoptimized: true,
  },
  webpack(config) {
    if (config.cache && typeof config.cache === "object") {
      config.cache = {
        ...config.cache,
        version: `${config.cache.version ?? "brave-blocks-dac"}-${requestedEdition}`,
      };
    }
    config.resolve.alias["@edition-narration"] = resolve(
      process.cwd(),
      requestedEdition === "CHILD"
        ? "app/narration-index.child.json"
        : "app/narration-index.json",
    );
    config.resolve.alias["@edition-content"] = resolve(
      process.cwd(),
      requestedEdition === "CHILD"
        ? "app/edition-content.child.ts"
        : "app/edition-content.review.ts",
    );
    config.resolve.alias["@active-profile"] = resolve(
      process.cwd(),
      "app/profile.generic.ts",
    );
    config.resolve.alias["@song-library"] = resolve(
      process.cwd(),
      "app/song-library.generic.ts",
    );
    return config;
  },
};

export default nextConfig;
