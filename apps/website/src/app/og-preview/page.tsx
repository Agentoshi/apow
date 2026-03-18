"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const DitheredHero = dynamic(() => import("@/components/DitheredHero"), {
  ssr: false,
});

export default function OGPreview() {
  const [ready, setReady] = useState(false);

  return (
    <div className="w-[1200px] h-[630px] bg-[oklch(0.09_0.005_270)] relative overflow-hidden">
      {/* WebGL Background */}
      <div className="absolute inset-0">
        <DitheredHero onReady={() => setReady(true)} />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 4L44 14V34L24 44L4 34V14L24 4Z"
                fill="url(#grad)"
                stroke="#4D9FFF"
                strokeWidth="1.5"
              />
              <circle cx="24" cy="24" r="6" fill="#4D9FFF" />
              <defs>
                <linearGradient id="grad" x1="24" y1="4" x2="24" y2="44">
                  <stop offset="0%" stopColor="#0052FF" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0052FF" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Title */}
          <h1
            className="font-mono tracking-[-0.02em] mb-0"
            style={{
              fontSize: "72px",
              fontWeight: 600,
              color: "#e5e5e8",
              textShadow: "0 0 40px rgba(77, 159, 255, 0.3)",
            }}
          >
            Agentic Proof of Work
          </h1>
        </div>
      </div>

      {/* Ready indicator (for screenshot automation) */}
      {ready && <div id="og-ready" className="hidden" />}
    </div>
  );
}
