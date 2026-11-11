# x402 GPU grinding

Easy Mode buys remote nonce grinding from `grind.apow.io`; the caller still signs and submits the mine transaction.

## Sub-features

- Deterministic USDC quotes and fail-closed wallet, backend and ledger checks.
- Resume an idle endpoint, submit one accepted job, deliver a valid nonce and settle one payment.
- Retry only an explicit HTTP 409 `ENDPOINT_PAUSED` rejection: at most six submissions over 60 seconds, within the overall 300-second backend deadline. Never retry a lost response or another error.
- Pause capacity after the request; cron cleans up abandoned work.

## How to get to it (user POV)

The CLI uses `/price` and the x402-protected `POST /grind`. Read-only state is at `/health`, `/ops/economics` and `/ops/ledger`.

## Driving it with the verification scripts

Preconditions: installed worker dependencies, local server from `serve.sh start grind`, no real credentials. Run worker typecheck and all 22 tests, then the local HTTP checks in `../SKILL.md`.

The dispatch regressions simulate a backend paused beyond 15 seconds and a permanently paused endpoint. Assert eventual acceptance once or bounded rejection; successful, unrelated-error and lost-response requests must never be replayed. This checks retry safety, not RunPod availability.

Production proof needs separate explicit approval and a capped funded test wallet. Start with zero workers/jobs, record the quote and balance, make one request, verify the returned nonce against its challenge/address/target, check the settlement receipt for exactly one transfer, reconcile the balance, then verify zero idle capacity and queued jobs. A nonce is not an on-chain mine. Stop on an unknown outcome and reconcile before another request.

## Gotchas

- RunPod can acknowledge a capacity update while the job API still reports paused. A successful management response or health check does not prove paid delivery.
- Keep dispatch and status polling within Cloudflare's outbound-call budget, leaving room for x402 settlement.
- On November 11, two live requests on the previous 15-second retry window failed with `ENDPOINT_PAUSED`, no accepted job and zero USDC charged. The longer-window change requires a new live proof.
- Local health intentionally reports unsafe without production wallets. Never put credentials into the local verification setup.
