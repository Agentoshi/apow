import type { SourceAsset } from "./types";

export interface SplitPlanInput {
  sourceAsset: SourceAsset;
  amount: string;
  ethReserveTarget: string;
  usdcReserveTarget: string;
  currentEth: string;
  currentUsdc: string;
}

export interface SplitPlan {
  sourceAsset: SourceAsset;
  needsSwap: boolean;
  swapDirection: "ETH_TO_USDC" | "USDC_TO_ETH" | "NONE";
  targetEth: string;
  targetUsdc: string;
  reason: string;
}

function decimal(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid positive decimal: ${value}`);
  }
  return parsed;
}

function fixed(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(/\.?0+$/, "");
}

export function sourceAssetLabel(asset: SourceAsset): string {
  switch (asset) {
    case "BASE_ETH":
      return "Base ETH";
    case "BASE_USDC":
      return "Base USDC";
    case "SOLANA_SOL":
      return "Solana SOL";
    case "SOLANA_USDC":
      return "Solana USDC";
  }
}

export function sourceAssetDepositAsset(asset: SourceAsset): "ETH" | "USDC" | "SOL" {
  if (asset === "BASE_ETH") return "ETH";
  if (asset === "BASE_USDC") return "USDC";
  if (asset === "SOLANA_SOL") return "SOL";
  return "USDC";
}

export function planAutoSplit(input: SplitPlanInput): SplitPlan {
  const currentEth = decimal(input.currentEth);
  const currentUsdc = decimal(input.currentUsdc);
  const ethTarget = decimal(input.ethReserveTarget);
  const usdcTarget = decimal(input.usdcReserveTarget);

  if (currentEth < ethTarget && (input.sourceAsset === "BASE_USDC" || input.sourceAsset === "SOLANA_USDC")) {
    return {
      sourceAsset: input.sourceAsset,
      needsSwap: true,
      swapDirection: "USDC_TO_ETH",
      targetEth: fixed(ethTarget, 6),
      targetUsdc: fixed(usdcTarget, 2),
      reason: "USDC arrived first, so the app must swap a slice into ETH for minting and gas.",
    };
  }

  if (currentUsdc < usdcTarget && (input.sourceAsset === "BASE_ETH" || input.sourceAsset === "SOLANA_SOL")) {
    return {
      sourceAsset: input.sourceAsset,
      needsSwap: true,
      swapDirection: "ETH_TO_USDC",
      targetEth: fixed(ethTarget, 6),
      targetUsdc: fixed(usdcTarget, 2),
      reason: "ETH arrived first, so the app must swap a slice into USDC for x402 RPC, LLM, and GPU spend.",
    };
  }

  return {
    sourceAsset: input.sourceAsset,
    needsSwap: false,
    swapDirection: "NONE",
    targetEth: fixed(ethTarget, 6),
    targetUsdc: fixed(usdcTarget, 2),
    reason: "Existing reserves already satisfy the startup targets.",
  };
}
