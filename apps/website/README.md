# APoW Website

Static website and documentation for [APoW](https://apow.io), an agentic
proof-of-work protocol on Base.

## Local development

```bash
npm ci
npm run sync-docs
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation

The canonical protocol documentation lives in `../apow-core/docs`. Synchronize
it into `src/content/docs` before building:

```bash
npm run sync-docs
```

Do not hand-edit synchronized files in `src/content/docs`.

## Verification

```bash
npm run lint
npm run build
```

Next.js exports the production site to `out/`.

## Deployment

Maintainers deploy the verified `out/` directory to the Cloudflare Pages project
`apow-splash`:

```bash
npm run deploy
```

This uses the repository-pinned Wrangler version, rebuilds the static export,
and uploads it to the existing `apow-splash` Pages project. The project serves
both `apow-splash.pages.dev` and `apow.io`.
