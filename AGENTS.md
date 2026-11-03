# APoW monorepo

Every APoW project lives here. Each folder keeps its own package.json and lockfile; run commands from inside it.

| Folder | Was | What |
|---|---|---|
| apps/website | Agentoshi/apow-website | apow.io (Next.js), docs, public skill copy |
| apps/mini | Agentoshi/apow-mini | Cloud mining mini app (Vite + Workers) |
| apps/dashboard | Agentoshi/apow-dashboard | Mining dashboard (Next.js on Workers) |
| apps/pool | Agentoshi/apow-pool | Mining pool agent (ACP) |
| packages/cli | Agentoshi/apow-cli | `apow-cli` npm package, miner, wallet flows, canonical `skill.md` |
| packages/core | Agentoshi/apow-core | Contracts and GitBook docs |
| packages/grind | Agentoshi/apow-grind | GPU grinder and worker |

## Rules
- `packages/cli/skill.md` is canonical. When it changes, update `packages/core/docs/skill.md`, `apps/website/public/skill.md` and `apps/website/src/content/docs/skill.md` in the same commit.
- Check the package version and npm identity before any `npm publish`.
- Never commit media; run `media-link <folder>` first (see ~/.claude/CLAUDE.md).
- Code work runs in PStack poteto-mode.
