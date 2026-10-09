// Extracts the text layer of every text source page by page into sources/text/<slug>/pNNN.txt
// (plus all.txt with "=== page N ===" markers for grep). Idempotent; --force re-extracts. Run: pnpm extract
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { INVENTORY_JSON, KATE_DIR, TEXT_DIR } from './lib/paths'
import { pMap, run } from './lib/run'
import type { InventoryEntry } from './inventory'

const force = process.argv.includes('--force')

async function extractOne(e: InventoryEntry): Promise<string> {
  const dir = join(TEXT_DIR, e.slug)
  const allFile = join(dir, 'all.txt')
  if (!force && (await stat(allFile).catch(() => null))) return `skip   ${e.slug} (exists)`
  await mkdir(dir, { recursive: true })
  const text = await run('pdftotext', ['-layout', join(KATE_DIR, e.rel), '-'])
  const pages = text.split('\f')
  if (pages.at(-1)?.trim() === '') pages.pop()
  const parts: string[] = []
  for (let i = 0; i < pages.length; i++) {
    const body = pages[i]!.replace(/[ \t]+$/gm, '')
    await writeFile(join(dir, `p${String(i + 1).padStart(3, '0')}.txt`), body)
    parts.push(`=== page ${i + 1} ===\n${body}`)
  }
  await writeFile(allFile, parts.join('\n'))
  return `done   ${e.slug}: ${pages.length} pages`
}

async function main() {
  const inv = JSON.parse(await readFile(INVENTORY_JSON, 'utf8')) as { entries: InventoryEntry[] }
  const targets = inv.entries.filter((e) => e.role === 'source' && e.textLayer && e.kind !== 'atlas')
  const lines = await pMap(targets, 4, extractOne)
  for (const l of lines) console.log(l)
  console.log(`extracted ${targets.length} text sources → ${TEXT_DIR}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
