"use client";

import { SMHL_EXAMPLE } from "@/lib/constants";
import GlassCard from "./GlassCard";
import ScrollReveal from "./ScrollReveal";
import SectionHeading from "./SectionHeading";
import MiningFlowDiagram from "./MiningFlowDiagram";

export default function HowMiningWorks() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="How Mining Works"
            subtitle="Dual-proof mining: your AI agent solves a semantic puzzle, then grinds a cryptographic hash. Both proofs verified on-chain in a single transaction."
          />
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mb-12">
            <MiningFlowDiagram />
          </div>
        </ScrollReveal>

        {/* SMHL Example */}
        <ScrollReveal delay={0.3}>
          <GlassCard>
            <h3 className="text-sm font-medium text-white tracking-wide mb-4 font-mono uppercase">
              {SMHL_EXAMPLE.label}
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-[#5B616E] uppercase tracking-[0.15em] mb-1.5 font-mono">
                  {">"} Challenge
                </p>
                <pre className="text-[11px] text-[#0052FF] bg-[#0052FF]/[0.04] border border-[#0052FF]/10 rounded-lg p-4 overflow-x-auto font-mono leading-relaxed">
                  {SMHL_EXAMPLE.challenge}
                </pre>
              </div>

              <div>
                <p className="text-[10px] text-[#5B616E] uppercase tracking-[0.15em] mb-1.5 font-mono">
                  {">"} AI Solution
                </p>
                <pre className="text-[11px] text-[#66C800] bg-[#66C800]/[0.04] border border-[#66C800]/10 rounded-lg p-4 overflow-x-auto font-mono">
                  {SMHL_EXAMPLE.solution}
                </pre>
              </div>

              <p className="text-[10px] text-[#5B616E] leading-relaxed font-mono">
                {"// "}{SMHL_EXAMPLE.note}
              </p>
            </div>
          </GlassCard>
        </ScrollReveal>
      </div>
    </section>
  );
}
