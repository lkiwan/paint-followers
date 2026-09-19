import { useCallback, useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'

/**
 * RoleReveal — hold-to-reveal mechanic.
 * Each player privately holds the screen to see their role and secret word.
 * Releasing the finger immediately hides the secret.
 * Inspired by bara-salfa-bdarija's hold mechanic.
 */
export default function RoleRevealScreen() {
  const { state, dispatch } = useGame()

  const currentPlayerId = state.revealOrder[state.revealIndex]
  const currentPlayer = state.players.find((p) => p.id === currentPlayerId)
  const isImposter = currentPlayerId === state.imposterId
  const isLast = state.revealIndex === state.revealOrder.length - 1

  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0) // 0–100
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const HOLD_DURATION = 600 // ms to fully reveal

  const startHold = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setHolding(true)
    setProgress(0)
    startRef.current = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startRef.current
      const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100)
      setProgress(pct)
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const stopHold = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setHolding(false)
    setProgress(0)
  }, [])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  if (!currentPlayer) return null

  const revealed = holding && progress >= 100

  return (
    <>
      <style>{`
        .rr-root {
          --paper:#F6EFE2; --card:#FFF9EC; --ink:#2A2118;
          --ink50:rgba(42,33,24,.55); --ink15:rgba(42,33,24,.15);
          --terra:#C8412B; --terra2:#E85C2A; --saffron:#F2B23D;
          --tea:#1F7A6B; --mint:#3FBA9A; --dim:#8A7A63;
          --shadow:0 4px 0 var(--ink); --shadow-sm:0 3px 0 var(--ink);
          background:var(--paper);
          min-height:100dvh;
          display:flex;flex-direction:column;align-items:center;
          justify-content:center;
          padding:26px 22px;
          gap:20px;
          font-family:'Cairo',system-ui,sans-serif;
          color:var(--ink);
          -webkit-user-select:none;user-select:none;
        }
        .rr-root *{box-sizing:border-box}

        @keyframes rrPop{0%{opacity:0;transform:scale(.82) rotate(-2deg)}65%{transform:scale(1.04) rotate(.4deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
        @keyframes rrFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes rrPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}

        .rr-header{text-align:center;animation:rrFadeUp .4s both}
        .rr-round{font-size:12px;font-weight:900;letter-spacing:.5px;color:var(--dim);text-transform:uppercase;margin-bottom:4px}
        .rr-name{font-family:'Lalezar','Cairo',sans-serif;font-size:clamp(30px,9vw,42px);color:var(--ink);line-height:1}

        /* progress bar */
        .rr-prog{width:100%;height:8px;border-radius:4px;background:var(--ink15);border:2px solid var(--ink);overflow:hidden;margin-top:6px}
        .rr-prog-fill{height:100%;border-radius:2px;
          background:repeating-linear-gradient(-45deg,var(--terra) 0 10px,var(--terra2) 10px 20px);
          transition:width .05s linear;}

        /* hold card */
        .rr-hold{
          position:relative;width:100%;min-height:300px;
          border-radius:24px;border:3px dashed var(--ink50);
          background:var(--card);
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          gap:14px;text-align:center;padding:28px;
          touch-action:none;
          transition:border-color .25s,background .25s,box-shadow .25s;
          box-shadow:var(--shadow-sm);
          animation:rrFadeUp .4s .1s both;
          cursor:pointer;
        }
        .rr-hold.live{border-style:solid;border-color:var(--terra);background:#FFF1DC;box-shadow:var(--shadow)}
        .rr-hold.live.imposter{border-color:var(--terra);background:#FFE8E3}
        .rr-hold.live.safe{border-color:var(--tea);background:#E8F5F2}

        .rr-veil{display:flex;flex-direction:column;align-items:center;gap:12px}
        .rr-veil-icon{font-size:48px;animation:rrPulse 1.8s ease-in-out infinite}
        .rr-veil-hint{font-size:15px;font-weight:800;color:var(--dim)}

        /* ring */
        .rr-ring{
          width:90px;height:90px;border-radius:50%;
          background:conic-gradient(var(--saffron) calc(var(--p,0)*1%),var(--ink15) 0);
          display:grid;place-items:center;
          border:3px solid var(--ink);
        }
        .rr-ring-inner{
          width:66px;height:66px;border-radius:50%;
          background:var(--paper);
          display:grid;place-items:center;
          font-size:28px;border:2px solid var(--ink);
        }

        /* secret */
        .rr-secret{display:none}
        .live .rr-secret{display:flex;flex-direction:column;align-items:center;gap:10px;animation:rrPop .35s cubic-bezier(.34,1.56,.64,1)}
        .live .rr-veil{display:none}

        .rr-badge{
          font-size:13px;font-weight:900;letter-spacing:1px;
          padding:6px 18px;border-radius:10px;margin-bottom:4px;
          display:inline-block;
          border:2.5px solid var(--ink);box-shadow:var(--shadow-sm);
          transform:rotate(-2deg);
        }
        .rr-badge.imposter{background:#FFD9C7;color:var(--terra)}
        .rr-badge.safe{background:#D8F0E4;color:var(--tea)}

        .rr-word{
          font-family:'Lalezar','Cairo',sans-serif;
          font-size:clamp(38px,11vw,54px);
          margin:6px 0 8px;line-height:1.05;
          color:var(--ink);
          padding:4px 18px;border-radius:10px;
          transform:rotate(-1deg);
          text-shadow:2px 2px 0 rgba(255,255,255,.65);
        }
        .rr-word.imposter-word{
          background:linear-gradient(180deg,rgba(200,65,43,.35),rgba(200,65,43,.15));
        }
        .rr-word.safe-word{
          background:linear-gradient(180deg,rgba(242,178,61,.5),rgba(242,178,61,.22));
        }

        .rr-sub{font-size:14px;font-weight:700;color:var(--dim);line-height:1.5}

        .rr-category{
          font-size:12px;font-weight:900;
          background:var(--saffron);color:var(--ink);
          border:2px solid var(--ink);border-radius:99px;
          padding:2px 14px;transform:rotate(-1deg);
          display:inline-block;
        }

        /* next button */
        .rr-btn{
          width:100%;
          font-family:'Lalezar','Cairo',sans-serif;font-size:22px;
          background:linear-gradient(135deg,var(--terra) 0%,var(--terra2) 55%,var(--saffron) 140%);
          color:var(--paper);border:3px solid var(--ink);border-radius:16px;
          padding:16px 20px;cursor:pointer;box-shadow:var(--shadow);
          transition:transform .12s,box-shadow .12s;
          animation:rrFadeUp .4s .2s both;
        }
        .rr-btn:hover{transform:translateY(-2px)}
        .rr-btn:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}

        .rr-count{
          font-size:13px;font-weight:800;color:var(--dim);
          text-align:center;
        }

        @media(prefers-reduced-motion:reduce){.rr-root *{animation:none!important;transition:none!important}}
      `}</style>

      <div className="rr-root" dir="rtl">
        {/* Header */}
        <div className="rr-header">
          <div className="rr-round">الجولة {state.roundNumber} · كشف الأدوار</div>
          <div className="rr-name">{currentPlayer.name}</div>
          <div className="rr-prog" style={{ marginTop: 8 }}>
            <div
              className="rr-prog-fill"
              style={{
                width: `${((state.revealIndex + 1) / state.revealOrder.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Hold card */}
        <div
          className={`rr-hold ${
            revealed ? (isImposter ? 'live imposter' : 'live safe') : ''
          }`}
          onPointerDown={startHold}
          onPointerUp={stopHold}
          onPointerCancel={stopHold}
          onPointerLeave={stopHold}
          role="button"
          aria-label="اضغط باستمرار لكشف دورك"
        >
          {/* Veil (shown before reveal) */}
          <div className="rr-veil">
            <div
              className="rr-ring"
              style={{ '--p': progress } as React.CSSProperties}
            >
              <div className="rr-ring-inner">
                {holding ? '👀' : '🤫'}
              </div>
            </div>
            <div className="rr-veil-hint">
              {holding ? 'استمر في الضغط...' : 'اضغط مع الاستمرار لكشف دورك'}
            </div>
            {!holding && (
              <div style={{ fontSize: 13, color: 'var(--dim)', fontWeight: 700 }}>
                تأكد أن لا أحد ينظر 👁️
              </div>
            )}
          </div>

          {/* Secret (shown while holding fully) */}
          <div className="rr-secret">
            {isImposter ? (
              <>
                <div className="rr-badge imposter">🕵️ المحتال</div>
                <div className="rr-word imposter-word">أنت المحتال!</div>
                <div className="rr-category">{state.category?.emoji} {state.category?.title}</div>
                <div className="rr-sub">ارسم عشوائياً وحاول تخمين الكلمة</div>
              </>
            ) : (
              <>
                <div className="rr-badge safe">✅ فالسالفة</div>
                <div className="rr-word safe-word">{state.secretWord}</div>
                <div className="rr-category">{state.category?.emoji} {state.category?.title}</div>
                <div className="rr-sub">ارسم بذكاء — لا تعطي المحتال الكلمة!</div>
              </>
            )}
          </div>
        </div>

        {/* Progress ring for holding */}
        {holding && !revealed && (
          <div style={{ fontSize: 13, color: 'var(--terra)', fontWeight: 800, textAlign: 'center' }}>
            استمر في الضغط...
          </div>
        )}

        {/* Next player button */}
        <button
          className="rr-btn"
          onClick={() => dispatch({ type: 'ADVANCE_REVEAL' })}
        >
          {isLast ? '🎨 يلا نرسمو' : `التالي ← ${state.players.find(p => p.id === state.revealOrder[state.revealIndex + 1])?.name ?? ''}`}
        </button>

        <div className="rr-count">
          {state.revealIndex + 1} / {state.revealOrder.length} لاعبين شافو دورهم
        </div>
      </div>
    </>
  )
}