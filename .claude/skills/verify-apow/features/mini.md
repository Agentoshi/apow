# Mini app (Cloud Mining Agent)

A Base App web console where a user signs in with SIWE, registers a hosted mining wallet derived in the browser, funds it and runs a browser-held mining agent.

## Sub-features

- `mini-landing` renders the console with agent status and connect options.
- `mini-signin` issues a nonce, verifies a SIWE signature and sets a session cookie.
- `mini-wallet` registers the hosted mining wallet address and shows it in `/api/me`.
- `mini-funding` and `mini-mining` move real funds. Not locally verifiable.

## How to get to it (user POV)

- Open the app in the Base App or a browser and choose `Sign in with Base` or `Use browser wallet`.
- The UI calls `/api/auth/nonce`, `/api/auth/verify`, `/api/wallets` and `/api/me` on the same origin.

## Driving it with mini-signin and cdp

Preconditions:

- `apps/mini` passed `npm run check` (which builds `dist/`).
- `$V/serve.sh status mini` prints `UP mini http://127.0.0.1:8791`.

- **Landing.** Run `node $V/cdp.mjs http://127.0.0.1:8791/ /tmp/apow-verify/evidence/mini/home "waitFor(() => text().includes('Deploy cloud'))" "text().includes('Sign in with Base')"`. Both steps PASS.
- **Sign-in and wallet.** Run `node $V/mini-signin.mjs | tee /tmp/apow-verify/evidence/mini/signin.txt`. Seven PASS lines: health, signed-out 401, nonce, SIWE cookie, nonce replay rejected, wallet registered, `/api/me` shows both addresses.
- **Stored state.** Run `npx wrangler d1 execute DB --local --persist-to /tmp/apow-verify/mini-d1 --command "select action from audit_events order by created_at desc limit 3"` from `apps/mini`. The newest rows include `auth.signin`.

## Gotchas

- The Worker runs with `ENVIRONMENT=development`. With the committed `production` value it throws on the missing `SESSION_SECRET`.
- An empty `BASE_RPC_URL` makes SIWE verify locally. With a URL set, verification calls Base RPC.
- `Sign in with Base` needs Base Account and a real wallet. Only the API path is drivable headless.
