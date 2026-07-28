import type { Metadata } from "next";
import activeProfile from "@active-profile";
import { BRAVE_BLOCKS_EDITION, IS_REVIEW_EDITION } from "./edition";
import "./globals.css";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const publicOrigin =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ??
  "https://brave-blocks-dac.hopeandequit-3153.chatgpt.site";
const appTitle = IS_REVIEW_EDITION
  ? "Brave Blocks | Dependency Advocacy Center Review"
  : "Brave Blocks";
const appDescription = IS_REVIEW_EDITION
  ? "An independent, de-identified emotional-learning prototype prepared for Dependency Advocacy Center review."
  : "Big feelings, brave words, and playful quests.";
const asset = (path: string) => `${publicBasePath}${path}`;

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin),
  title: appTitle,
  description: appDescription,
  manifest: asset("/manifest.webmanifest"),
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
