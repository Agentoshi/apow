import { describe, expect, it } from "vitest";
import { planAutoSplit, sourceAssetDepositAsset, sourceAssetLabel } from "../src/shared/funding";

describe("funding helpers", () => {
  it("labels user deposit assets", () => {
    expect(sourceAssetLabel("BASE_USDC")).toBe("Base USDC");
    expect(sourceAssetDepositAsset("SOLANA_SOL")).toBe("SOL");
  });

  it("plans USDC to ETH when USDC arrives and ETH reserve is low", () => {
    const plan = planAutoSplit({
      sourceAsset: "BASE_USDC",
      amount: "10",
      ethReserveTarget: "0.003",
      usdcReserveTarget: "2",
      currentEth: "0",
      currentUsdc: "10",
    });
    expect(plan.needsSwap).toBe(true);
    expect(plan.swapDirection).toBe("USDC_TO_ETH");
  });

  it("plans ETH to USDC when ETH arrives and x402 reserve is low", () => {
    const plan = planAutoSplit({
      sourceAsset: "BASE_ETH",
      amount: "0.02",
      ethReserveTarget: "0.003",
      usdcReserveTarget: "2",
      currentEth: "0.02",
      currentUsdc: "0",
    });
    expect(plan.needsSwap).toBe(true);
    expect(plan.swapDirection).toBe("ETH_TO_USDC");
  });

  it("does not swap when reserves already satisfy targets", () => {
    const plan = planAutoSplit({
      sourceAsset: "BASE_USDC",
      amount: "10",
      ethReserveTarget: "0.003",
      usdcReserveTarget: "2",
      currentEth: "0.004",
      currentUsdc: "10",
    });
    expect(plan.needsSwap).toBe(false);
    expect(plan.swapDirection).toBe("NONE");
  });
});
