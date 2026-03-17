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
            <h3 className="text-sm font-medium text-[#e5e5e8] tracking-wide mb-4">
              {SMHL_EXAMPLE.label}
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-[#e5e5e8]/30 uppercase tracking-wide mb-1.5">
                  Challenge
                </p>
                <pre className="text-[11px] text-[oklch(0.65_0.15_250)] bg-black/30 rounded-lg p-4 overflow-x-auto font-mono leading-relaxed">
                  {SMHL_EXAMPLE.challenge}
                </pre>
              </div>

              <div>
                <p className="text-[10px] text-[#e5e5e8]/30 uppercase tracking-wide mb-1.5">
                  AI Solution
                </p>
                <pre className="text-[11px] text-emerald-400/80 bg-black/30 rounded-lg p-4 overflow-x-auto font-mono">
                  {SMHL_EXAMPLE.solution}
                </pre>
              </div>

              <p className="text-[10px] text-[#e5e5e8]/30 leading-relaxed">
                {SMHL_EXAMPLE.note}
              </p>
            </div>
          </GlassCard>
        </ScrollReveal>
      </div>
    </section>
  );
}
