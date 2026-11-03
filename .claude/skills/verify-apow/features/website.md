# Website (apow.io)

The public site: landing page, `/mine` assistant guide, the docs rendered from `packages/core/docs`, and the agent-readable `/skill.md`.

## Sub-features

- `web-landing` renders the hero and links to `/mine`.
- `web-docs` renders every docs page and its navigation.
- `web-skill` serves `/skill.md`, identical to `packages/cli/skill.md`.
- `web-mine` renders the assistant guide.

## How to get to it (user POV)

- Open `/`, `/mine/`, `/docs/` or a page such as `/docs/protocol/mining/`.
- Agents fetch `/skill.md` directly.

## Driving it with cdp and curl

Preconditions:

- `apps/website` built (`out/` exists).
- `$V/serve.sh status website` prints `UP`.

- **Routes.** Curl `/`, `/mine/`, `/docs/`, `/docs/protocol/mining/` and `/skill.md`. All return 200.
- **Landing.** Run `node $V/cdp.mjs http://127.0.0.1:8793/ /tmp/apow-verify/evidence/website/home "waitFor(() => document.querySelector('h1')?.innerText.includes('Proof of Work'))" "document.querySelectorAll('a[href^=\"/mine\"]').length > 0"`. Both PASS.
- **Docs navigation.** Run the docs command in `../SKILL.md`. The `Mining` page renders and `click('Docs')` lands on `/docs/`.
- **Skill file.** `curl -s http://127.0.0.1:8793/skill.md | shasum` equals `shasum < $REPO/packages/cli/skill.md`.

## Gotchas

- The export uses trailing slashes. `/docs/protocol/mining` without the slash relies on the static server's redirect.
- Docs come from `packages/core/docs` through `npm run sync-docs`. Edit the source there, then sync and rebuild.
