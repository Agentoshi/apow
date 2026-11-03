"use client";

import { LP_VAULT_THRESHOLD } from "@/lib/constants";
import { fmtFixed } from "@/lib/format";

export function VaultProgress({ balance }: { balance: number }) {
  const percent = Math.min((balance / LP_VAULT_THRESHOLD) * 100, 100);
  const deployed = balance >= LP_VAULT_THRESHOLD;

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-mono text-[#5B616E] uppercase tracking-[0.05em]">
          LP Vault Progress
        </span>
        {deployed ? (
          <span className="text-[9px] font-mono text-[#66C800]">Liquidity Deployed</span>
        ) : (
          <span className="text-[9px] font-mono text-[#4D9FFF]">
            {fmtFixed(balance, 4)} / {LP_VAULT_THRESHOLD} ETH
          </span>
        )}
      </div>
      <div className="relative h-1.5 bg-[rgba(255,255,255,0.04)] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out"
          style={{
            width: `${percent}%`,
            background: deployed
              ? "linear-gradient(90deg, #66C800, #44AA00)"
              : "linear-gradient(90deg, #0052FF, #4D9FFF)",
            boxShadow: deployed
              ? "0 0 12px rgba(102,200,0,0.4)"
              : "0 0 12px rgba(0,82,255,0.4)",
          }}
        />
      </div>
    </div>
  );
}
