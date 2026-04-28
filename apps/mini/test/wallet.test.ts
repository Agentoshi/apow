import { describe, expect, it } from "vitest";
import {
  markWalletBackupConfirmed,
  pauseWallet,
  registerClientSeedWallet,
  resumeWallet,
} from "../src/server/signer";
import { MemoryStorage } from "../src/server/storage";

describe("client seed wallet registry", () => {
  it("stores wallet metadata without seed phrase or private key material", async () => {
    const storage = new MemoryStorage();
    const wallet = await registerClientSeedWallet({
      storage,
      userId: "usr_1",
      address: "0x1111111111111111111111111111111111111111",
    });
    expect(wallet.address).toBe("0x1111111111111111111111111111111111111111");
    expect(wallet.custodyModel).toBe("client_seed_phrase");
    expect("privateKey" in wallet).toBe(false);
    expect("mnemonic" in wallet).toBe(false);

    const stored = await storage.getWalletByUser("usr_1");
    const serialized = JSON.stringify(stored);
    expect(serialized).not.toContain("privateKey");
    expect(serialized).not.toContain("mnemonic");
    expect(serialized).not.toContain("encrypted");
    expect(serialized).not.toContain("secret");
  });

  it("tracks backup confirmation and pause state", async () => {
    const storage = new MemoryStorage();
    await registerClientSeedWallet({
      storage,
      userId: "usr_1",
      address: "0x1111111111111111111111111111111111111111",
    });
    const stored = await storage.getWalletByUser("usr_1");
    expect(stored).toBeTruthy();
    const confirmed = await markWalletBackupConfirmed({ storage, wallet: stored! });
    expect(confirmed.backupConfirmedAt).toBeTruthy();
    const paused = await pauseWallet({ storage, wallet: stored! });
    expect(paused.paused).toBe(true);
    const resumed = await resumeWallet({ storage, wallet: stored! });
    expect(resumed.paused).toBe(false);
  });

  it("allows only one mining wallet per user", async () => {
    const storage = new MemoryStorage();
    const first = await registerClientSeedWallet({
      storage,
      userId: "usr_1",
      address: "0x1111111111111111111111111111111111111111",
    });
    const second = await registerClientSeedWallet({
      storage,
      userId: "usr_1",
      address: "0x2222222222222222222222222222222222222222",
    });
    expect(second.address).toBe(first.address);
    expect([...storage.wallets.values()]).toHaveLength(1);
  });
});
