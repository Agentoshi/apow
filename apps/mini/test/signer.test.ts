import { describe, expect, it } from "vitest";
import { EncryptedHotWalletSigner } from "../src/server/signer";
import { MemoryStorage } from "../src/server/storage";
import type { Env } from "../src/server/env";

describe("EncryptedHotWalletSigner", () => {
  const env: Env = {
    ENVIRONMENT: "test",
    SIGNER_SECRET: "unit-test-secret",
  };

  it("creates a wallet without exposing private key in the public wallet", async () => {
    const storage = new MemoryStorage();
    const signer = new EncryptedHotWalletSigner(env, storage);
    const wallet = await signer.createWallet("usr_1");
    expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect("encryptedPrivateKey" in wallet).toBe(false);
    const stored = await storage.getWalletByUser("usr_1");
    expect(stored?.encryptedPrivateKey).toContain("AES-GCM-SHA256");
  });

  it("blocks non-export signatures while paused", async () => {
    const storage = new MemoryStorage();
    const signer = new EncryptedHotWalletSigner(env, storage);
    await signer.createWallet("usr_1");
    const stored = await storage.getWalletByUser("usr_1");
    expect(stored).toBeTruthy();
    await signer.pauseWallet(stored!);
    await expect(
      signer.signTypedData(
        stored!,
        {
          types: {
            Payment: [{ name: "amount", type: "uint256" }],
          },
          primaryType: "Payment",
          message: { amount: 1n },
        },
        {
          userId: "usr_1",
          walletId: stored!.id,
          reason: "x402-grind",
          requestId: "req_1",
          maxUsd: 1,
        },
      ),
    ).rejects.toThrow("Wallet is paused");
  });
});
