import { AlertTriangle, Flame, Layers, RotateCcw, Settings as SettingsIcon, Shuffle, Sun } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { buildTodayQueue, daysBetween, isDue, newCardQuota, toDateString } from '../engine/scheduler'
import { useContent } from '../store/content'
import { useProgress } from '../store/progress'
import { Button, Card, plural, ProgressRing, Screen } from './components'

export function Home() {
  const cards = useContent((s) => s.cards)
  const manifest = useContent((s) => s.manifest)
  const progress = useProgress((s) => s.progress)
  const settings = useProgress((s) => s.settings)
  const stats = useProgress((s) => s.stats)
  const today = toDateString(new Date())
  const daysToExam = settings.examDate ? daysBetween(today, settings.examDate) : null

  const { due, fresh, seen, learned, todayCount } = useMemo(() => {
    const sched = cards.map((c) => ({ id: c.id, block: c.block, cluster: c.cluster, examNumber: c.examNumber }))
    const due = sched.filter((c) => progress[c.id] && isDue(progress[c.id]!, today)).length
    const unseen = sched.filter((c) => !progress[c.id]).length
    const fresh = Math.min(unseen, settings.newPerDay ?? newCardQuota(unseen, daysToExam ?? 14))
    const seen = sched.length - unseen
    const learned = sched.filter((c) => progress[c.id]?.box === 5).length
    const todayCount = buildTodayQueue({ cards: sched, progress, today, daysToExam: daysToExam ?? 14, newLimit: settings.newPerDay ?? undefined }).length
    return { due, fresh, seen, learned, todayCount }
  }, [cards, progress, today, daysToExam, settings.newPerDay])

  const checked = manifest ? Object.values(manifest.counts).reduce((n, c) => n + c.checked, 0) : 0

  return (
    <Screen
      title="Мышечная память"
      right={
        <Link to="/settings" aria-label="Настройки" className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted active:bg-surface-2">
          <SettingsIcon />
        </Link>
      }
    >
      <div className="flex flex-col gap-4">
        <Card className="flex items-center gap-4">
          <ProgressRing value={cards.length ? seen / cards.length : 0} label={`${seen}`} sub={`из ${cards.length}`} />
          <div className="flex flex-1 flex-col gap-1">
            <div data-testid="home-days" className="text-lg font-bold">
              {daysToExam === null ? 'Дата экзамена не задана' : daysToExam > 0 ? `Экзамен через ${daysToExam} ${plural(daysToExam, 'день', 'дня', 'дней')}` : daysToExam === 0 ? 'Экзамен сегодня' : 'Экзамен прошёл'}
            </div>
            <div className="flex items-center gap-1 text-sm text-ink-muted">
              <Flame size={16} className={stats.streak ? 'text-warn' : ''} /> {stats.streak} {plural(stats.streak, 'день', 'дня', 'дней')} подряд
            </div>
            <div className="text-sm text-ink-muted">Усвоено: {learned}</div>
          </div>
        </Card>

        <Link to="/study/today" data-testid="home-today" className="block">
          <Card className="flex items-center gap-4 bg-sage-strong text-white">
            <Sun size={28} />
            <div className="flex-1">
              <div className="text-lg font-bold">Сегодня</div>
              <div className="text-sm opacity-90">
                {todayCount === 0 ? 'На сегодня всё сделано' : `${due} на повтор · ${fresh} ${plural(fresh, 'новая', 'новые', 'новых')}`}
              </div>
            </div>
          </Card>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/topics">
            <Button variant="secondary" className="w-full flex-col py-3"><Layers /> Блок / тема</Button>
          </Link>
          <Link to="/study/ticket">
            <Button variant="secondary" className="w-full flex-col py-3"><Shuffle /> Билет</Button>
          </Link>
          <Link to="/weak">
            <Button variant="secondary" className="w-full flex-col py-3"><AlertTriangle /> Слабые места</Button>
          </Link>
          <Link to="/study/final">
            <Button variant="secondary" className="w-full flex-col py-3"><RotateCcw /> Повтор перед экзаменом</Button>
          </Link>
        </div>

        <p className="text-center text-xs text-ink-muted">
          Карточек: {cards.length}, сверено с материалами: {checked}. Остальные — черновик.
        </p>
      </div>
    </Screen>
  )
}
