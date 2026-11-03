import type { FundingIntent } from "../shared/types";
import { CONTRACTS } from "../shared/constants";
import { createPublicClient, decodeEventLog, formatUnits, http, parseUnits, type Hex } from "viem";
import { base, baseSepolia } from "viem/chains";
import { basePayTestnet, type Env } from "./env";

export interface PaymentStatus {
  status: "completed" | "pending" | "failed" | "not_found";
  id: string;
  sender?: string;
  amount?: string;
  recipient?: string;
  message?: string;
}

export async function getVerifiedBasePayStatus(env: Env, paymentId: string): Promise<PaymentStatus> {
  if (env.ENABLE_LIVE_BASE_PAY_VERIFICATION !== "true") {
    throw new Error("Live Base Pay verification is disabled in this environment");
  }
  if (!env.BASE_RPC_URL) {
    throw new Error("BASE_RPC_URL is required for live Base Pay verification");
  }
  const client = createPublicClient({
    chain: basePayTestnet(env) ? baseSepolia : base,
    transport: http(env.BASE_RPC_URL),
  });
  const receipt = await client.getTransactionReceipt({ hash: paymentId as Hex }).catch(() => null);
  if (!receipt) {
    return { status: "not_found", id: paymentId, message: "Transaction receipt not found" };
  }
  if (receipt.status !== "success") {
    return { status: "failed", id: paymentId, message: "Transaction reverted" };
  }

  const transferAbi = [
    {
      type: "event",
      name: "Transfer",
      inputs: [
        { indexed: true, name: "from", type: "address" },
        { indexed: true, name: "to", type: "address" },
        { indexed: false, name: "value", type: "uint256" },
      ],
    },
  ] as const;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== CONTRACTS.baseUsdc.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({ abi: transferAbi, data: log.data, topics: log.topics });
      if (decoded.eventName !== "Transfer") continue;
      return {
        status: "completed",
        id: paymentId,
        sender: decoded.args.from,
        recipient: decoded.args.to,
        amount: formatUnits(decoded.args.value, 6),
        message: "USDC transfer confirmed on Base",
      };
    } catch {
      continue;
    }
  }

  return { status: "failed", id: paymentId, message: "No Base USDC transfer found in transaction" };
}

export function assertBasePayMatchesIntent(input: {
  status: PaymentStatus;
  intent: FundingIntent;
  authenticatedAddress: string;
}): void {
  const { status, intent, authenticatedAddress } = input;
  if (status.status !== "completed") {
    throw new Error(`Payment is not complete: ${status.status}`);
  }
  if (!status.sender || status.sender.toLowerCase() !== authenticatedAddress.toLowerCase()) {
    throw new Error("Payment sender does not match signed-in wallet");
  }
  if (!status.recipient || status.recipient.toLowerCase() !== intent.depositAddress.toLowerCase()) {
    throw new Error("Payment recipient does not match mining wallet");
  }
  if (parseUnits(status.amount ?? "0", 6) !== parseUnits(intent.amount, 6)) {
    throw new Error("Payment amount does not match funding intent");
  }
}
