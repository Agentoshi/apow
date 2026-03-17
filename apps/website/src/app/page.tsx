"use client";

import dynamic from "next/dynamic";
import Hero from "@/components/Hero";
import WhatIsApow from "@/components/WhatIsApow";
import Tokenomics from "@/components/Tokenomics";
import MiningRigs from "@/components/MiningRigs";
import HowMiningWorks from "@/components/HowMiningWorks";
import LPLiquidity from "@/components/LPLiquidity";
import GetStarted from "@/components/GetStarted";
import Footer from "@/components/Footer";

const DarkLiquidBackground = dynamic(
  () => import("@/components/DarkLiquidBackground"),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <DarkLiquidBackground />
      <div className="fixed inset-0 -z-20 bg-[oklch(0.09_0.005_270)]" />

      <main>
        <Hero />
        <WhatIsApow />
        <Tokenomics />
        <MiningRigs />
        <HowMiningWorks />
        <LPLiquidity />
        <GetStarted />
      </main>

      <Footer />
    </>
  );
}
