#!/usr/bin/env node
// Runs each native grinder in <apow-dir> on an easy target and checks the nonce the way
// AgentCoin.mine() does: uint256(keccak256(abi.encodePacked(challenge, miner, nonce))) < target.
// Usage: node grinder-check.mjs <apow-dir>   (the ~/.apow that `apow build-grinders` filled)
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repo = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const require = createRequire(join(repo, "packages/cli/package.json"));
const { keccak256, encodePacked } = require("viem");

const dir = process.argv[2];
if (!dir) { console.error("usage: grinder-check.mjs <apow-dir>"); process.exit(2); }

const challenge = keccak256(new TextEncoder().encode("apow-verify"));
const miner = "0x000000000000000000000000000000000000dEaD";
const target = 1n << 236n;
const targetHex = "0x" + target.toString(16).padStart(64, "0");

let ran = 0;
for (const name of ["grinder-cpu", "grinder-gpu"]) {
  const bin = join(dir, name);
  if (!existsSync(bin)) { console.log(`SKIP ${name} not built`); continue; }
  const started = Date.now();
  const out = execFileSync(bin, [challenge, miner, targetHex], { cwd: dir, timeout: 60_000 }).toString().trim();
  const nonce = BigInt(out.split(/\s+/)[0]);
  const digest = BigInt(keccak256(encodePacked(["bytes32", "address", "uint256"], [challenge, miner, nonce])));
  const ok = digest < target;
  console.log(`${ok ? "PASS" : "FAIL"} ${name} nonce=${nonce} digest<target=${ok} ${Date.now() - started}ms`);
  if (!ok) process.exit(1);
  ran++;
}
if (ran === 0) { console.log("FAIL no grinder binaries found"); process.exit(1); }
