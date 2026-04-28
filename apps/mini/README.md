# APoW Mini

Base App compatible cloud mining console for APoW.

This app is intentionally separate from `apow-splash` and `apow-cli`. The Base Account is the user's sign-in and funding wallet. A hosted APoW EOA is created for mining because the immutable APoW contracts reject contract callers for `mint()` and `mine()`.

## What Works

- React mobile-first mining console.
- wagmi + Base Account connector.
- Builder Code attribution suffix for `bc_6wfeb1kd`.
- Hono Worker API.
- SIWE auth with server-issued nonces.
- D1 schema for users, sessions, hosted wallets, funding intents, ledger, mining jobs, and audit events.
- Encrypted hosted-wallet signer abstraction.
- Fresh SIWE export API for the hosted mining private key.
- Base ETH and Base USDC funding intents.
- Base Pay client flow with backend verification via Base USDC transfer receipt.
- Direct ETH and USDC transfer fallback recording.
- Solana SOL and Solana USDC Squid deposit-address route creation when `SQUID_INTEGRATOR_ID` is configured.
- Mining job start and pause controls.

## Still Required Before Production

- Bind a real D1 database and apply `migrations/0001_init.sql`.
- Set production secrets: `SESSION_SECRET`, `SIGNER_SECRET`, `BASE_RPC_URL`, `SQUID_INTEGRATOR_ID`.
- Wire auto-split swap execution on Base.
- Port rig minting from `apow-cli/src/mint.ts`.
- Port the mining runner from `apow-cli/src/miner.ts` and x402 GrindProxy calls from `apow-cli/src/grinder-http.ts`.
- Run Base App Developer Mode Preview from a public HTTPS URL.

## Local Commands

```sh
npm i
npm run typecheck
npm test
npm run build
npx wrangler dev --ip 127.0.0.1 --port 8787
npm run dev
```

The Vite app runs at `http://127.0.0.1:5174`. The Worker API runs at `http://127.0.0.1:8787`.
