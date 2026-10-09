// Applies a verification patch — a TS module exporting Partial<Card>[] keyed by id — onto content/cards,
// then validates. Patches live in content/verified/*.ts (gitignored plaintext). Usage: pnpm apply-verified content/verified/g1.ts
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Block, CardInput } from '../src/content/schema'
import { loadCards, saveCards } from './lib/cards'
import { printResult, validateCards } from './validate'

export type Patch = Partial<CardInput> & { id: string }

const file = process.argv[2]
if (!file) {
  console.error('usage: pnpm apply-verified <patch.ts>')
  process.exit(2)
}
const mod = (await import(pathToFileURL(resolve(file)).href)) as { default: Patch[] }
const cards = await loadCards()
const byId = new Map(cards.map((c) => [c.id, c]))
let applied = 0
let added = 0
for (const p of mod.default) {
  let c = byId.get(p.id)
  if (!c) {
    // A full card (e.g. a quiz item) may be added; the validator rejects incomplete ones.
    c = p as CardInput
    cards.push(c)
    byId.set(p.id, c)
    added++
    continue
  }
  const { muscle, ...rest } = p
  Object.assign(c, rest)
  if (muscle) {
    const mmt = muscle.mmt || c.muscle?.mmt ? { ...(c.muscle?.mmt ?? {}), ...(muscle.mmt ?? {}) } : undefined
    c.muscle = { ...(c.muscle ?? {}), ...muscle, ...(mmt ? { mmt } : {}) }
  }
  applied++
}
const sortKey = (c: CardInput) => `${c.examNumber.toString().padStart(3, '0')}-${c.parentId ? 1 : 0}-${c.id}`
for (const block of [1, 2, 3, 4] as Block[]) await saveCards(block, cards.filter((c) => c.block === block).sort((a, b) => sortKey(a).localeCompare(sortKey(b))))
const r = await validateCards(cards)
printResult(r)
console.log(`applied ${applied} patch(es), added ${added} card(s) from ${file}`)
process.exit(r.errors.length ? 1 : 0)
