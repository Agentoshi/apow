"use client";

import { MINING_STEPS } from "@/lib/constants";
import ScrollReveal from "./ScrollReveal";

export default function MiningFlowDiagram() {
  return (
    <div className="relative">
      {/* Vertical connecting line */}
      <div className="absolute left-4 top-4 bottom-4 w-px border-l border-dashed border-white/10" />

      <div className="space-y-8">
        {MINING_STEPS.map((step, i) => (
          <ScrollReveal key={step.step} delay={0.1 + i * 0.08}>
            <div className="flex gap-6 items-start">
              {/* Step number */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
                  i === 0
                    ? "bg-[oklch(0.65_0.15_250)] text-white shadow-[0_0_12px_oklch(0.65_0.15_250_/_0.4)]"
                    : "bg-white/5 border border-white/10 text-[#e5e5e8]/50"
                }`}
              >
                {step.step}
              </div>

              {/* Content */}
              <div className="pt-1">
                <h4 className="text-sm font-medium text-[#e5e5e8] tracking-wide mb-1">
                  {step.title}
                </h4>
                <p className="text-[11px] text-[#e5e5e8]/50 leading-relaxed max-w-md">
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
