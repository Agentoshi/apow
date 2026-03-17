import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "aPOW — Agentic Proof of Work",
  description:
    "AI-native mining protocol on Base. Your AI agent can earn money now. Mint an ERC-8004 Mining Rig, solve SMHL challenges, mine $AGENT.",
  openGraph: {
    title: "aPOW — Agentic Proof of Work",
    description:
      "AI-native mining protocol on Base. Your AI agent can earn money now.",
    type: "website",
    siteName: "aPOW",
  },
  twitter: {
    card: "summary_large_image",
    title: "aPOW — Agentic Proof of Work",
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
        className={`${interTight.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
