# APoW verification map

The maintained source for verifying user-facing APoW behavior. Read the matching file before driving a surface. Commands, ports and safety rules come from `../SKILL.md`.

## Baseline preconditions

- `REPO=$(git rev-parse --show-toplevel); V=$REPO/.claude/skills/verify-apow/scripts`.
- Servers come only from `$V/serve.sh start <target>`, and `$V/serve.sh status <target>` reports `UP` before any drive.
- CLI drives run with `HOME` and the working directory set to a fresh `mktemp -d /tmp/apow-verify/home.XXXX`.
- No real wallet, key, `.env` or secret is present in any drive.

## Driving conventions

- Prefer visible text, placeholders and aria labels (`click('Add')`, `input[placeholder^="0x"]`) over CSS classes. The apps style with Tailwind utility classes that change often.
- Wait on a condition (`waitFor`), never a fixed sleep. Network numbers load from Base after first paint.
- Evidence goes to `/tmp/apow-verify/evidence/<folder>/`.

## Proof and skip reporting

- UI proof is the cdp step log plus its screenshot. API proof is the PASS lines plus a read-back of stored state. CLI proof is the command, its output and exit code.
- Report a path that needs mainnet funds, a browser wallet, the Base App or a paid service as not run, with the reason. Never substitute another path and call it verified.

## Feature entry contract

Each file has an H1, one paragraph, then `Sub-features`, `How to get to it (user POV)`, `Driving it with <harness>` (starting with `Preconditions:`) and `Gotchas`.

## Features

- [CLI](./cli.md) covers version, wallet policy, network stats and local grinders.
- [Mini app](./mini.md) covers SIWE sign-in, hosted wallet registration and the console landing page.
- [Dashboard](./dashboard.md) covers network stats and the address watchlist.
- [Website](./website.md) covers the landing page, docs navigation and the public skill file.
