"use client";

import type { WalletData } from "@/hooks/useWalletData";
import { fmt, fmtFixed } from "@/lib/format";

export function AggregateStats({ wallets }: { wallets: WalletData[] }) {
  if (wallets.length === 0) return null;

  let totalAgent = 0;
  let totalEth = 0;
  let totalMiners = 0;
  let totalMines = 0;
  let totalEarnings = 0;
  let totalHashpower = 0;

  for (const w of wallets) {
    totalAgent += Number(w.agentBalance);
    totalEth += Number(w.ethBalance);
    totalMiners += w.miners.length;
    for (const m of w.miners) {
      totalMines += Number(m.mineCount);
      totalEarnings += Number(m.earnings);
      totalHashpower += m.hashpower;
    }
  }

  const stats = [
    { label: "Wallets", value: String(wallets.length) },
    { label: "Total Rigs", value: String(totalMiners) },
    { label: "Total Hashpower", value: `${fmtFixed(totalHashpower / 100, 1)}x` },
    { label: "Total Mines", value: fmt(totalMines, 0) },
    { label: "Total AGENT", value: fmt(totalAgent, 1), highlight: true },
    { label: "Mined AGENT", value: fmt(totalEarnings, 1) },
    { label: "Total ETH", value: fmtFixed(totalEth, 4) },
  ];

  return (
    <div className="dashboard-grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 mb-px">
      {stats.map((s) => (
        <div key={s.label} className="p-3">
          <div className="text-[9px] text-[#5B616E] uppercase tracking-[0.05em] mb-1">
            {s.label}
          </div>
          <div
            className={`text-[13px] font-semibold font-mono ${
              s.highlight ? "text-[#0052FF]" : "text-white"
            }`}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
