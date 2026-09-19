import { useEffect, useState, useRef, type FormEvent } from 'react'
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
  
  const carouselRef = useRef<HTMLDivElement>(null)

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

  const scrollLeft = () => {
    if (carouselRef.current) carouselRef.current.scrollBy({ left: -200, behavior: 'smooth' })
  }
  
  const scrollRight = () => {
    if (carouselRef.current) carouselRef.current.scrollBy({ left: 200, behavior: 'smooth' })
  }

  const selected = state.category
  const canStart = state.players.length >= MIN_PLAYERS && !!selected
  
  let hintText = ''
  if (!canStart) {
    if (state.players.length < MIN_PLAYERS) {
      hintText = 'زيد لاعبين'
    } else if (!selected) {
      hintText = 'اختار فئة أولاً'
    }
  }

  return (
    <>
      <div className="setup-container" dir="rtl">
        <header className="setup-header">
          <h1 className="setup-title">ارسم كلمة 🎨</h1>
          <p className="setup-subtitle">اللعبة المجنونة</p>
        </header>

        <section className="setup-section">
          <div className="section-header">
            <h2 className="section-title">اللاعبون</h2>
            <div className="stepper" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => setQuickCount(state.players.length - 1)}
                disabled={state.players.length <= MIN_PLAYERS}
              >
                ➖
              </button>
              <div className="stepper-val">{state.players.length}</div>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => setQuickCount(state.players.length + 1)}
                disabled={state.players.length >= MAX_PLAYERS}
              >
                ➕
              </button>
            </div>
          </div>
          
          <form onSubmit={handleAdd} className="add-player-form">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم اللاعب"
              className="add-player-input"
            />
            <button type="submit" className="add-player-btn">
              إضافة
            </button>
          </form>
          {error && <p className="error-msg">{error}</p>}
          
          <div className="player-chips">
            {state.players.map((p) => (
              <div key={p.id} className="player-chip">
                <div className="player-dot" style={{ backgroundColor: p.color }}></div>
                <span className="player-name">{p.name}</span>
                <button
                  type="button"
                  className="player-remove"
                  onClick={() => dispatch({ type: 'REMOVE_PLAYER', id: p.id })}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="setup-section" style={{ paddingRight: 0, paddingLeft: 0 }}>
          <h2 className="section-title" style={{ padding: '0 24px', marginBottom: '16px' }}>اختر الفئة 👇</h2>
          <div className="carousel-wrapper">
            <button className="carousel-btn carousel-btn-right" onClick={scrollRight}>▶</button>
            <div className="carousel-scroll" ref={carouselRef}>
              <div
                className="cat-card is-random"
                onClick={handleRandomCategory}
              >
                <div className="cat-emoji">🎲</div>
                <div className="cat-title">عشوائية</div>
                <div className="cat-count">جرب حظك</div>
              </div>
              
              {CATEGORIES.map((cat) => {
                const isSelected = selected?.id === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={`cat-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleCategory(cat)}
                  >
                    {isSelected && <div className="cat-check">✓</div>}
                    <div className="cat-emoji">{cat.emoji}</div>
                    <div className="cat-title">{cat.title}</div>
                    <div className="cat-count">{cat.words.length} كلمات</div>
                  </div>
                )
              })}
            </div>
            <button className="carousel-btn carousel-btn-left" onClick={scrollLeft}>◀</button>
          </div>
        </section>

        <section className="start-section">
          <button
            className="start-btn"
            disabled={!canStart}
            onClick={() => dispatch({ type: 'START_GAME' })}
          >
            🚀 ابدأ اللعبة ({state.players.length} لاعبين)
          </button>
          {hintText && <p className="start-hint">{hintText}</p>}
        </section>
      </div>

      <style>{`
        .setup-container {
          --paper: #F6EFE2;
          --paper2: #EDE2C9;
          --card: #FFF9EC;
          --ink: #2A2118;
          --ink15: rgba(42,33,24,.15);
          --ink50: rgba(42,33,24,.55);
          --terra: #C8412B;
          --terra2: #E85C2A;
          --saffron: #F2B23D;
          --tea: #1F7A6B;
          --mint: #3FBA9A;
          --dim: #8A7A63;
          --shadow: 0 4px 0 var(--ink);
          --shadow-sm: 0 3px 0 var(--ink);

          font-family: 'Cairo', sans-serif;
          background: var(--paper);
          color: var(--ink);
          max-width: 520px;
          margin: 0 auto;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          padding: 24px 0 calc(24px + env(safe-area-inset-bottom));
          overflow-y: auto;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        .setup-header {
          text-align: center;
          margin-bottom: 32px;
          padding: 0 24px;
          flex-shrink: 0;
        }
        .setup-title {
          font-family: 'Lalezar', cursive;
          font-size: 44px;
          line-height: 1.1;
          color: var(--ink);
          margin: 0 0 4px 0;
        }
        .setup-subtitle {
          font-size: 18px;
          font-weight: 700;
          color: var(--dim);
          margin: 0;
        }

        .setup-section {
          padding: 0 24px;
          margin-bottom: 32px;
        }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .section-title {
          font-family: 'Lalezar', cursive;
          font-size: 24px;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--ink);
        }
        .count-chip {
          background: var(--saffron);
          color: var(--ink);
          font-family: 'Cairo', sans-serif;
          font-weight: 800;
          font-size: 15px;
          padding: 2px 12px;
          border-radius: 100px;
          border: 2px solid var(--ink);
          box-shadow: 0 2px 0 var(--ink);
        }

        .stepper {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }
        .stepper-btn {
          width: 52px;
          height: 48px;
          border-radius: 12px;
          background: var(--card);
          border: 2.5px solid var(--ink);
          font-size: 20px;
          font-weight: 900;
          display: grid;
          place-items: center;
          cursor: pointer;
          color: var(--ink);
          box-shadow: 0 3px 0 var(--ink);
          transition: transform 0.1s, box-shadow 0.1s;
        }
        .stepper-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .stepper-btn:active:not(:disabled) {
          transform: translateY(1px);
          box-shadow: 0 1px 0 var(--ink);
        }
        .stepper-val {
          width: 82px;
          height: 48px;
          background: var(--card);
          border: 2.5px solid var(--ink);
          border-radius: 16px;
          font-size: 30px;
          font-weight: 900;
          color: var(--terra);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .add-player-form {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .add-player-input {
          flex: 1;
          background: var(--card);
          border: 3px solid var(--ink);
          border-radius: 12px;
          padding: 10px 16px;
          font-family: 'Cairo', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--ink);
          outline: none;
          box-shadow: inset 0 2px 0 rgba(0,0,0,0.02);
        }
        .add-player-input:focus {
          border-color: var(--terra);
        }
        .add-player-btn {
          background: var(--saffron);
          border: 3px solid var(--ink);
          border-radius: 12px;
          padding: 0 20px;
          font-family: 'Cairo', sans-serif;
          font-weight: 800;
          font-size: 16px;
          color: var(--ink);
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: transform 0.1s, box-shadow 0.1s;
        }
        .add-player-btn:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 var(--ink);
        }
        .error-msg {
          color: var(--terra);
          font-size: 14px;
          font-weight: 700;
          margin: -8px 0 12px 0;
        }

        .player-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .player-chip {
          display: flex;
          align-items: center;
          background: var(--card);
          border: 2px solid var(--ink);
          border-radius: 100px;
          padding: 6px 12px 6px 6px;
          gap: 8px;
          box-shadow: 0 3px 0 var(--ink);
        }
        .player-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid var(--ink);
        }
        .player-name {
          font-weight: 800;
          font-size: 15px;
          padding-bottom: 2px;
        }
        .player-remove {
          background: none;
          border: none;
          color: var(--ink50);
          font-size: 18px;
          cursor: pointer;
          padding: 0 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .player-remove:hover {
          color: var(--terra);
        }

        .carousel-wrapper {
          position: relative;
        }
        .carousel-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 8px 16px 16px 16px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          scroll-behavior: smooth;
          scroll-snap-type: x mandatory;
        }
        .carousel-scroll::-webkit-scrollbar {
          display: none;
        }
        .carousel-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          background: var(--card);
          border: 3px solid var(--ink);
          border-radius: 50%;
          z-index: 2;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          display: none;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: var(--ink);
          margin-top: -4px;
        }
        @media (pointer: fine) {
          .carousel-btn {
            display: flex;
          }
        }
        .carousel-btn-right { right: 8px; }
        .carousel-btn-left { left: 8px; }

        .cat-card {
          flex: 0 0 calc((100vw - 32px - 20px) / 3.5);
          max-width: 110px;
          background: var(--card);
          border: 2.5px solid var(--ink);
          border-radius: 16px;
          padding: 20px 8px 12px;
          color: var(--ink);
          text-align: center;
          box-shadow: 0 3px 0 var(--ink);
          cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s, background 0.15s;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          line-height: 1.3;
          position: relative;
          user-select: none;
          scroll-snap-align: start;
        }
        .cat-card:hover {
          transform: translateY(-2px);
        }
        .cat-card:active {
          transform: translateY(1px);
          box-shadow: 0 1px 0 var(--ink);
        }
        .cat-card.is-selected {
          border-color: var(--terra);
          background: #FFF1DC;
          box-shadow: 3px 3px 0 var(--terra);
        }
        .cat-card.is-random {
          background: var(--paper2);
        }

        .cat-emoji {
          font-size: 36px;
          line-height: 1;
        }
        .cat-title {
          font-family: 'Cairo', sans-serif;
          font-weight: 800;
          font-size: 15px;
          line-height: 1.2;
          color: var(--ink);
        }
        .cat-count {
          font-size: 13px;
          color: var(--dim);
          font-weight: 700;
        }
        .cat-card.is-selected .cat-count {
          color: var(--ink50);
        }
        .cat-check {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 26px;
          height: 26px;
          background: var(--terra);
          color: #fff;
          border: 2px solid var(--ink);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
        }

        .start-section {
          padding: 0 24px;
          margin-top: auto;
        }
        .start-btn {
          width: 100%;
          background: linear-gradient(90deg, var(--terra) 0%, var(--saffron) 100%);
          border: 3px solid var(--ink);
          border-radius: 16px;
          padding: 18px;
          font-family: 'Lalezar', cursive;
          font-size: 24px;
          color: var(--card);
          box-shadow: 0 6px 0 var(--ink);
          cursor: pointer;
          text-shadow: 0 2px 0 var(--ink50);
          transition: transform 0.1s, box-shadow 0.1s;
        }
        .start-btn:active:not(:disabled) {
          transform: translateY(4px);
          box-shadow: 0 2px 0 var(--ink);
        }
        .start-btn:disabled {
          background: var(--paper2);
          box-shadow: 0 4px 0 var(--ink15);
          border-color: var(--ink50);
          color: var(--ink50);
          cursor: not-allowed;
          text-shadow: none;
        }
        .start-hint {
          text-align: center;
          font-weight: 800;
          color: var(--terra);
          margin-top: 16px;
          font-size: 15px;
        }
      `}</style>
    </>
  )
}
