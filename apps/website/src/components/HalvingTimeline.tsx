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
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-medium border ${
                  era.status === "active"
                    ? "bg-[#0052FF] border-[#0052FF] text-white shadow-[0_0_16px_rgba(0,82,255,0.4)]"
                    : "bg-white/[0.03] border-white/[0.08] text-[#5B616E]"
                }`}
              >
                {era.era}
              </div>
              <div className="mt-2 text-center">
                <p className="text-[10px] font-mono font-medium text-[#5B616E]">
                  {era.mineRange}
                </p>
                <p
                  className={`text-[12px] font-mono font-bold mt-0.5 ${
                    era.status === "active"
                      ? "text-[#0052FF]"
                      : "text-[#5B616E]"
                  }`}
                >
                  {era.reward} $AGENT
                </p>
              </div>
            </div>

            {/* Connecting line */}
            {i < HALVING_ERAS.length - 1 && (
              <div className="flex-1 h-px bg-white/[0.06] mx-3 mt-[-20px]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
