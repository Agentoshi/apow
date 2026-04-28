import { Hono } from "hono";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { parseUnits } from "viem";
import { APP_NAME, BASE_CHAIN_ID, BUILDER_CODE, CONTRACTS } from "../shared/constants";
import type { DashboardState, FundingIntent, LedgerEntry, SourceAsset } from "../shared/types";
import { planAutoSplit } from "../shared/funding";
import { nowIso, randomId, randomNonce } from "./crypto";
import type { Env } from "./env";
import { isProduction } from "./env";
import { assertBasePayMatchesIntent, getVerifiedBasePayStatus } from "./basePay";
import { verifySiwe } from "./auth";
import {
  isAddressLike,
  markWalletBackupConfirmed,
  pauseWallet,
  publicWallet,
  registerClientSeedWallet,
  resumeWallet,
} from "./signer";
import { storageFor, type Session } from "./storage";
import { getSquidDepositAddress } from "./squid";

const SESSION_COOKIE = "apow_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const NONCE_TTL_MS = 1000 * 60 * 10;

interface AppVars {
  session: Session;
}

export const app = new Hono<{ Bindings: Env; Variables: AppVars }>();
type AppContext = Context<{ Bindings: Env; Variables: AppVars }>;

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

async function recordAutoSplitPlan(input: {
  storage: ReturnType<typeof storageFor>;
  intent: FundingIntent;
}): Promise<void> {
  const currentEth = input.intent.sourceAsset === "BASE_ETH" || input.intent.sourceAsset === "SOLANA_SOL" ? input.intent.amount : "0";
  const currentUsdc = input.intent.sourceAsset === "BASE_USDC" || input.intent.sourceAsset === "SOLANA_USDC" ? input.intent.amount : "0";
  const plan = planAutoSplit({
    sourceAsset: input.intent.sourceAsset,
    amount: input.intent.amount,
    ethReserveTarget: "0.003",
    usdcReserveTarget: "2",
    currentEth,
    currentUsdc,
  });
  if (!plan.needsSwap) return;
  await input.storage.addLedgerEntry({
    id: randomId("ledger"),
    userId: input.intent.userId,
    walletId: input.intent.walletId,
    category: "swap",
    asset: "SYSTEM",
    amount: "0",
    status: "pending",
    txHash: null,
    description: `Auto-split planned: ${plan.swapDirection === "ETH_TO_USDC" ? "ETH to USDC" : "USDC to ETH"}. ${plan.reason}`,
    createdAt: nowIso(),
  });
}

async function requireSession(c: AppContext): Promise<Session | Response> {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (!sessionId) return jsonError("Not signed in", 401);
  const storage = storageFor(c.env.DB);
  const session = await storage.getSession(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    if (session) await storage.deleteSession(session.id);
    return jsonError("Session expired", 401);
  }
  c.set("session", session);
  return session;
}

app.use("/api/*", async (c, next) => {
  const publicPaths = ["/api/config", "/api/auth/nonce", "/api/auth/verify", "/api/health"];
  if (publicPaths.includes(new URL(c.req.url).pathname)) return next();
  const session = await requireSession(c);
  if (session instanceof Response) return session;
  return next();
});

app.get("/api/health", (c) => c.json({ ok: true, service: "apow-mini" }));

app.get("/api/config", (c) =>
  c.json({
    appName: APP_NAME,
    builderCode: c.env.APOW_BUILDER_CODE ?? BUILDER_CODE,
    baseChainId: BASE_CHAIN_ID,
    contracts: CONTRACTS,
  }),
);

app.post("/api/auth/nonce", async (c) => {
  const body = await c.req.json<{ address?: string; purpose?: "signin" | "export" }>().catch(() => ({} as { address?: string; purpose?: "signin" | "export" }));
  const storage = storageFor(c.env.DB);
  const nonce = randomNonce();
  await storage.putNonce({
    nonce,
    controlAddress: body.address?.toLowerCase() ?? null,
    purpose: body.purpose ?? "signin",
    expiresAt: Date.now() + NONCE_TTL_MS,
    createdAt: nowIso(),
  });
  return c.json({ nonce });
});

app.post("/api/auth/verify", async (c) => {
  const body = await c.req.json<{ message?: string; signature?: `0x${string}` }>().catch(() => ({} as { message?: string; signature?: `0x${string}` }));
  if (!body.message || !body.signature) return c.json({ error: "message and signature are required" }, 400);

  const storage = storageFor(c.env.DB);
  const parsedNonce = /Nonce: ([A-Za-z0-9_-]+)/.exec(body.message)?.[1];
  if (!parsedNonce) return c.json({ error: "SIWE message nonce not found" }, 400);
  const nonce = await storage.consumeNonce(parsedNonce, "signin");
  if (!nonce || nonce.expiresAt < Date.now()) return c.json({ error: "Nonce expired or already used" }, 400);

  const verified = await verifySiwe({
    message: body.message,
    signature: body.signature,
    expectedNonce: nonce.nonce,
    env: c.env,
  });
  const user = await storage.getOrCreateUser(verified.address);
  const session: Session = {
    id: randomId("sess"),
    userId: user.id,
    controlAddress: user.controlAddress,
    expiresAt: Date.now() + SESSION_TTL_MS,
    createdAt: nowIso(),
  };
  await storage.createSession(session);
  await storage.addAuditEvent({
    userId: user.id,
    action: "auth.signin",
    metadata: { address: user.controlAddress, chainId: verified.chainId, domain: verified.domain },
  });

  setCookie(c, SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: isProduction(c.env),
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return c.json({ user });
});

app.post("/api/auth/logout", async (c) => {
  const session = c.get("session");
  await storageFor(c.env.DB).deleteSession(session.id);
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

app.get("/api/me", async (c) => {
  const storage = storageFor(c.env.DB);
  const session = c.get("session");
  const user = await storage.getOrCreateUser(session.controlAddress);
  const wallet = await storage.getWalletByUser(user.id);
  const state: DashboardState = {
    user,
    wallet: wallet ? publicWallet(wallet) : null,
    fundingIntents: await storage.listFundingIntents(user.id),
    ledger: await storage.listLedger(user.id),
    miningJob: await storage.getMiningJob(user.id),
  };
  return c.json(state);
});

app.post("/api/wallets", async (c) => {
  const body = await c.req
    .json<{ address?: `0x${string}`; derivationPath?: string }>()
    .catch(() => ({} as { address?: `0x${string}`; derivationPath?: string }));
  if (!isAddressLike(body.address)) {
    return c.json({ error: "Client-derived wallet address is required" }, 400);
  }
  const storage = storageFor(c.env.DB);
  const session = c.get("session");
  const wallet = await registerClientSeedWallet({
    storage,
    userId: session.userId,
    address: body.address,
    derivationPath: body.derivationPath,
  });
  return c.json({ wallet });
});

app.post("/api/wallets/backup-confirmed", async (c) => {
  const storage = storageFor(c.env.DB);
  const session = c.get("session");
  const wallet = await storage.getWalletByUser(session.userId);
  if (!wallet) return c.json({ error: "No hosted mining wallet" }, 404);
  return c.json({ wallet: await markWalletBackupConfirmed({ storage, wallet }) });
});

app.post("/api/wallets/pause", async (c) => {
  const storage = storageFor(c.env.DB);
  const session = c.get("session");
  const wallet = await storage.getWalletByUser(session.userId);
  if (!wallet) return c.json({ error: "No hosted mining wallet" }, 404);
  return c.json({ wallet: await pauseWallet({ storage, wallet }) });
});

app.post("/api/wallets/resume", async (c) => {
  const storage = storageFor(c.env.DB);
  const session = c.get("session");
  const wallet = await storage.getWalletByUser(session.userId);
  if (!wallet) return c.json({ error: "No hosted mining wallet" }, 404);
  return c.json({ wallet: await resumeWallet({ storage, wallet }) });
});

app.post("/api/wallets/export", async (c) => {
  return c.json(
    {
      error:
        "APoW does not store mining wallet seed phrases or private keys. Export is only possible from the user's backed-up seed phrase.",
    },
    410,
  );
});

app.post("/api/funding/intents", async (c) => {
  const body = await c.req.json<{ sourceAsset?: SourceAsset; amount?: string }>().catch(() => ({} as { sourceAsset?: SourceAsset; amount?: string }));
  if (!body.sourceAsset || !body.amount) return c.json({ error: "sourceAsset and amount are required" }, 400);
  if (!["BASE_ETH", "BASE_USDC", "SOLANA_SOL", "SOLANA_USDC"].includes(body.sourceAsset)) {
    return c.json({ error: "Unsupported source asset" }, 400);
  }
  if (Number(body.amount) <= 0 || !Number.isFinite(Number(body.amount))) {
    return c.json({ error: "Amount must be positive" }, 400);
  }

  const storage = storageFor(c.env.DB);
  const session = c.get("session");
  const wallet = await storage.getWalletByUser(session.userId);
  if (!wallet) return c.json({ error: "Create hosted mining wallet first" }, 409);
  if (!wallet.backupConfirmedAt) return c.json({ error: "Back up the mining wallet seed phrase before funding." }, 409);
  let depositAddress: string = wallet.address;
  let bridgeRequestId: string | null = null;
  let expectedReceive: string | null = null;
  let expiresAt: string | null = null;
  if (body.sourceAsset.startsWith("SOLANA")) {
    const deposit = await getSquidDepositAddress(c.env, {
      baseAddress: wallet.address,
      sourceAsset: body.sourceAsset,
      amount: body.amount,
    });
    depositAddress = deposit.depositAddress;
    bridgeRequestId = deposit.requestId;
    expectedReceive = deposit.expectedReceive;
    expiresAt = deposit.expiresAt ?? null;
  }
  const intent = await storage.createFundingIntent({
    userId: session.userId,
    walletId: wallet.id,
    sourceAsset: body.sourceAsset,
    amount: body.amount,
    depositAddress,
    bridgeRequestId,
    expectedReceive,
    expiresAt,
  });
  await storage.addAuditEvent({
    userId: session.userId,
    walletId: wallet.id,
    action: "funding.intent_created",
    metadata: { intentId: intent.id, sourceAsset: intent.sourceAsset, amount: intent.amount },
  });
  if (intent.sourceAsset.startsWith("SOLANA")) {
    await storage.addLedgerEntry({
      id: randomId("ledger"),
      userId: session.userId,
      walletId: wallet.id,
      category: "bridge",
      asset: intent.sourceAsset === "SOLANA_SOL" ? "SOL" : "USDC",
      amount: intent.amount,
      status: "pending",
      txHash: null,
      description: `Solana bridge route created. Send funds to ${intent.depositAddress}.`,
      createdAt: nowIso(),
    });
  }
  return c.json({ intent, basePay: intent.sourceAsset === "BASE_USDC" ? { amount: intent.amount, to: intent.depositAddress } : null });
});

app.post("/api/base-pay/verify", async (c) => {
  const body = await c.req.json<{ intentId?: string; paymentId?: string; mockStatus?: unknown }>().catch(() => ({} as { intentId?: string; paymentId?: string; mockStatus?: unknown }));
  if (!body.intentId || !body.paymentId) return c.json({ error: "intentId and paymentId are required" }, 400);
  const storage = storageFor(c.env.DB);
  const session = c.get("session");
  const intent = await storage.getFundingIntent(body.intentId);
  if (!intent || intent.userId !== session.userId) return c.json({ error: "Funding intent not found" }, 404);
  if (intent.basePayPaymentId) return c.json({ error: "Funding intent already processed" }, 409);

  const status =
    body.mockStatus && c.env.ENVIRONMENT !== "production"
      ? (body.mockStatus as Awaited<ReturnType<typeof getVerifiedBasePayStatus>>)
      : await getVerifiedBasePayStatus(c.env, body.paymentId);

  assertBasePayMatchesIntent({ status, intent, authenticatedAddress: session.controlAddress });
  intent.status = "credited";
  intent.basePayPaymentId = body.paymentId;
  intent.txHash = body.paymentId;
  intent.updatedAt = nowIso();
  await storage.updateFundingIntent(intent);
  const entry: LedgerEntry = {
    id: randomId("ledger"),
    userId: session.userId,
    walletId: intent.walletId,
    category: "deposit",
    asset: "USDC",
    amount: intent.amount,
    status: "confirmed",
    txHash: body.paymentId,
    description: "Base Pay USDC mining budget deposit",
    createdAt: nowIso(),
  };
  await storage.addLedgerEntry(entry);
  await recordAutoSplitPlan({ storage, intent });
  await storage.addAuditEvent({
    userId: session.userId,
    walletId: intent.walletId,
    action: "funding.base_pay_verified",
    metadata: { intentId: intent.id, paymentId: body.paymentId },
  });
  return c.json({ intent, ledgerEntry: entry });
});

app.post("/api/funding/direct/confirm", async (c) => {
  const body = await c.req.json<{ intentId?: string; txHash?: `0x${string}` }>().catch(() => ({} as { intentId?: string; txHash?: `0x${string}` }));
  if (!body.intentId || !body.txHash) return c.json({ error: "intentId and txHash are required" }, 400);
  const storage = storageFor(c.env.DB);
  const session = c.get("session");
  const intent = await storage.getFundingIntent(body.intentId);
  if (!intent || intent.userId !== session.userId) return c.json({ error: "Funding intent not found" }, 404);
  if (intent.txHash) return c.json({ error: "Funding intent already has a transaction" }, 409);
  intent.status = "observed";
  intent.txHash = body.txHash;
  intent.updatedAt = nowIso();
  await storage.updateFundingIntent(intent);
  await storage.addLedgerEntry({
    id: randomId("ledger"),
    userId: session.userId,
    walletId: intent.walletId,
    category: "deposit",
    asset: intent.sourceAsset.endsWith("USDC") ? "USDC" : intent.sourceAsset.endsWith("SOL") ? "SOL" : "ETH",
    amount: intent.amount,
    status: "pending",
    txHash: body.txHash,
    description: "Direct funding transaction submitted; backend must confirm on-chain before crediting.",
    createdAt: nowIso(),
  });
  await recordAutoSplitPlan({ storage, intent });
  return c.json({ intent });
});

app.post("/api/mining/start", async (c) => {
  const storage = storageFor(c.env.DB);
  const session = c.get("session");
  const wallet = await storage.getWalletByUser(session.userId);
  if (!wallet) return c.json({ error: "Create hosted mining wallet first" }, 409);
  if (!wallet.backupConfirmedAt) return c.json({ error: "Back up the mining wallet seed phrase before mining." }, 409);
  if (wallet.paused) return c.json({ error: "Wallet is paused" }, 409);
  const now = nowIso();
  const existing = await storage.getMiningJob(session.userId);
  const job = {
    id: existing?.id ?? randomId("mine"),
    userId: session.userId,
    walletId: wallet.id,
    status: "active" as const,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastError: null,
  };
  await storage.upsertMiningJob(job);
  await storage.addLedgerEntry({
    id: randomId("ledger"),
    userId: session.userId,
    walletId: wallet.id,
    category: "system",
    asset: "SYSTEM",
    amount: "0",
    status: "confirmed",
    txHash: null,
    description: "Cloud mining job activated. Runner will use x402 GPU grinding by default.",
    createdAt: now,
  });
  return c.json({ job });
});

app.post("/api/mining/pause", async (c) => {
  const storage = storageFor(c.env.DB);
  const session = c.get("session");
  const existing = await storage.getMiningJob(session.userId);
  if (!existing) return c.json({ error: "No mining job" }, 404);
  existing.status = "paused";
  existing.updatedAt = nowIso();
  await storage.upsertMiningJob(existing);
  return c.json({ job: existing });
});

app.post("/api/x402/sign", async (c) => {
  return c.json(
    {
      error:
        "Server-side x402 signing is disabled because APoW does not store mining wallet keys. The client must sign with the backed-up seed phrase or a future non-custodial session signer.",
    },
    410,
  );
});

app.get("/api/parse/usdc/:amount", (c) => {
  return c.json({ units: parseUnits(c.req.param("amount"), 6).toString() });
});
