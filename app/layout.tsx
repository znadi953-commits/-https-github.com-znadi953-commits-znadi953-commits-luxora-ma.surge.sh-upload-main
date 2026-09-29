import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUXORA — He watches. He judges. He follows.",
  description:
    "A sulking 3D monkey that never breaks eye contact — built with canvas, not CSS tricks. 190 frames of pure gaze tracking.",
  openGraph: {
    title: "LUXORA — He watches. He judges. He follows.",
    description:
      "A sulking 3D monkey that never breaks eye contact — built with canvas, not CSS tricks.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload neutral frame with high priority */}
        <link
          rel="preload"
          as="image"
          href="/frames/frame-000.webp"
          type="image/webp"
          // @ts-ignore - fetchpriority is valid
          fetchPriority="high"
        />
        {/* Fallback fonts via Google Fonts CDN - no build-time fetch */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ink text-paper antialiased">{children}</body>
    </html>
  );
}
