"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPublicClient, http, formatEther, type Address, type Abi } from "viem";
import { base } from "viem/chains";
import {
  AGENT_COIN_ADDRESS,
  MINING_AGENT_ADDRESS,
  AGENT_COIN_ABI,
  MINING_AGENT_ABI,
  MULTICALL_CHUNK,
  RARITY_LABELS,
  BASE_RPC,
} from "@/lib/constants";
import { parseArtFromTokenUri } from "@/lib/format";

export interface MinerData {
  tokenId: string;
  rarity: number;
  rarityLabel: string;
  hashpower: number;
  mineCount: string;
  earnings: string;
  mintBlock: string;
  imageUri?: string;
}

export interface WalletData {
  address: string;
  ethBalance: string;
  agentBalance: string;
  miners: MinerData[];
}

const client = createPublicClient({
  chain: base,
  transport: http(BASE_RPC),
});

type McContract = {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
};

async function chunkedMulticall(
  contracts: McContract[]
): Promise<{ status: string; result?: unknown; error?: unknown }[]> {
  if (contracts.length === 0) return [];
  if (contracts.length <= MULTICALL_CHUNK) {
    return client.multicall({ contracts });
  }
  const results: { status: string; result?: unknown; error?: unknown }[] = [];
  for (let i = 0; i < contracts.length; i += MULTICALL_CHUNK) {
    const chunk = contracts.slice(i, i + MULTICALL_CHUNK);
    try {
      const chunkResults = await client.multicall({ contracts: chunk });
      results.push(...chunkResults);
    } catch {
      for (let j = 0; j < chunk.length; j++) {
        results.push({ status: "failure" });
      }
    }
  }
  return results;
}

async function fetchWalletData(addresses: string[]): Promise<WalletData[]> {
  if (addresses.length === 0) return [];

  const addrs = addresses as Address[];

  // Phase 1: ETH balance + AGENT balance + NFT count
  const phase1Contracts: McContract[] = addrs.flatMap((addr) => [
    {
      address: AGENT_COIN_ADDRESS,
      abi: AGENT_COIN_ABI as Abi,
      functionName: "balanceOf",
      args: [addr],
    },
    {
      address: MINING_AGENT_ADDRESS,
      abi: MINING_AGENT_ABI as Abi,
      functionName: "balanceOf",
      args: [addr],
    },
  ]);

  const [balances, multicallResults] = await Promise.all([
    Promise.all(addrs.map((addr) => client.getBalance({ address: addr }).catch(() => 0n))),
    chunkedMulticall(phase1Contracts),
  ]);

  const walletInfos = addrs.map((addr, i) => ({
    address: addr,
    ethBalance: balances[i],
    agentBalance: (multicallResults[i * 2]?.result as bigint) ?? 0n,
    nftCount: Number((multicallResults[i * 2 + 1]?.result as bigint) ?? 0n),
  }));

  // Phase 2: token IDs
  const tokenIdContracts: McContract[] = [];
  const tokenIdMap: { walletIdx: number }[] = [];

  for (let wi = 0; wi < walletInfos.length; wi++) {
    const info = walletInfos[wi];
    for (let mi = 0; mi < info.nftCount; mi++) {
      tokenIdContracts.push({
        address: MINING_AGENT_ADDRESS,
        abi: MINING_AGENT_ABI as Abi,
        functionName: "tokenOfOwnerByIndex",
        args: [info.address, BigInt(mi)],
      });
      tokenIdMap.push({ walletIdx: wi });
    }
  }

  const tokenIds: bigint[] = [];
  const validTokenMap: number[] = [];

  if (tokenIdContracts.length > 0) {
    const tokenIdResults = await chunkedMulticall(tokenIdContracts);
    for (let i = 0; i < tokenIdResults.length; i++) {
      const r = tokenIdResults[i];
      if (r.status === "success" && r.result != null) {
        validTokenMap.push(i);
        tokenIds.push(r.result as bigint);
      }
    }
  }

  // No miners — return early
  if (tokenIds.length === 0) {
    return walletInfos.map((info) => ({
      address: info.address,
      ethBalance: formatEther(info.ethBalance),
      agentBalance: formatEther(info.agentBalance),
      miners: [],
    }));
  }

  // Phase 3: miner stats + art
  const FIELDS_PER_TOKEN = 5;
  const detailContracts: McContract[] = tokenIds.flatMap((tokenId) => [
    { address: MINING_AGENT_ADDRESS, abi: MINING_AGENT_ABI as Abi, functionName: "rarity", args: [tokenId] },
    { address: MINING_AGENT_ADDRESS, abi: MINING_AGENT_ABI as Abi, functionName: "hashpower", args: [tokenId] },
    { address: AGENT_COIN_ADDRESS, abi: AGENT_COIN_ABI as Abi, functionName: "tokenMineCount", args: [tokenId] },
    { address: AGENT_COIN_ADDRESS, abi: AGENT_COIN_ABI as Abi, functionName: "tokenEarnings", args: [tokenId] },
    { address: MINING_AGENT_ADDRESS, abi: MINING_AGENT_ABI as Abi, functionName: "mintBlock", args: [tokenId] },
  ]);

  const detailResults = await chunkedMulticall(detailContracts);

  // Art URIs — small chunks since tokenURI returns ~41KB each
  const ART_CHUNK_SIZE = 2;
  const artResults: { status: string; result?: unknown }[] = [];
  for (let i = 0; i < tokenIds.length; i += ART_CHUNK_SIZE) {
    const chunk = tokenIds.slice(i, i + ART_CHUNK_SIZE);
    const artContracts: McContract[] = chunk.map((tokenId) => ({
      address: MINING_AGENT_ADDRESS,
      abi: MINING_AGENT_ABI as Abi,
      functionName: "tokenURI",
      args: [tokenId],
    }));
    try {
      const chunkResults = await client.multicall({ contracts: artContracts });
      artResults.push(...chunkResults);
    } catch {
      for (let j = 0; j < chunk.length; j++) {
        artResults.push({ status: "failure" });
      }
    }
  }

  // Build wallet data
  const minersByWallet = new Map<number, MinerData[]>();

  for (let ti = 0; ti < tokenIds.length; ti++) {
    const originalIdx = validTokenMap[ti];
    const { walletIdx } = tokenIdMap[originalIdx];
    const b = ti * FIELDS_PER_TOKEN;

    const rarity = Number((detailResults[b]?.result as bigint) ?? 0n);
    const hashpower = Number((detailResults[b + 1]?.result as bigint) ?? 100n);
    const mineCount = (detailResults[b + 2]?.result as bigint) ?? 0n;
    const earnings = (detailResults[b + 3]?.result as bigint) ?? 0n;
    const mintBlock = (detailResults[b + 4]?.result as bigint) ?? 0n;

    let imageUri: string | undefined;
    const artResult = artResults[ti];
    if (artResult?.status === "success" && artResult.result) {
      imageUri = parseArtFromTokenUri(artResult.result as string) || undefined;
    }

    const miner: MinerData = {
      tokenId: tokenIds[ti].toString(),
      rarity,
      rarityLabel: RARITY_LABELS[rarity] ?? `Tier ${rarity}`,
      hashpower,
      mineCount: mineCount.toString(),
      earnings: formatEther(earnings),
      mintBlock: mintBlock.toString(),
      imageUri,
    };

    if (!minersByWallet.has(walletIdx)) minersByWallet.set(walletIdx, []);
    minersByWallet.get(walletIdx)!.push(miner);
  }

  return walletInfos.map((info, i) => ({
    address: info.address,
    ethBalance: formatEther(info.ethBalance),
    agentBalance: formatEther(info.agentBalance),
    miners: minersByWallet.get(i) ?? [],
  }));
}

export function useWalletData(addresses: string[]) {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const addressKeyRef = useRef("");

  const fetch = useCallback(async () => {
    if (addresses.length === 0) {
      setWallets([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchWalletData(addresses);
      setWallets(data);
    } catch (err) {
      console.error("Failed to fetch wallet data:", err);
    } finally {
      setLoading(false);
    }
  }, [addresses]);

  useEffect(() => {
    const key = addresses.sort().join(",");
    if (key !== addressKeyRef.current) {
      addressKeyRef.current = key;
      fetch();
    }

    clearInterval(intervalRef.current);
    if (addresses.length > 0) {
      intervalRef.current = setInterval(fetch, 30_000);
    }
    return () => clearInterval(intervalRef.current);
  }, [addresses, fetch]);

  return { wallets, loading };
}
