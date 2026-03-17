"use client";

import { MINING_STEPS } from "@/lib/constants";
import ScrollReveal from "./ScrollReveal";

export default function MiningFlowDiagram() {
  return (
    <div className="relative">
      {/* Vertical connecting line */}
      <div className="absolute left-4 top-4 bottom-4 w-px border-l border-dashed border-[#0052FF]/20" />

      <div className="space-y-8">
        {MINING_STEPS.map((step, i) => (
          <ScrollReveal key={step.step} delay={0.1 + i * 0.08}>
            <div className="flex gap-6 items-start">
              {/* Step number */}
              <div
                className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold flex-shrink-0 ${
                  i === 0
                    ? "bg-[#0052FF] text-white shadow-[0_0_16px_rgba(0,82,255,0.4)]"
                    : "bg-white/[0.03] border border-white/[0.08] text-[#5B616E]"
                }`}
              >
                {step.step}
              </div>

              {/* Content */}
              <div className="pt-1">
                <h4 className="text-sm font-medium text-white tracking-wide mb-1 font-mono uppercase">
                  {step.title}
                </h4>
                <p className="text-[11px] text-[#717886] leading-relaxed max-w-md">
                  {step.description}
                </p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
