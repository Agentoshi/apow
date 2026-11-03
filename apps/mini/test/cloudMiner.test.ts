import { describe, expect, it } from "vitest";
import { deriveMiningAccountFromMnemonic, solveSmhlAlgorithmic } from "../src/client/lib/cloudMiner";

describe("cloud miner client helpers", () => {
  it("derives the registered mining account from the backed-up seed phrase path", () => {
    const account = deriveMiningAccountFromMnemonic("test test test test test test test test test test test junk");
    expect(account.address).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  });

  it("builds a deterministic SMHL solution that satisfies the on-chain shape checks", () => {
    const solution = solveSmhlAlgorithmic({
      targetAsciiSum: 700,
      firstNChars: 7,
      wordCount: 4,
      charPosition: 2,
      charValue: "q".charCodeAt(0),
      totalLength: 25,
    });

    expect(solution.length).toBe(25);
    expect(solution.split(/\s+/)).toHaveLength(4);
    expect(solution).toContain("q");
  });
});
