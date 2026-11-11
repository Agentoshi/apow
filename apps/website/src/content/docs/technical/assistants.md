# Personal Assistant Mining Guide

APoW routing updated **10 November 2026**. These are support requirements and
readiness checks, not claims that an assistant has passed funded mining tests.
Use the [mining skill](../skill.md) for the pinned CLI and complete setup flow.

## Choose the wallet host first

All assistant mining uses **Easy Mode**, including x402 remote GPU grinding.
The runner still signs payments and Base transactions. A cloud GPU service does
not preserve a wallet or keep the signing runner alive.

**Cloud Mining is the intended default, but is not released.** The current web
app uses a browser-held signer and needs an open tab; it is not the managed
service. Until the managed service passes its release checks, do not create a
wallet or request funds for that route. See [managed mining](managed-mining.md).

Never create, import, or unlock a mining wallet on an assistant's own cloud
computer or disposable task VM. AGENT transfers are locked until the LP deploys,
so a wallet can accumulate rewards that cannot be swept. It is a long-lived vault.

Direct Easy Mode is an explicit user choice on the user's own trusted computer.
Require a supported execution tool, Node 20+, outbound HTTPS, host-local signing,
a proven off-device restore, permitted execution, and a reliable stop mechanism.
A secret manager prevents password disclosure in chat; it does not remove signing
authority from an assistant that can run code beside the unlocked signer.

## Six assistant paths

| Assistant | Default when released | Direct Easy Mode today |
| --- | --- | --- |
| Grok Bot | Managed Cloud Mining | Candidate on the user's connected computer, after every check below; never on the bot's cloud computer |
| ChatGPT dots | Managed Cloud Mining | Candidate on the user's connected computer, after every check; not in a dot or delegated cloud VM |
| Muse | Managed Cloud Mining | No supported funded path established; do not create a wallet in its VM |
| Instinct | Managed Cloud Mining through a tested browser or user handoff | No supported CLI path established |
| Wajo / Fo | Managed Cloud Mining through a tested integration or user handoff | No supported wallet host established; chat memory is not recovery |
| Claude Duet | Managed Cloud Mining through a tested connector or user handoff | No supported direct signing path established |

An integration is not live merely because an assistant supports APIs or connectors.
MCP, HTTPS job access, and a user-facing dashboard are proposed entry points, not
existing APoW endpoints. A link-only handoff means the user controls the job.
Platform restrictions and payment approvals continue to apply.

### Grok Bot

Confirm that commands run on the user's selected computer, rather than the bot's
own computer. A historical successful CLI run does not prove durable custody.
Check version, independent restore, one runner, and stop/restart on the selected
host. Status routines must not create extra wallets or duplicate miners.

### ChatGPT dots

Identify the exact execution environment for every delegated task. A connected
local computer is a candidate; a separate cloud task is not the same host.
Keep wallet material on the selected host. Network credential placeholders and
browser logins are not keystore passwords. Stop the actual miner process and
verify the result rather than assuming that pausing a dot stops delegated work.

### Muse

Wait for Cloud Mining; do not create or unlock a wallet in the assistant's VM.
A future approved connector should use a scoped job token through the platform's
supported credential interface. Do not infer wallet signing from browser or API
credential handling. The cause of an earlier lost wallet has not been established
by a controlled recovery test.

### Instinct

Do a read-only readiness check without assuming shell or custom-connector support.
Use the future APoW browser flow only if supported and tested; otherwise hand the
link to the user. Wallet recovery and owner authorization happen with the user.

### Wajo / Fo

Do not depend on files, memory, or chat persistence for wallet custody. Never share
a key or recovery secret with the assistant or human support. A future integration
must reconnect to the same account and job after a new chat; a chat reset must not
create a replacement wallet. If only links are supported, hand off to the user.

### Claude Duet

Wait for a tested Cloud Mining integration. Browser credentials or protected
connector tokens do not establish a local signer. Do not assume a computer-control
bridge exists. Retain platform approval requirements for any future job controls.

## Other CLI agents

OpenClaw, Hermes, Claude Code, Codex, Manus, Cowork, and Perplexity must meet the
same wallet-host and recovery rules. A product name does not establish where a
command executes. Use an existing, user-approved trusted computer; do not rent a
server or create an assistant-cloud wallet as a fallback. In this assistant guide,
all supported paths use x402 grinding, never an automatic CPU/GPU fallback.

## Recovery before funding

CLI 0.12.3 `wallet verify-recovery` proves a fresh-process unlock of the same
address. It does **not** prove off-device backup. The proposed
`wallet verify-backup` command is not implemented in that release.

Before presenting a funding handoff, the user must restore an encrypted backup on
a separate trusted device using independently recoverable unlock material. Verify
the same address; record only the address and outcome. A temp folder on the same
host or an unconfirmed sync folder is insufficient. Keep backup and unlock material
separate, outside chat and the repository. If the restore fails, repair the same
wallet and stop before funding; never create a replacement to skip the check.

After recovery and explicit spending approval, the CLI requests Base ETH only,
using its current funding quote. It retains gas and converts the service budget
to USDC. Do not invent a fixed ETH amount or ask for a separate USDC deposit.

## End-to-end proof

No complete per-agent pass is recorded for the six assistants above. Version and
readiness checks are free; funded tests wait for the grinder incident to be
resolved and a finite budget to be approved.

A pass needs the same recoverable wallet throughout, a valid nonce delivered to
the client, reconciled x402 payment, a confirmed Base mine, a clean stop, and a
restart using the same wallet. A health check or server-side GPU result is not
proof that the client received its purchased nonce.

Unknown payment or transaction outcomes stop new dispatch until reconciliation.
Never widen policy limits, launch duplicate jobs, or silently change mining modes.
Cloud Mining additionally needs owner recovery/revocation, enforced signing limits,
cross-user isolation, budget reservation, and browser-close operation before release.
