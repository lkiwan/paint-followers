import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'
import { Canvas } from '../components/Canvas'
import type { Point, Stroke } from '../types'

const TIMER_SECONDS = 60

/**
 * DrawingScreen — unlimited strokes per player.
 *
 * Flow:
 * 1. Current drawer draws as many strokes as they like on the shared canvas.
 * 2. "Done / Finish" button → passes to the next player.
 * 3. At any point, the host can tap "Vote Now" to skip straight to voting.
 * 4. Timer is cosmetic / advisory only (no auto-advance).
 *
 * The canvas accumulates ALL strokes from all drawers — everyone can see
 * the collective painting build up over time.
 */
export default function DrawingScreen() {
  const { state, dispatch } = useGame()

  const currentDrawerId = state.drawOrder[state.drawIndex]
  const currentDrawer = state.players.find((p) => p.id === currentDrawerId)
  const isImposter = currentDrawerId === state.imposterId
  const isLastDrawer = state.drawIndex === state.drawOrder.length - 1

  // Timer — advisory only, no auto-advance
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showPassOverlay, setShowPassOverlay] = useState(false)
  const [brushSize, setBrushSize] = useState(5)
  const [hasDrawn, setHasDrawn] = useState(false) // track if current player drew anything

  // Reset timer and overlay when the drawer changes
  useEffect(() => {
    setTimeLeft(TIMER_SECONDS)
    setShowPassOverlay(false)
    setHasDrawn(false)
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [currentDrawerId])

  if (!currentDrawer) return null

  const handleStrokeComplete = (points: Point[]) => {
    const stroke: Stroke = {
      playerId: currentDrawerId,
      color: currentDrawer.color,
      points,
      width: brushSize,
    }
    dispatch({ type: 'COMMIT_STROKE', stroke })
    setHasDrawn(true)
  }

  const handleDone = () => {
    clearInterval(intervalRef.current!)
    setShowPassOverlay(true)
  }

  const handleAdvance = () => {
    setShowPassOverlay(false)
    if (isLastDrawer) {
      dispatch({ type: 'GO_TO_VOTING' })
    } else {
      dispatch({ type: 'NEXT_DRAWER' })
    }
  }

  const handleVoteNow = () => {
    clearInterval(intervalRef.current!)
    dispatch({ type: 'GO_TO_VOTING' })
  }

  const timeLow = timeLeft <= 10
  const timerText = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`

  return (
    <>
      <style>{`
        .dr-root {
          --paper:#F6EFE2; --card:#FFF9EC; --ink:#2A2118;
          --ink15:rgba(42,33,24,.15); --ink50:rgba(42,33,24,.55);
          --terra:#C8412B; --terra2:#E85C2A; --saffron:#F2B23D;
          --tea:#1F7A6B; --dim:#8A7A63;
          --shadow:0 4px 0 var(--ink); --shadow-sm:0 3px 0 var(--ink);
          background:var(--paper);
          height:100dvh;
          display:flex;flex-direction:column;
          padding:14px 16px calc(16px + env(safe-area-inset-bottom));
          gap:10px;
          font-family:'Cairo',system-ui,sans-serif;
          color:var(--ink);
          -webkit-user-select:none;user-select:none;
          position:relative;
          overflow:hidden;
        }
        .dr-root *{box-sizing:border-box}

        @keyframes drPulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes drFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes drSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}

        /* ── TOP BAR ── */
        .dr-topbar{display:flex;align-items:center;gap:8px;flex-wrap:nowrap}
        .dr-player-chip{
          display:flex;align-items:center;gap:7px;
          background:var(--card);border:3px solid var(--ink);
          border-radius:99px;padding:6px 14px 6px 8px;
          box-shadow:var(--shadow-sm);flex-shrink:0;
        }
        .dr-color-dot{width:13px;height:13px;border-radius:50%;border:2px solid var(--ink);flex-shrink:0}
        .dr-player-name{font-size:15px;font-weight:800;white-space:nowrap}
        .dr-role-badge{
          font-size:11px;font-weight:900;letter-spacing:.3px;white-space:nowrap;
          padding:4px 10px;border-radius:99px;
          border:2.5px solid var(--ink);box-shadow:0 2px 0 var(--ink);flex-shrink:0;
        }
        .dr-role-badge.imposter{background:#FFD9C7;color:var(--terra)}
        .dr-role-badge.safe{background:#D8F0E4;color:var(--tea)}
        .dr-spacer{flex:1}
        .dr-timer{
          font-family:'Lalezar','Cairo',sans-serif;
          font-size:22px;font-weight:400;
          color:var(--ink);letter-spacing:.5px;flex-shrink:0;
        }
        .dr-timer.low{color:var(--terra);animation:drPulse 1s ease-in-out infinite}

        /* ── WORD BAR ── */
        .dr-word-bar{
          background:var(--card);border:3px solid var(--ink);
          border-radius:12px;padding:9px 14px;
          box-shadow:var(--shadow-sm);
          display:flex;align-items:center;gap:8px;
          flex-shrink:0;
        }
        .dr-word-label{font-size:12px;font-weight:800;color:var(--dim);white-space:nowrap}
        .dr-word-text{
          font-family:'Lalezar','Cairo',sans-serif;
          font-size:20px;color:var(--terra);flex:1;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        }
        .dr-word-text.imposter-text{color:var(--dim);font-family:'Cairo',sans-serif;font-size:14px;font-weight:800}
        .dr-cat-emoji{font-size:18px;flex-shrink:0}

        /* ── PROGRESS ── */
        .dr-prog{
          height:7px;border-radius:4px;background:var(--ink15);
          border:2px solid var(--ink);overflow:hidden;flex-shrink:0;
        }
        .dr-prog-fill{
          height:100%;border-radius:2px;
          background:repeating-linear-gradient(-45deg,var(--saffron) 0 8px,var(--terra) 8px 16px);
          transition:width .35s;
        }

        /* ── CANVAS ── */
        .dr-canvas-wrap{flex:1;min-height:0;display:flex;flex-direction:column}

        /* ── BRUSH PICKER ── */
        .dr-brush-row{
          display:flex;align-items:center;gap:8px;flex-shrink:0;
        }
        .dr-brush-label{font-size:12px;font-weight:800;color:var(--dim)}
        .dr-brush-btn{
          padding:5px 10px;border-radius:99px;
          border:2.5px solid var(--ink);background:var(--card);
          font-size:12px;font-weight:800;cursor:pointer;
          box-shadow:0 2px 0 var(--ink);
          transition:transform .1s,box-shadow .1s;
        }
        .dr-brush-btn:active{transform:translateY(1px);box-shadow:0 1px 0 var(--ink)}
        .dr-brush-btn.active{background:var(--terra);color:var(--card);border-color:var(--terra)}

        /* ── BOTTOM ACTIONS ── */
        .dr-actions{display:flex;gap:8px;flex-shrink:0}
        .dr-btn-done{
          flex:2;
          font-family:'Lalezar','Cairo',sans-serif;font-size:20px;
          background:linear-gradient(135deg,var(--tea),var(--mint));
          color:var(--paper);border:3px solid var(--ink);border-radius:14px;
          padding:13px 16px;cursor:pointer;box-shadow:var(--shadow);
          transition:transform .12s,box-shadow .12s;
        }
        .dr-btn-done:hover{transform:translateY(-2px)}
        .dr-btn-done:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}
        .dr-btn-vote{
          flex:1;
          font-family:'Cairo',sans-serif;font-size:13px;font-weight:900;
          background:var(--card);border:3px solid var(--ink);border-radius:14px;
          padding:13px 10px;cursor:pointer;box-shadow:var(--shadow-sm);
          color:var(--terra);
          transition:transform .12s,box-shadow .12s;
          white-space:nowrap;
        }
        .dr-btn-vote:hover{transform:translateY(-2px)}
        .dr-btn-vote:active{transform:translateY(1px);box-shadow:0 1px 0 var(--ink)}

        /* ── PASS OVERLAY ── */
        .dr-overlay{
          position:absolute;inset:0;
          background:rgba(246,239,226,.97);
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          gap:18px;padding:32px;
          animation:drFadeIn .22s ease both;
          z-index:20;
        }
        .dr-overlay-icon{font-size:60px;animation:drSlideUp .35s both}
        .dr-overlay-title{
          font-family:'Lalezar','Cairo',sans-serif;
          font-size:clamp(26px,7vw,36px);
          text-align:center;color:var(--ink);
          animation:drSlideUp .35s .08s both;
        }
        .dr-overlay-sub{font-size:15px;font-weight:800;color:var(--dim);text-align:center;animation:drSlideUp .35s .14s both}
        .dr-overlay-btn{
          width:100%;
          font-family:'Lalezar','Cairo',sans-serif;font-size:22px;
          background:linear-gradient(135deg,var(--terra) 0%,var(--terra2) 55%,var(--saffron) 140%);
          color:var(--paper);border:3px solid var(--ink);border-radius:16px;
          padding:16px;cursor:pointer;box-shadow:var(--shadow);
          transition:transform .12s,box-shadow .12s;
          animation:drSlideUp .35s .18s both;
        }
        .dr-overlay-btn:hover{transform:translateY(-2px)}
        .dr-overlay-btn:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}
        .dr-overlay-back{
          font-size:14px;font-weight:800;color:var(--dim);
          background:none;border:0;cursor:pointer;padding:4px;
          animation:drSlideUp .35s .22s both;
        }
        .dr-overlay-back:hover{color:var(--terra)}

        @media(prefers-reduced-motion:reduce){.dr-root *{animation:none!important;transition:none!important}}
      `}</style>

      <div className="dr-root" dir="rtl">

        {/* ── TOP BAR ── */}
        <div className="dr-topbar">
          <div className="dr-player-chip">
            <span className="dr-color-dot" style={{ backgroundColor: currentDrawer.color }} />
            <span className="dr-player-name">{currentDrawer.name}</span>
          </div>
          <span className={`dr-role-badge ${isImposter ? 'imposter' : 'safe'}`}>
            {isImposter ? '🕵️ المحتال' : '🎨 يرسم'}
          </span>
          <span className="dr-spacer" />
          <span className={`dr-timer ${timeLow ? 'low' : ''}`}>{timerText}</span>
        </div>

        {/* ── WORD BAR ── */}
        <div className="dr-word-bar">
          <span className="dr-word-label">{isImposter ? 'وضعيتك:' : 'الكلمة:'}</span>
          <span className={`dr-word-text ${isImposter ? 'imposter-text' : ''}`}>
            {isImposter ? '🕵️ ارسم أي شيء يجي برأسك!' : state.secretWord}
          </span>
          <span className="dr-cat-emoji">{state.category?.emoji}</span>
        </div>

        {/* ── PLAYER PROGRESS ── */}
        <div className="dr-prog">
          <div
            className="dr-prog-fill"
            style={{ width: `${((state.drawIndex + 1) / state.drawOrder.length) * 100}%` }}
          />
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--dim)', textAlign: 'center', marginTop: -4 }}>
          {state.drawIndex + 1} من {state.drawOrder.length} لاعبين رسمو
        </div>

        {/* ── CANVAS ── */}
        <div className="dr-canvas-wrap">
          <Canvas
            key={`round-${state.roundNumber}`}  /* reset only on new round, not per drawer */
            strokes={state.strokes}
            activeColor={currentDrawer.color}   /* always active — no locking */
            brushSize={brushSize}
            onStrokeComplete={handleStrokeComplete}
            drawerId={currentDrawerId}
          />
        </div>

        {/* ── BRUSH SIZE PICKER ── */}
        <div className="dr-brush-row">
          <span className="dr-brush-label">🖌️ الحجم:</span>
          {[3, 5, 10, 18].map((s) => (
            <button
              key={s}
              className={`dr-brush-btn ${brushSize === s ? 'active' : ''}`}
              onClick={() => setBrushSize(s)}
              aria-label={`حجم القلم ${s}`}
            >
              {s === 3 ? 'رفيع' : s === 5 ? 'عادي' : s === 10 ? 'سميك' : 'عريض'}
            </button>
          ))}
        </div>

        {/* ── ACTIONS ── */}
        <div className="dr-actions">
          <button className="dr-btn-done" onClick={handleDone}>
            {isLastDrawer ? '✅ خلصت — صوتو!' : `✅ خلصت — التالي`}
          </button>
          <button className="dr-btn-vote" onClick={handleVoteNow} title="انتقل مباشرة للتصويت">
            🗳️ صوتو دابا
          </button>
        </div>

      </div>

      {/* ── PASS-DEVICE OVERLAY ── */}
      {showPassOverlay && (
        <div className="dr-overlay" dir="rtl">
          <div className="dr-overlay-icon">
            {hasDrawn ? '🎨' : '⏭️'}
          </div>
          <div className="dr-overlay-title">
            {hasDrawn ? `رسم ${currentDrawer.name}! ✅` : `${currentDrawer.name} قرر يتخطى`}
          </div>
          <div className="dr-overlay-sub">
            {isLastDrawer
              ? 'الكل رسم — وقت التصويت!'
              : `مرر الجهاز لـ ${state.players.find(p => p.id === state.drawOrder[state.drawIndex + 1])?.name ?? 'اللاعب التالي'}`}
          </div>
          <button className="dr-overlay-btn" onClick={handleAdvance}>
            {isLastDrawer ? '🗳️ يلا نصوتو' : '▶ التالي'}
          </button>
          <button className="dr-overlay-back" onClick={() => setShowPassOverlay(false)}>
            ← رجوع للرسم
          </button>
        </div>
      )}
    </>
  )
}