"use client";

import type { NetworkStats as NetworkStatsType } from "@/hooks/useNetworkStats";
import { fmt, fmtFixed } from "@/lib/format";
import { LP_VAULT_THRESHOLD } from "@/lib/constants";

function StatCell({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-3 sm:p-4">
      <div className="text-[9px] sm:text-[10px] text-[#5B616E] uppercase tracking-[0.05em] mb-1">
        {label}
      </div>
      <div className={`text-[13px] sm:text-[14px] font-semibold font-mono ${highlight ? "text-[#0052FF]" : "text-white"}`}>
        {value}
      </div>
      {sub && (
        <div className="text-[9px] text-[#5B616E] mt-0.5">{sub}</div>
      )}
    </div>
  );
}

export function NetworkStats({ stats }: { stats: NetworkStatsType | null }) {
  if (!stats) {
    return (
      <div className="dashboard-grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 mb-px">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="h-3 w-16 bg-[rgba(255,255,255,0.04)] mb-2" />
            <div className="h-5 w-12 bg-[rgba(255,255,255,0.04)]" />
          </div>
        ))}
      </div>
    );
  }

  const vaultPct = Math.min((stats.vaultBalance / LP_VAULT_THRESHOLD) * 100, 100);

  return (
    <div className="dashboard-grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 mb-px">
      <StatCell
        label="Network Mines"
        value={fmt(Number(stats.totalMines), 0)}
        highlight
      />
      <StatCell
        label="Rigs Minted"
        value={`${fmt(stats.rigsMinted, 0)} / 10K`}
      />
      <StatCell
        label="Era"
        value={String(stats.era)}
        sub={`${fmt(Number(stats.minesUntilNextEra), 0)} to next`}
      />
      <StatCell
        label="Base Reward"
        value={`${fmtFixed(stats.baseReward, 2)} AGENT`}
      />
      <StatCell
        label="Difficulty"
        value={stats.difficulty}
      />
      <StatCell
        label="LP Vault"
        value={`${fmtFixed(vaultPct, 1)}%`}
        sub={`${fmtFixed(stats.vaultBalance, 4)} / ${LP_VAULT_THRESHOLD} ETH`}
      />
    </div>
  );
}
