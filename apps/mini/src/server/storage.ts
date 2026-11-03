import type {
  FundingIntent,
  LedgerEntry,
  MiningJob,
  MiningWallet,
  SourceAsset,
  User,
} from "../shared/types";
import { nowIso, randomId } from "./crypto";

export interface AuthNonce {
  nonce: string;
  controlAddress?: string | null;
  purpose: "signin" | "export";
  expiresAt: number;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  controlAddress: string;
  expiresAt: number;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  userId?: string | null;
  walletId?: string | null;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface StorageAdapter {
  putNonce(nonce: AuthNonce): Promise<void>;
  consumeNonce(nonce: string, purpose: AuthNonce["purpose"]): Promise<AuthNonce | null>;
  getOrCreateUser(controlAddress: string): Promise<User>;
  createSession(session: Session): Promise<void>;
  getSession(id: string): Promise<Session | null>;
  deleteSession(id: string): Promise<void>;
  getWalletByUser(userId: string): Promise<MiningWallet | null>;
  createWallet(wallet: MiningWallet): Promise<void>;
  updateWallet(wallet: MiningWallet): Promise<void>;
  createFundingIntent(input: {
    userId: string;
    walletId: string;
    sourceAsset: SourceAsset;
    amount: string;
    depositAddress: string;
    bridgeRequestId?: string | null;
    expectedReceive?: string | null;
    expiresAt?: string | null;
  }): Promise<FundingIntent>;
  updateFundingIntent(intent: FundingIntent): Promise<void>;
  getFundingIntent(id: string): Promise<FundingIntent | null>;
  listFundingIntents(userId: string): Promise<FundingIntent[]>;
  addLedgerEntry(entry: LedgerEntry): Promise<void>;
  listLedger(userId: string): Promise<LedgerEntry[]>;
  upsertMiningJob(job: MiningJob): Promise<void>;
  getMiningJob(userId: string): Promise<MiningJob | null>;
  addAuditEvent(event: Omit<AuditEvent, "id" | "createdAt">): Promise<void>;
}

function asUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    controlAddress: String(row.control_address),
    createdAt: String(row.created_at),
  };
}

function asWallet(row: Record<string, unknown>): MiningWallet {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    address: String(row.address) as `0x${string}`,
    derivationPath: String(row.derivation_path),
    custodyModel: "client_seed_phrase",
    paused: Number(row.paused) === 1,
    createdAt: String(row.created_at),
    backupConfirmedAt: row.backup_confirmed_at ? String(row.backup_confirmed_at) : null,
  };
}

function asFundingIntent(row: Record<string, unknown>): FundingIntent {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    walletId: String(row.wallet_id),
    sourceAsset: String(row.source_asset) as SourceAsset,
    amount: String(row.amount),
    status: String(row.status) as FundingIntent["status"],
    depositAddress: String(row.deposit_address),
    txHash: row.tx_hash ? String(row.tx_hash) : null,
    basePayPaymentId: row.base_pay_payment_id ? String(row.base_pay_payment_id) : null,
    bridgeRequestId: row.bridge_request_id ? String(row.bridge_request_id) : null,
    expectedReceive: row.expected_receive ? String(row.expected_receive) : null,
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function asLedgerEntry(row: Record<string, unknown>): LedgerEntry {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    walletId: String(row.wallet_id),
    category: String(row.category) as LedgerEntry["category"],
    asset: String(row.asset) as LedgerEntry["asset"],
    amount: String(row.amount),
    status: String(row.status) as LedgerEntry["status"],
    txHash: row.tx_hash ? String(row.tx_hash) : null,
    description: String(row.description),
    createdAt: String(row.created_at),
  };
}

function asMiningJob(row: Record<string, unknown>): MiningJob {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    walletId: String(row.wallet_id),
    status: String(row.status) as MiningJob["status"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastError: row.last_error ? String(row.last_error) : null,
  };
}

export class D1Storage implements StorageAdapter {
  constructor(private readonly db: D1Database) {}

  async putNonce(nonce: AuthNonce): Promise<void> {
    await this.db
      .prepare("INSERT INTO auth_nonces (nonce, control_address, purpose, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(nonce.nonce, nonce.controlAddress ?? null, nonce.purpose, nonce.expiresAt, nonce.createdAt)
      .run();
  }

  async consumeNonce(nonce: string, purpose: AuthNonce["purpose"]): Promise<AuthNonce | null> {
    const row = await this.db
      .prepare("SELECT * FROM auth_nonces WHERE nonce = ? AND purpose = ?")
      .bind(nonce, purpose)
      .first<Record<string, unknown>>();
    if (!row) return null;
    await this.db.prepare("DELETE FROM auth_nonces WHERE nonce = ?").bind(nonce).run();
    return {
      nonce: String(row.nonce),
      controlAddress: row.control_address ? String(row.control_address) : null,
      purpose: String(row.purpose) as AuthNonce["purpose"],
      expiresAt: Number(row.expires_at),
      createdAt: String(row.created_at),
    };
  }

  async getOrCreateUser(controlAddress: string): Promise<User> {
    const normalized = controlAddress.toLowerCase();
    const existing = await this.db
      .prepare("SELECT * FROM users WHERE control_address = ?")
      .bind(normalized)
      .first<Record<string, unknown>>();
    if (existing) return asUser(existing);
    const user: User = { id: randomId("usr"), controlAddress: normalized, createdAt: nowIso() };
    await this.db
      .prepare("INSERT INTO users (id, control_address, created_at) VALUES (?, ?, ?)")
      .bind(user.id, user.controlAddress, user.createdAt)
      .run();
    return user;
  }

  async createSession(session: Session): Promise<void> {
    await this.db
      .prepare("INSERT INTO sessions (id, user_id, control_address, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(session.id, session.userId, session.controlAddress, session.expiresAt, session.createdAt)
      .run();
  }

  async getSession(id: string): Promise<Session | null> {
    const row = await this.db.prepare("SELECT * FROM sessions WHERE id = ?").bind(id).first<Record<string, unknown>>();
    if (!row) return null;
    return {
      id: String(row.id),
      userId: String(row.user_id),
      controlAddress: String(row.control_address),
      expiresAt: Number(row.expires_at),
      createdAt: String(row.created_at),
    };
  }

  async deleteSession(id: string): Promise<void> {
    await this.db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
  }

  async getWalletByUser(userId: string): Promise<MiningWallet | null> {
    const row = await this.db
      .prepare("SELECT * FROM mining_wallets WHERE user_id = ? ORDER BY created_at ASC LIMIT 1")
      .bind(userId)
      .first<Record<string, unknown>>();
    return row ? asWallet(row) : null;
  }

  async createWallet(wallet: MiningWallet): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO mining_wallets (id, user_id, address, derivation_path, custody_model, paused, created_at, backup_confirmed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        wallet.id,
        wallet.userId,
        wallet.address,
        wallet.derivationPath,
        wallet.custodyModel,
        wallet.paused ? 1 : 0,
        wallet.createdAt,
        wallet.backupConfirmedAt ?? null,
      )
      .run();
  }

  async updateWallet(wallet: MiningWallet): Promise<void> {
    await this.db
      .prepare("UPDATE mining_wallets SET paused = ?, backup_confirmed_at = ? WHERE id = ?")
      .bind(wallet.paused ? 1 : 0, wallet.backupConfirmedAt ?? null, wallet.id)
      .run();
  }

  async createFundingIntent(input: {
    userId: string;
    walletId: string;
    sourceAsset: SourceAsset;
    amount: string;
    depositAddress: string;
    bridgeRequestId?: string | null;
    expectedReceive?: string | null;
    expiresAt?: string | null;
  }): Promise<FundingIntent> {
    const now = nowIso();
    const status = input.sourceAsset.startsWith("SOLANA") ? "awaiting_bridge" : "awaiting_payment";
    const intent: FundingIntent = {
      id: randomId("fund"),
      userId: input.userId,
      walletId: input.walletId,
      sourceAsset: input.sourceAsset,
      amount: input.amount,
      status,
      depositAddress: input.depositAddress,
      txHash: null,
      basePayPaymentId: null,
      bridgeRequestId: input.bridgeRequestId ?? null,
      expectedReceive: input.expectedReceive ?? null,
      expiresAt: input.expiresAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await this.db
      .prepare(
        "INSERT INTO funding_intents (id, user_id, wallet_id, source_asset, amount, status, deposit_address, tx_hash, base_pay_payment_id, bridge_request_id, expected_receive, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        intent.id,
        intent.userId,
        intent.walletId,
        intent.sourceAsset,
        intent.amount,
        intent.status,
        intent.depositAddress,
        intent.txHash,
        intent.basePayPaymentId,
        intent.bridgeRequestId,
        intent.expectedReceive,
        intent.expiresAt,
        intent.createdAt,
        intent.updatedAt,
      )
      .run();
    return intent;
  }

  async updateFundingIntent(intent: FundingIntent): Promise<void> {
    await this.db
      .prepare("UPDATE funding_intents SET status = ?, tx_hash = ?, base_pay_payment_id = ?, bridge_request_id = ?, expected_receive = ?, expires_at = ?, updated_at = ? WHERE id = ?")
      .bind(
        intent.status,
        intent.txHash ?? null,
        intent.basePayPaymentId ?? null,
        intent.bridgeRequestId ?? null,
        intent.expectedReceive ?? null,
        intent.expiresAt ?? null,
        intent.updatedAt,
        intent.id,
      )
      .run();
  }

  async getFundingIntent(id: string): Promise<FundingIntent | null> {
    const row = await this.db.prepare("SELECT * FROM funding_intents WHERE id = ?").bind(id).first<Record<string, unknown>>();
    return row ? asFundingIntent(row) : null;
  }

  async listFundingIntents(userId: string): Promise<FundingIntent[]> {
    const { results } = await this.db
      .prepare("SELECT * FROM funding_intents WHERE user_id = ? ORDER BY created_at DESC LIMIT 50")
      .bind(userId)
      .all<Record<string, unknown>>();
    return results.map(asFundingIntent);
  }

  async addLedgerEntry(entry: LedgerEntry): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO ledger_entries (id, user_id, wallet_id, category, asset, amount, status, tx_hash, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        entry.id,
        entry.userId,
        entry.walletId,
        entry.category,
        entry.asset,
        entry.amount,
        entry.status,
        entry.txHash ?? null,
        entry.description,
        entry.createdAt,
      )
      .run();
  }

  async listLedger(userId: string): Promise<LedgerEntry[]> {
    const { results } = await this.db
      .prepare("SELECT * FROM ledger_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 100")
      .bind(userId)
      .all<Record<string, unknown>>();
    return results.map(asLedgerEntry);
  }

  async upsertMiningJob(job: MiningJob): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO mining_jobs (id, user_id, wallet_id, status, created_at, updated_at, last_error) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at, last_error = excluded.last_error",
      )
      .bind(job.id, job.userId, job.walletId, job.status, job.createdAt, job.updatedAt, job.lastError ?? null)
      .run();
  }

  async getMiningJob(userId: string): Promise<MiningJob | null> {
    const row = await this.db
      .prepare("SELECT * FROM mining_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
      .bind(userId)
      .first<Record<string, unknown>>();
    return row ? asMiningJob(row) : null;
  }

  async addAuditEvent(event: Omit<AuditEvent, "id" | "createdAt">): Promise<void> {
    await this.db
      .prepare("INSERT INTO audit_events (id, user_id, wallet_id, action, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(randomId("audit"), event.userId ?? null, event.walletId ?? null, event.action, JSON.stringify(event.metadata), nowIso())
      .run();
  }
}

export class MemoryStorage implements StorageAdapter {
  nonces = new Map<string, AuthNonce>();
  users = new Map<string, User>();
  sessions = new Map<string, Session>();
  wallets = new Map<string, MiningWallet>();
  fundingIntents = new Map<string, FundingIntent>();
  ledger = new Map<string, LedgerEntry>();
  miningJobs = new Map<string, MiningJob>();
  auditEvents: AuditEvent[] = [];

  async putNonce(nonce: AuthNonce): Promise<void> {
    this.nonces.set(nonce.nonce, nonce);
  }

  async consumeNonce(nonce: string, purpose: AuthNonce["purpose"]): Promise<AuthNonce | null> {
    const existing = this.nonces.get(nonce);
    if (!existing || existing.purpose !== purpose) return null;
    this.nonces.delete(nonce);
    return existing;
  }

  async getOrCreateUser(controlAddress: string): Promise<User> {
    const normalized = controlAddress.toLowerCase();
    const existing = [...this.users.values()].find((user) => user.controlAddress === normalized);
    if (existing) return existing;
    const user: User = { id: randomId("usr"), controlAddress: normalized, createdAt: nowIso() };
    this.users.set(user.id, user);
    return user;
  }

  async createSession(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async getSession(id: string): Promise<Session | null> {
    return this.sessions.get(id) ?? null;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async getWalletByUser(userId: string): Promise<MiningWallet | null> {
    return [...this.wallets.values()].find((wallet) => wallet.userId === userId) ?? null;
  }

  async createWallet(wallet: MiningWallet): Promise<void> {
    this.wallets.set(wallet.id, wallet);
  }

  async updateWallet(wallet: MiningWallet): Promise<void> {
    this.wallets.set(wallet.id, wallet);
  }

  async createFundingIntent(input: {
    userId: string;
    walletId: string;
    sourceAsset: SourceAsset;
    amount: string;
    depositAddress: string;
    bridgeRequestId?: string | null;
    expectedReceive?: string | null;
    expiresAt?: string | null;
  }): Promise<FundingIntent> {
    const now = nowIso();
    const intent: FundingIntent = {
      id: randomId("fund"),
      userId: input.userId,
      walletId: input.walletId,
      sourceAsset: input.sourceAsset,
      amount: input.amount,
      status: input.sourceAsset.startsWith("SOLANA") ? "awaiting_bridge" : "awaiting_payment",
      depositAddress: input.depositAddress,
      txHash: null,
      basePayPaymentId: null,
      bridgeRequestId: input.bridgeRequestId ?? null,
      expectedReceive: input.expectedReceive ?? null,
      expiresAt: input.expiresAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.fundingIntents.set(intent.id, intent);
    return intent;
  }

  async updateFundingIntent(intent: FundingIntent): Promise<void> {
    this.fundingIntents.set(intent.id, intent);
  }

  async getFundingIntent(id: string): Promise<FundingIntent | null> {
    return this.fundingIntents.get(id) ?? null;
  }

  async listFundingIntents(userId: string): Promise<FundingIntent[]> {
    return [...this.fundingIntents.values()]
      .filter((intent) => intent.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addLedgerEntry(entry: LedgerEntry): Promise<void> {
    this.ledger.set(entry.id, entry);
  }

  async listLedger(userId: string): Promise<LedgerEntry[]> {
    return [...this.ledger.values()]
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async upsertMiningJob(job: MiningJob): Promise<void> {
    this.miningJobs.set(job.userId, job);
  }

  async getMiningJob(userId: string): Promise<MiningJob | null> {
    return this.miningJobs.get(userId) ?? null;
  }

  async addAuditEvent(event: Omit<AuditEvent, "id" | "createdAt">): Promise<void> {
    this.auditEvents.push({ ...event, id: randomId("audit"), createdAt: nowIso() });
  }
}

const fallbackStorage = new MemoryStorage();

export function storageFor(db?: D1Database): StorageAdapter {
  return db ? new D1Storage(db) : fallbackStorage;
}
