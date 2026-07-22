"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPublicClient, http, formatEther, type Address, type Abi } from "viem";
import { base } from "viem/chains";
import {
  AGENT_COIN_ADDRESS,
  MINING_AGENT_ADDRESS,
  LP_VAULT_ADDRESS,
  AGENT_COIN_ABI,
  MINING_AGENT_ABI,
  ERA_INTERVAL,
  BASE_RPC,
} from "@/lib/constants";

export interface NetworkStats {
  totalMines: string;
  totalMinted: string;
  miningTarget: bigint;
  era: number;
  minesUntilNextEra: string;
  baseReward: number;
  difficulty: string;
  supplyPct: number;
  rigsMinted: number;
  mintPrice: string;
  vaultBalance: number;
}

const client = createPublicClient({
  chain: base,
  transport: http(BASE_RPC),
});

export function useNetworkStats() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchStats = useCallback(async () => {
    try {
      const [multicallResults, vaultBal] = await Promise.all([
        client.multicall({
          contracts: [
            { address: AGENT_COIN_ADDRESS, abi: AGENT_COIN_ABI as Abi, functionName: "totalMines" },
            { address: AGENT_COIN_ADDRESS, abi: AGENT_COIN_ABI as Abi, functionName: "totalMinted" },
            { address: AGENT_COIN_ADDRESS, abi: AGENT_COIN_ABI as Abi, functionName: "miningTarget" },
            { address: AGENT_COIN_ADDRESS, abi: AGENT_COIN_ABI as Abi, functionName: "MINEABLE_SUPPLY" },
            { address: MINING_AGENT_ADDRESS, abi: MINING_AGENT_ABI as Abi, functionName: "getMintPrice" },
            { address: MINING_AGENT_ADDRESS, abi: MINING_AGENT_ABI as Abi, functionName: "nextTokenId" },
          ],
        }),
        client.getBalance({ address: LP_VAULT_ADDRESS }),
      ]);

      const totalMines = multicallResults[0].result as bigint;
      const totalMinted = multicallResults[1].result as bigint;
      const miningTarget = multicallResults[2].result as bigint;
      const mineableSupply = multicallResults[3].result as bigint;
      const mintPrice = multicallResults[4].result as bigint;
      const nextTokenId = multicallResults[5].result as bigint;

      const era = totalMines / BigInt(ERA_INTERVAL);
      const minesUntilNextEra = BigInt(ERA_INTERVAL) - (totalMines % BigInt(ERA_INTERVAL));
      const supplyPct = Number((totalMinted * 10000n) / mineableSupply) / 100;

      let baseReward = 3;
      for (let i = 0n; i < era; i++) {
        baseReward *= 0.9;
      }

      const targetLog = Math.log2(Number(miningTarget));
      const difficulty =
        targetLog > 250 ? "Very Easy" :
        targetLog > 240 ? "Easy" :
        targetLog > 220 ? "Moderate" :
        targetLog > 200 ? "Hard" : "Very Hard";

      setStats({
        totalMines: totalMines.toString(),
        totalMinted: formatEther(totalMinted),
        miningTarget,
        era: Number(era),
        minesUntilNextEra: minesUntilNextEra.toString(),
        baseReward,
        difficulty,
        supplyPct,
        rigsMinted: Number(nextTokenId) - 1,
        mintPrice: formatEther(mintPrice),
        vaultBalance: Number(formatEther(vaultBal)),
      });
    } catch (err) {
      console.error("Failed to fetch network stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(fetchStats, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchStats]);

  return { stats, loading };
}
