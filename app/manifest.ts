import type { MetadataRoute } from "next";
import { IS_REVIEW_EDITION } from "./edition";

export const dynamic = "force-static";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const asset = (path: string) => `${publicBasePath}${path}`;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: IS_REVIEW_EDITION
      ? "Brave Blocks — Dependency Advocacy Center Review"
      : "Brave Blocks",
    short_name: "Brave Blocks",
    description:
      "Big feelings, brave words, and playful, privacy-preserving quests.",
    start_url: asset("/") || "/",
    scope: asset("/") || "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fff8df",
    theme_color: "#112f43",
    icons: [
      {
        src: asset("/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: asset("/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
