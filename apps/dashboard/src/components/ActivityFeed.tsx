"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPublicClient, http, formatEther, parseAbiItem, type Address } from "viem";
import { base } from "viem/chains";
import { AGENT_COIN_ADDRESS, RARITY_LABELS, RARITY_COLORS, BASE_RPC } from "@/lib/constants";
import { shortAddr, fmt } from "@/lib/format";

interface MinedEvent {
  miner: string;
  tokenId: string;
  reward: string;
  blockNumber: bigint;
  timestamp?: number;
}

const client = createPublicClient({
  chain: base,
  transport: http(BASE_RPC),
});

const minedEvent = parseAbiItem(
  "event Mined(address indexed miner, uint256 indexed tokenId, uint256 reward, uint256 totalMines)"
);

export function ActivityFeed({ watchedAddresses }: { watchedAddresses: string[] }) {
  const [events, setEvents] = useState<MinedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchEvents = useCallback(async () => {
    if (watchedAddresses.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      const blockNumber = await client.getBlockNumber();
      // Look back ~1000 blocks (~30 minutes on Base)
      const fromBlock = blockNumber > 1000n ? blockNumber - 1000n : 0n;

      const logs = await client.getLogs({
        address: AGENT_COIN_ADDRESS,
        event: minedEvent,
        fromBlock,
        toBlock: "latest",
      });

      const watchedSet = new Set(watchedAddresses.map((a) => a.toLowerCase()));

      const filtered = logs
        .filter((log) => {
          const miner = log.args.miner as string;
          return watchedSet.has(miner.toLowerCase());
        })
        .reverse()
        .slice(0, 20)
        .map((log) => ({
          miner: log.args.miner as string,
          tokenId: (log.args.tokenId as bigint).toString(),
          reward: formatEther(log.args.reward as bigint),
          blockNumber: log.blockNumber,
        }));

      setEvents(filtered);
    } catch (err) {
      console.error("Failed to fetch Mined events:", err);
    } finally {
      setLoading(false);
    }
  }, [watchedAddresses]);

  useEffect(() => {
    fetchEvents();
    intervalRef.current = setInterval(fetchEvents, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchEvents]);

  if (watchedAddresses.length === 0) return null;

  return (
    <div className="border border-[rgba(255,255,255,0.06)] bg-[#0A0B0D]">
      <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.04)]">
        <span className="text-[10px] font-mono text-[#5B616E] uppercase tracking-[0.05em]">
          Recent Activity
        </span>
      </div>

      {loading ? (
        <div className="p-4 text-center text-[10px] font-mono text-[#32353D]">
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="p-4 text-center text-[10px] font-mono text-[#32353D]">
          No recent mining activity
        </div>
      ) : (
        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
          {events.map((ev, i) => (
            <div key={`${ev.blockNumber}-${i}`} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#0052FF] pulse-dot" />
                <span className="text-[10px] font-mono text-[#5B616E]">
                  {shortAddr(ev.miner)}
                </span>
                <span className="text-[9px] font-mono text-[#32353D]">
                  Rig #{ev.tokenId}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-[#0052FF]">
                  +{fmt(Number(ev.reward), 2)} AGENT
                </span>
                <span className="text-[9px] font-mono text-[#32353D]">
                  Block {ev.blockNumber.toString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
