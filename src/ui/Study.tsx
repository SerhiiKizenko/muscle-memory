import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { Block } from '../content/schema'
import {
  buildExtraNewQueue,
  buildFinalReviewQueue,
  buildQuizQueue,
  buildTicket,
  buildTodayQueue,
  buildTopicQueue,
  buildWeakQueue,
  currentCard,
  daysBetween,
  gradeInSession,
  isFinished,
  remaining,
  startSession,
  toDateString,
  type Grade,
  type SchedCard,
} from '../engine/scheduler'
import { useContent } from '../store/content'
import { useProgress } from '../store/progress'
import { BlockBadge, Button, Card, Screen } from './components'
import { Markdown } from './Markdown'

const MODE_TITLES: Record<string, string> = { today: 'Сегодня', topic: 'Блок / тема', ticket: 'Билет', weak: 'Слабые места', final: 'Повтор перед экзаменом', quiz: 'Викторина' }

/** Fisher–Yates with Math.random; returns option indexes in display order. */
function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function Study() {
  const { mode = 'today' } = useParams()
  const [params] = useSearchParams()
  const cards = useContent((s) => s.cards)
  const byId = useContent((s) => s.byId)
  const grade = useProgress((s) => s.grade)
  const today = toDateString(new Date())

  const [session, setSession] = useState(() => {
    const { progress, settings } = useProgress.getState()
    const sched: SchedCard[] = cards.map((c) => ({ id: c.id, block: c.block, cluster: c.cluster, examNumber: c.examNumber, parentId: c.parentId }))
    const daysToExam = settings.examDate ? daysBetween(today, settings.examDate) : 14
    const block = params.get('block') ? (Number(params.get('block')) as Block) : null
    const cluster = params.get('cluster')
    let queue: string[]
    switch (mode) {
      case 'topic':
        queue = buildTopicQueue(sched, progress, today, (c) => (block === null || c.block === block) && (cluster === null || c.cluster === cluster))
        break
      case 'ticket':
        queue = buildTicket(sched, Math.random)
        break
      case 'weak':
        queue = buildWeakQueue(sched, progress)
        break
      case 'final':
        queue = buildFinalReviewQueue(sched, progress)
        break
      case 'quiz':
        queue = buildQuizQueue(sched, progress, today, 20)
        break
      default:
        queue = buildTodayQueue({ cards: sched, progress, today, daysToExam, newLimit: settings.newPerDay ?? undefined })
    }
    return startSession(queue)
  })
  const [revealed, setRevealed] = useState(false)
  /** MCQ state: display order of options and the chosen index (in card terms), reset per card. */
  const [order, setOrder] = useState<number[]>([])
  const [chosen, setChosen] = useState<number | null>(null)

  const id = currentCard(session)
  const card = id ? byId[id] : undefined
  useEffect(() => {
    setOrder(card?.quiz ? shuffled(card.quiz.options.length) : [])
    setChosen(null)
  }, [id, card])
  const title = useMemo(() => MODE_TITLES[mode] ?? 'Карточки', [mode])
  const unseenCount = useMemo(() => {
    const { progress } = useProgress.getState()
    return cards.filter((c) => progress[c.id] === undefined).length
  }, [cards, session])

  function moreNew() {
    const { progress } = useProgress.getState()
    const sched: SchedCard[] = cards.map((c) => ({ id: c.id, block: c.block, cluster: c.cluster, examNumber: c.examNumber, parentId: c.parentId }))
    setSession(startSession(buildExtraNewQueue(sched, progress, 10)))
    setRevealed(false)
    window.scrollTo({ top: 0 })
  }
  const moreNewButton =
    mode === 'today' && unseenCount > 0 ? (
      <Button data-testid="study-more-new" variant="secondary" onClick={moreNew}>
        Ещё {Math.min(10, unseenCount)} новых
      </Button>
    ) : null

  function onGrade(g: Grade) {
    if (!id) return
    grade(id, g, today)
    setSession((s) => gradeInSession(s, g, Math.random))
    setRevealed(false)
    setChosen(null)
    window.scrollTo({ top: 0 })
  }

  /** Quiz: the first tap decides; right = «Знаю», wrong = «Не знаю» (the item comes back after 4–6 cards and tomorrow). */
  function choose(optionIndex: number) {
    if (!card?.quiz || chosen !== null || !id) return
    setChosen(optionIndex)
    grade(id, optionIndex === card.quiz.answer ? 'good' : 'again', today)
  }
  function nextAfterQuiz() {
    if (!card?.quiz || chosen === null) return
    setSession((s) => gradeInSession(s, chosen === card.quiz!.answer ? 'good' : 'again', Math.random))
    setChosen(null)
    window.scrollTo({ top: 0 })
  }

  if (session.queue.length === 0)
    return (
      <Screen title={title} back="/">
        <Card className="mt-4 flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-semibold">Карточек нет</p>
          <p className="text-ink-muted">{mode === 'today' ? 'На сегодня всё сделано. Можно взять ещё новых, повторить тему или собрать билет.' : mode === 'quiz' ? 'Вопросы викторины появляются после того, как вы прошли их карточки в «Сегодня».' : 'В этом режиме пока нечего показывать.'}</p>
          {moreNewButton}
          <Link to="/"><Button variant="secondary">На главную</Button></Link>
        </Card>
      </Screen>
    )

  if (isFinished(session) || !card)
    return (
      <Screen title={title} back="/">
        <Card data-testid="study-finished" className="mt-4 flex flex-col items-center gap-4 text-center">
          <p className="text-2xl font-bold">Готово</p>
          <p className="text-ink-muted">Пройдено карточек: {session.done}</p>
          {moreNewButton}
          <Link to="/"><Button>На главную</Button></Link>
        </Card>
      </Screen>
    )

  if (card.quiz) {
    const q = card.quiz
    const answered = chosen !== null
    const correct = answered && chosen === q.answer
    const cls = (i: number) => {
      if (!answered) return 'bg-surface active:bg-surface-2'
      if (i === q.answer) return 'bg-ok text-on-accent'
      if (i === chosen) return 'bg-bad text-on-accent'
      return 'bg-surface opacity-60'
    }
    return (
      <Screen
        title={title}
        back="/"
        right={<span data-testid="study-remaining" className="text-sm text-ink-muted">осталось {remaining(session)}</span>}
        footer={answered ? <Button data-testid="quiz-next" className="w-full" onClick={nextAfterQuiz}>Дальше</Button> : undefined}
      >
        <div className="flex flex-col gap-3 pt-2">
          <BlockBadge block={card.block} label={card.clusterTitle} />
          <Card>
            <p data-testid="study-prompt" className="text-xl font-semibold leading-snug">{card.prompt}</p>
          </Card>
          <div className="flex flex-col gap-2" data-testid="quiz-options">
            {order.map((i, pos) => (
              <button
                key={i}
                type="button"
                data-testid={`quiz-option-${pos}`}
                data-correct={i === q.answer ? 'true' : 'false'}
                disabled={answered}
                onClick={() => choose(i)}
                className={`min-h-12 rounded-2xl px-4 py-3 text-left text-base font-medium shadow-sm transition ${cls(i)}`}
              >
                {q.options[i]}
              </button>
            ))}
          </div>
          {answered ? (
            <>
              <p data-testid="quiz-verdict" className={`px-1 font-semibold ${correct ? 'text-ok' : 'text-bad'}`}>
                {correct ? 'Верно' : 'Неверно — правильный ответ подсвечен'}
              </p>
              {q.explanation ? (
                <Card>
                  <Markdown text={q.explanation} />
                </Card>
              ) : null}
              {card.examLine ? (
                <Card className="border-l-4 border-sage-strong bg-sage/20">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Как сказать на экзамене</p>
                  <p className="font-medium">{card.examLine}</p>
                </Card>
              ) : null}
              {card.sources.length ? (
                <p className="px-1 text-xs text-ink-muted">
                  Источники: {card.sources.map((s) => `${s.file.replace(/\.pdf$/i, '')}${s.page ? `, с. ${s.page}` : ''}`).join('; ')}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </Screen>
    )
  }

  return (
    <Screen
      title={title}
      back="/"
      right={<span data-testid="study-remaining" className="text-sm text-ink-muted">осталось {remaining(session)}</span>}
      footer={
        revealed ? (
          <div className="grid grid-cols-3 gap-2">
            <Button data-testid="grade-again" variant="bad" onClick={() => onGrade('again')}>Не знаю</Button>
            <Button data-testid="grade-hard" variant="warn" onClick={() => onGrade('hard')}>С трудом</Button>
            <Button data-testid="grade-good" variant="ok" onClick={() => onGrade('good')}>Знаю</Button>
          </div>
        ) : (
          <Button data-testid="study-reveal" className="w-full" onClick={() => setRevealed(true)}>Показать ответ</Button>
        )
      }
    >
      <div className="flex flex-col gap-3 pt-2">
        <BlockBadge block={card.block} label={card.clusterTitle} />
        <Card>
          <p data-testid="study-prompt" className="text-xl font-semibold leading-snug">{card.prompt}</p>
          {mode === 'ticket' ? <p className="mt-2 text-sm text-ink-muted">Ответьте вслух, как на экзамене.</p> : null}
        </Card>
        {revealed ? (
          <>
            {card.reviewStatus === 'draft' ? (
              <p className="rounded-2xl bg-warn/25 px-4 py-2 text-sm">Черновик — ответ ещё не сверен с материалами.</p>
            ) : null}
            <Card data-testid="study-answer">
              <Markdown text={card.answer} />
            </Card>
            {card.examLine ? (
              <Card className="border-l-4 border-sage-strong bg-sage/20">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Как сказать на экзамене</p>
                <p className="font-medium">{card.examLine}</p>
              </Card>
            ) : null}
            {card.sources.length ? (
              <p className="px-1 text-xs text-ink-muted">
                Источники: {card.sources.map((s) => `${s.file.replace(/\.pdf$/i, '')}${s.page ? `, с. ${s.page}` : ''}`).join('; ')}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </Screen>
  )
}
