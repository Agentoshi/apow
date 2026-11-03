# Managed mining implementation plan

Status: prepared; provider integration and funded acceptance remain pending.
Owner: `apow-mini`. Extend this application; do not create another wallet or mining backend.

Target: retain the existing static website; serve the managed console and API under a scoped `apow.io/mining/` Worker route with namespaced assets. Verify the existing Cloudflare account, zone, and Worker before adding the route. This is a planned integration target, not a deployed URL.

## Outcome and acceptance

One user-owned EOA, one funded budget, and one managed runner work from apow.io and from personal assistants. Closing the browser, ending the assistant task, or restarting an execution instance does not lose wallet access or duplicate paid work. The user can revoke the delegate independently and retain control of remaining funds.

Acceptance requires: verified owner and policy ownership; recovery/export by the user; delegate denied export, owner/policy changes, arbitrary messages/transfers/approvals; bounded gas, service spend, and expiry; crash/payment/nonce reconciliation; pause/revoke before another dispatch; isolation between users; and one separately budgeted funded canary. No production claim before these pass.

## Verified starting point

- Main application has Base Account/SIWE sign-in, D1 users/sessions/wallets/jobs/ledger, browser-generated seed wallets, browser mining, and a RunPod x402 grind proxy.
- `src/worker/index.ts` has a fetch handler, without an unattended mining scheduler.
- `src/client/lib/cloudMiner.ts` holds the signing account in the tab. `/api/x402/sign` returns 410 because the backend holds no mining keys.
- APoW contract `mint()` and `mine()` require `msg.sender == tx.origin`; the mining account must submit an EOA transaction. Preserve funding/sign-in smart-wallet support separately.
- Current production `apow-mini` secret-name inventory contains `SESSION_SECRET` only. Dedicated RPC, bridge integration, and Privy deployment credentials are not configured there.

## Recommended design

Use Privy TEE execution with a user owner and a separate additional signer. Keep recovery/export available only to the owner. Bind the delegate to nonempty, reviewed policies. The delegate must not own or update its policy; test this explicitly in the provider account. Do not use a service-owned wallet, unrestricted additional signer, EIP-7702 delegation, or an ERC-4337 mining caller.

Provider source: [offline user-owned actions](https://docs.privy.io/controls/authorization-keys/owners/configuration/user/offline), [signer provisioning](https://docs.privy.io/wallets/using-wallets/signers/quickstart), [policy enforcement](https://docs.privy.io/controls/policies/overview).

Use one SQLite Durable Object per mining wallet to coordinate the job, reserve budget, and recover work. D1 remains the existing user/session and reporting store. Alarm execution is at least once: persist the work state before external effects, reconcile after restart, and never replay an unknown paid job or transaction. Do not hold a concurrency gate across provider/network calls. [Alarms](https://developers.cloudflare.com/durable-objects/api/alarms/).

Use prepaid, finite service credit for the first managed version: the user's approved USDC transfer goes only to a pinned APoW service recipient; the service pays x402/LLM from its own service wallet. This removes unattended user x402 typed-data signing from the first integration. Keep credited balances, costs, refunds, and the current service price explicit. This is payment for a service, not a claim that user deposits are risk-free or that unspent credit requires no refund accounting.

Delegate transaction allowlist: Base only; APoW challenge call at zero value; one rig mint within its value ceiling; mine on the owned rig at zero value; constrained ETH-to-USDC conversion returning assets to that wallet; bounded service-credit transfer to the fixed recipient. No NFT transfer, general token approval, arbitrary router multicall, arbitrary payout, or general message signing. User withdrawal requires the user's authorization, outside the delegate.

Enforce maximum gas units and fee rates at both request construction and supported provider-policy fields. Reserve the worst-case fee before submission, including Base L1 fees, and reconcile to receipt cost. If provider policy cannot enforce the required boundary, do not enable that operation. Privy's cumulative policies currently document post-sign updates with concurrency overshoot and transaction-only aggregation; they are not strict typed-data spending controls. [Stateful policies](https://docs.privy.io/controls/policies/stateful-policies).

## Implementation stages

1. Connect the existing APoW Privy app or a new isolated app; verify the exact account/app ID. Persist app credentials and a generated delegate authorization key in the APoW secret enclave before use. No values in Git or logs. Configure user owner, independent policy owner, restricted signer, expiry, user revoke, and recovery.
2. Add a signer adapter used by the existing mining logic; separate algorithm/RPC/receipt work from browser seed handling. First verify read-only identity and rejected actions using the provider sandbox. Preserve existing browser wallet records; no automatic migration or seed upload.
3. Add the per-wallet Durable Object, work journal, leases, nonce tracking, spend reservations, and alarm recovery. Job states: awaiting authorization, awaiting funds, minting, ready, grinding, submitting, confirming, paused, budget exhausted, expired, and needs reconciliation. Store confirmed receipts before reporting a mine.
4. Extend the funding flow with live mint price, conservative ETH reserve, swap quote/slippage and gas; convert the service budget only. Default to Base ETH. Solana SOL/USDC must bridge to Base ETH with a sufficient quoted minimum, expiry, and recoverable request ID. Keep Solana disabled until Squid integration and an actual route test pass.
5. Add website authorization, budget/expiry, backup/recovery, single-asset deposit, start, status, pause, revoke, and owner withdrawal. Show service price and remaining budget. Remove the open-tab requirement only for verified managed jobs.
6. Add per-user agent authorization with limited job scopes: create against an existing owner grant, read status, pause, and resume within that grant. Bind tokens to one user/wallet/job and expiry. No token can widen budget, mint extra rigs, withdraw, export, alter signers, or access another user's job. Personal agents use an owner authorization link; no wallet secrets in chat. Reuse existing user auth rather than creating a parallel identity database.
7. Pass failure checks, one bounded canary, browser-close/restart/revoke tests, and a production price/economics check. Promote the tested Worker under a disabled-by-default managed feature flag, then enable only the canary. Publish the hosted skill/API path after verified acceptance.

## Failure and rollback

An indeterminate GPU charge or submitted transaction becomes needs reconciliation; do not resubmit automatically. A stale work challenge does not authorize repeating a paid request. Provider/RPC outage, missing signing permission, expired grant, reserve floor, or exhausted service credit stops new dispatch.

Rollback disables new managed starts and alarms, revokes canary delegates, and reconciles in-flight work before refund or withdrawal. Keep existing browser/local modes, wallet addresses, owner recovery, and ledgers. Use additive migrations and retain the previous Worker deployment. Do not change immutable contracts or move user funds as part of rollback.

## Dependencies still needed

- APoW Privy app/account and provider policy integration tests.
- Dedicated Base RPC for the managed Worker.
- Squid integrator configuration and live deposit-address route verification.
- Confirmed service billing recipient, price/refund policy, and separately specified canary budget.

These are release dependencies, not reasons to hold local fixes, assistant research, or the Base-ETH CLI path unfinished.
