"use client";

import type { MinerData } from "@/hooks/useWalletData";
import { RARITY_COLORS, MINING_AGENT_ADDRESS } from "@/lib/constants";
import { fmt, fmtFixed } from "@/lib/format";

export function RigCard({ miner }: { miner: MinerData }) {
  const color = RARITY_COLORS[miner.rarity] ?? "#5B616E";
  const osUrl = `https://opensea.io/item/base/${MINING_AGENT_ADDRESS.toLowerCase()}/${miner.tokenId}`;

  return (
    <a
      href={osUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2 hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
    >
      {/* Art thumbnail */}
      {miner.imageUri ? (
        <img
          src={miner.imageUri}
          alt={`Rig #${miner.tokenId}`}
          className="w-10 h-10 rounded group-hover:shadow-[0_0_0_1px_#0052FF] transition-shadow"
        />
      ) : (
        <div className="w-10 h-10 rounded bg-[rgba(255,255,255,0.05)] animate-pulse" />
      )}

      {/* Stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-[#5B616E] group-hover:text-[#0052FF] transition-colors">
            #{miner.tokenId}
          </span>
          <span
            className="text-[8px] font-mono uppercase tracking-[0.08em] px-1 py-px"
            style={{ color, border: `1px solid ${color}40` }}
          >
            {miner.rarityLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[9px] font-mono text-[#5B616E]">
            {fmtFixed(miner.hashpower / 100, 1)}x HP
          </span>
          <span className="text-[9px] font-mono text-[#5B616E]">
            {fmt(Number(miner.mineCount), 0)} mines
          </span>
          <span className="text-[9px] font-mono text-[#0052FF]">
            {fmt(Number(miner.earnings), 1)} AGENT
          </span>
        </div>
      </div>
    </a>
  );
}
