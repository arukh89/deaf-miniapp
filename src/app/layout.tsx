export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { CREATOR_USERNAME } from "@/lib/constants";
import "./globals.css";
import { ResponseLogger } from "@/components/response-logger";
import { ReadyNotifier } from "@/components/ready-notifier";
import FarcasterWrapper from "@/components/FarcasterWrapper";
import { cookies } from "next/headers";
import { WagmiProviders } from "@/providers/WagmiProviders";

const APP_URL = "https://deaf-miniapp.vercel.app/";
const TILE_IMAGE_URL =
  "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_e6a8c594-ad66-4fdd-9511-d14d4581c9e1-hlhHK1O5jC2ojzAgKAM7OMvaVgwQdp";
const SPLASH_IMAGE_URL = APP_URL + "splash.svg";

// Follow Farcaster mini-app meta spec exactly
const frame = {
  version: "1" as const,
  imageUrl: TILE_IMAGE_URL,
  button: {
    title: "Launch Gesture Translator",
    action: {
      type: "launch_frame" as const,
      name: "Gesture Translator",
      url: APP_URL,
      splashImageUrl: SPLASH_IMAGE_URL,
      splashBackgroundColor: "#ffffff",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Gesture Translator",
    description: `Convert gestures to text/audio in multiple languages for the hearing-impaired. Support us via USDC/ETH donations directly through the app. UID: farcaster ${CREATOR_USERNAME}.`,
    openGraph: {
      title: "Gesture Translator",
      description: `Convert gestures to text/audio in multiple languages for the hearing-impaired. Support us via USDC/ETH donations directly through the app. UID: farcaster ${CREATOR_USERNAME}.`,
      url: APP_URL,
      type: "website",
      images: [
        {
          url: TILE_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: "Gesture Translator",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Gesture Translator",
      description: `Convert gestures to text/audio in multiple languages for the hearing-impaired. Support us via USDC/ETH donations directly through the app. UID: farcaster ${CREATOR_USERNAME}.`,
      images: [TILE_IMAGE_URL],
    },
    other: {
      "fc:miniapp": JSON.stringify(frame),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const requestId = cookieStore.get("x-request-id")?.value;

  return (
    <html lang="en">
      <head>{requestId && <meta name="x-request-id" content={requestId} />}</head>
      <body className="antialiased">
        {/* Do not remove this component — used to notify parent that the mini-app is ready */}
        <ReadyNotifier />
        <WagmiProviders>
          <FarcasterWrapper>{children}</FarcasterWrapper>
        </WagmiProviders>
        <ResponseLogger />
      </body>
    </html>
  );
}
