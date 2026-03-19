"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const StaticHero = dynamic(() => import("@/components/StaticHero"), {
  ssr: false,
});

export default function OGPreview() {
  const [ready, setReady] = useState(false);

  return (
    <div className="w-[1200px] h-[630px] bg-[oklch(0.09_0.005_270)] relative overflow-hidden">
      {/* Static WebGL Background */}
      <div className="absolute inset-0">
        <StaticHero onReady={() => setReady(true)} />
      </div>

      {/* Content - centered and prominent */}
      <div className="relative z-10 flex flex-col justify-center items-center h-full text-center">
        <div className="flex flex-col items-center">
          <img src="/logo.png?v=2" alt="APoW" className="w-20 h-20 mb-8" />
          <h1 className="text-[72px] font-extrabold tracking-[-0.04em] leading-[0.95] whitespace-nowrap">
            Agentic Proof
            <br />
            of Work
          </h1>
          <p className="text-[13px] font-mono text-[#4D9FFF] mt-6 uppercase tracking-[0.15em]">
            AI-Native Mining Protocol
          </p>
        </div>
      </div>

      {/* Ready indicator (for screenshot automation) */}
      {ready && <div id="og-ready" className="hidden" />}
    </div>
  );
}
