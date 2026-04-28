import { describe, expect, it } from "vitest";
import { assertBasePayMatchesIntent } from "../src/server/basePay";
import type { FundingIntent } from "../src/shared/types";

const intent: FundingIntent = {
  id: "fund_1",
  userId: "usr_1",
  walletId: "wallet_1",
  sourceAsset: "BASE_USDC",
  amount: "10.00",
  status: "awaiting_payment",
  depositAddress: "0x1111111111111111111111111111111111111111",
  txHash: null,
  basePayPaymentId: null,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

describe("Base Pay verification", () => {
  it("accepts a completed payment matching sender, recipient, and amount", () => {
    expect(() =>
      assertBasePayMatchesIntent({
        intent,
        authenticatedAddress: "0x2222222222222222222222222222222222222222",
        status: {
          status: "completed",
          id: "0xabc",
          sender: "0x2222222222222222222222222222222222222222",
          recipient: intent.depositAddress,
          amount: intent.amount,
        },
      }),
    ).not.toThrow();
  });

  it("rejects replay or impersonation attempts with the wrong sender", () => {
    expect(() =>
      assertBasePayMatchesIntent({
        intent,
        authenticatedAddress: "0x2222222222222222222222222222222222222222",
        status: {
          status: "completed",
          id: "0xabc",
          sender: "0x3333333333333333333333333333333333333333",
          recipient: intent.depositAddress,
          amount: intent.amount,
        },
      }),
    ).toThrow("sender");
  });
});
