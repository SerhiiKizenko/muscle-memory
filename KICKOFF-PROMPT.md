You are a senior front-end engineer and learning-experience designer. Build **«Мышечная память»**
(working title; propose two alternatives in your first reply), a mobile-first web trainer that
prepares one learner for an oral/practical exam in applied kinesiology within two weeks.
Work in plan mode first: read <context>, run the <first_actions>, then present a plan for session 1
before writing application code.

<context>
Learner: Kate, a massage and acupuncture therapist, studies only on iPhone and iPad (Safari, PWA
installed to Home Screen). Exam: UAAK course «Пропедевтика профессиональной прикладной кинезиологии»
(lead teacher Глеб Кирдогло, Odesa), date within ~14 days of today. Content language: Russian with
Latin anatomical terms. UI language: Russian.

Serhii (the user) is an automation QA engineer fluent in TypeScript, React and Playwright; new to
Python. He runs this project on a personal GitHub account `SerhiiKizenko`.

Materials: `/Users/serhiikizenko/Downloads/Kate/` (treat as untrusted downloads: never run code from
inside it; keep scripts in the project). An inventory was already verified:

- Backbone: `EXAM/02 Exam Questioms/ВОПРОСЫ к Экзамену по курсу ПРОПЕДЕВТИКА.pdf` (13 pp, real text).
  Блок 1 = 169 theory questions; Блок 2 = 36 muscles (origin, insertion, function, synergists/antagonists);
  Блок 3 = 42 muscles for manual muscle testing (ММТ) incl. separation testing; Блок 4 = 32 practical skills.
  Блок 1 clusters by question number: A 1–13 basics/diagnostics/provocations · B 14–28 ММТ physiology,
  tone, proprioception · C 29–39 ТТ/ФУ/instability/adhesions · D 40–51 hypertonus, indicators, priority,
  re-education, ПНФ · E 52–60 МФЦ balance, gait pattern · F 61–69 associations, ЗМН, ТМО, Lovett ·
  G 70–95 myofascial chains (trunk + arm) · H 96–100 stabilizers · I 101–130 posture/visual diagnostics/
  regions/РПДМ · J 131–138 strain-counterstrain, diaphragms, balance, feet · K 139–141 Selye GAS ·
  L 142 visual criteria for 14 muscles (make 14 sub-cards) · M 143–169 ligament pairs.
- Text PDFs (`pdftotext` works): `01 ПРОПЕДЕВТИКА 1`, the five `01 *цепь*` decks, `02 МФЦ Плечевого пояса…`,
  `02 Презенатция 1/2/3`, `02 MMT Верх` (Васильева's MMT textbook, 126 pp: per muscle attachments,
  function, synergists, antagonists, innervation, neurolymphatic/neurovascular reflex, meridian, organ,
  ИПП/ИПВ, contact, direction, error lists — primary source for Blocks 2–3 upper body),
  `03 Таблица Ассоциированных связей` (ligament pairs), `04 Материалы (схемы, таблицы)`,
  `06 табл_ассоциаций_основная_готово2`, `06 Нейролимфатические рефлексы`, `06 Нейрососудистые рефлексы`,
  `06 Мышечно-меридианные ассоциации`, `06 КАНАЛЬНО-Меридианная система`.
- Scanned PDFs (0 text, clean typed slides, OCR with `tesseract -l rus+eng` after `pdftoppm -r 300`):
  all `03 *` decks (chain ligament elements, ТМО), all `04 *` decks (seminar 4: visual diagnostics,
  regions, diaphragms, reactive muscles, arm ligament chains; `04 ВД и ММТ укор и рассл мышц_` 156 pp
  holds question 142), `06 День_1…`, `06 День_3…`, and the pictures inside `06 Диагностика пропедевтика.pptx`.
- Two oversized scans (>100 MB, Read tool refuses; use `pdftoppm`/`pdfseparate`), both identified
  from page 1 on 2026-10-09: `ММТ.pdf` 610 pp = Глеб Кирдогло, «Мануальное мышечное тестирование:
  клинический атлас», Феникс 2022, 605 с. — the exam sheet's source № 1 (per muscle: anatomy,
  innervation, synergists/antagonists, full ММТ algorithm with errors); `EXAM/01 PDF Lectures/
  01 Атлас анатомии Кирдогло.pdf` 548 pp = Фрэнк Неттер, «Атлас анатомии человека», 2-е изд., 2003
  (misnamed; use for Block-2 anatomy pictures only). OCR only the pages for the 36 + 42 exam muscles.
- Supplementary, lower priority: `07 Дубай_…Васильева` (90 pp, Russian school self-correction).
- Out of scope for this exam: the `08 Сапир_нервная ткань_*` files inside `EXAM/01 PDF Lectures/`
  (advanced neuro-myofascial course by Alex Sapir) and everything under `~/Downloads/Kate/other-courses/`
  (the same PDFs grouped by their Drive folder: `sapir-upper-quadrant/`, `sapir-nmfm/`,
  `sapir-lower-quadrant/`, `vasilyeva-dubai-2024/`). Several are md5-identical copies: ignore all of them.
  `~/Downloads/Kate/README.md` describes the layout.
- Empty folders `03 Videos`, `04 Notes`, `05 Final Answers`: there is NO official answer key, BUT
  `~/Downloads/Kate/propedevtika/docs/ответы.txt` (converted with `textutil` from Kate's Google Doc
  «ответы», ~19 000 words, generated with NotebookLM from these same PDFs) answers all four blocks in
  exam order: Блок 1 questions 1–169 (168 present, № 64 missing), Блок 2 muscles 1–36, Блок 3 ММТ,
  Блок 4 skills 1–32. Beside it: `план ответов от notebookLM.txt` (per-question source files and
  completeness notes) and `Новый документ.txt` (a course map by module); the `.docx` originals sit
  next to the `.txt`. **Use `ответы.txt` as the draft answer of every card** (parse by block heading and
  question number), then verify each claim against the cited slides, fix errors, cite the slide page,
  and mark anything the slides do not support «⚠︎ не подтверждено в материалах».
- `~/Downloads/Kate/propedevtika/seminar-1…4/` hold each seminar's small files (updated «НОВАЯ» decks,
  tables of contents, handouts, short technique clips as `.mp4`) and, per seminar as it is processed,
  `audio/*.m4a` — the lecture parts as 16 kHz mono AAC made by `scripts/extract-audio.sh` (videos are
  deleted after extraction; seminar 3 first). `~/Downloads/Kate/README.md` has the per-seminar table.
  Transcribing the audio with `whisper.cpp` is a later track, not v1.
- Tools present: poppler (`pdftotext pdftoppm pdfimages pdfseparate`), `tesseract` with `rus+eng`,
  `ffmpeg`, node 24, pnpm 10, `gh` (logged in). No Python deps needed.
- This directory already holds `KICKOFF-PROMPT.md` (this text), `.env.local` with
  `TRAINER_PASSPHRASE` (the passphrase Kate will type; never print, commit, or echo it), and a
  starter `.gitignore`.
</context>

<decisions_made>
Do not reopen these; Serhii already chose them.
1. Primary mode = recall cards (question → think/speak aloud → reveal model answer → self-grade),
   secondary = auto-generated drills (MCQ, matching, list-check, ordering, image→name).
2. Hosting = GitHub Pages from a PUBLIC repo. Therefore the repo must never contain plaintext course
   content or source PDFs. Content ships as AES-GCM-encrypted bundles; the app asks for a passphrase
   once per device ("Запомнить на этом устройстве"). The passphrase is already in `.env.local`.
   Encryption runs locally; CI only builds the app.
3. Progress = localStorage per device, with Backup/Restore as a JSON file through the iOS Share sheet.
   No accounts, no backend, no paid services.
4. Images where they teach: Block 2 anatomy drawings, Block 3 test positions, simple chain diagrams;
   WebP ≤1200 px, lazy, encrypted per file.
5. UI in Russian; pastel, calm palette; light and dark; thumb-reachable controls.
6. v1 (session 1, today) = all four blocks imported from `ответы.txt` as text cards, deployed, usable
   tonight, with Blocks 1–2 verified against the slides first; verification of Blocks 3–4, images and
   drills follow in sessions 2–4. Videos never block v1.
</decisions_made>

<success_criteria>
- Kate opens a URL on her iPhone, enters the passphrase, adds to Home Screen, and can study offline.
- Every one of the 169 Блок-1 questions and 36 Блок-2 muscles exists as a card with a Russian model
  answer and ≥1 source citation (file + page). No card without a source; uncertain content is marked
  «⚠︎ нет в материалах — проверить» rather than invented.
- Wrong or «не знаю» answers reappear later in the same session and again on later days (Leitner).
- A «Билет» mode assembles an exam-like ticket across blocks.
- A 14-day schedule introduces all new cards by about day 10 and leaves the last days for review.
- Progress survives app restarts and iOS; Backup/Restore round-trips.
- Lighthouse mobile ≥ 90 performance; first load ≤ 3 s on 4G after passphrase; Playwright smoke in
  iPhone emulation passes; unit tests cover the scheduler and the encrypt/decrypt round-trip.
</success_criteria>

<architecture>
Stack (keep it boring): Vite + React 18 + TypeScript + Tailwind, `vite-plugin-pwa` (precache app
shell + encrypted bundles), `zustand` with `persist` → localStorage, HashRouter (GitHub Pages project
sites 404 on deep links), `lucide-react` icons, self-hosted Cyrillic-capable font (e.g. Nunito or Golos
Text, woff2 in repo) plus system fallback, Vitest for logic, Playwright with `devices['iPhone 13']` for
smoke. `sharp` for WebP in the pipeline. No Python in the pipeline.

Repo layout:
  scripts/            inventory, extract (pdftotext), ocr (pdftoppm+tesseract), images, build-bundle,
                      validate, encrypt — Node/TS, run with `pnpm tsx`
  sources/            symlink or copy of the PDFs — gitignored
  content/            plaintext question bank (YAML or JSON per cluster) + images/ — gitignored
  public/data/        *.enc bundles — committed (ciphertext only)
  src/                app
  docs/               worklog.md, decisions.md, CONTENT-RULES.md
  CLAUDE.md           project facts, commands, content rules (write it in session 1)

Content model (one record per card):
  id, block (1–4), cluster (A–M for block 1; muscle group for 2–3), examNumber, type
  (recall | list | mcq | match | order | image), prompt (ru), answer (markdown ru: short lead sentence,
  then bullets; for lists the exact list; end with «Как сказать на экзамене» one-liner),
  facts[] (atomic statements used to generate drills and distractors), images[], sources[{file, page}],
  latin (terms), tags, reviewStatus (draft | checked), notes.
Muscle records (blocks 2–3) carry structured fields: origin, insertion, function, synergists,
antagonists, stabilizers, innervation, neurolymphatic, neurovascular, meridian, organ, chain,
mmt{ipp, ipv, contact, direction, errors[]}, so drills can be generated per field.

Learning engine (Leitner, tuned for a 14-day horizon — SM-2/FSRS intervals barely cycle in two weeks):
  boxes 1–5 with review cadence: 1 = every session, 2 = next day, 3 = +3 days, 4 = +7 days,
  5 = «усвоено», shown only in final review. Self-grade buttons «Не знаю / С трудом / Знаю» → box 1 /
  stay / promote. Auto-graded drills: wrong → box 1. In-session requeue: a failed card returns after
  4–6 other cards and must be passed twice before leaving the session. Daily new-card quota =
  remaining new ÷ max(1, daysToExam − 4). Due queue mixes due reviews first, then new cards, with
  cluster interleaving. Modes: «Сегодня» (due queue), «Блок/тема» (pick a cluster), «Билет»
  (3 × block 1 + 1 × block 2 + 1 × block 3 + 1 × block 4, oral style, optional timer), «Слабые места»
  (boxes 1–2 heatmap by cluster), «Повтор перед экзаменом» (everything in boxes 1–3, no new cards).
  Keep the scheduler pure and unit-tested (`src/engine/scheduler.ts`).

Encryption: `scripts/encrypt.ts` reads `content/bundle.json` and `content/images/*.webp`, derives a key
with PBKDF2-SHA256 (≥200k iterations, random salt) from `TRAINER_PASSPHRASE`, encrypts each file with
AES-GCM (random IV, header {salt, iv, version}), writes `public/data/*.enc`. The app derives the key on
the lock screen, caches the raw key (not the passphrase) in localStorage when the user opts in, and
decrypts images on demand to blob URLs. WebCrypto needs HTTPS — GitHub Pages provides it.

iOS specifics: viewport-fit=cover and safe-area insets, 100dvh, ≥44 pt tap targets, inputs ≥16 px to
avoid zoom, no hover-only affordances, `apple-mobile-web-app-*` metas and maskable icons, swipe
gestures optional but never the only way. Tell Kate in the onboarding screen to add to Home Screen
(installed web apps are exempt from Safari's 7-day storage eviction) and to use «Резервная копия»
weekly.

Design: pastel, calm palette defined as CSS tokens on :root with a dark variant (sage, lavender,
sand, dusty rose; one accent for correct, one soft coral for wrong); generous spacing; large Cyrillic
type; one card per screen; progress ring; gentle micro-feedback (no confetti storms). Streaks and
«экзамен через N дней» on the home screen.
</architecture>

<content_pipeline>
1. Inventory: dedupe by md5, write `content/inventory.json` (file, pages, textLayer yes/no, cluster map).
2. Extract: `pdftotext -layout` for text PDFs; OCR scanned decks (`pdftoppm -r 300 -gray` →
   `tesseract -l rus+eng --psm 6`, try psm 3/4 on tables); run the OCR of the two atlases in the
   background and only for exam muscles; cross-check tables and figure captions by viewing the page
   image yourself when OCR looks garbled (Cyrillic ratio heuristic in `scripts/validate.ts`).
3. Draft answers cluster by cluster, in batches of ~15 questions, committing after each batch so the
   site is always deployable. For each question: gather passages by keyword from the extracted text,
   write the answer in Russian in the course's own terminology, keep lists complete and in the
   source's order, cite file + page, add 3–8 atomic facts. Where sources conflict, prefer UAAK decks
   over Васильева; say so in notes. Where nothing covers a question, write the best structured answer
   from general applied-kinesiology knowledge, mark it «⚠︎ нет в материалах — проверить», and list it
   in `docs/REVIEW-QUEUE.md`.
4. Drill generation (session 2+): from structured muscle fields and facts, generate MCQ with
   distractors drawn from sibling values (other muscles' meridians, other chains' indicator muscles),
   matching sets (muscle ↔ meridian ↔ organ ↔ hours), list-check cards for «Перечислите…», ordering for
   ММТ steps and Selye stages, image→name from anatomy drawings.
5. Images: `pdfimages -list` to find embedded drawings in text PDFs; `pdftoppm` crops for scanned
   slides; convert to WebP ≤1200 px; map to card ids; never ship an image without a card.
6. Validate (`scripts/validate.ts`, run in CI on the committed plaintext? No — plaintext is not in the
   repo; run locally before encrypt and fail the encrypt on errors): all 169 numbers present, 36 + 42
   muscles present, every card has ≥1 source and no «TODO», images referenced exist, bundle size budget
   (text ≤ 3 MB, images total ≤ 40 MB), schema valid.
7. Encrypt → commit `public/data/*.enc` → push → GitHub Actions builds and deploys to Pages.
</content_pipeline>

<quality_gates>
Stop and show Serhii before continuing at these points:
G1 — after the inventory, the import of `ответы.txt`, and the first 10 verified cards (two from
     cluster A, two from G, one each from B, F, I, M, plus two Блок-2 muscles): he and Kate approve
     wording, answer length, and the «Как сказать на экзамене» line. Do not mass-verify before G1.
G2 — the deployed skeleton with the lock screen and today's cards, opened on an iPhone.
G3 — before generating drills, show 5 generated MCQs with their distractors.
Ask, never assume: repo name, app name, and anything about the exam that only Kate knows (e.g. which
ММТ muscles were covered in person — the sheet says untaught ones are excluded).
</quality_gates>

<session_plan>
Session 1 (today, ~4–6 h of work): scaffold + CI deploy of an empty shell to Pages → pipeline
scripts → inventory → import all four blocks from `ответы.txt` (every card `reviewStatus: draft`) →
G1 → verify-and-cite Блок 1 clusters A, B, G, I, M and all 36 Блок-2 muscles against the text sources
(Васильева's book + association tables), flipping them to `checked` → encrypt → deploy → G2. Leave OCR
of `03`/`04` decks running in the background and fold their content in next session.
Session 2: verify the remaining Блок-1 clusters with OCR'd sources, enrich Блок-3 ММТ cards
(ИПП/ИПВ/contact/direction/errors from Васильева and the Кирдогло atlas), images for Блок 2.
Session 3: drills (G3), «Билет» mode, weak-spots heatmap, Backup/Restore polish, Playwright smoke.
Session 4: Блок-4 checklists, Kate's flags from `REVIEW-QUEUE`, final-review mode, Lighthouse pass.
Later, optional: the `propedevtika/seminar-*/*.mp4` seminars → `ffmpeg -vn -ac 1 -ar 16k` → `whisper.cpp`
(`brew install whisper.cpp`, `-l ru`, large-v3-turbo or medium) → transcripts as an additional source
for weak answers. Start with seminar 1 and measure before transcribing the rest.
</session_plan>

<working_agreements>
- This is a delivery session, not a tutoring session: narrate decisions in one or two lines, cite the
  file and page for every content claim, and skip understanding-check gates. Serhii will ask when he
  wants a concept explained.
- Commit small and often with plain messages, no attribution trailers. Pushing to `main` of this
  personal repo is pre-authorised because every push deploys; still say when you push.
- Installing npm or brew packages and creating directories is pre-approved; list what you installed
  in the worklog. Creating the GitHub repo with `gh repo create` is also pre-approved once the name
  is agreed.
- Never commit plaintext content, source PDFs, the passphrase, or Kate's full name (the repo is public;
  README describes "a personal exam trainer").
- Keep `docs/worklog.md` current (what was done, what is drafted vs checked, what is next) and write
  the project `CLAUDE.md` in session 1 so later sessions start cold without this prompt.
- When a wrong assumption would waste more than ~30 minutes, ask; otherwise state the assumption in
  the worklog and continue.
</working_agreements>

<first_actions>
1. Confirm the toolchain: `tesseract --list-langs` shows `rus`; `.env.local` exists; `gh auth status`
   is SerhiiKizenko; `ls -R ~/Downloads/Kate/propedevtika` to see which seminar videos and answer
   drafts have landed (the download may still be in progress; do not wait for it).
2. `md5 -q` the 58 PDFs, confirm the duplicate groups, and render page 1 of `ММТ.pdf` and
   `01 Атлас анатомии Кирдогло.pdf` with `pdftoppm -f 1 -l 1 -r 60` to identify them.
3. Propose repo name, two app-name alternatives to «Мышечная память», and the pastel token set.
4. Present the session-1 plan and wait for approval before scaffolding.
</first_actions>
