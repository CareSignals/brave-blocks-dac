import type { Metadata } from "next";
import { headers } from "next/headers";
import activeProfile from "@active-profile";
import { BRAVE_BLOCKS_EDITION, IS_REVIEW_EDITION } from "./edition";
import "./globals.css";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const appTitle = IS_REVIEW_EDITION
  ? "Brave Blocks | Dependency Advocacy Center Review"
  : "Brave Blocks";
const appDescription = IS_REVIEW_EDITION
  ? "An independent, de-identified emotional-learning prototype prepared for Dependency Advocacy Center review."
  : "Big feelings, brave words, and playful quests.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const asset = (path: string) => `${origin}${publicBasePath}${path}`;

  return {
    metadataBase: new URL(origin),
    title: appTitle,
    description: appDescription,
    manifest: `${publicBasePath}/manifest.webmanifest`,
    applicationName: "Brave Blocks",
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
    appleWebApp: {
      capable: true,
      title: "Brave Blocks",
      statusBarStyle: "black-translucent",
    },
    icons: {
      icon: [
        { url: asset("/favicon.svg"), type: "image/svg+xml" },
        { url: asset("/icon-192.png"), sizes: "192x192", type: "image/png" },
      ],
      apple: [
        { url: asset("/icon-192.png"), sizes: "192x192", type: "image/png" },
      ],
      shortcut: asset("/favicon.svg"),
    },
    openGraph: {
      title: appTitle,
      description: appDescription,
      type: "website",
      images: [
        {
          url: asset("/og.png"),
          width: 1672,
          height: 941,
          alt: "Brave Blocks characters in a colorful block-built world",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: appTitle,
      description: appDescription,
      images: [asset("/og.png")],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-edition={BRAVE_BLOCKS_EDITION.toLowerCase()}
      data-profile={activeProfile.id}
    >
      <body>{children}</body>
    </html>
  );
}
