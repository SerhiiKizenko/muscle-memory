// All filesystem locations used by the pipeline. Sources are untrusted downloads: read-only.
import { homedir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const KATE_DIR = process.env.KATE_DIR ?? join(homedir(), 'Downloads', 'Kate')
export const LECTURES_DIR = join(KATE_DIR, 'EXAM', '01 PDF Lectures')
export const EXAM_SHEET_PDF = join(KATE_DIR, 'EXAM', '02 Exam Questioms', 'ВОПРОСЫ к Экзамену по курсу ПРОПЕДЕВТИКА.pdf')
export const ANSWERS_TXT = join(KATE_DIR, 'propedevtika', 'docs', 'ответы.txt')
export const PLAN_TXT = join(KATE_DIR, 'propedevtika', 'docs', 'план ответов от notebookLM.txt')
export const ATLAS_MMT_PDF = join(KATE_DIR, 'ММТ.pdf')
export const ATLAS_NETTER_PDF = join(LECTURES_DIR, '01 Атлас анатомии Кирдогло.pdf')

export const CONTENT_DIR = join(ROOT, 'content') // gitignored plaintext
export const CARDS_DIR = join(CONTENT_DIR, 'cards')
export const IMAGES_DIR = join(CONTENT_DIR, 'images')
export const INVENTORY_JSON = join(CONTENT_DIR, 'inventory.json')
export const SOURCES_DIR = join(ROOT, 'sources') // gitignored extracted text
export const TEXT_DIR = join(SOURCES_DIR, 'text')
export const OCR_DIR = join(SOURCES_DIR, 'ocr')
export const PUBLIC_DATA_DIR = join(ROOT, 'public', 'data') // committed ciphertext
export const DOCS_DIR = join(ROOT, 'docs')
export const ENV_LOCAL = join(ROOT, '.env.local')

/** Stable directory name for a PDF: basename without extension, punctuation → "_". Cyrillic kept. */
export function slugOf(file: string): string {
  return basename(file)
    .replace(/\.pdf$/i, '')
    .replace(/[\s()!,+№«»'"]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}
