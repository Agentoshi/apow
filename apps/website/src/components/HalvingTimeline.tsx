"use client";

import { HALVING_ERAS } from "@/lib/constants";

export default function HalvingTimeline() {
  return (
    <div className="relative w-full overflow-x-auto pb-2">
      <div className="flex items-center justify-between min-w-[480px] px-4">
        {HALVING_ERAS.map((era, i) => (
          <div key={era.era} className="flex items-center flex-1">
            {/* Node */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium border ${
                  era.status === "active"
                    ? "bg-[oklch(0.65_0.15_250)] border-[oklch(0.65_0.15_250)] text-white shadow-[0_0_12px_oklch(0.65_0.15_250_/_0.4)]"
                    : "bg-white/5 border-white/10 text-[#e5e5e8]/40"
                }`}
              >
                {era.era}
              </div>
              <div className="mt-2 text-center">
                <p className="text-[10px] font-medium text-[#e5e5e8]/60">
                  {era.mineRange}
                </p>
                <p
                  className={`text-[12px] font-semibold mt-0.5 ${
                    era.status === "active"
                      ? "text-[oklch(0.65_0.15_250)]"
                      : "text-[#e5e5e8]/40"
                  }`}
                >
                  {era.reward} $AGENT
                </p>
              </div>
            </div>

            {/* Connecting line */}
            {i < HALVING_ERAS.length - 1 && (
              <div className="flex-1 h-px bg-white/10 mx-3 mt-[-20px]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
