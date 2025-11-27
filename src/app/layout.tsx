import type { Metadata } from "next";
import { CREATOR_USERNAME } from "@/lib/constants";
import "./globals.css";
import { ResponseLogger } from "@/components/response-logger";
import { cookies } from "next/headers";
import { ReadyNotifier } from "@/components/ready-notifier";
import FarcasterWrapper from "@/components/FarcasterWrapper";


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const requestId = cookieStore.get("x-request-id")?.value;

  return (
        <html lang="en">
          <head>
            {requestId && <meta name="x-request-id" content={requestId} />}
          </head>
          <body className={`antialiased`}>
            {/* Do not remove this component, we use it to notify the parent that the mini-app is ready */}
            <ReadyNotifier />
            
      <FarcasterWrapper>
        {children}
      </FarcasterWrapper>
      
            <ResponseLogger />
          </body>
        </html>
      );
}

export const metadata: Metadata = {
        title: "Gesture Translator",
        description: `Convert gestures to text/audio in multiple languages for the hearing-impaired. Support us via USDC/ETH donations directly through the app. UID: farcaster ${CREATOR_USERNAME}.`,
        other: { 
          "fc:miniapp": JSON.stringify({ version: "1" }),
          "fc:frame": JSON.stringify({
            version: "next",
            imageUrl: "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_e6a8c594-ad66-4fdd-9511-d14d4581c9e1-hlhHK1O5jC2ojzAgKAM7OMvaVgwQdp",
            button: {
              title: "Open Deaf Helper",
              action: {
                type: "launch_frame",
                name: "Gesture Translator",
                url: "https://deaf-miniapp.vercel.app/",
                splashImageUrl: "https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/farcaster/splash_images/splash_image1.svg",
                splashBackgroundColor: "#ffffff"
              }
            }
          })
        }
    };
