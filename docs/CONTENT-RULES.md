# Content rules

## Card anatomy

- `prompt` — the exam sheet's wording (Block 1/4 verbatim; Blocks 2/3 = muscle name + Latin + what to cover).
- `answer` — Russian markdown: short lead sentence, then bullets; lists complete and in the source's order.
  Blocks 2/3 use bold field labels (**Начало**, **Прикрепление**, … / **ИПП**, **ИПВ**, **Контакт**, **Вектор**).
- `examLine` — «Как сказать на экзамене»: one spoken sentence the learner can say out loud.
- `facts[]` — 3–8 atomic statements (drill generation, session 3).
- `sources[]` — `{file, page}`; `file` is the PDF basename as in `content/inventory.json`; `page` is the
  **PDF page number** (the Кирдогло atlas prints book page = PDF page − 1).
- `muscle` (Blocks 2/3) — structured fields incl. `mmt{ipp, ipv, contact, direction, separation, errors[]}`.

## Status and marks

- `draft` — imported from the NotebookLM draft, not yet checked. The app shows a «черновик» banner.
- `checked` — every claim verified against a cited page; `validate` refuses `checked` without pages.
- «⚠︎ не подтверждено в материалах» inline + flag `unsupported` — a claim the materials do not support
  (keep it only when the exam clearly expects it; say where it might be, e.g. a lecture video timestamp).
- «⚠︎ нет в материалах — проверить» + flag `stub` — no draft answer at all (listed in `REVIEW-QUEUE.md`).
- Source precedence on conflict: UAAK decks (Кирдогло) > Васильева; record the conflict in `notes`.

## Workflow for a verification batch

1. `pnpm find "…" --in <slug>` to locate passages; read `sources/text|ocr/<slug>/pNNN.txt`.
2. Write `content/verified/<batch>.ts` (array of partial cards by id; see `g1.ts`).
3. `pnpm apply-verified content/verified/<batch>.ts` → validate must be green.
4. `pnpm encrypt` → commit `public/data/*` → push (deploys).

## Budgets

Text bundle ≤ 3 MB, images ≤ 40 MB total (WebP ≤ 1200 px), enforced by `pnpm validate`.
