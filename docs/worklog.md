# Worklog

## 2026-10-09 — Session 1

**Done**
- Scaffold: Vite 8 + React 18 + TS 7 + Tailwind 4, vite-plugin-pwa, zustand, HashRouter, Nunito (self-hosted),
  Vitest, Playwright (WebKit, iPhone 13). CI deploys `main` to GitHub Pages. Live URL in `CLAUDE.md`.
- Pipeline: `inventory` (90 PDFs → 43 sources, 29 dupes, 18 out of scope), `extract` (24 text sources),
  `ocr` (all 17 scanned decks, 643 pages, done; atlas pages 1–14, 140–180, 255–270), `find`, `import-answers`,
  `validate`, `encrypt`, `apply-verified`, `make-test-bundle`.
- Import: 169 + 36 + 41 + 32 = 278 cards from the NotebookLM draft; 62 citation artefacts cleaned (report in
  `content/import-report.md`); 4 stubs in Block 3 (three pelvic-floor muscles, короткие экстензоры ШОП).
- G1 batch verified and `checked` (10 cards): b1-q001, q006, q017, q064, q070, q075, q101, q143, b2-m01, b2-m02.
  Patch: `content/verified/g1.ts`. Preview for review: `content/verified/g1-preview.md` (local only).
- App v1: lock screen with per-device key cache, onboarding (exam date, Home-Screen tip, backup tip), Home
  (days to exam, streak, counts), modes Сегодня / Блок-тема / Билет / Слабые места / Повтор, Settings with
  Backup (Share sheet or download) / Restore / reset / forget key. 22 unit tests, 2 e2e smoke tests green.
- Encrypted bundle deployed (278 cards, 10 checked). Decrypts with the real passphrase (checked from the CLI).

**Drafted vs checked**: Block 1 — 8/169 checked; Block 2 — 2/36; Block 3 — 0/41 (4 stubs); Block 4 — 0/32.

**Installed**: packages in `package.json`; Playwright WebKit browser (`pnpm exec playwright install webkit`).

**Assumptions / notes**
- Block-3 exclusion rule (untaught muscles) not applied yet — ask K. which ММТ were covered in person.
- Q142's 14 sub-cards wait for session 2 (`04 ВД и ММТ` OCR is ready).
- The kickoff said Q64 was missing from the draft — it is present; all 169 Block-1 answers imported.
- `pnpm import` (pnpm built-in) once deleted `pnpm-lock.yaml`; restored. Script renamed `import-answers`.
- Vasilyeva's book covers upper body only; lower-body Block-2 muscles need the Кирдогло atlas OCR (TOC on PDF
  p.11–14; page numbers partly garbled — OCR the section range and search for the heading).

**Next (session 1 continued, after G1 approval)**
1. Mass-verify Block 1 clusters A, B, G, I, M and the remaining 34 Block-2 muscles (batches of ~15, one
   `content/verified/<batch>.ts` each; encrypt + push after each batch).
2. G2 on an iPhone: passphrase, add to Home Screen, offline check, Backup round trip.
3. Session 2: remaining Block-1 clusters with OCR sources, Block-3 ММТ enrichment from the atlas, Block-2 images.

## 2026-10-09 — Chrome MCP verification run (live site)

Driven through Serhii's Chrome at phone width (430 px) and desktop width (1400 px) on the real bundle
(auto-unlocked by his cached key) and on the dummy bundle (`?data=data-test`):
- Home, «Сегодня» (28 new), reveal, «Знаю» → box 2 due tomorrow, «Не знаю» → box 1 + requeue, streak 1,
  counters update, progress survives reload; service worker active, `bundle.enc` precached (offline OK).
- «Блок / тема» list + cluster session, «Билет» (6), «Слабые места» (2 clusters), Settings theme switch.
- Lock screen: wrong passphrase → «Неверный пароль.», right → onboarding → home. No console errors.
- Found and fixed: cached key/progress were not scoped by data dir (a test bundle would have wiped the real
  key); dark-mode filled buttons used white text on pale fills (new `--c-on-accent` token); muscle groups
  now listed in anatomical order. Not exercised: Backup download / Restore file picker (need a real file
  dialog), iOS Share sheet, airplane mode — G2 on the iPhone still covers those.
