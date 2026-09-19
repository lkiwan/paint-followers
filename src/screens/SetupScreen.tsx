import { useEffect, useState, type FormEvent } from 'react'
import { useGame } from '../context/GameContext'
import {
  CATEGORIES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  pickRandomCategory,
} from '../data/words'
import type { Category } from '../types'

/**
 * Setup phase: add/remove players, pick a category, then start.
 * Also exposes the "random" picker so a category can be chosen one-tap.
 */
export default function SetupScreen() {
  const { state, dispatch } = useGame()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Fast start: prefill the default player roster so a game can begin in one tap.
  useEffect(() => {
    if (state.phase !== 'setup' || state.players.length > 0) return
    for (let i = 1; i <= MIN_PLAYERS; i++) {
      dispatch({ type: 'ADD_PLAYER', name: `لاعب ${i}` })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // One-tap player count: fill/trim the roster with default-named players.
  function setQuickCount(n: number) {
    const target = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, Math.round(n)))
    const current = state.players.length
    if (target > current) {
      let toAdd = target - current
      let i = current + 1
      for (let guard = 0; guard < MAX_PLAYERS * 2 && toAdd > 0; guard++) {
        const nm = `لاعب ${i}`
        if (!state.players.some((p) => p.name === nm)) {
          dispatch({ type: 'ADD_PLAYER', name: nm })
          toAdd--
        }
        i++
      }
    } else if (target < current) {
      const ids = state.players.slice(target).map((p) => p.id)
      for (const id of ids) dispatch({ type: 'REMOVE_PLAYER', id })
    }
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('اكتب اسم أولاً')
      return
    }
    if (state.players.some((p) => p.name === trimmed)) {
      setError('هذا الاسم مستخدم')
      return
    }
    dispatch({ type: 'ADD_PLAYER', name: trimmed })
    setName('')
    setError(null)
  }

  function handleCategory(cat: Category) {
    dispatch({ type: 'SELECT_CATEGORY', category: cat })
  }

  function handleRandomCategory() {
    dispatch({ type: 'SELECT_CATEGORY', category: pickRandomCategory() })
  }

  const selected = state.category
  const canStart = state.players.length >= MIN_PLAYERS && !!selected

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto p-6" dir="rtl">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-white">ارسم كلمة</h1>
        <p className="mt-1 text-slate-400">لعبة رفيق المكتب — اهرب من المحتال</p>
      </header>

      {/* Fast start: quick player-count stepper with default names */}
      <section className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">عدد اللاعبين</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuickCount(state.players.length + 1)}
              disabled={state.players.length >= MAX_PLAYERS}
              className="h-9 w-9 rounded-xl bg-fuchsia-500 text-lg font-bold text-white transition hover:bg-fuchsia-400 disabled:opacity-40"
              aria-label="زيادة عدد اللاعبين"
            >
              ＋
            </button>
            <span className="min-w-[3ch] text-center text-2xl font-bold text-white">
              {state.players.length}
            </span>
            <button
              type="button"
              onClick={() => setQuickCount(state.players.length - 1)}
              disabled={state.players.length <= MIN_PLAYERS}
              className="h-9 w-9 rounded-xl border border-slate-600 text-lg font-bold text-slate-300 transition hover:border-slate-500 disabled:opacity-40"
              aria-label="إنقاص عدد اللاعبين"
            >
              −
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          اللاعبون يتضافو بأسماء افتراضية تلقائياً (لاعب 1، لاعب 2...)
        </p>
      </section>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم اللاعب"
          className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-white outline-none focus:border-fuchsia-400"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-fuchsia-500 px-4 py-2 font-semibold text-white transition hover:bg-fuchsia-400"
        >
          إضافة
        </button>
      </form>
      {error && <p className="-mt-3 text-sm text-red-400">{error}</p>}

      {state.players.length > 0 && (
        <ul className="flex flex-col gap-2">
          {state.players.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2"
            >
              <span className="flex items-center gap-2 text-white">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                {i + 1}. {p.name}
              </span>
              <button
                onClick={() => dispatch({ type: 'REMOVE_PLAYER', id: p.id })}
                className="text-slate-400 transition hover:text-red-400"
                aria-label={`حذف ${p.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <h2 className="mb-2 text-lg font-semibold text-white">اختر الفئة</h2>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategory(cat)}
              className={`rounded-xl border px-3 py-3 text-right transition ${
                selected?.id === cat.id
                  ? 'border-fuchsia-400 bg-fuchsia-500/20 text-white'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
              }`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="mt-1 block text-sm font-medium">{cat.title}</span>
            </button>
          ))}
          <button
            onClick={handleRandomCategory}
            className="rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-3 text-center text-slate-300 transition hover:border-fuchsia-400"
          >
            <span className="text-2xl">🎲</span>
            <span className="mt-1 block text-sm font-medium">فئة عشوائية</span>
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {state.category ? `الكلمات: ${state.category.words.length}` : 'لم تختر فئة بعد'}
        </p>
      </div>

      <button
        onClick={() => dispatch({ type: 'START_GAME' })}
        disabled={!canStart}
        className="w-full rounded-xl bg-fuchsia-500 py-3 text-lg font-bold text-white transition enabled:hover:bg-fuchsia-400 disabled:opacity-40"
      >
        ابدأ اللعبة ({state.players.length})
      </button>
    </div>
  )
}
