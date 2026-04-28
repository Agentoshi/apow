import type { DashboardState, FundingIntent, SourceAsset } from "../../shared/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed: ${response.status}`);
  }
  return data;
}

export const api = {
  nonce(address?: string, purpose: "signin" | "export" = "signin") {
    return request<{ nonce: string }>("/api/auth/nonce", {
      method: "POST",
      body: JSON.stringify({ address, purpose }),
    });
  },
  verify(message: string, signature: `0x${string}`) {
    return request<{ user: DashboardState["user"] }>("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ message, signature }),
    });
  },
  logout() {
    return request<{ ok: true }>("/api/auth/logout", { method: "POST" });
  },
  dashboard() {
    return request<DashboardState>("/api/me");
  },
  createWallet() {
    return request<{ wallet: NonNullable<DashboardState["wallet"]> }>("/api/wallets", { method: "POST" });
  },
  pauseWallet() {
    return request<{ wallet: NonNullable<DashboardState["wallet"]> }>("/api/wallets/pause", { method: "POST" });
  },
  resumeWallet() {
    return request<{ wallet: NonNullable<DashboardState["wallet"]> }>("/api/wallets/resume", { method: "POST" });
  },
  createFundingIntent(sourceAsset: SourceAsset, amount: string) {
    return request<{ intent: FundingIntent; basePay: { amount: string; to: string } | null }>("/api/funding/intents", {
      method: "POST",
      body: JSON.stringify({ sourceAsset, amount }),
    });
  },
  verifyBasePay(intentId: string, paymentId: string) {
    return request<{ intent: FundingIntent }>("/api/base-pay/verify", {
      method: "POST",
      body: JSON.stringify({ intentId, paymentId }),
    });
  },
  confirmDirectFunding(intentId: string, txHash: `0x${string}`) {
    return request<{ intent: FundingIntent }>("/api/funding/direct/confirm", {
      method: "POST",
      body: JSON.stringify({ intentId, txHash }),
    });
  },
  startMining(dailyCapUsdc: string) {
    return request<{ job: NonNullable<DashboardState["miningJob"]> }>("/api/mining/start", {
      method: "POST",
      body: JSON.stringify({ dailyCapUsdc }),
    });
  },
  pauseMining() {
    return request<{ job: NonNullable<DashboardState["miningJob"]> }>("/api/mining/pause", { method: "POST" });
  },
};
