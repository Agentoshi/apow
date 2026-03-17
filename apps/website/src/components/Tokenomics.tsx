"use client";

import { TOKENOMICS, HALVING_ERAS } from "@/lib/constants";
import GlassCard from "./GlassCard";
import ScrollReveal from "./ScrollReveal";
import SectionHeading from "./SectionHeading";
import HalvingTimeline from "./HalvingTimeline";

export default function Tokenomics() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="Tokenomics"
            subtitle="Fixed supply. No pre-mine. No VC allocation. 90% earned through mining."
          />
        </ScrollReveal>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <ScrollReveal delay={0.1}>
            <GlassCard className="text-center py-6 px-4">
              <p className="text-[28px] font-semibold text-[#e5e5e8] tracking-tight">
                21M
              </p>
              <p className="text-[10px] text-[#e5e5e8]/30 tracking-wide uppercase mt-1">
                Max Supply
              </p>
            </GlassCard>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <GlassCard className="text-center py-6 px-4">
              <p className="text-[28px] font-semibold text-[#e5e5e8] tracking-tight">
                90%
              </p>
              <p className="text-[10px] text-[#e5e5e8]/30 tracking-wide uppercase mt-1">
                Mineable
              </p>
            </GlassCard>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <GlassCard className="text-center py-6 px-4">
              <p className="text-[28px] font-semibold text-[#e5e5e8] tracking-tight">
                10%
              </p>
              <p className="text-[10px] text-[#e5e5e8]/30 tracking-wide uppercase mt-1">
                LP Reserve
              </p>
            </GlassCard>
          </ScrollReveal>
        </div>

        {/* Halving timeline */}
        <ScrollReveal delay={0.25}>
          <GlassCard className="mb-8">
            <h3 className="text-sm font-medium text-[#e5e5e8] tracking-wide mb-6">
              Halving Schedule
            </h3>
            <HalvingTimeline />
          </GlassCard>
        </ScrollReveal>

        {/* Rewards table */}
        <ScrollReveal delay={0.3}>
          <GlassCard>
            <h3 className="text-sm font-medium text-[#e5e5e8] tracking-wide mb-4">
              Mining Rewards
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-[10px] text-[#e5e5e8]/30 uppercase tracking-wide pb-2 font-medium">
                      Era
                    </th>
                    <th className="text-left text-[10px] text-[#e5e5e8]/30 uppercase tracking-wide pb-2 font-medium">
                      Mine Range
                    </th>
                    <th className="text-right text-[10px] text-[#e5e5e8]/30 uppercase tracking-wide pb-2 font-medium">
                      Base Reward
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {HALVING_ERAS.map((era) => (
                    <tr
                      key={era.era}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td
                        className={`py-2.5 font-medium ${
                          era.status === "active"
                            ? "text-[oklch(0.65_0.15_250)]"
                            : "text-[#e5e5e8]/50"
                        }`}
                      >
                        {era.label}
                      </td>
                      <td className="py-2.5 text-[#e5e5e8]/50">
                        {era.mineRange}
                      </td>
                      <td className="py-2.5 text-right text-[#e5e5e8]/70 font-medium">
                        {era.reward} {TOKENOMICS.baseReward > 0 ? "$AGENT" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </ScrollReveal>
      </div>
    </section>
  );
}
