import type { Address } from "viem";
import type { MiningWallet, PublicMiningWallet } from "../shared/types";
import { DEFAULT_DERIVATION_PATH } from "../shared/constants";
import { nowIso, randomId } from "./crypto";
import type { StorageAdapter } from "./storage";

export function publicWallet(wallet: MiningWallet): PublicMiningWallet {
  return {
    id: wallet.id,
    userId: wallet.userId,
    address: wallet.address,
    derivationPath: wallet.derivationPath,
    custodyModel: wallet.custodyModel,
    paused: wallet.paused,
    createdAt: wallet.createdAt,
    backupConfirmedAt: wallet.backupConfirmedAt ?? null,
  };
}

export function isAddressLike(value: unknown): value is Address {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

export async function registerClientSeedWallet(input: {
  storage: StorageAdapter;
  userId: string;
  address: `0x${string}`;
  derivationPath?: string;
}): Promise<PublicMiningWallet> {
  const existing = await input.storage.getWalletByUser(input.userId);
  if (existing) return publicWallet(existing);

  const wallet: MiningWallet = {
    id: randomId("wallet"),
    userId: input.userId,
    address: input.address,
    derivationPath: input.derivationPath ?? DEFAULT_DERIVATION_PATH,
    custodyModel: "client_seed_phrase",
    paused: false,
    createdAt: nowIso(),
    backupConfirmedAt: null,
  };

  await input.storage.createWallet(wallet);
  await input.storage.addAuditEvent({
    userId: input.userId,
    walletId: wallet.id,
    action: "wallet.registered",
    metadata: {
      address: wallet.address,
      custodyModel: wallet.custodyModel,
      storesPrivateKey: false,
      storesSeedPhrase: false,
    },
  });
  return publicWallet(wallet);
}

export async function markWalletBackupConfirmed(input: {
  storage: StorageAdapter;
  wallet: MiningWallet;
}): Promise<PublicMiningWallet> {
  input.wallet.backupConfirmedAt = nowIso();
  await input.storage.updateWallet(input.wallet);
  await input.storage.addAuditEvent({
    userId: input.wallet.userId,
    walletId: input.wallet.id,
    action: "wallet.backup_confirmed",
    metadata: {},
  });
  return publicWallet(input.wallet);
}

export async function pauseWallet(input: {
  storage: StorageAdapter;
  wallet: MiningWallet;
}): Promise<PublicMiningWallet> {
  input.wallet.paused = true;
  await input.storage.updateWallet(input.wallet);
  await input.storage.addAuditEvent({
    userId: input.wallet.userId,
    walletId: input.wallet.id,
    action: "wallet.paused",
    metadata: {},
  });
  return publicWallet(input.wallet);
}

export async function resumeWallet(input: {
  storage: StorageAdapter;
  wallet: MiningWallet;
}): Promise<PublicMiningWallet> {
  input.wallet.paused = false;
  await input.storage.updateWallet(input.wallet);
  await input.storage.addAuditEvent({
    userId: input.wallet.userId,
    walletId: input.wallet.id,
    action: "wallet.resumed",
    metadata: {},
  });
  return publicWallet(input.wallet);
}
