export type SourceAsset = "BASE_ETH" | "BASE_USDC" | "SOLANA_SOL" | "SOLANA_USDC";

export type FundingIntentStatus =
  | "created"
  | "awaiting_payment"
  | "awaiting_bridge"
  | "observed"
  | "credited"
  | "failed";

export type LedgerCategory =
  | "deposit"
  | "bridge"
  | "swap"
  | "x402-rpc"
  | "x402-llm"
  | "x402-grind"
  | "mint"
  | "mine"
  | "withdraw"
  | "system";

export type MiningJobStatus = "idle" | "active" | "paused" | "error";

export interface User {
  id: string;
  controlAddress: string;
  createdAt: string;
}

export interface MiningWallet {
  id: string;
  userId: string;
  address: `0x${string}`;
  derivationPath: string;
  custodyModel: "client_seed_phrase";
  paused: boolean;
  createdAt: string;
  backupConfirmedAt?: string | null;
}

export interface PublicMiningWallet {
  id: string;
  userId: string;
  address: `0x${string}`;
  derivationPath: string;
  custodyModel: "client_seed_phrase";
  paused: boolean;
  createdAt: string;
  backupConfirmedAt?: string | null;
}

export interface FundingIntent {
  id: string;
  userId: string;
  walletId: string;
  sourceAsset: SourceAsset;
  amount: string;
  status: FundingIntentStatus;
  depositAddress: string;
  txHash?: string | null;
  basePayPaymentId?: string | null;
  bridgeRequestId?: string | null;
  expectedReceive?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  walletId: string;
  category: LedgerCategory;
  asset: "ETH" | "USDC" | "AGENT" | "SOL" | "SYSTEM";
  amount: string;
  status: "pending" | "confirmed" | "failed";
  txHash?: string | null;
  description: string;
  createdAt: string;
}

export interface MiningJob {
  id: string;
  userId: string;
  walletId: string;
  status: MiningJobStatus;
  createdAt: string;
  updatedAt: string;
  lastError?: string | null;
}

export interface AppConfig {
  appName: string;
  builderCode: string;
  baseChainId: number;
  contracts: {
    agentCoin: string;
    miningAgent: string;
    lpVault: string;
    baseUsdc: string;
  };
}

export interface DashboardState {
  user: User | null;
  wallet: PublicMiningWallet | null;
  fundingIntents: FundingIntent[];
  ledger: LedgerEntry[];
  miningJob: MiningJob | null;
}
