interface HomeScreenProps {
  onStart: () => void
}

/**
 * HOME — faithful port of the "bara-salfa-bdarija" hero (warm paper,
 * star8 spinning mascot + tape, stacked Lalezar two-line title with a
 * hand-drawn squiggle, ticker marquee, darija badge, tilted feature
 * stickers and a one-tap quick-start).
 *
 * Self-contained: the whole visual system (tokens + home CSS + keyframes)
 * lives in a scoped <style> so it renders exactly like the reference
 * regardless of the global Tailwind shell.
 */
export default function HomeScreen({ onStart }: HomeScreenProps) {
  return (
    <>
      <style>{`
        .home-root{
          --paper:#F6EFE2; --paper2:#EDE2C9; --card:#FFF9EC;
          --ink:#2A2118; --ink50:rgba(42,33,24,.55); --ink35:rgba(42,33,24,.3);
          --ink15:rgba(42,33,24,.15); --ink05:rgba(42,33,24,.05);
          --terra:#C8412B; --terra2:#E85C2A; --saffron:#F2B23D;
          --tea:#1F7A6B; --mint:#3FBA9A;
          --dim:#8A7A63; --chalk:#4A3826;
          --shadow:0 6px 0 var(--ink); --shadow-sm:0 3px 0 var(--ink);
          --shadow-sm2:0 3px 0 var(--paper2);
          background:var(--paper);
          background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><g fill="none" stroke="%232A2118" stroke-opacity=".06" stroke-width="1.6"><path d="M48 16L54 8L62 16L70 8L78 16L86 8L94 16L86 24L94 32L86 40L94 48L86 56L94 64L86 72L94 80L86 88L78 80L70 88L62 80L54 88L46 80L38 88L30 80L22 88L14 80L6 88L14 72L6 64L14 56L6 48L14 40L6 32L14 24L6 16L14 8L22 16L30 8L38 16L46 8Z"/></g></svg>');
          background-size:96px 96px;
          color:var(--ink);
          min-height:100%;
          display:flex;flex-direction:column;align-items:center;
          padding:26px 22px 30px;
          overflow-y:auto;overscroll-behavior:none;
          -webkit-user-select:none;user-select:none;
        }
        .home-root *{box-sizing:border-box}
        @keyframes marq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes stampIn{0%{opacity:0;transform:scale(1.7) rotate(-8deg)}60%{transform:scale(.9) rotate(1deg)}100%{opacity:1;transform:scale(1) rotate(1.4deg)}}
        @keyframes titleBob{0%,100%{transform:rotate(-.6deg) translateY(0)}50%{transform:rotate(.6deg) translateY(-4px)}}
        @keyframes floatOrb{0%,100%{transform:translate(0,0)}50%{transform:translate(0,-16px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

        .ticker{
          position:relative;overflow:hidden;align-self:stretch;
          background:var(--ink);color:var(--paper);
          font-size:13px;font-weight:800;letter-spacing:.5px;
          padding:9px 0;border:2.5px solid var(--ink);
          border-radius:10px;box-shadow:var(--shadow-sm);margin-bottom:8px;
        }
        .ticker .track{display:inline-block;white-space:nowrap;padding:0 4px;
          animation:marq 26s linear infinite;will-change:transform}
        .ticker .track b{color:var(--saffron)}

        .home-hero{display:flex;flex-direction:column;align-items:center;width:100%}
        .home-mascot-wrap{position:relative;display:inline-block;margin:14px 0 12px}
        .star8{
          position:absolute;inset:-44px;margin:auto;width:160px;height:160px;
          animation:spin 16s linear infinite;
          filter:drop-shadow(2px 2px 0 rgba(42,33,24,.18));
        }
        .tape{
          position:absolute;z-index:2;
          background:rgba(242,178,61,.88);
          border:2px solid var(--ink);border-radius:4px;
          top:8px;right:-16px;width:66px;height:17px;
          transform:rotate(8deg);
          box-shadow:var(--shadow-sm2);
        }
        .home-mascot-emoji{
          font-size:58px;display:block;position:relative;z-index:1;
          background:var(--card);border:3px solid var(--ink);border-radius:18px;
          padding:12px;line-height:1;
          box-shadow:var(--shadow-sm);
          transform:rotate(-3deg);
          animation:titleBob 3.6s ease-in-out infinite;
        }
        .home-title-wrap{display:flex;flex-direction:column;align-items:center;gap:2px}
        .home-title-1{
          font-family:'Lalezar','Cairo',sans-serif;
          font-size:clamp(64px,20vw,96px);line-height:.92;color:var(--terra);
          text-shadow:3px 3px 0 var(--saffron),5px 5px 0 var(--ink);
          animation:titleBob 3.6s ease-in-out infinite;
        }
        .home-title-1::after{
          content:'';display:block;height:10px;margin-top:-2px;
          background:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="12" viewBox="0 0 120 12"><path d="M2 8 Q10 2 20 6 T40 7 T60 5 T80 7 T100 5 T118 7" fill="none" stroke="%23F2B23D" stroke-width="5" stroke-linecap="round"/></svg>') repeat-x;
          background-size:auto 10px;background-position:center;
        }
        .home-title-2{
          font-family:'Lalezar','Cairo',sans-serif;
          font-size:clamp(64px,20vw,96px);line-height:.92;color:var(--ink);
          animation:titleBob 3.6s ease-in-out infinite .15s;
        }
        .home-darija-badge{
          display:inline-flex;align-items:center;gap:6px;
          font-size:13px;font-weight:900;margin-top:14px;
          padding:6px 16px;border-radius:8px;
          background:var(--terra);color:var(--paper);
          border:2.5px solid var(--ink);box-shadow:var(--shadow-sm);
          transform:rotate(1.2deg);
          animation:stampIn .55s cubic-bezier(.22,1,.36,1) both;
        }
        .home-tagline{
          font-size:clamp(14px,4.2vw,17px);font-weight:900;color:var(--chalk);
          margin-top:14px;
        }
        .home-feats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;width:100%;margin-top:22px}
        .home-feat{
          background:var(--card);border:2.5px solid var(--ink);
          border-radius:12px;padding:12px 5px;text-align:center;
          box-shadow:var(--shadow-sm);transition:transform .12s;
          animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both;
        }
        .home-feat:nth-child(2){transform:rotate(1deg)}
        .home-feat:nth-child(3){transform:rotate(-1.2deg)}
        .home-feat:hover{transform:translateY(-2px)}
        .home-feat-ico{font-size:24px;display:block;margin-bottom:5px}
        .home-feat-lbl{font-size:11px;font-weight:800;color:var(--dim);line-height:1.5;display:block}

        .home-cta{
          width:100%;margin-top:24px;
          font-family:'Lalezar','Cairo',sans-serif;font-size:26px;letter-spacing:.5px;
          background:linear-gradient(135deg,var(--terra) 0%,var(--terra2) 55%,var(--saffron) 140%);
          color:var(--paper);border:3px solid var(--ink);border-radius:16px;
          padding:18px 20px;cursor:pointer;box-shadow:var(--shadow);
          transition:transform .12s,box-shadow .12s;
          animation:fadeUp .45s cubic-bezier(.22,1,.36,1) both .2s;
        }
        .home-cta:hover{transform:translateY(-2px)}
        .home-cta:active{transform:translateY(3px);box-shadow:0 3px 0 var(--ink)}
        .home-foot{
          margin-top:16px;font-size:12px;font-weight:800;color:var(--dim);text-align:center;
        }
        @media(prefers-reduced-motion:reduce){
          .home-root *{animation:none!important;transition:none!important}
        }
      `}</style>

      <div className="home-root" dir="rtl">
        <div className="ticker" aria-hidden="true">
          <span className="track">
            <b>ارسم كلمة</b> 🕵️ بالدارجة 100% • كل واحد يرسم والمحتال يخمّم ✦ <b>ارسم كلمة</b> 🕵️ بالدارجة 100% • كل واحد يرسم والمحتال يخمّم ✦
          </span>
        </div>

        <div className="home-hero">
          <div className="home-mascot-wrap">
            <svg className="star8" viewBox="0 0 100 100" aria-hidden="true">
              <g fill="none" stroke="#F2B23D" stroke-width="3">
                <path d="M50 6 L59 41 L94 50 L59 59 L50 94 L41 59 L6 50 L41 41 Z" />
                <circle cx="50" cy="50" r="9" />
              </g>
            </svg>
            <span className="tape"></span>
            <span className="home-mascot-emoji">🕵️</span>
          </div>

          <div className="home-title-wrap">
            <span className="home-title-1">ارسم</span>
            <span className="home-title-2">كلمة</span>
          </div>

          <div className="home-darija-badge">🇲🇦 بالدارجة</div>
          <p className="home-tagline">واش نجيبدوها؟ 😅</p>
        </div>

        <div className="home-feats">
          <div className="home-feat">
            <span className="home-feat-ico">👥</span>
            <span className="home-feat-lbl">3–15<br />لاعبين</span>
          </div>
          <div className="home-feat">
            <span className="home-feat-ico">📱</span>
            <span className="home-feat-lbl">تيليفون<br />واحد</span>
          </div>
          <div className="home-feat">
            <span className="home-feat-ico">🎨</span>
            <span className="home-feat-lbl">رسم و<br />تخمين</span>
          </div>
        </div>

        <button className="home-cta" onClick={onStart}>
          🚀 يلا نبداو
        </button>

        <p className="home-foot">
          لعبة رفيق المكتب — اكتشف المحتال قبل ما يفوتك
        </p>
      </div>
    </>
  )
}
