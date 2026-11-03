#!/usr/bin/env node
// Drives the apps/mini Worker API like the browser does: SIWE sign-in with a throwaway key,
// register a hosted mining wallet address, read it back from /api/me.
// Usage: node mini-signin.mjs [baseUrl]   (default http://127.0.0.1:8791)
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repo = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const require = createRequire(join(repo, "apps/mini/package.json"));
const { generatePrivateKey, privateKeyToAccount } = require("viem/accounts");
const { createSiweMessage } = require("viem/siwe");

const base = process.argv[2] ?? "http://127.0.0.1:8791";
const host = new URL(base).host;

function check(ok, label, detail) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? ` ${detail}` : ""}`);
  if (!ok) process.exit(1);
}

async function call(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json, setCookie: res.headers.get("set-cookie") };
}

const control = privateKeyToAccount(generatePrivateKey());
const miner = privateKeyToAccount(generatePrivateKey());

const health = await call("/api/health");
check(health.status === 200 && health.json.ok === true, "health", JSON.stringify(health.json));

const anon = await call("/api/me");
check(anon.status === 401, "signed-out /api/me is 401");

const { json: { nonce } } = await call("/api/auth/nonce", { method: "POST", body: { address: control.address } });
check(typeof nonce === "string" && nonce.length > 0, "nonce issued");

const message = createSiweMessage({
  address: control.address, chainId: 8453, domain: host, uri: base,
  version: "1", nonce, statement: "Sign in to APoW Cloud Mining.",
});
const signature = await control.signMessage({ message });
const verify = await call("/api/auth/verify", { method: "POST", body: { message, signature } });
const cookie = verify.setCookie?.split(";")[0];
check(verify.status === 200 && cookie?.startsWith("apow_session="), "SIWE verify sets session cookie", `status=${verify.status}`);

const replay = await call("/api/auth/verify", { method: "POST", body: { message, signature } });
check(replay.status === 400, "nonce replay rejected");

const wallet = await call("/api/wallets", {
  method: "POST", cookie, body: { address: miner.address, derivationPath: "m/44'/60'/0'/0/0" },
});
check(wallet.status === 200, "hosted wallet registered", `status=${wallet.status}`);

const me = await call("/api/me", { cookie });
check(
  me.status === 200
    && me.json.user?.controlAddress?.toLowerCase() === control.address.toLowerCase()
    && me.json.wallet?.address?.toLowerCase() === miner.address.toLowerCase(),
  "/api/me shows user and wallet",
);

console.log(JSON.stringify({ control: control.address, miner: miner.address, me: me.json }, null, 2));
