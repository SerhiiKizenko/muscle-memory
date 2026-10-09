# Decisions

- **2026-10-09 — Repo `muscle-memory`, app «Мышечная память», short name «Память».** Alternatives offered: Тонус,
  Ретест. Chosen by Serhii.
- **2026-10-09 — Encrypted bundle format is self-describing.** Header carries version, PBKDF2 iterations, salt and
  IV, so the app needs no side file and test bundles can use fewer iterations. Format in `src/crypto/format.ts`.
- **2026-10-09 — One salt per project, kept in `public/data/salt.json`.** A device that cached its derived key
  keeps working across content updates. Rotate by deleting the file (everyone re-enters the passphrase).
- **2026-10-09 — Deterministic IV (SHA-256 of salt‖plaintext) for static content.** Re-encrypting unchanged content
  yields identical bytes, so git only changes when content changes. Safe: an IV repeats only for identical plaintext.
- **2026-10-09 — Block 3 has 41 muscles, not 42.** Counted on the exam sheet; the kickoff's 42 was wrong.
- **2026-10-09 — Pages cited are PDF pages.** Book pagination differs (atlas: book = PDF − 1); the app will render
  images from PDF pages, so PDF numbering is the stable key.
- **2026-10-09 — Study screen is remounted per URL** (`key = pathname + search`), so switching modes starts a new session.
- **2026-10-09 — Kickoff prompt is untracked** (`KICKOFF-PROMPT.md` in `.gitignore`). It was in the first two commits of
  the public repo; it holds no secrets. Rewriting history needs a force-push, which is Serhii's call.
