# apow CLI

The `apow` command lets an agent configure a wallet policy, read network stats, build native grinders and (with funds) mint and mine.

## Sub-features

- `cli-version` prints the package version.
- `cli-policy` writes and prints the local signing policy.
- `cli-stats` prints live network statistics from Base.
- `cli-grinders` compiles CPU and Metal grinders that find valid nonces.
- `cli-mine` mints a rig and mines. Not locally verifiable.

## How to get to it (user POV)

- `npx apow <command>` or `apow <command>` after a global install.
- Locally: `node $REPO/packages/cli/dist/index.js <command>` after `npm test` (which builds).

## Driving it with node

Preconditions:

- `packages/cli` installed and `npm test` passed.
- `T=$(mktemp -d /tmp/apow-verify/home.XXXX); cd $T` and every command prefixed with `HOME=$T`.

- **Version.** Run `node $REPO/packages/cli/dist/index.js --version`. Prints the `version` from `packages/cli/package.json`, exit 0.
- **Policy.** Run `... policy init` then `... policy show`. `$T/.apow/policy.json` exists and the printed JSON has `"mode": "enforce"`.
- **Stats.** Run `RPC_URL=https://mainnet.base.org ... stats </dev/null`. A `Network` block with `Total mines`, `Supply mined` and `Era`, exit 0.
- **Grinders.** Run `... build-grinders` then `node $V/grinder-check.mjs $T/.apow`. One `PASS` line per built grinder.

## Gotchas

- Without `RPC_URL` and with `USE_X402` unset, `stats` has no RPC and fails. Never set `USE_X402=true` here; it pays per call.
- Every command writes `$T/.apow/latest-version.json` after a read-only npm registry check.
- `build-grinders` skips CUDA on macOS (`nvcc not found`). That is expected.
- `setup` and `start` are interactive and end at funding. Do not drive them.
