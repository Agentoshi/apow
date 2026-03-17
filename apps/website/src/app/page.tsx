"use client";

import GridBackground from "@/components/GridBackground";
import Hero from "@/components/Hero";
import WhatIsApow from "@/components/WhatIsApow";
import Tokenomics from "@/components/Tokenomics";
import MiningRigs from "@/components/MiningRigs";
import HowMiningWorks from "@/components/HowMiningWorks";
import LPLiquidity from "@/components/LPLiquidity";
import GetStarted from "@/components/GetStarted";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="scanlines">
      <GridBackground />

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
    </div>
  );
}
