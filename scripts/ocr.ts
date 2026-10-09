// OCR for scanned PDFs, page by page: pdftoppm -r 300 -gray → tesseract -l rus+eng --psm 6
// → sources/ocr/<slug>/pNNN.txt (+ all.txt). Resumable: existing pages are skipped.
// Usage:
//   pnpm ocr                       all scanned decks from the inventory, in ocrPriority order
//   pnpm ocr --only "04 ВД"        decks whose basename contains the substring
//   pnpm ocr --file <pdf> --pages 1-8,12   specific pages of one PDF (atlases)
//   options: --jobs 4  --psm 6  --dpi 300
import { mkdir, readFile, rm, stat, writeFile, readdir } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { INVENTORY_JSON, MATERIALS_DIR, OCR_DIR, slugOf } from './lib/paths'
import { pMap, pdfPages, run } from './lib/run'
import type { InventoryEntry } from './inventory'

const arg = (name: string, def?: string) => {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : def
}
const JOBS = Number(arg('--jobs', '4'))
const PSM = arg('--psm', '6')!
const DPI = arg('--dpi', '300')!
const TMP = join(OCR_DIR, '.tmp')
const LOG = join(OCR_DIR, 'ocr.log')

async function log(line: string) {
  const l = `${new Date().toISOString().slice(11, 19)} ${line}`
  console.log(l)
  await writeFile(LOG, l + '\n', { flag: 'a' })
}

function parsePages(spec: string, max: number): number[] {
  const out = new Set<number>()
  for (const part of spec.split(',')) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part.trim())
    if (!m) throw new Error(`bad page spec ${part}`)
    const a = Number(m[1]), b = Number(m[2] ?? m[1])
    for (let p = a; p <= Math.min(b, max); p++) out.add(p)
  }
  return [...out].sort((x, y) => x - y)
}

async function ocrPage(pdf: string, slug: string, page: number): Promise<'done' | 'skip'> {
  const dir = join(OCR_DIR, slug)
  const txt = join(dir, `p${String(page).padStart(3, '0')}.txt`)
  if (await stat(txt).catch(() => null)) return 'skip'
  const prefix = join(TMP, `${slug}_p${page}`)
  await run('pdftoppm', ['-r', DPI, '-gray', '-f', String(page), '-l', String(page), '-singlefile', '-png', pdf, prefix])
  const text = await run('tesseract', [`${prefix}.png`, 'stdout', '-l', 'rus+eng', '--psm', PSM], {
    env: { ...process.env, OMP_THREAD_LIMIT: '1' },
  })
  await writeFile(txt, text)
  await rm(`${prefix}.png`, { force: true })
  return 'done'
}

async function assembleAll(slug: string) {
  const dir = join(OCR_DIR, slug)
  const files = (await readdir(dir)).filter((f) => /^p\d{3}\.txt$/.test(f)).sort()
  const parts: string[] = []
  for (const f of files) parts.push(`=== page ${Number(f.slice(1, 4))} ===\n${await readFile(join(dir, f), 'utf8')}`)
  await writeFile(join(dir, 'all.txt'), parts.join('\n'))
}

async function ocrFile(pdf: string, pages?: number[]) {
  const slug = slugOf(pdf)
  const total = await pdfPages(pdf)
  const list = pages ?? Array.from({ length: total }, (_, i) => i + 1)
  await mkdir(join(OCR_DIR, slug), { recursive: true })
  await log(`start  ${basename(pdf)}: ${list.length} of ${total} pages`)
  const t0 = Date.now()
  let done = 0
  await pMap(list, JOBS, async (p) => {
    const r = await ocrPage(pdf, slug, p)
    if (r === 'done') done++
    if (done && done % 25 === 0) await log(`  … ${basename(pdf)}: ${done}/${list.length}`)
  })
  await assembleAll(slug)
  await log(`finish ${basename(pdf)}: ${done} new pages in ${((Date.now() - t0) / 1000).toFixed(0)} s`)
}

async function main() {
  await mkdir(TMP, { recursive: true })
  const file = arg('--file')
  if (file) {
    const max = await pdfPages(file)
    await ocrFile(file, arg('--pages') ? parsePages(arg('--pages')!, max) : undefined)
    return
  }
  const only = arg('--only')
  const inv = JSON.parse(await readFile(INVENTORY_JSON, 'utf8')) as { entries: InventoryEntry[] }
  const queue = inv.entries
    .filter((e) => e.role === 'source' && e.ocrPriority)
    .filter((e) => !only || basename(e.rel).includes(only))
    .sort((a, b) => a.ocrPriority! - b.ocrPriority! || a.rel.localeCompare(b.rel, 'ru'))
  await log(`queue: ${queue.length} decks, ${queue.reduce((n, e) => n + e.pages, 0)} pages, ${JOBS} jobs`)
  for (const e of queue) await ocrFile(join(MATERIALS_DIR, e.rel))
  await log('queue finished')
}

main().catch(async (e) => {
  await log(`ERROR ${e?.message ?? e}`)
  process.exit(1)
})
