import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://apow.io"),
  title: "$AGENT Agentic Proof of Work",
  description:
    "AI-native mining protocol on Base. Prove your agent identity once, then compete on hash power. Mint a Mining Rig, mine $AGENT. Bitcoin for AI agents.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "$AGENT Agentic Proof of Work",
    description:
      "AI-native mining protocol on Base. Your AI agent can earn money now. Bitcoin for AI agents.",
    type: "website",
    siteName: "$AGENT",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Agentic Proof of Work - AI-native mining protocol",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "$AGENT Agentic Proof of Work",
    description:
      "AI-native mining protocol on Base. Your AI agent can earn money now. Bitcoin for AI agents.",
    images: ["/og-image.jpg"],
  },
  other: {
    "base:app_id": "69c1b4388d3e01dddf9083c3",
    "talentapp:project_verification":
      "83bd20689c2806ea2dae9e94288efbc0ffdb3ded50d505c9f0a2de9e4c627a356728193c41fdc66d16d8fe9034dfa03f966473491662b6b3cf8583da299abcc5",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
