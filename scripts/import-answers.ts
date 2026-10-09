// Imports the four exam blocks: prompts from the exam sheet (extracted text), draft answers from
// ответы.txt, source-file hints from «план ответов». Every card is reviewStatus: draft.
// Writes content/cards/block{1..4}.json, content/import-report.md (plaintext, gitignored) and
// docs/REVIEW-QUEUE.md (ids + reasons only — no course text; the repo is public). Run: pnpm import
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  block1Cluster,
  EXPECTED_COUNTS,
  UNSUPPORTED_MARK,
  type Block,
  type CardInput,
  type Muscle,
  type Source,
} from '../src/content/schema'
import { saveCards } from './lib/cards'
import { ANSWERS_TXT, CONTENT_DIR, DOCS_DIR, EXAM_SHEET_PDF, INVENTORY_JSON, PLAN_TXT, TEXT_DIR, slugOf } from './lib/paths'
import type { InventoryEntry } from './inventory'

// ---------------------------------------------------------------- exam sheet (prompts)
interface SheetItem { n: number; text: string }
type Sheet = Record<Block, SheetItem[]>

function numbered(lines: string[]): SheetItem[] {
  const out: SheetItem[] = []
  for (const l of lines) {
    const m = /^\s*(\d{1,3})\.\s+(.*)$/.exec(l)
    if (m) out.push({ n: Number(m[1]), text: m[2]!.trim() })
    else if (out.length) out[out.length - 1]!.text += ' ' + l.trim()
  }
  return out.map((i) => ({ ...i, text: i.text.replace(/\s+/g, ' ').trim() }))
}

async function parseSheet(): Promise<Sheet> {
  const raw = await readFile(join(TEXT_DIR, slugOf(EXAM_SHEET_PDF), 'all.txt'), 'utf8')
  const lines = raw
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.trim() !== '' && !/^=== page \d+ ===$/.test(l) && !/^\s*\d{1,2}\s*$/.test(l))
  const idx = (re: RegExp) => lines.findIndex((l) => re.test(l))
  const [b1, b2, b3, b4, end] = [/БЛОК 1/, /БЛОК 2/, /БЛОК 3/, /БЛОК 4/, /Для подготовки к Экзамену/].map(idx)
  if ([b1, b2, b3, b4, end].some((i) => i! < 0)) throw new Error('exam sheet: block headings not found')
  const block3: SheetItem[] = []
  for (const l of lines.slice(b3! + 1, b4)) {
    const m = /^\s*-\s+(.*?)[;.]?\s*$/.exec(l)
    if (m) block3.push({ n: block3.length + 1, text: m[1]!.trim() })
  }
  return {
    1: numbered(lines.slice(b1! + 1, b2)),
    2: numbered(lines.slice(b2! + 1, b3)).map((i) => ({ ...i, text: i.text.replace(/\.$/, '') })),
    3: block3,
    4: numbered(lines.slice(b4! + 1, end)),
  }
}

// ---------------------------------------------------------------- answers draft
const isBullet = (l: string) => /^\s*•/.test(l)
const bulletText = (l: string) => l.replace(/^\s*•\s*/, '').trim()

function splitDraftBlocks(text: string): Record<Block, string[]> {
  const lines = text.split('\n')
  const find = (re: RegExp) => lines.findIndex((l) => re.test(l))
  const [b1, b2, b3, b4] = [/^\s*Блок 1/i, /^\s*БЛОК 2/, /^\s*БЛОК 3/, /^\s*БЛОК 4/].map(find)
  if ([b1, b2, b3, b4].some((i) => i! < 0)) throw new Error('ответы.txt: block headings not found')
  return { 1: lines.slice(b1! + 1, b2), 2: lines.slice(b2! + 1, b3), 3: lines.slice(b3! + 1, b4), 4: lines.slice(b4! + 1) }
}

interface DraftItem { n: number; title: string; body: string[] }
function draftItems(lines: string[]): DraftItem[] {
  const out: DraftItem[] = []
  for (const l of lines) {
    if (!l.trim()) continue
    const m = /^\s*(\d{1,3})\.\s+(.*)$/.exec(l)
    if (m) out.push({ n: Number(m[1]), title: m[2]!.trim(), body: [] })
    else if (out.length) out[out.length - 1]!.body.push(l)
  }
  return out
}

/** Flat draft body → markdown: «Ответ: …» becomes the lead paragraph, the rest become bullets. */
function bodyToMarkdown(body: string[]): string {
  const lead: string[] = []
  const bullets: string[] = []
  for (const l of body) {
    if (isBullet(l)) {
      const t = bulletText(l)
      const m = /^Ответ:\s*(.*)$/.exec(t)
      if (m) {
        if (m[1]!.trim()) lead.push(m[1]!.trim())
        continue
      }
      bullets.push(t)
    } else lead.push(l.trim())
  }
  return [lead.join(' '), bullets.map((b) => `- ${b}`).join('\n')].filter(Boolean).join('\n\n')
}

const latinOf = (s: string): string[] => {
  const out: string[] = []
  for (const m of s.matchAll(/\((m{1,2}\.\s*[^)]+)\)/g)) out.push(m[1]!.replace(/\s*[—–-]\s*[А-Яа-яё].*$/, '').replace(/\s*\/\s*[А-ЯЁ]{2,}$/, '').trim())
  return out
}

// ---------------------------------------------------------------- artefact cleanup
interface Edit { where: string; before: string; after: string }
function cleanArtefacts(text: string, where: string, edits: Edit[]): string {
  const ctx = (s: string, i: number, len: number) => s.slice(Math.max(0, i - 25), i + len + 10).replace(/\n/g, ' ')
  let out = text.replace(/\s+z(\.?)(?=\s|$)/g, (m, dot: string, off: number, s: string) => {
    edits.push({ where, before: ctx(s, off, m.length), after: ctx(s, off, m.length).replace(m, dot) })
    return dot
  })
  // "$" is what the docx→txt conversion made of NotebookLM arrows in association chains
  out = out.replace(/\s*\$\s*/g, (m, off: number, s: string) => {
    edits.push({ where, before: ctx(s, off, m.length), after: ctx(s, off, m.length).replace(m, ' → ') })
    return ' → '
  })
  // digits glued to a Cyrillic word, °, ) or » — NotebookLM citation indices
  out = out.replace(/([а-яё°»)\]])(\d{1,4})(?=[\s.,;:)\]]|$)/g, (m, pre: string, _d: string, off: number, s: string) => {
    edits.push({ where, before: ctx(s, off, m.length), after: ctx(s, off, m.length).replace(m, pre) })
    return pre
  })
  return out
}

// ---------------------------------------------------------------- plan (source hints)
async function parsePlanSources(known: Set<string>, unknown: Set<string>): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  const text = await readFile(PLAN_TXT, 'utf8').catch(() => '')
  let block: Block | 0 = 0
  let range: [number, number] | null = null
  for (const raw of text.split('\n')) {
    const l = raw.trim()
    const bm = /^БЛОК (\d)/.exec(l)
    if (bm) {
      block = Number(bm[1]) as Block
      range = null
      continue
    }
    const rm = /(?:Вопрос|Вопросы|Пункт|Пункты|Мышца|Мышцы|Задача|Задачи)\s+(\d+)(?:\s*[–-]\s*(\d+))?/.exec(l)
    if (rm && !/Источники/.test(l)) range = [Number(rm[1]), Number(rm[2] ?? rm[1])]
    const sm = /Источники:\s*(.*)$/.exec(l)
    if (sm && block) {
      const files = [...sm[1]!.matchAll(/([^,;]*?\.pdf)/g)].map((m) => m[1]!.trim().replace(/^[\s.]+/, ''))
      for (const f of files) (known.has(f) ? known : unknown).add(f)
      const valid = files.filter((f) => known.has(f))
      const [a, b] = range ?? [1, EXPECTED_COUNTS[block]]
      for (let n = a; n <= b; n++) if (!map.has(`${block}:${n}`)) map.set(`${block}:${n}`, valid)
    }
  }
  return map
}

const FALLBACK_SOURCE: Record<Block, string> = {
  1: '01 ПРОПЕДЕВТИКА 1.pdf',
  2: 'ММТ.pdf',
  3: 'ММТ.pdf',
  4: '04 Материалы (схемы, таблицы).pdf',
}

// ---------------------------------------------------------------- muscle clusters
const MUSCLE_CLUSTERS: { key: string; title: string; re: RegExp }[] = [
  { key: 'head', title: 'Голова', re: /крыловидн|височн|жевательн/ },
  { key: 'neck', title: 'Шея', re: /грудино-ключично|шейного отдела|шоп|лестничн|поднимающая лопатку|флексоры шеи|экстензоры шеи/ },
  { key: 'trunk', title: 'Туловище', re: /мышца живота|мышцы живота|квадратная мышца поясницы|поперечная/ },
  { key: 'pelvis', title: 'Таз и бедро', re: /подвздошно-поясничн|экстензоры бедра|бедра|полусухожильн|полуперепончат|ягодичн|грушевидн|напрягающая|четырехглав|приводящ|подколенн|копчиков|хамстринг/ },
  { key: 'leg', title: 'Голень и стопа', re: /большеберцов|малоберцов|разгибател|сгибател|икроножн|камбаловидн|третичн|пальц/ },
  { key: 'shoulder', title: 'Плечевой пояс и рука', re: /дельтовидн|грудная|подлопаточн|трапециевидн|трехглав|двуглав|зубчат|широчайш|ромбовидн|подключичн|надостн|подостн|круглая/ },
]
function muscleCluster(name: string): { key: string; title: string } {
  const n = name.toLowerCase().replace(/ё/g, 'е')
  for (const c of MUSCLE_CLUSTERS) if (c.re.test(n)) return { key: c.key, title: c.title }
  return { key: 'other', title: 'Другие мышцы' }
}

const BLOCK4_CLUSTERS = (n: number) =>
  n <= 2 ? { key: 'vd', title: 'Визуальная диагностика регионов' }
  : n <= 11 ? { key: 'chains', title: 'Диагностика миофасциальных цепей' }
  : n <= 14 ? { key: 'gait', title: 'Паттерн шага и неврологическая дезорганизация' }
  : { key: 'corr', title: 'Техники коррекции' }

// ---------------------------------------------------------------- block 3 (ММТ) draft
interface MmtDraft { name: string; latin: string[]; group: string; fields: Partial<Record<'ipp' | 'ipv' | 'contact' | 'direction', string>>; separation: string[]; other: string[] }
function parseMmtDraft(lines: string[]): MmtDraft[] {
  const out: MmtDraft[] = []
  let group = ''
  for (const l of lines) {
    if (!l.trim()) continue
    const gm = /^\s*(\d{1,2})\.\s+(.*)$/.exec(l)
    if (gm) { group = gm[2]!.trim(); continue }
    if (!isBullet(l)) { out.at(-1)?.other.push(l.trim()); continue }
    const t = bulletText(l)
    const fm = /^(ИПП|ИПВ|Контакт и вектор|Контакт|Вектор|Направление)\s*:\s*(.*)$/.exec(t)
    const cur = out.at(-1)
    if (fm && cur) {
      const [, k, v] = fm
      if (k === 'ИПП') cur.fields.ipp = v!.trim()
      else if (k === 'ИПВ') cur.fields.ipv = v!.trim()
      else {
        const split = /\s*(?:Вектор давления|Направление давления|Вектор)\s*[—–:-]\s*/.exec(v!)
        if (k === 'Контакт и вектор' && split) {
          cur.fields.contact = v!.slice(0, split.index).trim()
          cur.fields.direction = v!.slice(split.index + split[0].length).trim()
        } else if (k === 'Вектор' || k === 'Направление') cur.fields.direction = v!.trim()
        else cur.fields.contact = v!.trim()
      }
      continue
    }
    if (/^Сепарационн/i.test(t) && cur) { cur.separation.push(t); continue }
    if (/:$/.test(t) && /\((m{1,2}\.|мм?\.)/.test(t)) {
      out.push({ name: t.replace(/\s*\(.*$/, '').replace(/:$/, '').trim(), latin: latinOf(t), group, fields: {}, separation: [], other: [] })
      continue
    }
    cur?.other.push(t)
  }
  return out
}

const STOP = new Set(['мышца', 'мышцы', 'мышц', 'и', 'm', 'mm', 'группа'])
function nameTokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase().replace(/ё/g, 'е').replace(/\(.*?\)/g, ' ').replace(/(^|\s)шоп(?=\s|$)/g, '$1шейного отдела позвоночника')
      .replace(/[^а-я\s-]/g, ' ').split(/[\s-]+/).filter((w) => w && !STOP.has(w)),
  )
}
function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  return inter / (a.size + b.size - inter || 1)
}

// ---------------------------------------------------------------- main
async function main() {
  const inv = JSON.parse(await readFile(INVENTORY_JSON, 'utf8')) as { entries: InventoryEntry[] }
  const known = new Set(inv.entries.filter((e) => e.role !== 'out-of-scope').map((e) => e.rel.split('/').pop()!))
  const unknownPlanFiles = new Set<string>()
  const plan = await parsePlanSources(known, unknownPlanFiles)
  const sheet = await parseSheet()
  const draft = splitDraftBlocks(await readFile(ANSWERS_TXT, 'utf8'))
  const edits: Edit[] = []
  const report: string[] = []
  const queue: { id: string; reason: string }[] = []

  const sourcesFor = (block: Block, n: number): Source[] => {
    const files = plan.get(`${block}:${n}`)
    const list = files?.length ? files : [FALLBACK_SOURCE[block]]
    return list.map((file) => ({ file, page: null }))
  }
  const stubCard = (block: Block, id: string, cluster: { key: string; title: string }, n: number, prompt: string, reason: string): CardInput => {
    queue.push({ id, reason })
    return {
      id, block, cluster: cluster.key, clusterTitle: cluster.title, examNumber: n, type: 'recall', prompt,
      answer: `${UNSUPPORTED_MARK}\n\nОтвета в черновике нет — нужно написать по материалам.`,
      facts: [], images: [], sources: sourcesFor(block, n), latin: [], tags: [], reviewStatus: 'draft', flags: ['stub', 'unsupported'],
      notes: reason,
    }
  }

  // ---- block 1
  const d1 = new Map(draftItems(draft[1]).map((i) => [i.n, i]))
  const b1: CardInput[] = sheet[1].map((q) => {
    const id = `b1-q${String(q.n).padStart(3, '0')}`
    const cl = block1Cluster(q.n)
    const d = d1.get(q.n)
    if (!d) return stubCard(1, id, cl, q.n, q.text, 'нет ответа в черновике')
    const answer = cleanArtefacts(bodyToMarkdown(d.body), id, edits)
    return {
      id, block: 1, cluster: cl.key, clusterTitle: cl.title, examNumber: q.n,
      type: /^Перечислите/i.test(q.text) ? 'list' : 'recall',
      prompt: q.text, answer, facts: [], images: [], sources: sourcesFor(1, q.n), latin: [], tags: [], reviewStatus: 'draft', flags: [],
    }
  })
  const extra1 = [...d1.keys()].filter((n) => !sheet[1].some((q) => q.n === n))
  report.push(`## Блок 1\n- вопросов на листе: ${sheet[1].length}; в черновике: ${d1.size}; без ответа: ${b1.filter((c) => c.flags?.includes('stub')).map((c) => c.examNumber).join(', ') || '—'}; лишние номера в черновике: ${extra1.join(', ') || '—'}`)

  // ---- block 2
  const d2 = new Map(draftItems(draft[2]).map((i) => [i.n, i]))
  const FIELDS: [RegExp, keyof Muscle][] = [[/^Начало:/, 'origin'], [/^Прикрепление:/, 'insertion'], [/^Функция:/, 'function'], [/^Иннервация:/, 'innervation']]
  const b2: CardInput[] = sheet[2].map((q) => {
    const id = `b2-m${String(q.n).padStart(2, '0')}`
    const cl = muscleCluster(q.text)
    const d = d2.get(q.n)
    if (!d) return stubCard(2, id, cl, q.n, q.text, 'нет ответа в черновике')
    const muscle: Muscle = {}
    const latin = latinOf(d.title)
    if (latin[0]) muscle.latinName = latin[0]
    const leftovers: string[] = []
    for (const l of d.body) {
      if (!isBullet(l)) { leftovers.push(l.trim()); continue }
      const t = cleanArtefacts(bulletText(l), id, edits)
      const f = FIELDS.find(([re]) => re.test(t))
      if (f) { muscle[f[1]] = t.replace(f[0], '').trim() as never; continue }
      const sa = /^Синергисты и антагонисты:\s*(.*)$/.exec(t)
      if (sa) {
        const v = sa[1]!
        const cut = /;?\s*антагонист[ыа]?\s*[—–:-]\s*/i.exec(v)
        if (cut) { muscle.synergists = v.slice(0, cut.index).replace(/^синергист[ыа]?\s*(отведения\s*)?[—–:-]\s*/i, '').trim(); muscle.antagonists = v.slice(cut.index + cut[0].length).trim() }
        else muscle.synergists = v.trim()
        continue
      }
      leftovers.push(t)
    }
    const answer = [
      muscle.origin && `**Начало:** ${muscle.origin}`,
      muscle.insertion && `**Прикрепление:** ${muscle.insertion}`,
      muscle.function && `**Функция:** ${muscle.function}`,
      muscle.innervation && `**Иннервация:** ${muscle.innervation}`,
      muscle.synergists && `**Синергисты:** ${muscle.synergists}`,
      muscle.antagonists && `**Антагонисты:** ${muscle.antagonists}`,
      ...leftovers,
    ].filter(Boolean).join('\n\n')
    return {
      id, block: 2, cluster: cl.key, clusterTitle: cl.title, examNumber: q.n, type: 'recall',
      prompt: `${q.text}${latin[0] ? ` (${latin[0]})` : ''}: начало, прикрепление, функция, синергисты и антагонисты`,
      answer, facts: [], images: [], sources: sourcesFor(2, q.n), latin, tags: [], reviewStatus: 'draft', flags: [], muscle,
    }
  })
  report.push(`## Блок 2\n- мышц на листе: ${sheet[2].length}; в черновике: ${d2.size}`)

  // ---- block 3
  const mmt = parseMmtDraft(draft[3])
  const used = new Set<number>()
  const matchRows: string[] = []
  const b3: CardInput[] = sheet[3].map((q) => {
    const id = `b3-m${String(q.n).padStart(2, '0')}`
    const cl = muscleCluster(q.text)
    const qt = nameTokens(q.text)
    let best = -1, bestScore = 0
    mmt.forEach((m, i) => { if (used.has(i)) return; const s = jaccard(qt, nameTokens(m.name)); if (s > bestScore) { bestScore = s; best = i } })
    if (best < 0 || bestScore < 0.5) {
      matchRows.push(`| ${q.n} | ${q.text} | — | ${bestScore.toFixed(2)} | STUB |`)
      return stubCard(3, id, cl, q.n, `ММТ: ${q.text}`, 'нет описания теста в черновике')
    }
    used.add(best)
    const m = mmt[best]!
    matchRows.push(`| ${q.n} | ${q.text} | ${m.name} | ${bestScore.toFixed(2)} | ok |`)
    const c = (s?: string) => (s ? cleanArtefacts(s, id, edits) : undefined)
    const muscle: Muscle = { latinName: m.latin[0], mmt: { ipp: c(m.fields.ipp), ipv: c(m.fields.ipv), contact: c(m.fields.contact), direction: c(m.fields.direction), separation: m.separation.length ? c(m.separation.join('\n')) : undefined } }
    const answer = [
      muscle.mmt!.ipp && `**ИПП:** ${muscle.mmt!.ipp}`,
      muscle.mmt!.ipv && `**ИПВ:** ${muscle.mmt!.ipv}`,
      muscle.mmt!.contact && `**Контакт:** ${muscle.mmt!.contact}`,
      muscle.mmt!.direction && `**Вектор:** ${muscle.mmt!.direction}`,
      ...m.separation.map((s) => `- ${c(s)}`),
      ...m.other.map((s) => c(s)),
    ].filter(Boolean).join('\n\n')
    return {
      id, block: 3, cluster: cl.key, clusterTitle: cl.title, examNumber: q.n, type: 'recall',
      prompt: `ММТ: ${q.text}${m.latin[0] ? ` (${m.latin[0]})` : ''} — ИПП, ИПВ, контакт, вектор${m.separation.length ? ', сепарационные тесты' : ''}`,
      answer: answer || `${UNSUPPORTED_MARK}\n\nВ черновике есть только название.`,
      facts: [], images: [], sources: sourcesFor(3, q.n), latin: m.latin, tags: [], reviewStatus: 'draft', flags: answer ? [] : ['unsupported'], muscle,
    }
  })
  const unusedMmt = mmt.filter((_, i) => !used.has(i)).map((m) => m.name)
  report.push(`## Блок 3\n- мышц на листе: ${sheet[3].length}; в черновике: ${mmt.length}; не сопоставлены из черновика: ${unusedMmt.join('; ') || '—'}\n\n| № | Лист | Черновик | score | |\n|---|---|---|---|---|\n${matchRows.join('\n')}`)

  // ---- block 4
  const d4 = new Map(draftItems(draft[4]).map((i) => [i.n, i]))
  const b4: CardInput[] = sheet[4].map((q) => {
    const id = `b4-s${String(q.n).padStart(2, '0')}`
    const cl = BLOCK4_CLUSTERS(q.n)
    const d = d4.get(q.n)
    if (!d) return stubCard(4, id, cl, q.n, q.text, 'нет ответа в черновике')
    const answer = cleanArtefacts(bodyToMarkdown(d.body.filter((l) => !/^\s*•\s*Алгоритм выполнения:\s*$/.test(l))), id, edits)
    return {
      id, block: 4, cluster: cl.key, clusterTitle: cl.title, examNumber: q.n, type: 'order',
      prompt: q.text, answer, facts: [], images: [], sources: sourcesFor(4, q.n), latin: [], tags: [], reviewStatus: 'draft', flags: [],
    }
  })
  report.push(`## Блок 4\n- навыков на листе: ${sheet[4].length}; в черновике: ${d4.size}`)

  // ---- write
  for (const [block, cards] of [[1, b1], [2, b2], [3, b3], [4, b4]] as [Block, CardInput[]][]) await saveCards(block, cards)
  const all = [...b1, ...b2, ...b3, ...b4]
  const bySource = new Map<string, number>()
  for (const c of all) for (const s of c.sources) bySource.set(s.file, (bySource.get(s.file) ?? 0) + 1)
  report.push(`## Источники (из плана NotebookLM, страницы не проверены)\n${[...bySource.entries()].sort((a, b) => b[1] - a[1]).map(([f, n]) => `- ${f}: ${n}`).join('\n')}\n- не найдены в инвентаре: ${[...unknownPlanFiles].join('; ') || '—'}`)
  report.push(`## Чистка артефактов цитирования NotebookLM (${edits.length})\n${edits.map((e) => `- ${e.where}: «…${e.before}…» → «…${e.after}…»`).join('\n')}`)
  await mkdir(CONTENT_DIR, { recursive: true })
  await writeFile(join(CONTENT_DIR, 'import-report.md'), `# Import report ${new Date().toISOString()}\n\n${report.join('\n\n')}\n`)

  await mkdir(DOCS_DIR, { recursive: true })
  const q = queue.map((s) => `- \`${s.id}\` — ${s.reason}`).join('\n')
  await writeFile(join(DOCS_DIR, 'REVIEW-QUEUE.md'), `# Review queue\n\nCards that need a human (Kate / Serhii) before they can be trusted. Ids only — the repo is public, so no course text here. Details live in the local, gitignored \`content/import-report.md\`.\n\n## Stubs — no answer in the draft (${queue.length})\n\n${q || '—'}\n\n## Unsupported claims\n\n_(filled during verification)_\n`)

  console.log(`imported: block1 ${b1.length}, block2 ${b2.length}, block3 ${b3.length}, block4 ${b4.length}; stubs ${queue.length}; cleanup edits ${edits.length}`)
  console.log(`report: content/import-report.md; queue: docs/REVIEW-QUEUE.md`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
