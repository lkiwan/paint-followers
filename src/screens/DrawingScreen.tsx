import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'
import { Canvas } from '../components/Canvas'
import type { Point, Stroke } from '../types'

const TIMER_SECONDS = 60

export default function DrawingScreen() {
  const { state, dispatch } = useGame()

  const currentDrawerId = state.drawOrder[state.drawIndex]
  const currentDrawer = state.players.find((p) => p.id === currentDrawerId)
  const isImposter = currentDrawerId === state.imposterId

  const [wordVisible, setWordVisible] = useState(false)
  const [brushSize, setBrushSize] = useState(5)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const allDrawn = state.players.every((p) => state.drawnPlayerIds.includes(p.id))

  // Reset per drawer
  useEffect(() => {
    setWordVisible(false)
    setTimeLeft(TIMER_SECONDS)
    clearInterval(intervalRef.current!)
    intervalRef.current = setInterval(
      () => setTimeLeft((t) => Math.max(0, t - 1)),
      1000,
    )
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
  }

  const handleDone = () => dispatch({ type: 'NEXT_DRAWER' })
  const handleVote = () => dispatch({ type: 'GO_TO_VOTING' })

  const timeLow = timeLeft <= 10
  const timerText = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`

  // Word reveal card content
  const wordContent = isImposter
    ? { label: '🕵️ أنت المحتال!', sub: 'ارسم أي شيء يجي برأسك' }
    : { label: state.secretWord ?? '', sub: `${state.category?.emoji} ${state.category?.title}` }

  return (
    <>
      <style>{`
        .dr-root {
          --paper:#F6EFE2; --card:#FFF9EC;
          --ink:#2A2118; --ink15:rgba(42,33,24,.15); --ink50:rgba(42,33,24,.5);
          --terra:#C8412B; --terra2:#E85C2A; --saffron:#F2B23D;
          --tea:#1F7A6B; --mint:#3FBA9A; --dim:#8A7A63;
          --shadow:0 4px 0 var(--ink); --shadow-sm:0 3px 0 var(--ink);
          background:var(--paper);
          height:100dvh; overflow:hidden;
          display:flex; flex-direction:column;
          font-family:'Cairo',system-ui,sans-serif;
          color:var(--ink);
          -webkit-user-select:none; user-select:none;
        }
        .dr-root *{box-sizing:border-box}

        @keyframes drPulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes drPop{0%{opacity:0;transform:scale(.82) rotate(-2deg)}70%{transform:scale(1.04)}100%{opacity:1;transform:none}}
        @keyframes drFade{from{opacity:0}to{opacity:1}}

        /* ── HEADER ── */
        .dr-header {
          flex-shrink:0;
          display:flex; align-items:center; gap:10px;
          padding:12px 16px 8px;
          border-bottom:2.5px solid var(--ink15);
        }
        .dr-player-chip {
          display:flex; align-items:center; gap:7px;
          background:var(--card); border:3px solid var(--ink);
          border-radius:99px; padding:5px 14px 5px 8px;
          box-shadow:var(--shadow-sm); flex-shrink:0;
        }
        .dr-dot {width:12px;height:12px;border-radius:50%;border:2px solid var(--ink);flex-shrink:0}
        .dr-pname {font-size:15px;font-weight:800}
        .dr-badge {
          font-size:11px;font-weight:900;letter-spacing:.3px;
          padding:3px 10px;border-radius:99px;
          border:2.5px solid var(--ink);box-shadow:0 2px 0 var(--ink);flex-shrink:0;
        }
        .dr-badge.imp{background:#FFD9C7;color:var(--terra)}
        .dr-badge.ok{background:#D8F0E4;color:var(--tea)}
        .dr-spacer{flex:1}
        .dr-timer {
          font-family:'Lalezar','Cairo',sans-serif;
          font-size:22px; color:var(--ink); flex-shrink:0;
        }
        .dr-timer.low{color:var(--terra);animation:drPulse 1s ease-in-out infinite}

        /* ── BODY ── */
        .dr-body {
          flex:1; min-height:0;
          display:flex; flex-direction:column;
          padding:10px 12px 12px;
          gap:10px;
        }
        /* Desktop: side by side */
        @media(min-width:768px){
          .dr-body{flex-direction:row; padding:16px 20px; gap:16px}
        }

        /* ── CANVAS COLUMN ── */
        .dr-canvas-col {
          flex:1; min-height:0;
          display:flex; flex-direction:column;
          gap:8px;
        }
        @media(min-width:768px){
          .dr-canvas-col{flex:2}
        }
        .dr-canvas-wrap {
          flex:1; min-height:200px;
        }

        /* Player drawn-dots strip below canvas */
        .dr-drawn-row {
          display:flex; align-items:center; gap:6px; flex-wrap:wrap;
          flex-shrink:0;
        }
        .dr-drawn-label{font-size:11px;font-weight:800;color:var(--dim)}
        .dr-drawn-chip {
          display:flex;align-items:center;gap:4px;
          font-size:11px;font-weight:800;
          padding:3px 8px;border-radius:99px;
          border:2px solid var(--ink);
          background:var(--card);
          box-shadow:0 2px 0 var(--ink);
          transition:background .2s;
        }
        .dr-drawn-chip.done{background:var(--saffron)}
        .dr-drawn-chip .dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}

        /* ── CONTROLS COLUMN ── */
        .dr-ctrl-col {
          flex-shrink:0;
          display:flex; flex-direction:column;
          gap:10px;
        }
        @media(min-width:768px){
          .dr-ctrl-col{width:280px}
        }

        /* ── WORD REVEAL BUTTON ── */
        .dr-word-btn {
          width:100%; text-align:center;
          background:var(--card); border:3px solid var(--ink);
          border-radius:14px; padding:14px 12px;
          box-shadow:var(--shadow-sm);
          cursor:pointer; font-family:inherit;
          touch-action:none;
          transition:border-color .15s, background .15s;
          position:relative; overflow:hidden;
        }
        .dr-word-btn.revealed{
          border-color:var(--terra);
          background:linear-height(180deg,#FFF1DC,#FFF1DC);
          background:#FFF1DC;
        }
        .dr-word-btn.revealed.imp-reveal{ border-color:var(--terra); background:#FFE8E3}
        .dr-word-hint{font-size:13px;font-weight:800;color:var(--dim);margin-bottom:4px}
        .dr-word-val{
          font-family:'Lalezar','Cairo',sans-serif;
          font-size:clamp(24px,6vw,34px);
          color:var(--terra);
          animation:drPop .3s cubic-bezier(.34,1.56,.64,1) both;
        }
        .dr-word-val.imp-word{font-size:18px;font-family:'Cairo',sans-serif;font-weight:900}
        .dr-word-sub{font-size:13px;font-weight:700;color:var(--dim);margin-top:4px}
        .dr-word-placeholder{
          font-size:15px;font-weight:800;color:var(--dim);
          display:flex;align-items:center;justify-content:center;gap:6px;
        }

        /* ── BRUSH PICKER ── */
        .dr-brush-row{
          display:flex; align-items:center; gap:6px; flex-wrap:wrap;
        }
        .dr-brush-label{font-size:12px;font-weight:800;color:var(--dim);flex-shrink:0}
        .dr-brush-btn{
          padding:5px 10px; border-radius:99px;
          border:2.5px solid var(--ink); background:var(--card);
          font-size:12px; font-weight:800; cursor:pointer;
          box-shadow:0 2px 0 var(--ink);
          transition:transform .1s;
          font-family:inherit;
        }
        .dr-brush-btn:active{transform:translateY(1px)}
        .dr-brush-btn.on{background:var(--ink);color:var(--paper)}

        /* ── PROGRESS BAR ── */
        .dr-prog{height:7px;border-radius:4px;background:var(--ink15);border:2px solid var(--ink);overflow:hidden}
        .dr-prog-fill{
          height:100%;border-radius:2px;
          background:repeating-linear-gradient(-45deg,var(--saffron) 0 8px,var(--terra) 8px 16px);
          transition:width .35s;
        }

        /* ── ROUND INFO ── */
        .dr-info-card {
          background:var(--card); border:3px solid var(--ink);
          border-radius:12px; padding:10px 14px;
          box-shadow:var(--shadow-sm);
          font-size:13px; font-weight:800; color:var(--dim);
          display:flex; align-items:center; justify-content:space-between;
          gap:6px;
        }
        .dr-round-num{
          font-family:'Lalezar','Cairo',sans-serif;
          font-size:18px;color:var(--terra);
        }

        /* ── BUTTONS ── */
        .dr-btn-done{
          width:100%;
          font-family:'Lalezar','Cairo',sans-serif; font-size:21px;
          background:linear-gradient(135deg,var(--tea),var(--mint));
          color:var(--paper); border:3px solid var(--ink); border-radius:14px;
          padding:14px; cursor:pointer; box-shadow:var(--shadow);
          transition:transform .12s, box-shadow .12s;
          font-family:'Lalezar','Cairo',sans-serif;
        }
        .dr-btn-done:hover{transform:translateY(-2px)}
        .dr-btn-done:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}

        .dr-btn-vote{
          width:100%;
          font-family:'Lalezar','Cairo',sans-serif; font-size:21px;
          background:linear-gradient(135deg,var(--terra) 0%,var(--terra2) 55%,var(--saffron) 140%);
          color:var(--paper); border:3px solid var(--ink); border-radius:14px;
          padding:14px; cursor:pointer; box-shadow:var(--shadow);
          transition:transform .12s, box-shadow .12s;
          animation:drPop .5s cubic-bezier(.34,1.56,.64,1) both;
        }
        .dr-btn-vote:hover{transform:translateY(-2px)}
        .dr-btn-vote:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}
        .dr-vote-hint{
          font-size:12px;font-weight:800;color:var(--dim);
          text-align:center;
        }

        .dr-btn-vote-ghost{
          width:100%;
          font-size:14px;font-weight:800;color:var(--dim);
          background:none;border:0;cursor:pointer;padding:6px;
          font-family:inherit;
        }
        .dr-btn-vote-ghost:hover{color:var(--terra)}

        @media(prefers-reduced-motion:reduce){.dr-root *{animation:none!important;transition:none!important}}
      `}</style>

      <div className="dr-root" dir="rtl">

        {/* ── HEADER ── */}
        <div className="dr-header">
          <div className="dr-player-chip">
            <span className="dr-dot" style={{ backgroundColor: currentDrawer.color }} />
            <span className="dr-pname">{currentDrawer.name}</span>
          </div>
          <span className={`dr-badge ${isImposter ? 'imp' : 'ok'}`}>
            {isImposter ? '🕵️ محتال' : '🎨 يرسم'}
          </span>
          <span className="dr-spacer" />
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--dim)' }}>
            الجولة {state.roundNumber}
          </span>
          <span className={`dr-timer ${timeLow ? 'low' : ''}`}>{timerText}</span>
        </div>

        {/* ── BODY ── */}
        <div className="dr-body">

          {/* ── LEFT / TOP: CANVAS ── */}
          <div className="dr-canvas-col">
            <div className="dr-canvas-wrap">
              <Canvas
                key={`round-${state.roundNumber}`}
                strokes={state.strokes}
                activeColor={currentDrawer.color}
                brushSize={brushSize}
                onStrokeComplete={handleStrokeComplete}
                drawerId={currentDrawerId}
              />
            </div>

            {/* Drawn indicators */}
            <div className="dr-drawn-row">
              <span className="dr-drawn-label">رسم:</span>
              {state.players.map((p) => {
                const hasDone = state.drawnPlayerIds.includes(p.id)
                return (
                  <span key={p.id} className={`dr-drawn-chip ${hasDone ? 'done' : ''}`}>
                    <span className="dot" style={{ backgroundColor: p.color, border: '1.5px solid #2A2118' }} />
                    {p.name}
                    {hasDone ? ' ✅' : ''}
                  </span>
                )
              })}
            </div>
          </div>

          {/* ── RIGHT / BOTTOM: CONTROLS ── */}
          <div className="dr-ctrl-col">

            {/* Progress bar */}
            <div>
              <div className="dr-prog">
                <div
                  className="dr-prog-fill"
                  style={{
                    width: `${(state.drawnPlayerIds.length / state.players.length) * 100}%`,
                  }}
                />
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--dim)', textAlign: 'center', marginTop: 4 }}>
                {state.drawnPlayerIds.length} / {state.players.length} رسمو
              </div>
            </div>

            {/* Word reveal (hold to see) */}
            <button
              className={`dr-word-btn ${wordVisible ? (isImposter ? 'revealed imp-reveal' : 'revealed') : ''}`}
              onPointerDown={() => setWordVisible(true)}
              onPointerUp={() => setWordVisible(false)}
              onPointerCancel={() => setWordVisible(false)}
              onPointerLeave={() => setWordVisible(false)}
              aria-label="اضغط باستمرار لكشف كلمتك"
            >
              {wordVisible ? (
                <>
                  <div className="dr-word-hint">كلمتك هي:</div>
                  <div className={`dr-word-val ${isImposter ? 'imp-word' : ''}`}>
                    {wordContent.label}
                  </div>
                  <div className="dr-word-sub">{wordContent.sub}</div>
                </>
              ) : (
                <div className="dr-word-placeholder">
                  <span>👁️</span>
                  <span>اضغط لكشف كلمتك</span>
                </div>
              )}
            </button>

            {/* Brush picker */}
            <div className="dr-brush-row">
              <span className="dr-brush-label">🖌️</span>
              {([3, 5, 10, 18] as const).map((s) => (
                <button
                  key={s}
                  className={`dr-brush-btn ${brushSize === s ? 'on' : ''}`}
                  onClick={() => setBrushSize(s)}
                >
                  {s === 3 ? 'رفيع' : s === 5 ? 'عادي' : s === 10 ? 'سميك' : 'عريض'}
                </button>
              ))}
            </div>

            {/* Done button */}
            <button className="dr-btn-done" onClick={handleDone}>
              ✅ خلصت — التالي
            </button>

            {/* Vote button — only when everyone drew at least once */}
            {allDrawn ? (
              <>
                <button className="dr-btn-vote" onClick={handleVote}>
                  🗳️ يلا نصوتو!
                </button>
                <div className="dr-vote-hint">الكل رسم — يمكنو يكملو أو يصوتو</div>
              </>
            ) : (
              <button className="dr-btn-vote-ghost" onClick={handleVote}>
                تخطى للتصويت ←
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}