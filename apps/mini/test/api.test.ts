import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";
import { app } from "../src/server/routes";
import type { Env } from "../src/server/env";

const env: Env = {
  ENVIRONMENT: "test",
  SESSION_SECRET: "api-test-session-secret",
  SIGNER_SECRET: "api-test-signer-secret",
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
        headers: { cookie: cookie ?? "" },
      }),
      env,
    );
    expect(walletResponse.status).toBe(200);
    const body = await json<{ wallet: { address: string; encryptedPrivateKey?: string } }>(walletResponse);
    expect(body.wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(body.wallet.encryptedPrivateKey).toBeUndefined();
  });
});
