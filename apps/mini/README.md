# APoW Mini

Base App compatible Cloud Mining Agent console for APoW. No need to download any software to your device.

This app is intentionally separate from `apow-splash` and `apow-cli`. The Base Account is the user's sign-in and funding wallet. A hosted APoW EOA is created for mining because the immutable APoW contracts reject contract callers for `mint()` and `mine()`.

## What Works

- React mobile-first Cloud Mining Agent console.
- Tailwind 4 + shadcn styling aligned to `apow-splash`/`apow.io`: dark CRT grid, Base-blue actions, APoW logo, and favicon.
- Official Base Account UI sign-in button, with wagmi/Base Account connector and a browser-wallet fallback for desktop testing.
- wagmi + Base Account connector.
- Builder Code attribution suffix for `bc_6wfeb1kd`.
- Hono Worker API.
- SIWE auth with server-issued nonces.
- D1 schema for users, sessions, hosted wallets, funding intents, ledger, mining jobs, and audit events.
- Client-side one-time seed phrase generation for hosted mining wallets.
- Backend stores only the derived mining wallet address and metadata, never seed phrases or private keys.
- One hosted mining wallet per Base Account. The wallet may own multiple rigs, but mining uses one active rig and should default to the highest-hashpower rig once rig detection is wired.
- Base ETH and Base USDC funding intents.
- Base Pay client flow with backend verification via Base USDC transfer receipt.
- Direct ETH and USDC transfer fallback recording.
- Solana SOL and Solana USDC Squid deposit-address route creation when `SQUID_INTEGRATOR_ID` is configured.
- Cloud Mining Agent deploy and pause controls with no daily spend cap.
- Agent brain/tooling UI for BlockRun ClawRouter, free LLM default, x402 GPU grinding, x402 RPC, and active rig-agent policy.

## Still Required Before Production

- Apply `migrations/0001_init.sql` to the bound D1 database.
- Set production secret: `SESSION_SECRET`.
- Set `SQUID_INTEGRATOR_ID` before enabling Solana funding routes.
- Wire auto-split swap execution on Base.
- Port rig minting from `apow-cli/src/mint.ts`.
- Port the mining runner from `apow-cli/src/miner.ts` and x402 GrindProxy calls from `apow-cli/src/grinder-http.ts` with a non-custodial signer/session-key design.
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
