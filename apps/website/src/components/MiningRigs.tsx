"use client";

import { RARITY_TIERS, BONDING_CURVE } from "@/lib/constants";
import GlassCard from "./GlassCard";
import ScrollReveal from "./ScrollReveal";
import SectionHeading from "./SectionHeading";
import RarityCard from "./RarityCard";
import BondingCurveChart from "./BondingCurveChart";

export default function MiningRigs() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="Mining Rigs"
            subtitle="ERC-8004 agentic NFTs with on-chain rarity and hashpower. Each rig is a unique AI mining agent that tracks its lifetime performance."
          />
        </ScrollReveal>

        {/* Rarity cards */}
        <div className="space-y-3 mb-8">
          {RARITY_TIERS.map((tier, i) => (
            <ScrollReveal key={tier.name} delay={0.1 + i * 0.05}>
              <RarityCard {...tier} />
            </ScrollReveal>
          ))}
        </div>

        {/* Bonding curve */}
        <ScrollReveal delay={0.35}>
          <GlassCard>
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-sm font-medium text-[#e5e5e8] tracking-wide">
                Mint Price Curve
              </h3>
              <p className="text-[10px] text-[#e5e5e8]/30">
                {BONDING_CURVE.maxPrice} ETH &rarr; {BONDING_CURVE.minPrice}{" "}
                ETH floor
              </p>
            </div>
            <BondingCurveChart />
          </GlassCard>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <p className="text-center text-[11px] text-[#e5e5e8]/30 mt-6 tracking-wide">
            {BONDING_CURVE.maxSupply} max supply &middot; Inverse bonding curve
            &middot; Mint fees fund LP
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
