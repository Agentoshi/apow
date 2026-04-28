import type { SourceAsset } from "../shared/types";
import type { Env } from "./env";

const SQUID_API = "https://v2.api.squidrouter.com/v2";

const CHAIN_IDS = {
  solana: "solana",
  base: "8453",
} as const;

const TOKENS = {
  solana: {
    nativeWrapped: "So11111111111111111111111111111111111111112",
    usdc: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  base: {
    nativeSquid: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
} as const;

export interface SquidRoute {
  fromChain: string;
  fromToken: string;
  toChain: string;
  toToken: string;
  srcDecimals: number;
  dstDecimals: number;
}

export interface SquidDepositInfo {
  depositAddress: string;
  requestId: string;
  expectedReceive: string;
  expiresAt?: string;
}

export function squidRouteFor(asset: SourceAsset): SquidRoute | null {
  if (asset === "SOLANA_SOL") {
    return {
      fromChain: CHAIN_IDS.solana,
      fromToken: TOKENS.solana.nativeWrapped,
      toChain: CHAIN_IDS.base,
      toToken: TOKENS.base.nativeSquid,
      srcDecimals: 9,
      dstDecimals: 18,
    };
  }
  if (asset === "SOLANA_USDC") {
    return {
      fromChain: CHAIN_IDS.solana,
      fromToken: TOKENS.solana.usdc,
      toChain: CHAIN_IDS.base,
      toToken: TOKENS.base.usdc,
      srcDecimals: 6,
      dstDecimals: 6,
    };
  }
  return null;
}

export async function getSquidDepositAddress(env: Env, input: {
  baseAddress: string;
  amount: string;
  sourceAsset: SourceAsset;
}): Promise<SquidDepositInfo> {
  const integratorId = env.SQUID_INTEGRATOR_ID;
  if (!integratorId) {
    throw new Error("SQUID_INTEGRATOR_ID is required for Solana funding routes");
  }
  const route = squidRouteFor(input.sourceAsset);
  if (!route) {
    throw new Error(`No Squid route for ${input.sourceAsset}`);
  }
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be positive");
  }
  const rawAmount = Math.floor(amount * 10 ** route.srcDecimals).toString();

  const routeResponse = await fetch(`${SQUID_API}/route`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-integrator-id": integratorId,
    },
    body: JSON.stringify({
      fromChain: route.fromChain,
      toChain: route.toChain,
      fromToken: route.fromToken,
      toToken: route.toToken,
      fromAmount: rawAmount,
      toAddress: input.baseAddress,
      quoteOnly: false,
      enableBoost: true,
      prefer: ["CHAINFLIP_DEPOSIT_ADDRESS"],
    }),
  });

  if (!routeResponse.ok) {
    throw new Error(`Squid route API error (${routeResponse.status}): ${await routeResponse.text()}`);
  }
  const routeData = (await routeResponse.json()) as {
    requestId?: string;
    error?: { message?: string };
    route?: {
      estimate?: { toAmount?: string };
      transactionRequest?: unknown;
      params?: { prefer?: string[] };
    };
  };
  if (routeData.error) {
    throw new Error(`Squid route error: ${routeData.error.message ?? JSON.stringify(routeData.error)}`);
  }
  if (routeData.route?.transactionRequest && !routeData.route?.params?.prefer?.includes("CHAINFLIP_DEPOSIT_ADDRESS")) {
    throw new Error("Squid returned a contract-call route instead of a deposit-address route");
  }

  const depositResponse = await fetch(`${SQUID_API}/deposit-address`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-integrator-id": integratorId,
    },
    body: JSON.stringify({ routeData: routeData.route }),
  });
  if (!depositResponse.ok) {
    throw new Error(`Squid deposit-address API error (${depositResponse.status}): ${await depositResponse.text()}`);
  }
  const depositData = (await depositResponse.json()) as {
    depositAddress?: string;
    requestId?: string;
    expiresAt?: string;
  };
  if (!depositData.depositAddress) {
    throw new Error("Squid did not return a deposit address");
  }

  const toAmount = routeData.route?.estimate?.toAmount;
  const expectedReceive = toAmount
    ? (Number(toAmount) / 10 ** route.dstDecimals).toFixed(route.dstDecimals === 6 ? 2 : 6)
    : "unknown";

  return {
    depositAddress: depositData.depositAddress,
    requestId: depositData.requestId ?? routeData.requestId ?? "",
    expectedReceive,
    expiresAt: depositData.expiresAt,
  };
}
