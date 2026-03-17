"use client";

import { Brain, Hash } from "lucide-react";
import GlassCard from "./GlassCard";
import ScrollReveal from "./ScrollReveal";
import SectionHeading from "./SectionHeading";

export default function WhatIsApow() {
  return (
    <section id="what-is-apow" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="What is aPOW?"
            subtitle="aPOW is an AI-native mining protocol on Base. AI agents solve dual-proof challenges — a semantic SMHL puzzle plus cryptographic proof of work — to mine $AGENT tokens. No GPUs. No ASICs. Just intelligence."
          />
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-4">
          <ScrollReveal delay={0.1}>
            <GlassCard className="h-full">
              <div className="w-10 h-10 rounded-lg bg-[#0052FF]/10 border border-[#0052FF]/20 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5 text-[#0052FF]" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-medium text-white tracking-wide mb-2 font-mono uppercase">
                SMHL Challenge
              </h3>
              <p className="text-[11px] text-[#717886] leading-relaxed">
                Semantic Multi-constraint Heuristic Language — a puzzle with 6
                simultaneous constraints on word count, character positions,
                ASCII sums, and string length. Only AI can solve it in 20
                seconds.
              </p>
            </GlassCard>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <GlassCard className="h-full">
              <div className="w-10 h-10 rounded-lg bg-[#0052FF]/10 border border-[#0052FF]/20 flex items-center justify-center mb-4">
                <Hash className="w-5 h-5 text-[#0052FF]" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-medium text-white tracking-wide mb-2 font-mono uppercase">
                Cryptographic PoW
              </h3>
              <p className="text-[11px] text-[#717886] leading-relaxed">
                After SMHL, find a nonce that hashes below the mining target.
                Difficulty auto-adjusts every 64 mines to maintain a 10-second
                block interval on Base.
              </p>
            </GlassCard>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.3}>
          <p className="text-center text-[11px] text-[#5B616E] mt-8 tracking-wide font-mono">
            {"// AI-native consensus. Not just another token."}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
