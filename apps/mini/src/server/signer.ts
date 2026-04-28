import type { Address, Hex, TypedData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { generatePrivateKey } from "viem/accounts";
import type { MiningWallet, PublicMiningWallet } from "../shared/types";
import { decryptString, encryptString, nowIso, randomId } from "./crypto";
import { requiredSecret, type Env } from "./env";
import type { StorageAdapter } from "./storage";

export type PolicyReason =
  | "mint"
  | "mine"
  | "x402-rpc"
  | "x402-llm"
  | "x402-grind"
  | "swap"
  | "withdraw"
  | "export";

export interface PolicyContext {
  userId: string;
  walletId: string;
  reason: PolicyReason;
  requestId: string;
  maxUsd?: number;
}

export interface SignerBackend {
  createWallet(userId: string): Promise<PublicMiningWallet>;
  exportSecret(wallet: MiningWallet, policy: PolicyContext): Promise<{ privateKey: Hex }>;
  pauseWallet(wallet: MiningWallet): Promise<PublicMiningWallet>;
  resumeWallet(wallet: MiningWallet): Promise<PublicMiningWallet>;
  signTypedData(wallet: MiningWallet, typedData: {
    domain?: Record<string, unknown>;
    types: TypedData;
    primaryType: string;
    message: Record<string, unknown>;
  }, policy: PolicyContext): Promise<Hex>;
}

export function publicWallet(wallet: MiningWallet): PublicMiningWallet {
  return {
    id: wallet.id,
    userId: wallet.userId,
    address: wallet.address,
    paused: wallet.paused,
    createdAt: wallet.createdAt,
    exportedAt: wallet.exportedAt ?? null,
  };
}

export class EncryptedHotWalletSigner implements SignerBackend {
  constructor(
    private readonly env: Env,
    private readonly storage: StorageAdapter,
  ) {}

  async createWallet(userId: string): Promise<PublicMiningWallet> {
    const existing = await this.storage.getWalletByUser(userId);
    if (existing) return publicWallet(existing);

    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const wallet: MiningWallet = {
      id: randomId("wallet"),
      userId,
      address: account.address,
      encryptedPrivateKey: await encryptString(privateKey, requiredSecret(this.env, "SIGNER_SECRET")),
      paused: false,
      createdAt: nowIso(),
      exportedAt: null,
    };

    await this.storage.createWallet(wallet);
    await this.storage.addAuditEvent({
      userId,
      walletId: wallet.id,
      action: "wallet.created",
      metadata: { address: wallet.address, signer: "encrypted-hot-wallet" },
    });
    return publicWallet(wallet);
  }

  async exportSecret(wallet: MiningWallet, policy: PolicyContext): Promise<{ privateKey: Hex }> {
    this.assertPolicy(wallet, policy, "export");
    const privateKey = (await decryptString(
      wallet.encryptedPrivateKey ?? "",
      requiredSecret(this.env, "SIGNER_SECRET"),
    )) as Hex;
    wallet.exportedAt = nowIso();
    await this.storage.updateWallet(wallet);
    await this.storage.addAuditEvent({
      userId: wallet.userId,
      walletId: wallet.id,
      action: "wallet.exported",
      metadata: { requestId: policy.requestId },
    });
    return { privateKey };
  }

  async pauseWallet(wallet: MiningWallet): Promise<PublicMiningWallet> {
    wallet.paused = true;
    await this.storage.updateWallet(wallet);
    await this.storage.addAuditEvent({
      userId: wallet.userId,
      walletId: wallet.id,
      action: "wallet.paused",
      metadata: {},
    });
    return publicWallet(wallet);
  }

  async resumeWallet(wallet: MiningWallet): Promise<PublicMiningWallet> {
    wallet.paused = false;
    await this.storage.updateWallet(wallet);
    await this.storage.addAuditEvent({
      userId: wallet.userId,
      walletId: wallet.id,
      action: "wallet.resumed",
      metadata: {},
    });
    return publicWallet(wallet);
  }

  async signTypedData(wallet: MiningWallet, typedData: {
    domain?: Record<string, unknown>;
    types: TypedData;
    primaryType: string;
    message: Record<string, unknown>;
  }, policy: PolicyContext): Promise<Hex> {
    if (!policy.reason.startsWith("x402")) {
      throw new Error("Typed data signing is only enabled for approved x402 resources");
    }
    this.assertPolicy(wallet, policy, policy.reason);
    const privateKey = (await decryptString(
      wallet.encryptedPrivateKey ?? "",
      requiredSecret(this.env, "SIGNER_SECRET"),
    )) as Hex;
    const account = privateKeyToAccount(privateKey);
    const signature = await account.signTypedData({
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message,
    });
    await this.storage.addAuditEvent({
      userId: wallet.userId,
      walletId: wallet.id,
      action: "wallet.sign_typed_data",
      metadata: { reason: policy.reason, requestId: policy.requestId, maxUsd: policy.maxUsd ?? null },
    });
    return signature;
  }

  private assertPolicy(wallet: MiningWallet, policy: PolicyContext, expected: PolicyReason): void {
    if (wallet.userId !== policy.userId || wallet.id !== policy.walletId) {
      throw new Error("Signer policy context does not match wallet");
    }
    if (wallet.paused && expected !== "export") {
      throw new Error("Wallet is paused");
    }
    if (policy.reason !== expected) {
      throw new Error(`Signer policy reason must be ${expected}`);
    }
  }
}

export function signerFor(env: Env, storage: StorageAdapter): SignerBackend {
  return new EncryptedHotWalletSigner(env, storage);
}

export function isAddressLike(value: unknown): value is Address {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}
