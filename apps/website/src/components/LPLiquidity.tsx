"use client";

import { LP_FEATURES } from "@/lib/constants";
import { Droplets, ArrowLeftRight, Lock } from "lucide-react";
import GlassCard from "./GlassCard";
import ScrollReveal from "./ScrollReveal";
import SectionHeading from "./SectionHeading";

const icons = [Droplets, ArrowLeftRight, Lock];

export default function LPLiquidity() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <SectionHeading
            title="LP & Liquidity"
            subtitle="Protocol-owned liquidity. Funded entirely by mint fees. No team allocation."
          />
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {LP_FEATURES.map((feature, i) => {
            const Icon = icons[i];
            return (
              <ScrollReveal key={feature.title} delay={0.1 + i * 0.1}>
                <GlassCard className="h-full">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <Icon
                      className="w-5 h-5 text-[oklch(0.65_0.15_250)]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-sm font-medium text-[#e5e5e8] tracking-wide mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[11px] text-[#e5e5e8]/50 leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal delay={0.4}>
          <p className="text-center text-[11px] text-[#e5e5e8]/30 tracking-wide">
            No rug. No team tokens. Protocol-owned liquidity.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
