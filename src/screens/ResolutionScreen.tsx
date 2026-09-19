import { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'

function spawnConfetti(container: HTMLDivElement) {
  const colors = ['#C8412B', '#F2B23D', '#1F7A6B', '#3FBA9A', '#E85C2A', '#FFF9EC']
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div')
    el.style.cssText = `
      position:absolute;
      left:${Math.random() * 100}%;
      top:-20px;
      width:${8 + Math.random() * 8}px;
      height:${12 + Math.random() * 8}px;
      border-radius:3px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border:1.5px solid rgba(42,33,24,.35);
      animation:confettiFall ${1.8 + Math.random() * 1.6}s linear ${Math.random() * 0.8}s both;
      pointer-events:none;
      transform:rotate(${Math.random() * 360}deg);
    `
    container.appendChild(el)
    setTimeout(() => el.remove(), 4000)
  }
}

/**
 * ResolutionScreen — shows result banner, imposter bonus guess, round scoreboard.
 * Confetti on imposter caught. Inspired by bara-salfa-bdarija's result & scoreboard.
 */
export default function ResolutionScreen() {
  const { state, dispatch } = useGame()
  const confettiRef = useRef<HTMLDivElement>(null)
  const [guessSubmitted, setGuessSubmitted] = useState(false)

  const imposter = state.players.find((p) => p.id === state.imposterId)

  // Fire confetti when imposter caught
  useEffect(() => {
    if (state.imposterCaught && confettiRef.current) {
      spawnConfetti(confettiRef.current)
    }
  }, [state.imposterCaught])

  const handleGuess = (word: string) => {
    setGuessSubmitted(true)
    dispatch({ type: 'GUESS_WORD', word })
  }

  const sortedPlayers = [...state.players].sort(
    (a, b) => (state.scores[b.id] ?? 0) - (state.scores[a.id] ?? 0),
  )
  const topScore = state.scores[sortedPlayers[0]?.id] ?? 0

  const showBonusGuess = state.imposterCaught && !guessSubmitted && state.guessedWords

  return (
    <>
      <style>{`
        .rs-root {
          --paper:#F6EFE2; --card:#FFF9EC; --ink:#2A2118;
          --ink15:rgba(42,33,24,.15); --ink50:rgba(42,33,24,.55);
          --terra:#C8412B; --terra2:#E85C2A; --saffron:#F2B23D;
          --tea:#1F7A6B; --mint:#3FBA9A; --dim:#8A7A63;
          --shadow:0 4px 0 var(--ink); --shadow-sm:0 3px 0 var(--ink);
          background:var(--paper);
          min-height:100dvh;
          display:flex;flex-direction:column;
          padding:20px 18px calc(24px + env(safe-area-inset-bottom));
          gap:16px;
          font-family:'Cairo',system-ui,sans-serif;
          color:var(--ink);
          -webkit-user-select:none;user-select:none;
          position:relative;overflow:hidden;
        }
        .rs-root *{box-sizing:border-box}

        @keyframes confettiFall{
          0%{transform:translateY(-20px) rotate(0deg);opacity:1}
          100%{transform:translateY(110vh) rotate(720deg);opacity:0}
        }
        @keyframes rsPop{0%{opacity:0;transform:scale(.82) rotate(-2deg)}65%{transform:scale(1.06) rotate(.4deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
        @keyframes rsSlideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes rsWinnerBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px) scale(1.02)}}
        @keyframes rsStampIn{0%{opacity:0;transform:scale(1.5) rotate(-6deg)}65%{transform:scale(.94) rotate(.8deg)}100%{opacity:1;transform:scale(1) rotate(0)}}

        /* Banner */
        .rs-banner{
          border-radius:20px;padding:22px 18px;text-align:center;
          border:3px solid var(--ink);box-shadow:var(--shadow);
          position:relative;overflow:hidden;
          animation:rsPop .5s cubic-bezier(.34,1.56,.64,1) both;
        }
        .rs-banner::before{
          content:'';position:absolute;top:10px;right:16px;
          width:20px;height:20px;border-radius:5px;
          background:var(--saffron);border:2px solid var(--ink);transform:rotate(12deg);
        }
        .rs-banner.caught{background:#E2F4E8;border-color:var(--tea)}
        .rs-banner.escaped{background:#FFE6DA;border-color:var(--terra)}

        .rs-banner-icon{font-size:52px;display:block;margin-bottom:8px;animation:rsStampIn .5s cubic-bezier(.34,1.56,.64,1) both .15s}
        .rs-banner-title{
          font-family:'Lalezar','Cairo',sans-serif;
          font-size:clamp(30px,9vw,42px);
          color:var(--ink);line-height:1.05;margin-bottom:6px;
        }
        .rs-banner-imposter{
          display:flex;align-items:center;gap:8px;justify-content:center;
          margin-top:8px;
        }
        .rs-imposter-dot{width:14px;height:14px;border-radius:50%;border:2px solid var(--ink)}
        .rs-imposter-name{font-size:18px;font-weight:900}

        .rs-word-reveal{
          font-family:'Lalezar','Cairo',sans-serif;
          font-size:clamp(28px,8vw,38px);
          background:linear-gradient(180deg,rgba(242,178,61,.5),rgba(242,178,61,.22));
          padding:3px 16px;border-radius:8px;
          display:inline-block;transform:rotate(-1deg);
          margin-top:8px;
        }
        .rs-word-label{font-size:14px;font-weight:800;color:var(--dim);margin-bottom:4px}

        /* Bonus guess */
        .rs-bonus{
          background:var(--card);border:3px solid var(--saffron);
          border-radius:16px;padding:16px;
          box-shadow:var(--shadow-sm);
          animation:rsSlideUp .4s .2s both;
        }
        .rs-bonus-title{font-size:16px;font-weight:900;margin-bottom:10px;text-align:center}
        .rs-bonus-title span{color:var(--terra)}
        .rs-guess-options{display:flex;flex-direction:column;gap:8px}
        .rs-guess-btn{
          width:100%;text-align:right;
          background:var(--card);border:2.5px solid var(--ink);
          border-radius:14px;padding:13px 16px;
          cursor:pointer;font-family:inherit;font-size:17px;font-weight:800;
          transition:border-color .15s,background .15s,transform .12s,box-shadow .15s;
          box-shadow:0 2px 0 var(--ink);
        }
        .rs-guess-btn:hover{border-color:var(--terra);transform:translateY(-2px);box-shadow:0 4px 0 var(--ink)}
        .rs-guess-btn:active{transform:translateY(1px);box-shadow:0 1px 0 var(--ink)}

        /* Guess result */
        .rs-guess-result{
          text-align:center;
          animation:rsPop .5s cubic-bezier(.34,1.56,.64,1) both;
          background:var(--card);border:3px solid var(--ink);
          border-radius:16px;padding:16px;
          box-shadow:var(--shadow-sm);
        }
        .rs-guess-icon{font-size:44px;display:block;margin-bottom:6px}
        .rs-guess-text{font-size:18px;font-weight:900}

        /* Scoreboard */
        .rs-scores{
          background:var(--card);border:3px solid var(--ink);
          border-radius:16px;overflow:hidden;
          box-shadow:var(--shadow-sm);
          animation:rsSlideUp .4s .25s both;
        }
        .rs-scores-header{
          background:var(--ink);color:var(--paper);
          padding:10px 16px;
          font-size:14px;font-weight:900;letter-spacing:.5px;
          display:flex;align-items:center;gap:8px;
        }
        .rs-scores-table{width:100%;border-collapse:collapse}
        .rs-scores-table td{
          padding:11px 14px;
          border-bottom:2.5px dashed var(--ink15);
          font-weight:800;font-size:16px;
          color:var(--ink);
        }
        .rs-scores-table td.pts{
          text-align:left;color:var(--terra);
          font-weight:900;font-size:18px;
          font-variant-numeric:tabular-nums;
          white-space:nowrap;
        }
        .rs-scores-table tr:last-child td{border-bottom:0}
        .rs-scores-table tr.winner td{animation:rsWinnerBob 1.4s ease-in-out infinite}
        .rs-score-dot{width:12px;height:12px;border-radius:50%;border:2px solid var(--ink);display:inline-block;margin-left:6px}

        /* Action buttons */
        .rs-actions{display:flex;flex-direction:column;gap:10px;animation:rsSlideUp .4s .3s both}
        .rs-btn-primary{
          width:100%;
          font-family:'Lalezar','Cairo',sans-serif;font-size:22px;
          background:linear-gradient(135deg,var(--terra) 0%,var(--terra2) 55%,var(--saffron) 140%);
          color:var(--paper);border:3px solid var(--ink);border-radius:16px;
          padding:16px;cursor:pointer;box-shadow:var(--shadow);
          transition:transform .12s,box-shadow .12s;
        }
        .rs-btn-primary:hover{transform:translateY(-2px)}
        .rs-btn-primary:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}
        .rs-btn-ghost{
          width:100%;
          font-family:'Cairo',system-ui,sans-serif;font-size:16px;font-weight:800;
          background:var(--card);border:3px solid var(--ink);border-radius:16px;
          padding:13px;cursor:pointer;box-shadow:var(--shadow-sm);
          color:var(--ink);
          transition:transform .12s,box-shadow .12s;
        }
        .rs-btn-ghost:hover{transform:translateY(-2px)}
        .rs-btn-ghost:active{transform:translateY(1px);box-shadow:0 1px 0 var(--ink)}

        @media(prefers-reduced-motion:reduce){.rs-root *{animation:none!important;transition:none!important}}
      `}</style>

      {/* Confetti container */}
      <div
        ref={confettiRef}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}
        aria-hidden="true"
      />

      <div className="rs-root" dir="rtl">
        {/* Result banner */}
        <div className={`rs-banner ${state.imposterCaught ? 'caught' : 'escaped'}`}>
          <span className="rs-banner-icon">
            {state.imposterCaught ? '🎉' : '😈'}
          </span>
          <div className="rs-banner-title">
            {state.imposterCaught ? 'تم كشف المحتال!' : 'المحتال هرب!'}
          </div>

          <div className="rs-banner-imposter">
            <span className="rs-imposter-dot" style={{ backgroundColor: imposter?.color }} />
            <span className="rs-imposter-name">{imposter?.name}</span>
            <span style={{ fontSize: 13, color: 'var(--dim)', fontWeight: 800 }}>كان المحتال</span>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="rs-word-label">الكلمة كانت</div>
            <span className="rs-word-reveal">{state.secretWord}</span>
          </div>
        </div>

        {/* Imposter bonus guess */}
        {showBonusGuess && (
          <div className="rs-bonus">
            <div className="rs-bonus-title">
              🎯 يا <span>{imposter?.name}</span>، خمن الكلمة تاخد نقطة إضافية!
            </div>
            <div className="rs-guess-options">
              {state.guessedWords?.map((w) => (
                <button key={w} className="rs-guess-btn" onClick={() => handleGuess(w)}>
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Guess result */}
        {guessSubmitted && state.guessCorrect !== null && (
          <div className="rs-guess-result">
            <span className="rs-guess-icon">{state.guessCorrect ? '🏆' : '❌'}</span>
            <div className="rs-guess-text">
              {state.guessCorrect
                ? `${imposter?.name} خمّن صح! +1 نقطة`
                : `غلط — الكلمة كانت "${state.secretWord}"`}
            </div>
          </div>
        )}

        {/* Scoreboard */}
        <div className="rs-scores">
          <div className="rs-scores-header">
            🏅 النقاط — الجولة {state.roundNumber}
          </div>
          <table className="rs-scores-table">
            <tbody>
              {sortedPlayers.map((p, i) => {
                const pts = state.scores[p.id] ?? 0
                const isWinner = pts === topScore && topScore > 0 && i === 0
                return (
                  <tr key={p.id} className={isWinner ? 'winner' : ''}>
                    <td>
                      <span className="rs-score-dot" style={{ backgroundColor: p.color }} />
                      {isWinner && '🥇 '}
                      {p.name}
                      {p.id === state.imposterId && (
                        <span style={{ fontSize: 12, color: 'var(--terra)', marginRight: 6 }}>
                          (المحتال)
                        </span>
                      )}
                    </td>
                    <td className="pts">{pts} نقطة</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="rs-actions">
          <button
            className="rs-btn-primary"
            onClick={() => dispatch({ type: 'PLAY_AGAIN' })}
          >
            🎮 جولة جديدة
          </button>
          <button
            className="rs-btn-ghost"
            onClick={() => dispatch({ type: 'RESET' })}
          >
            إعادة تعيين من الأول
          </button>
        </div>
      </div>
    </>
  )
}