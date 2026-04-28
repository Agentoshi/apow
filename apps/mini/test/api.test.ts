import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";
import { app } from "../src/server/routes";
import type { Env } from "../src/server/env";

const env: Env = {
  ENVIRONMENT: "test",
  SESSION_SECRET: "api-test-session-secret",
};

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe("API auth and wallet flow", () => {
  it("signs in with SIWE and creates a hosted mining wallet", async () => {
    const account = privateKeyToAccount("0x59c6995e998f97a5a0044966f094538a6f44e6ddf4077e9d8b2efdb9c9d6a6b7");

    const nonceResponse = await app.fetch(
      new Request("http://apow.test/api/auth/nonce", {
        method: "POST",
        body: JSON.stringify({ address: account.address }),
        headers: { "content-type": "application/json" },
      }),
      env,
    );
    const { nonce } = await json<{ nonce: string }>(nonceResponse);
    const message = createSiweMessage({
      address: account.address,
      chainId: 8453,
      domain: "apow.test",
      uri: "http://apow.test",
      version: "1",
      nonce,
      statement: "Sign in to APoW Cloud Mining.",
    });
    const signature = await account.signMessage({ message });

    const verifyResponse = await app.fetch(
      new Request("http://apow.test/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({ message, signature }),
        headers: { "content-type": "application/json" },
      }),
      env,
    );
    expect(verifyResponse.status).toBe(200);
    const cookie = verifyResponse.headers.get("set-cookie");
    expect(cookie).toContain("apow_session");

    const walletResponse = await app.fetch(
      new Request("http://apow.test/api/wallets", {
        method: "POST",
        body: JSON.stringify({
          address: "0x1111111111111111111111111111111111111111",
          derivationPath: "m/44'/60'/0'/0/0",
        }),
        headers: {
          cookie: cookie ?? "",
          "content-type": "application/json",
        },
      }),
      env,
    );
    expect(walletResponse.status).toBe(200);
    const body = await json<{ wallet: { address: string; privateKey?: string; mnemonic?: string } }>(walletResponse);
    expect(body.wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(body.wallet.privateKey).toBeUndefined();
    expect(body.wallet.mnemonic).toBeUndefined();

    const blockedFunding = await app.fetch(
      new Request("http://apow.test/api/funding/intents", {
        method: "POST",
        body: JSON.stringify({ sourceAsset: "BASE_ETH", amount: "0.01" }),
        headers: {
          cookie: cookie ?? "",
          "content-type": "application/json",
        },
      }),
      env,
    );
    expect(blockedFunding.status).toBe(409);

    const backupResponse = await app.fetch(
      new Request("http://apow.test/api/wallets/backup-confirmed", {
        method: "POST",
        headers: {
          cookie: cookie ?? "",
          "content-type": "application/json",
        },
      }),
      env,
    );
    expect(backupResponse.status).toBe(200);

    const exportResponse = await app.fetch(
      new Request("http://apow.test/api/wallets/export", {
        method: "POST",
        headers: {
          cookie: cookie ?? "",
          "content-type": "application/json",
        },
      }),
      env,
    );
    expect(exportResponse.status).toBe(410);
  });
});
