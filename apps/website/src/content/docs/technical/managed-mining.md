# Managed Cloud Mining

**Status: design in progress.** The existing web app uses a browser-held signer and needs an open tab. It does not yet run unattended mining for website users or personal assistants.

Cloud Mining is the intended path for assistants without persistent storage,
secure signing, or a durable runner. Their chat can reset without losing the
user's wallet or mining job. A new chat authenticates to the same account and
retrieves the existing job; it must not create another wallet. Until this service
is released, those assistants stop before wallet creation or funding.

## Assistant experience

Recommend Cloud Mining as the common assistant-facing experience. It must not
require the assistant to install or run a CLI. Adapt job control to the tools
actually available in each assistant; do not infer support from its brand.

- A supported API or connector can expose status, start, pause, and resume within
  the user's approved limits.
- A supported browser can use the same authenticated APoW account and controls.
- A chat-only assistant can provide the user-facing setup link. The user opens
  APoW and controls the job; do not claim that the assistant controls it itself.
- Direct CLI Easy Mode remains an advanced option on the user's own trusted
  computer, with independent recovery, secure signing, permitted execution, and
  a reliable stop. An assistant's own cloud VM is not a mining-wallet host.

Keep account authentication separate from wallet signing. The assistant receives
only scoped job access, never the mining key. Recovery, withdrawals, and changes
to signing limits stay in the user's authenticated APoW flow. Reauthentication
after a chat reset returns the same account, wallet, and jobs.

## Intended user flow

1. Sign in at apow.io and create or recover one dedicated, user-owned mining wallet.
2. Prove recovery from another trusted device without the original assistant or
   runner. Grant a limited mining signer with a budget and expiry only afterward.
3. Deposit Base ETH once. The funding flow calculates the live rig cost, retains ETH for gas, and converts a service budget to USDC. Enable Solana funding only after the bridge integration and minimum-receive checks pass.
4. Start a managed job. APoW keeps the runner alive and obtains GPU work from its grinding service. The user's browser or assistant can close.
5. View confirmed mines and costs. Pause the job or revoke signing permission. Wallet recovery and withdrawal remain under the user's control.

Personal assistants would use this same service through limited job access. They would not need a mining VPS, wallet password, private key, or recovery phrase.

## Wallet choice

Mined AGENT cannot transfer until the LP deploys (`AgentCoin._update`). The mining
wallet therefore holds locked rewards and must remain recoverable for the long
term. A sweep cannot protect those rewards while transfers are locked. Small gas
balances limit operating spend, not the value at risk from losing the wallet.

APoW's current contracts require `msg.sender == tx.origin` for mining and rig minting. Use an EOA for the mining wallet. A smart wallet can authenticate or fund the user, but cannot directly call those entry points.

A password-encrypted wallet unlocked by our server still gives our server signing access. Giving the user a backup does not change that fact. Keeping the password only on the user's device prevents unattended server signing with that key.

The proposed provider is Privy with a **user owner** and a separate restricted server signer. Privy documents offline actions with user-owned wallets, permission limits, and user revocation. The signer does not receive the underlying wallet key. This is a proposed integration, not a claim that the current APoW app has those controls. [Offline actions](https://docs.privy.io/controls/authorization-keys/owners/configuration/user/offline), [signers](https://docs.privy.io/wallets/using-wallets/signers/overview).

A passkey alone does not prove recovery after losing a device or provider account.
Test the configured recovery/export path, independent owner revocation, and policy
limits before accepting funds. No provider integration is approved by naming it here.

## Permission boundary

The delegate must be unable to export keys, change the wallet owner, change or widen its own policy, make arbitrary transfers, approve arbitrary spenders, or sign arbitrary messages. Permit only the required Base contract calls, a capped mint, and narrowly checked funding operations. Swaps must return assets to the same mining wallet.

Use an explicit finite service budget. A first implementation can use prepaid service credit so the APoW service wallet pays the GPU provider; the user's mining signer then does not need general x402 payment authority. Service payments must go to a fixed recipient, with transparent costs and refund terms. User rewards remain in the user's mining wallet.

Provider policies support calldata and EIP-712 restrictions, but their supported conditions and actual SDK payloads need integration tests. Privy's stateful limits update after signing, permit concurrent overshoot, and currently document transaction rather than typed-data aggregation. They are insufficient alone for a strict total-spend cap. Serialize and reserve spend in the runner before each action. [Policies](https://docs.privy.io/controls/policies/overview), [stateful limits](https://docs.privy.io/controls/policies/stateful-policies).

## Release checks

The service stays unavailable until it passes owner recovery, independent revoke, prohibited-signature tests, budget and fee reservation, duplicate-job prevention, crash recovery, payment reconciliation, isolation between users, browser-close operation, and one bounded funded canary. A status of “running” must report runner activity; a successful mine requires a confirmed Base receipt.
