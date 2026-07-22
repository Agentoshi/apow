"use client";

import { useState } from "react";
import type { WalletData } from "@/hooks/useWalletData";
import { RigCard } from "./RigCard";
import { shortAddr, fmt, fmtFixed } from "@/lib/format";

export function WalletCard({
  wallet,
  onRemove,
}: {
  wallet: WalletData;
  onRemove: (addr: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasAgent = Number(wallet.agentBalance) > 0;
  const totalHp = wallet.miners.reduce((sum, m) => sum + m.hashpower, 0);

  return (
    <div className="border border-[rgba(255,255,255,0.06)] bg-[#0A0B0D] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2">
          <a
            href={`https://basescan.org/address/${wallet.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-[#5B616E] hover:text-[#0052FF] transition-colors"
          >
            {shortAddr(wallet.address)}
          </a>
          {wallet.miners.length > 0 && (
            <span className="text-[9px] font-mono text-[#66C800]">
              {fmtFixed(totalHp / 100, 1)}x
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-[#5B616E]">
              <span className="text-[9px]">E </span>
              {fmtFixed(Number(wallet.ethBalance), 4)}
            </span>
            <span className={hasAgent ? "text-[#0052FF]" : "text-[#5B616E]"}>
              <span className="text-[9px]">A </span>
              {fmt(Number(wallet.agentBalance), 1)}
            </span>
          </div>
          <button
            onClick={() => onRemove(wallet.address)}
            className="text-[9px] text-[#32353D] hover:text-[#FC401F] transition-colors"
            title="Remove"
          >
            x
          </button>
        </div>
      </div>

      {/* Miners */}
      {wallet.miners.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2 p-2">
            {wallet.miners.slice(0, expanded ? undefined : 4).map((miner) => (
              <RigCard key={miner.tokenId} miner={miner} />
            ))}
          </div>
          {wallet.miners.length > 4 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-1.5 text-[9px] font-mono text-[#4D9FFF] hover:text-[#0052FF] transition-colors border-t border-[rgba(255,255,255,0.04)]"
            >
              {expanded ? "Show less" : `Show all ${wallet.miners.length} rigs`}
            </button>
          )}
        </>
      ) : (
        <div className="px-3 py-2 text-[10px] font-mono text-[#32353D]">
          No miners
        </div>
      )}
    </div>
  );
}
