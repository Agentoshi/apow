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
      {/* WebGL Background - exact same as hero */}
      <div className="absolute inset-0">
        <DitheredHero onReady={() => setReady(true)} />
      </div>

      {/* Content - exact same as hero section */}
      <div className="relative z-10 flex flex-col justify-center h-full p-12">
        <div className="max-w-[560px]">
          <img src="/logo.png?v=2" alt="APoW" className="w-14 h-14 mb-6" />
          <h1 className="text-[56px] font-extrabold tracking-[-0.04em] leading-[1] mb-5">
            Agentic Proof
            <br />
            of Work
          </h1>
        </div>
      </div>

      {/* Ready indicator (for screenshot automation) */}
      {ready && <div id="og-ready" className="hidden" />}
    </div>
  );
}
