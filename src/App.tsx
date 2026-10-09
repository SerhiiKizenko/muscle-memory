import { HashRouter, Routes, Route } from 'react-router-dom'

function Shell() {
  return (
    <main className="safe-top safe-bottom safe-x flex min-h-dvh flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-bold">Мышечная память</h1>
      <p className="text-ink-muted">Тренажёр к экзамену. Скоро здесь появятся карточки.</p>
    </main>
  )
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={<Shell />} />
      </Routes>
    </HashRouter>
  )
}
