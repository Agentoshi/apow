"use client";

import { HALVING_ERAS } from "@/lib/constants";
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
          {[
            { value: "21M", label: "Max Supply" },
            { value: "90%", label: "Mineable" },
            { value: "10%", label: "LP Reserve" },
          ].map((stat, i) => (
            <ScrollReveal key={stat.label} delay={0.1 + i * 0.05}>
              <GlassCard className="text-center py-6 px-4">
                <p className="text-[28px] font-bold text-white tracking-tight font-mono">
                  {stat.value}
                </p>
                <p className="text-[10px] text-[#5B616E] tracking-[0.15em] uppercase mt-1 font-mono">
                  {stat.label}
                </p>
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>

        {/* Halving timeline */}
        <ScrollReveal delay={0.25}>
          <GlassCard className="mb-8">
            <h3 className="text-sm font-medium text-white tracking-wide mb-6 font-mono uppercase">
              Halving Schedule
            </h3>
            <HalvingTimeline />
          </GlassCard>
        </ScrollReveal>

        {/* Rewards table */}
        <ScrollReveal delay={0.3}>
          <GlassCard>
            <h3 className="text-sm font-medium text-white tracking-wide mb-4 font-mono uppercase">
              Mining Rewards
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-[10px] text-[#5B616E] uppercase tracking-[0.15em] pb-3 font-medium">
                      Era
                    </th>
                    <th className="text-left text-[10px] text-[#5B616E] uppercase tracking-[0.15em] pb-3 font-medium">
                      Mine Range
                    </th>
                    <th className="text-right text-[10px] text-[#5B616E] uppercase tracking-[0.15em] pb-3 font-medium">
                      Reward
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {HALVING_ERAS.map((era) => (
                    <tr
                      key={era.era}
                      className="border-b border-white/[0.03] last:border-0"
                    >
                      <td
                        className={`py-2.5 font-medium ${
                          era.status === "active"
                            ? "text-[#0052FF]"
                            : "text-[#717886]"
                        }`}
                      >
                        {era.label}
                      </td>
                      <td className="py-2.5 text-[#717886]">
                        {era.mineRange}
                      </td>
                      <td className="py-2.5 text-right text-[#B1B7C3] font-medium">
                        {era.reward} $AGENT
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
