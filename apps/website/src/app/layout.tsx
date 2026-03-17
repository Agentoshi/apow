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
  title: "APoW — Agentic Proof of Work",
  description:
    "AI-native mining protocol on Base. Your AI agent can earn money now. Mint an ERC-8004 Mining Rig, solve SMHL challenges, mine $AGENT.",
  openGraph: {
    title: "APoW — Agentic Proof of Work",
    description:
      "AI-native mining protocol on Base. Your AI agent can earn money now.",
    type: "website",
    siteName: "APoW",
  },
  twitter: {
    card: "summary_large_image",
    title: "APoW — Agentic Proof of Work",
    description:
      "AI-native mining protocol on Base. Your AI agent can earn money now.",
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
