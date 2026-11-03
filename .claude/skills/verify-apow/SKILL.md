---
name: verify-apow
description: Install, build, test, launch and drive every APoW monorepo folder locally (apps/website, apps/mini, apps/dashboard, apps/pool, packages/cli, packages/core, packages/grind) to prove a change works. Use after any code change in this repo, before committing, or when asked to run, screenshot or smoke-test an APoW app, the apow CLI, the contracts or the GrindProxy worker.
---

# Verify APoW

Every folder has its own `package.json` and lockfile and there is no root workspace, so run each recipe from inside its folder. Run the recipe for each folder your change touches. When a change crosses folders (for example `skill.md`, which is canonical in `packages/cli` and copied to three places), run every touched folder.

`$REPO` below means the repo root (`git rev-parse --show-toplevel`). Scripts live in `$REPO/.claude/skills/verify-apow/scripts/`, called `$V` below.

```bash
REPO=$(git rev-parse --show-toplevel); V=$REPO/.claude/skills/verify-apow/scripts
```

## Safety rules

This repo is public and the apps touch Base mainnet and paid services. None of these recipes deploys, publishes, signs a real transaction or spends money. Keep it that way.

- Never run `npm run deploy`, `wrangler deploy`, `wrangler secret put`, `npm publish`, `forge script ... --broadcast`, or any `apow mint`, `apow mine`, `apow fund`, `apow start` or `apow setup` against a funded wallet.
- Never run anything with a real `.env`, keystore or private key. Run CLI drives with `HOME` and the working directory set to a fresh temp dir so no `~/.apow` or `.env` is read or written. Generate throwaway keys (`openssl rand -hex 32` or viem `generatePrivateKey`) when a code path needs one.
- `wrangler.toml` files hold placeholders such as `<D1_DATABASE_ID>`. Local `wrangler dev` and `--local` D1 work with the placeholder. Never paste real IDs from `.cloudflare-ids.local` into a tracked file.
- Read-only calls to public Base RPC (`https://mainnet.base.org`) and to the npm registry (the CLI's update check) are allowed. They are the only network traffic these recipes make, apart from installs.
- Evidence (screenshots, logs, DOM dumps) is media and logs. It goes under `/tmp/apow-verify/evidence/<folder>/`, never into the repo.

## Launch, doctor and cleanup

`$V/serve.sh` owns every long-running server. It gives each its own process group and pidfile under `/tmp/apow-verify/run/`, refuses a port that something else holds, and waits until the health path answers 200.

| Target | URL | Health path | Prereq |
|---|---|---|---|
| `mini` | http://127.0.0.1:8791 | `/api/health` | `apps/mini` built (`dist/`) |
| `dashboard` | http://127.0.0.1:8792 | `/` | `apps/dashboard` built (`out/`) |
| `website` | http://127.0.0.1:8793 | `/` | `apps/website` built (`out/`) |
| `grind` | http://127.0.0.1:8794 | `/health` | `packages/grind/worker` deps installed |

```bash
$V/serve.sh start mini        # or dashboard | website | grind | all
$V/serve.sh status all        # doctor: UP only if our pid is alive and health is 200
$V/serve.sh stop all          # kills only process groups this script started
```

Doctor first whenever a drive misbehaves. `DOWN` or `STARTING` means read `/tmp/apow-verify/run/<target>.log`. `FAIL port ... held by pid` means another process owns the port. Do not kill it; it is not yours. Stop and report, or set different ports by editing your local copy of the command.

Cleanup is `$V/serve.sh stop all`, then `rm -rf /tmp/apow-verify/mini-d1 /tmp/apow-verify/grind-d1 /tmp/apow-verify/home.*` for scratch state. Keep `/tmp/apow-verify/evidence/`. Build outputs (`dist/`, `out/`, `.next/`, `.tmp-test/`) are gitignored and can stay.

Two runs can share these servers only if they do not mutate state. The mini drive creates a new throwaway user each run, so repeated runs are safe.

## Drivers

- `$V/cdp.mjs <url> <out-prefix> [step ...]` drives headless Chrome over DevTools. Each step is a JS expression evaluated in the page; a falsy value fails the run. Page helpers: `waitFor(fn, ms)`, `text()`, `fill(selector, value)` (works on React-controlled inputs), `click(label)` (button or link by text or aria-label). Writes `<out-prefix>.png` and `<out-prefix>.log`.
- `$V/shot.sh <url> <out-prefix> [W,H]` is a quick screenshot plus rendered DOM dump. Headless Chrome will not render narrower than about 500px, so a 430px "mobile" shot clips on the right. That is a capture artifact, not a layout bug.
- `$V/mini-signin.mjs [baseUrl]` drives the mini Worker API end to end (see apps/mini).
- `$V/grinder-check.mjs <apow-dir>` runs locally built grinders and checks the nonce with the contract's hash rule (see packages/cli).

All of them need Google Chrome at the default macOS path (override with `CHROME=`) and Node 22 or newer.

## Per-folder recipes

Install everywhere with `npm ci --no-audit --no-fund`. npm 11 skips dependency install scripts that are not allow-listed (esbuild, workerd, sharp, keccak, bufferutil). Every recipe below passes without them; do not approve them unless a recipe fails for that reason.

### packages/cli (apow-cli)

Surface is the `apow` CLI. Feature map: [features/cli.md](features/cli.md).

```bash
cd $REPO/packages/cli && npm ci --no-audit --no-fund
npm test                                   # tsc build, then 38 node:test tests
T=$(mktemp -d /tmp/apow-verify/home.XXXX); cd $T
HOME=$T node $REPO/packages/cli/dist/index.js --version        # prints package.json version
HOME=$T node $REPO/packages/cli/dist/index.js policy init      # writes $T/.apow/policy.json
HOME=$T node $REPO/packages/cli/dist/index.js policy show      # prints mode "enforce" and limits
HOME=$T RPC_URL=https://mainnet.base.org node $REPO/packages/cli/dist/index.js stats </dev/null
HOME=$T node $REPO/packages/cli/dist/index.js build-grinders   # CPU-C and Metal on macOS; CUDA skipped
node $V/grinder-check.mjs $T/.apow                             # PASS per grinder, digest < target
```

Pass means 38 of 38 tests, `stats` prints a `Network` block with `Total mines` and `Era`, and each built grinder prints `PASS`. `stats` is a read-only chain call. Cannot run locally: `setup`, `start`, `fund`, `mint`, `mine` and `wallet new` either sign mainnet transactions, spend USDC through x402, or prompt interactively. Their logic is covered by the unit tests. `test-grind-mock.mjs` serves the GrindProxy API from a local grinder if you need the mine loop's HTTP contract, but driving `apow mine` against it still needs a funded wallet and rig.

### apps/mini (Vite UI + Hono Worker + D1)

Surface is the Cloud Mining Agent web console and its `/api/*` Worker. Feature map: [features/mini.md](features/mini.md).

```bash
cd $REPO/apps/mini && npm ci --no-audit --no-fund
npm run check                              # tsc --noEmit, vitest (13 tests), vite build
$V/serve.sh start mini                     # applies migrations to a scratch D1, then wrangler dev
node $V/mini-signin.mjs                    # SIWE sign-in, wallet register, /api/me read-back
npx wrangler d1 execute DB --local --persist-to /tmp/apow-verify/mini-d1 \
  --command "select action from audit_events order by created_at desc limit 3"
node $V/cdp.mjs http://127.0.0.1:8791/ /tmp/apow-verify/evidence/mini/home \
  "waitFor(() => text().includes('Deploy cloud'))" "text().includes('Sign in with Base')"
```

`serve.sh` runs the Worker with `ENVIRONMENT=development` (so the dev `SESSION_SECRET` fallback applies) and an empty `BASE_RPC_URL` (so SIWE checks the signature locally instead of calling Base). The Worker also serves the built UI from `dist/`, so one port covers UI and API. `npm run dev` (Vite on 5174) proxies `/api` to port 8787, not 8791; use it only for hot reload. Cannot run locally: Base Account sign-in and Base Pay need the Base App and a real wallet; funding, x402 grinding and `mine()` need mainnet funds; Solana routes need `SQUID_INTEGRATOR_ID`.

### apps/dashboard (Next.js static export)

Surface is the read-only mining dashboard. Feature map: [features/dashboard.md](features/dashboard.md).

```bash
cd $REPO/apps/dashboard && npm ci --no-audit --no-fund
npx tsc --noEmit && npm run build          # writes out/
$V/serve.sh start dashboard
node $V/cdp.mjs http://127.0.0.1:8792/ /tmp/apow-verify/evidence/dashboard/watchlist \
  "waitFor(() => /NETWORK MINES\s+[\d,]{3,}/i.test(text()))" \
  "text().includes('No wallets added')" \
  "fill('input[placeholder^=\"0x\"]', '0xDD47511d060eA4E955B95F6f43553414328648a6')" \
  "click('Add')" \
  "waitFor(() => !text().includes('No wallets added') && /No miners|#\d+/.test(text()))" \
  "JSON.parse(localStorage.getItem('apow-watchlist')).length === 1"
```

The address is the public LPVault contract, so its card shows an ETH balance and `No miners`. Network numbers come from Base mainnet in the browser and should match `apow stats`. Cannot run locally: wallet connect (`Sign in with Base`, `Connect Injected`) needs a browser wallet.

### apps/website (apow.io, Next.js static export)

Surface is the marketing site, `/mine`, `/docs/**` and the public `/skill.md`. Feature map: [features/website.md](features/website.md).

```bash
cd $REPO/apps/website && npm ci --no-audit --no-fund
npm run lint && npm run build              # lint has warnings, 0 errors; writes out/
npm run sync-docs && git -C $REPO status --short apps/website/src/content   # empty means docs in sync
$V/serve.sh start website
for p in / /mine/ /docs/ /docs/protocol/mining/ /skill.md; do curl -s -o /dev/null -w "%{http_code} $p\n" http://127.0.0.1:8793$p; done
curl -s http://127.0.0.1:8793/skill.md | shasum; shasum < $REPO/packages/cli/skill.md   # must match
node $V/cdp.mjs http://127.0.0.1:8793/docs/protocol/mining/ /tmp/apow-verify/evidence/website/docs \
  "waitFor(() => document.querySelector('h1')?.innerText === 'Mining')" \
  "click('Docs')" "waitFor(() => location.pathname === '/docs/')"
```

The four `skill.md` copies must be byte-identical: `shasum $REPO/packages/cli/skill.md $REPO/packages/core/docs/skill.md $REPO/apps/website/public/skill.md $REPO/apps/website/src/content/docs/skill.md`. Cannot run locally: `npm run deploy` (Cloudflare Pages).

### apps/pool (ACP mining pool agent)

Surface is a long-running Node agent that sells mining jobs on Virtuals ACP. It has no tests.

```bash
cd $REPO/apps/pool && npm ci --no-audit --no-fund && npm run build
cd $(mktemp -d) && node $REPO/apps/pool/dist/index.js; echo "exit $?"
# expect exit 1 and "Missing required env var: LLM_API_KEY" (config guard, nothing started)
cd $(mktemp -d) && env LLM_API_KEY=unused ACP_ENTITY_ID=0 \
  ACP_PRIVATE_KEY=0x$(openssl rand -hex 32) ACP_WALLET_ADDRESS=0x0000000000000000000000000000000000000000 \
  FLEET_KEY_0=0x$(openssl rand -hex 32) FLEET_KEY_1=0x$(openssl rand -hex 32) \
  node -e "const {Fleet}=require('$REPO/apps/pool/dist/fleet.js'); const f=new Fleet(); f.initialize().then(()=>{console.log(f.slots.length===2&&f.getIdleMinter()?'PASS fleet':'FAIL fleet');process.exit(0)},e=>{console.error('FAIL',e.message);process.exit(1)})"
```

The fleet check reads rig ownership for two throwaway wallets from Base and prints `Fleet initialized: 2 wallets (0 with rigs, 2 available for minting)`. Run from a temp dir so `dotenv` loads no `.env`. Cannot run locally: `npm start` or `npm run dev` connects to ACP with the real seller key and then mines with funded fleet wallets. Never start it here.

### packages/core (Solidity contracts + GitBook docs)

```bash
cd $REPO && git submodule update --init --depth 1   # forge-std and OpenZeppelin at pinned SHAs
cd $REPO/packages/core/contracts
forge build
forge test                                           # fork tests self-skip without a fork
forge test --match-path test/LPVaultFork.t.sol --fork-url https://mainnet.base.org   # optional, read-only
```

Needs Foundry: `forge` on PATH, or `~/.foundry/bin/forge` (install with foundryup). Expected result: 230 of 231 pass. `testSimulation_GasProfile_Era0` fails its 200k gas budget (first-ever `mine()` measures about 227k with cold storage); the deployed contracts are immutable, so treat that one failure as known and flag any other. Docs are Markdown in `docs/`; after editing them, run the website `sync-docs` and build steps above so the site picks them up. Cannot run locally: `script/*.s.sol` with `--broadcast` deploys or mutates mainnet. Never run them.

### packages/grind (GPU grinder + GrindProxy Worker)

Surface is the `grind.apow.io` x402 Worker (`worker/`) and the RunPod CUDA image (`gpu/`).

```bash
cd $REPO/packages/grind/worker && npm ci --no-audit --no-fund
npm run typecheck && npm test                        # 16 node:test tests
$V/serve.sh start grind
curl -s http://127.0.0.1:8794/health                 # ok true, price "$0.301", wallet_split.safe false
curl -s http://127.0.0.1:8794/price                  # deterministic quote, price_usd 0.301
curl -s -w ' HTTP %{http_code}\n' -X POST http://127.0.0.1:8794/grind -H 'content-type: application/json' \
  -d '{"challenge":"0x'$(printf '%064d' 1)'","target":"0x'$(printf 'f%.0s' $(seq 1 60))'","address":"0x0000000000000000000000000000000000000001"}'
# expect HTTP 502 "RunPod safety check failed": no RunPod config locally, so the gate fails closed
python3 -m py_compile $REPO/packages/grind/gpu/handler.py && find $REPO/packages/grind/gpu -name __pycache__ -exec rm -rf {} +
```

The Worker entry is `src/worker.ts`, which re-exports only the default handler; `src/index.ts` keeps named exports for tests, which workerd rejects as an entry. Local `wrangler dev` never fires the every-minute cron, so the RunPod cleanup does not run. Cannot run locally: a paid `/grind` (x402 USDC settlement plus a RunPod GPU job), the cron cleanup against RunPod, `npm run economics` and `npm run reconcile` (need production D1 and the RunPod API key), and the CUDA grinder (needs `nvcc` and an NVIDIA GPU). The CLI's CPU and Metal grinders in packages/cli are the safest local proof of the grinding algorithm.

## Evidence standard

- Capture the action and the resulting state: the cdp `.log` lists each step with PASS or FAIL, and the `.png` shows the end state.
- Verify side effects alongside the screen: the D1 `audit_events` row for mini sign-in, `localStorage['apow-watchlist']` for the dashboard, `$T/.apow/policy.json` for the CLI.
- Drive the real user path (HTTP routes, the real CLI binary, page clicks), never internal setters.
- Report anything you could not run with the command you would have run and the missing precondition. Never report a skipped path as verified through a different one.

When an app changes, keep this skill and `features/` current with `/pstack:maintain-verification-skill`.
