# Мышечная память — project facts for Claude sessions

A personal exam trainer (PWA) for one learner («K.», never her full name in this repo) preparing for the
UAAK «Пропедевтика профессиональной прикладной кинезиологии» oral/practical exam. Serhii runs the project;
sessions are delivery sessions (see `docs/worklog.md` for state, `docs/decisions.md` for the why).

**Public repo. Never commit:** plaintext course content (`content/`, `sources/`), source PDFs, the
passphrase (`.env.local`), the learner's full name, or the kickoff prompt. Only ciphertext in `public/data/`.

## Commands

```sh
pnpm dev / build / test / e2e        # app; e2e = Playwright WebKit iPhone 13 against `pnpm preview`
pnpm inventory                       # content/inventory.json from ~/Downloads/Kate (md5 dedupe, text layer, OCR queue)
pnpm extract                         # text PDFs → sources/text/<slug>/pNNN.txt + all.txt
pnpm ocr [--only "04 ВД"] | pnpm ocr --file <pdf> --pages 1-8,12   # scanned decks / atlas pages → sources/ocr/<slug>/
pnpm find "регекс" [--in slug] [--ctx 1]   # search extracted + OCR text, prints slug p.N: line
pnpm import-answers                  # ответы.txt + exam sheet → content/cards/block{1..4}.json (all draft)
pnpm apply-verified content/verified/<batch>.ts   # merge verified cards (TS patch) + validate
pnpm validate && pnpm encrypt        # → public/data/{bundle.enc,manifest.json,salt.json}; commit + push deploys
pnpm test-bundle                     # dummy bundle for e2e → public/data-test (passphrase: test-passphrase)
```

`pnpm import` is a pnpm built-in (it deleted the lockfile once) — the script is `import-answers`.

## Layout

- `scripts/` pipeline (Node/TS via tsx), `scripts/lib/paths.ts` holds every path. `scripts/extract-audio.sh` is
  Serhii's seminar-video → audio tool (runs outside this pipeline).
- `src/content/schema.ts` card model (zod) shared by scripts and app; `src/crypto/format.ts` the encrypted
  file format (also shared); `src/engine/scheduler.ts` pure Leitner engine (unit-tested); `src/store/*`
  zustand (progress persisted to localStorage, content in memory); `src/ui/*` screens.
- `content/` (gitignored): `cards/block{1..4}.json`, `verified/*.ts` patches, `inventory.json`, `import-report.md`.
- `sources/` (gitignored): extracted text and OCR, one dir per PDF slug, `all.txt` has `=== page N ===` markers.
- `docs/`: `worklog.md` (state + next), `decisions.md`, `CONTENT-RULES.md`, `REVIEW-QUEUE.md` (ids only).

## Content rules (short form; full in docs/CONTENT-RULES.md)

- Prompt text comes from the exam sheet; answers in Russian in the course's terminology; lists complete and
  in source order; every card ≥ 1 source `{file, page}`; `page` = PDF page number (book pagination can differ).
- `reviewStatus: checked` only with a page-level citation; unsupported claims carry the inline mark
  «⚠︎ не подтверждено в материалах» and the `unsupported` flag; stubs carry `stub`.
- Conflicts: UAAK decks (Кирдогло) beat Васильева; say so in `notes`.
- Verification batches go into `content/verified/<name>.ts` and are applied with `pnpm apply-verified`.

## Quality gates

G1 (10 verified cards: wording, length, «Как сказать на экзамене») — done 2026-10-09, awaiting Serhii/K.
G2 (deployed skeleton on an iPhone) — awaiting Serhii. G3 (5 generated MCQs) — before drills, session 3.
Ask, never assume: anything only K. knows (exam date, which ММТ muscles were taught in person).

## Deploy

GitHub Pages from `main` via `.github/workflows/deploy.yml` (test → build → deploy).
Live: https://serhiikizenko.github.io/muscle-memory/ . Every push deploys — say so when pushing.
