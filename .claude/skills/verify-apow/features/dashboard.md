# Dashboard

A read-only page showing APoW network stats from Base and a watchlist of wallet addresses with their rigs and balances.

## Sub-features

- `dash-network` shows network mines, rigs minted, era, base reward, difficulty and LP vault progress.
- `dash-watchlist` adds an address, shows its card and keeps it in localStorage.
- `dash-connect` connects a browser wallet. Not locally verifiable.

## How to get to it (user POV)

- Open the dashboard. Stats load on their own.
- Paste an address into `0x... add wallet address` and choose `Add`.

## Driving it with cdp

Preconditions:

- `apps/dashboard` built (`out/` exists).
- `$V/serve.sh status dashboard` prints `UP`.

- **Network stats.** Step `waitFor(() => /NETWORK MINES\s+[\d,]{3,}/i.test(text()))` PASSes. The number matches `apow stats` `Total mines` within a few mines.
- **Empty watchlist.** Step `text().includes('No wallets added')` PASSes on a fresh profile.
- **Add address.** Steps `fill('input[placeholder^="0x"]', '0xDD47511d060eA4E955B95F6f43553414328648a6')` and `click('Add')`, then `waitFor(() => !text().includes('No wallets added') && /No miners|#\d+/.test(text()))`. A card for `0xDD47...48a6` appears.
- **Persistence.** Step `JSON.parse(localStorage.getItem('apow-watchlist')).length === 1` PASSes.
- **Proof.** The full command is in `../SKILL.md`. Artifacts are `/tmp/apow-verify/evidence/dashboard/watchlist.{png,log}`.

## Gotchas

- `cdp.mjs` uses a fresh Chrome profile each run, so the watchlist starts empty every time.
- An invalid address shows `Invalid address`, and a duplicate shows `Already watching`, inside the input.
