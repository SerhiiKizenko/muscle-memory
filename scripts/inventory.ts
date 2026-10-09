// Inventory of every PDF under MATERIALS_DIR: md5 dedupe, page counts, text-layer check, role.
// Writes content/inventory.json (gitignored). Run: pnpm inventory
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'
import { CONTENT_DIR, INVENTORY_JSON, MATERIALS_DIR, slugOf } from './lib/paths'
import { md5File, pdfPages, pMap, run } from './lib/run'

export type Role = 'source' | 'duplicate' | 'out-of-scope'
export type Kind = 'exam-sheet' | 'atlas' | 'deck' | 'table'
export interface InventoryEntry {
  rel: string
  slug: string
  bytes: number
  md5: string
  pages: number
  /** words in the first 5 pages of the text layer */
  textWords: number
  textLayer: boolean
  role: Role
  duplicateOf?: string
  kind: Kind
  /** OCR queue order for scanned sources (1 = first); undefined = no OCR needed */
  ocrPriority?: number
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === '_drive-zips') continue
      out.push(...(await walk(p)))
    } else if (e.isFile() && /\.pdf$/i.test(e.name)) out.push(p)
  }
  return out
}

/** Canonical precedence when the same md5 appears twice: exam sheet, lectures, atlas, seminars, other. */
function precedence(rel: string): number {
  if (rel.startsWith('EXAM/02')) return 0
  if (rel.startsWith('EXAM/01')) return 1
  if (rel === 'ММТ.pdf') return 2
  if (rel.startsWith('propedevtika/')) return 3
  return 4
}

function kindOf(rel: string): Kind {
  const b = basename(rel)
  if (rel.startsWith('EXAM/02')) return 'exam-sheet'
  if (rel === 'ММТ.pdf' || b.startsWith('01 Атлас')) return 'atlas'
  if (/Табл|табл|Таблица|Материалы|рефлексы|ассоциации/.test(b)) return 'table'
  return 'deck'
}

function ocrPriorityOf(b: string): number {
  if (b.startsWith('04 ВД и ММТ')) return 1
  if (b.startsWith('04 ВД регионов')) return 2
  if (b.startsWith('03 ')) return 3
  if (b.startsWith('04 ВД Диафрагм')) return 4
  if (b.startsWith('04 ')) return 5
  if (b.startsWith('06 ')) return 6
  return 7
}

async function main() {
  const files = await walk(MATERIALS_DIR)
  const entries = await pMap(files, 4, async (file): Promise<InventoryEntry> => {
    const rel = relative(MATERIALS_DIR, file)
    const [bytes, md5, pages, text] = await Promise.all([
      stat(file).then((s) => s.size),
      md5File(file),
      pdfPages(file),
      run('pdftotext', ['-l', '5', file, '-']).catch(() => ''),
    ])
    const textWords = text.split(/\s+/).filter(Boolean).length
    return { rel, slug: slugOf(file), bytes, md5, pages, textWords, textLayer: textWords > 20, role: 'source', kind: kindOf(rel) }
  })
  entries.sort((a, b) => precedence(a.rel) - precedence(b.rel) || a.rel.localeCompare(b.rel, 'ru'))

  const seen = new Map<string, string>()
  for (const e of entries) {
    const b = basename(e.rel)
    if (e.rel.startsWith('other-courses/') || b.startsWith('08 ')) e.role = 'out-of-scope'
    const first = seen.get(e.md5)
    if (first) {
      if (e.role !== 'out-of-scope') e.role = 'duplicate'
      e.duplicateOf = first
    } else seen.set(e.md5, e.rel)
    if (e.role === 'source' && !e.textLayer && e.kind !== 'atlas') e.ocrPriority = ocrPriorityOf(b)
  }

  await mkdir(CONTENT_DIR, { recursive: true })
  await writeFile(INVENTORY_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), root: MATERIALS_DIR, entries }, null, 2) + '\n')

  const sources = entries.filter((e) => e.role === 'source')
  const scanned = sources.filter((e) => e.ocrPriority)
  console.log(`inventory: ${entries.length} PDFs → ${sources.length} sources, ${entries.filter((e) => e.role === 'duplicate').length} duplicates, ${entries.filter((e) => e.role === 'out-of-scope').length} out of scope`)
  console.log(`text-layer sources: ${sources.filter((e) => e.textLayer).length}; scanned decks to OCR: ${scanned.length} (${scanned.reduce((n, e) => n + e.pages, 0)} pages); atlases: ${sources.filter((e) => e.kind === 'atlas').length}`)
  console.log(`written ${relative(process.cwd(), INVENTORY_JSON)}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
