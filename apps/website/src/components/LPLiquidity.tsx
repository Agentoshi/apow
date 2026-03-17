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
                  <div className="w-10 h-10 rounded-lg bg-[#0052FF]/10 border border-[#0052FF]/20 flex items-center justify-center mb-4">
                    <Icon
                      className="w-5 h-5 text-[#0052FF]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 className="text-sm font-medium text-white tracking-wide mb-2 font-mono uppercase">
                    {feature.title}
                  </h3>
                  <p className="text-[11px] text-[#717886] leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal delay={0.4}>
          <p className="text-center text-[11px] text-[#5B616E] tracking-wide font-mono">
            {"// no rug. no team tokens. protocol-owned liquidity."}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
