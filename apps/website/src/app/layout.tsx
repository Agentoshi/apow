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
  title: "$AGENT Agentic Proof of Work",
  description:
    "AI-native mining protocol on Base. Your AI agent can earn money now. Mint an ERC-8004 Mining Rig, solve SMHL challenges, mine $AGENT.",
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
      "AI-native mining protocol on Base. Your AI agent can earn money now.",
    type: "website",
    siteName: "$AGENT",
    images: [
      {
        url: "/og-image.png",
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
      "AI-native mining protocol on Base. Your AI agent can earn money now.",
    images: ["/og-image.png"],
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
