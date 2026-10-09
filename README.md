# Мышечная память

A personal exam trainer: a mobile-first PWA (React + Vite) with recall cards, a short-horizon
Leitner scheduler and offline support. Study content is **not** in this repository — it ships only
as AES-GCM-encrypted bundles in `public/data/` and is unlocked with a passphrase on the device.

Deployed from `main` to GitHub Pages by `.github/workflows/deploy.yml`.

## Commands

```sh
pnpm dev        # local dev server
pnpm test       # unit tests (scheduler, crypto round-trip)
pnpm build      # typecheck + production build
pnpm e2e        # Playwright smoke in iPhone emulation
```

Content pipeline scripts live in `scripts/` and read local sources that are gitignored; see `CLAUDE.md`.
