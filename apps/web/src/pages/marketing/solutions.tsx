import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { SEO } from '@/components/SEO';
import { LandingHeader, LandingFooter } from '@/components/landing';

const N = '#1d2879'; // navy
const G = '#1aa86b'; // green
const R = '#e0386b'; // rose
const A = '#f5a524'; // amber

export function SolutionsPage() {
  useEffect(() => {
    const revealEls = document.querySelectorAll('[data-reveal], [data-stagger]');
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            revealIO.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    revealEls.forEach((el) => revealIO.observe(el));

    const counters = document.querySelectorAll<HTMLElement>('[data-count]');
    const counterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const target = parseInt(el.dataset.count ?? '0', 10);
          const unit = el.querySelector('.stat-unit');
          let curr = 0;
          const tick = () => {
            curr = Math.min(curr + Math.ceil(target / 40), target);
            const num = el.querySelector('.stat-num-val');
            if (num) num.textContent = String(curr);
            if (curr < target) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          counterIO.unobserve(el);
          void unit;
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => counterIO.observe(el));

    return () => {
      revealIO.disconnect();
      counterIO.disconnect();
    };
  }, []);

  return (
    <>
      <SEO 
        title="Tailored Revenue Intelligence" 
        description="Discover how FlowRaze solves revenue disconnectedness for Sales Teams, Marketing Teams, Founders, and Agencies."
      />
      <style>{`
        @keyframes nodeFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes solDash { to { stroke-dashoffset: -200; } }
        @keyframes solPulse { 0%{transform:translate(-50%,-50%) scale(1);opacity:.6} 100%{transform:translate(-50%,-50%) scale(2);opacity:0} }
        @keyframes meterIn { from { width: 0; } }
        @keyframes attrIn { from { width: 0; } }
        [data-reveal]{opacity:0;transform:translateY(28px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
        [data-reveal="scale"]{transform:scale(.96)}
        [data-reveal].in{opacity:1;transform:none}
        [data-stagger]>*{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}
        [data-stagger].in>*{opacity:1;transform:none}
        [data-stagger].in>*:nth-child(1){transition-delay:.05s}
        [data-stagger].in>*:nth-child(2){transition-delay:.12s}
        [data-stagger].in>*:nth-child(3){transition-delay:.19s}
        [data-stagger].in>*:nth-child(4){transition-delay:.26s}
        [data-stagger].in>*:nth-child(5){transition-delay:.33s}
        @media (prefers-reduced-motion:reduce){[data-reveal],[data-stagger]>*{opacity:1!important;transform:none!important;transition:none!important}}
        .sol-logo-dot{width:22px;height:22px;border-radius:7px;background:#1d2879;position:relative;overflow:hidden;flex-shrink:0}
        .sol-logo-dot::before{content:"";position:absolute;inset:5px 4px 4px 5px;background:#fff;border-radius:3px;clip-path:polygon(0 60%,40% 60%,40% 0,70% 0,70% 40%,100% 40%,100% 100%,0 100%)}
        .sol-nav-active::after{content:"";position:absolute;left:0;right:0;bottom:-3px;height:2px;background:#1d2879;border-radius:2px}
        .sol-const-dash{stroke-dasharray:5 5;animation:solDash 22s linear infinite}
        .sol-node{animation:nodeFloat 7s ease-in-out infinite}
        .sol-node-1{animation-delay:0s}
        .sol-node-2{animation-delay:1.2s}
        .sol-node-3{animation-delay:2.4s}
        .sol-node-4{animation-delay:3.6s}
        .sol-pulse{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:160px;height:160px;border-radius:24px;border:1.5px solid rgba(29,40,121,.4);animation:solPulse 2.6s ease-out infinite;pointer-events:none}
        .sol-pulse-2{animation-delay:.8s}
        .sol-pulse-3{animation-delay:1.6s}
        .sol-meter-bar{animation:meterIn 1.4s cubic-bezier(.2,.7,.2,1) both}
        .sol-attr-bar{animation:attrIn 1.6s cubic-bezier(.2,.7,.2,1) both}
        .sol-module-cta{display:inline-flex;align-items:center;gap:8px;font-size:14.5px;font-weight:600;color:#1d2879;transition:gap .2s;text-decoration:none}
        .sol-module-cta::after{content:" →"}
        .sol-module-cta:hover{gap:12px}
        .sol-role-tile{transition:transform .3s,box-shadow .3s,border-color .25s}
        .sol-role-tile:hover{transform:translateY(-4px);box-shadow:0 24px 50px -22px rgba(20,26,77,.18);border-color:#d0d6ee}
        .sol-final-card::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 15% 30%,rgba(94,114,228,.45),transparent 40%),radial-gradient(circle at 85% 70%,rgba(45,202,140,.3),transparent 40%);pointer-events:none}
        .sol-pillar-chip:hover .sol-pillar-sub{color:#1d2879}
        .sol-btn-ghost-inv{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.3)}
        .sol-btn-ghost-inv:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.5)}
      `}</style>

      <div className="min-h-screen bg-white" style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#0c1030' }}>

        <LandingHeader />

        {/* HERO */}
        <section style={{ padding: '64px 32px 48px', overflow: 'hidden', position: 'relative', background: '#fff' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: '50%', top: -160, width: 1100, height: 1100, transform: 'translateX(-50%)', background: 'radial-gradient(closest-side, rgba(29,40,121,.07), transparent 70%)' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(230,232,240,1) 1px,transparent 1px),linear-gradient(90deg,rgba(230,232,240,1) 1px,transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%,black 30%,transparent 75%)', opacity: 0.45 }} />
          </div>
          <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 64, alignItems: 'center' }}>
            <div>
              <span data-reveal="up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: '#eef0fa', color: N, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: N, boxShadow: `0 0 0 4px rgba(29,40,121,.15)` }} />
                Solutions
              </span>
              <h1 data-reveal="up" style={{ marginTop: 22, fontSize: 72, lineHeight: 1.02, letterSpacing: '-0.035em', fontWeight: 700, color: '#0c1030' }}>
                Solutions for how your business{' '}
                <span style={{ color: N, fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400 }}>actually</span>{' '}
                operates.
              </h1>
              <p data-reveal="up" style={{ marginTop: 24, fontSize: 18, color: '#5a6178', lineHeight: 1.6, maxWidth: 520 }}>
                From sales pipelines to marketing performance to executive reporting — FlowRaze connects every part of your revenue motion into one clear, actionable system.
              </p>
              <p data-reveal="up" style={{ marginTop: 14, fontSize: 14, color: '#7a809a', fontFamily: '"Instrument Serif", serif', fontStyle: 'italic' }}>Stop managing tools. Start managing results.</p>
              <div data-reveal="up" style={{ marginTop: 36, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <a href="#sales" style={{ background: N, color: '#fff', padding: '14px 22px', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none', boxShadow: '0 2px 4px rgba(20,26,77,.25),0 12px 24px -10px rgba(20,26,77,.55)' }}>Explore Solutions →</a>
                <Link to="/pricing" style={{ background: '#fff', color: '#0c1030', border: '1px solid #e6e8f0', padding: '14px 22px', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>See Pricing</Link>
              </div>
            </div>

            {/* Constellation */}
            <div data-reveal="scale">
              <div style={{ position: 'relative', aspectRatio: '1/1', maxWidth: 520, margin: '0 auto' }}>
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} viewBox="0 0 400 400" preserveAspectRatio="none">
                  <path d="M 80 80 Q 200 200 320 80" className="sol-const-dash" stroke={N} strokeWidth={1.4} fill="none" opacity={0.32} />
                  <path d="M 80 320 Q 200 200 320 320" className="sol-const-dash" stroke={N} strokeWidth={1.4} fill="none" opacity={0.32} />
                  <path d="M 80 80 Q 200 200 80 320" className="sol-const-dash" stroke={N} strokeWidth={1.4} fill="none" opacity={0.32} />
                  <path d="M 320 80 Q 200 200 320 320" className="sol-const-dash" stroke={N} strokeWidth={1.4} fill="none" opacity={0.32} />
                </svg>
                <div className="sol-pulse" />
                <div className="sol-pulse sol-pulse-2" />
                <div className="sol-pulse sol-pulse-3" />
                {/* Core */}
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 160, height: 160, borderRadius: 24, background: N, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 30px 60px -25px rgba(20,26,77,.45),0 12px 28px -16px rgba(20,26,77,.3)', zIndex: 3 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.14)', display: 'grid', placeItems: 'center' }}>
                    <span className="sol-logo-dot" style={{ width: 18, height: 18, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>FlowRaze</div>
                  <div style={{ fontSize: 9.5, color: '#b6bce3', letterSpacing: '.14em', textTransform: 'uppercase' }}>Connectivity Core</div>
                </div>
                {/* Nodes */}
                {[
                  { pos: { top: '6%', left: '8%' }, cls: 'sol-node sol-node-1', ic: '$', icBg: '#e6f7ee', icColor: G, ttl: 'Sales', val: 'Pipeline · Deals' },
                  { pos: { top: '6%', right: '8%' }, cls: 'sol-node sol-node-2', ic: '◔', icBg: '#e7ebff', icColor: N, ttl: 'Marketing', val: 'ROAS · Attribution' },
                  { pos: { bottom: '8%', left: '4%' }, cls: 'sol-node sol-node-3', ic: '◉', icBg: '#ffeadb', icColor: '#d27a3a', ttl: 'Team', val: 'OKRs · Output' },
                  { pos: { bottom: '8%', right: '4%' }, cls: 'sol-node sol-node-4', ic: '▤', icBg: '#fee9ee', icColor: R, ttl: 'Executive', val: 'P&L · Forecast' },
                ].map(({ pos, cls, ic, icBg, icColor, ttl, val }) => (
                  <div key={ttl} className={cls} style={{ position: 'absolute', ...pos, width: 130, background: '#fff', border: '1px solid #e6e8f0', borderRadius: 14, padding: '14px 14px 12px', boxShadow: '0 18px 40px -22px rgba(20,26,77,.25),0 4px 10px rgba(20,26,77,.05)', zIndex: 2 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: icBg, color: icColor, display: 'grid', placeItems: 'center', marginBottom: 8, fontSize: 14, fontWeight: 700 }}>{ic}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '-0.01em', color: '#0c1030' }}>{ttl}</div>
                    <div style={{ fontSize: 11, color: '#7a809a', marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PILLAR STRIP */}
        <section style={{ padding: 0, background: '#f5f6fb', borderTop: '1px solid #e6e8f0', borderBottom: '1px solid #e6e8f0' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 32px' }}>
            <div data-stagger style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 32, alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#7a809a', lineHeight: 1.5 }}>FOUR PILLARS<br />ONE OPERATING SYSTEM</div>
              {[
                { href: '#sales', ic: '$', icBg: '#e6f7ee', icColor: G, label: 'Sales Management', sub: 'Pipeline visibility' },
                { href: '#marketing', ic: '◔', icBg: '#e7ebff', icColor: N, label: 'Marketing Performance', sub: 'Attribution & ROI' },
                { href: '#team', ic: '◉', icBg: '#ffeadb', icColor: '#d27a3a', label: 'Team Performance', sub: 'OKRs & output' },
                { href: '#exec', ic: '▤', icBg: '#fee9ee', icColor: R, label: 'Executive Dashboard', sub: 'Business intelligence' },
              ].map(({ href, ic, icBg, icColor, label, sub }) => (
                <a key={href} href={href} className="sol-pillar-chip" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 600, color: '#0c1030', textDecoration: 'none' }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: icBg, color: icColor, display: 'grid', placeItems: 'center', flexShrink: 0, fontWeight: 700 }}>{ic}</span>
                  <span>
                    {label}
                    <span className="sol-pillar-sub" style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: '#7a809a', marginTop: 2, transition: 'color .2s' }}>{sub}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* MODULES */}
        <div>

          {/* MODULE 1: SALES */}
          <section id="sales" style={{ padding: '120px 32px', background: '#fff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 80, alignItems: 'center', maxWidth: 1240, margin: '0 auto' }}>
              <div>
                <div data-reveal="up" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: N, marginBottom: 14 }}>
                  <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, fontSize: 48, color: N, letterSpacing: '-0.02em', lineHeight: 0.8, marginRight: 4 }}>01</span>
                  Sales Management
                </div>
                <h2 data-reveal="up" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: '-0.025em', fontWeight: 700 }}>
                  Stop guessing where deals stand.{' '}
                  <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: N }}>Know.</span>
                </h2>
                <p data-reveal="up" style={{ marginTop: 18, fontSize: 18, color: '#5a6178', lineHeight: 1.6, maxWidth: 520 }}>
                  Get a real-time visual of every deal — from first touch to closed-won. No more chasing updates in DMs. No more outdated spreadsheets. Just the truth, live.
                </p>
                <ul data-stagger style={{ margin: '28px 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['Automated pipeline stage tracking with deal-health scoring', 'Revenue forecasting grounded in your historical conversion data', 'Bottleneck alerts the moment a deal goes cold', 'Mobile-first deal cards your reps will actually use'].map((f) => (
                    <li key={f} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, color: '#3a4060', lineHeight: 1.5 }}>
                      <span style={{ width: 22, height: 22, flexShrink: 0, marginTop: 1, borderRadius: 7, background: '#e6f7ee', display: 'grid', placeItems: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 6-7" stroke="#1aa86b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div data-reveal="up" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 20px 14px 18px', background: '#fff', border: '1px solid #d6e8de', borderLeft: `4px solid ${G}`, borderRadius: 12, boxShadow: `0 8px 20px -12px rgba(26,168,107,.25)` }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: '#e6f7ee', color: G, display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>↑</span>
                  <div>
                    <div style={{ fontSize: 13.5, color: '#5a6178', fontWeight: 500 }}>Average customer outcome</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0c1030', letterSpacing: '-0.01em' }}>+24% increase in sales velocity</div>
                  </div>
                </div>
                <div data-reveal="up" style={{ marginTop: 24 }}>
                  <Link to="/pricing" className="sol-module-cta">See pricing for Sales</Link>
                </div>
              </div>

              {/* Sales Pipeline Visualization */}
              <div data-reveal="scale" style={{ background: '#fff', border: '1px solid #e6e8f0', borderRadius: 18, padding: 22, boxShadow: '0 30px 60px -28px rgba(20,26,77,.18)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#0c1030' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: G }} />
                    Active Pipeline · 12 deals
                  </div>
                  <div style={{ display: 'inline-flex', background: '#f5f6fb', border: '1px solid #e6e8f0', borderRadius: 6, padding: 2, fontSize: 10.5, fontWeight: 600 }}>
                    <span style={{ padding: '4px 7px', borderRadius: 4, color: '#7a809a' }}>Today</span>
                    <span style={{ padding: '4px 7px', borderRadius: 4, background: N, color: '#fff' }}>This Quarter</span>
                    <span style={{ padding: '4px 7px', borderRadius: 4, color: '#7a809a' }}>YTD</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[
                    { label: 'Qualified', color: G, count: 3, cards: [{ nm: 'PT Anindita', who: 'Mark Thompson', val: 'Rp 60.000.000' }, { nm: 'Surya Mandiri', who: 'Jennifer M.', val: 'Rp 15.000.000' }] },
                    { label: 'Discovery', color: A, count: 2, cards: [{ nm: 'Velora Group', who: 'Rina Sari', val: 'Rp 220.000.000' }] },
                    { label: 'Proposal', color: '#5868d6', count: 3, cards: [{ nm: 'Logistics Co.', who: 'Kevin P.', val: 'Rp 480.000.000' }, { nm: 'Hyperflow', who: 'William J.', val: 'Rp 320.000.000' }] },
                    { label: 'Won', color: G, count: 4, cards: [{ nm: 'Growth Pkg', who: 'Kevin Park', val: 'Rp 35.000.000' }, { nm: 'Annual Sub', who: 'William J.', val: 'Rp 50.000.000' }] },
                  ].map(({ label, color, count, cards }) => (
                    <div key={label} style={{ background: '#f5f6fb', border: '1px solid #e6e8f0', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 700, color: '#5a6178', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                        {label}
                        <span style={{ marginLeft: 'auto', color: '#9aa0bb', fontWeight: 600 }}>{count}</span>
                      </div>
                      {cards.map((c) => (
                        <div key={c.nm} style={{ background: '#fff', borderRadius: 8, padding: 9, fontSize: 10.5, border: '1px solid #e6e8f0' }}>
                          <div style={{ fontWeight: 700, color: N, fontSize: 11, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{c.nm}</div>
                          <div style={{ color: '#7a809a', fontSize: 9.5, marginTop: 2 }}>{c.who}</div>
                          <div style={{ color: G, fontWeight: 700, marginTop: 5, fontSize: 10.5 }}>{c.val}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f5f6fb', borderRadius: 10, border: '1px solid #e6e8f0' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#7a809a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Quarter Forecast</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0c1030', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>Rp 1.18 B</div>
                  </div>
                  <div style={{ flex: 1, height: 7, borderRadius: 4, background: '#e6e8f0', overflow: 'hidden' }}>
                    <div className="sol-meter-bar" style={{ height: '100%', background: `linear-gradient(90deg,${N},#2a39a8)`, width: '74%', borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 12, color: G, fontWeight: 700 }}>+24% vs Q1</div>
                </div>
              </div>
            </div>
          </section>

          {/* MODULE 2: MARKETING */}
          <section id="marketing" style={{ padding: '120px 32px', background: '#f5f6fb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 80, alignItems: 'center', maxWidth: 1240, margin: '0 auto' }}>
              {/* Vis first on even */}
              <div data-reveal="scale" style={{ background: '#fff', border: '1px solid #e6e8f0', borderRadius: 18, padding: 22, boxShadow: '0 30px 60px -28px rgba(20,26,77,.18)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#0c1030' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: G }} />
                    Channel Attribution · Last 30 days
                  </div>
                  <div style={{ display: 'inline-flex', background: '#f5f6fb', border: '1px solid #e6e8f0', borderRadius: 6, padding: 2, fontSize: 10.5, fontWeight: 600 }}>
                    <span style={{ padding: '4px 7px', borderRadius: 4, color: '#7a809a' }}>ROAS</span>
                    <span style={{ padding: '4px 7px', borderRadius: 4, background: N, color: '#fff' }}>Revenue</span>
                    <span style={{ padding: '4px 7px', borderRadius: 4, color: '#7a809a' }}>CAC</span>
                  </div>
                </div>
                {[
                  { ic: 'in', icBg: '#e6f7ee', icColor: G, nm: 'LinkedIn Ads', meta: 'Sponsored Content · 4 campaigns', barW: '88%', barColor: G, roas: '5.4×', up: true },
                  { ic: '@', icBg: '#eef0fa', icColor: N, nm: 'Email Nurture', meta: '12 sequences · 8.4K contacts', barW: '72%', barColor: N, roas: '4.1×', up: true },
                  { ic: 'f', icBg: '#ffeadb', icColor: '#d27a3a', nm: 'Meta Ads', meta: '6 active · retargeting', barW: '46%', barColor: '#ffb38a', roas: '2.2×', up: true },
                  { ic: 'G', icBg: '#fee9ee', icColor: R, nm: 'Google Search', meta: 'Brand + non-brand', barW: '24%', barColor: R, roas: '0.8×', up: false },
                  { ic: 'w', icBg: '#eef0fa', icColor: N, nm: 'WhatsApp Outreach', meta: 'Direct + community', barW: '62%', barColor: G, roas: '3.6×', up: true },
                ].map((row) => (
                  <div key={row.nm} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #e6e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: row.icBg, color: row.icColor, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{row.ic}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, letterSpacing: '-0.01em' }}>{row.nm}</div>
                        <div style={{ fontSize: 11, color: '#9aa0bb', marginTop: 1 }}>{row.meta}</div>
                      </div>
                    </div>
                    <div style={{ width: 140, height: 8, borderRadius: 4, background: '#e6e8f0', overflow: 'hidden' }}>
                      <div className="sol-attr-bar" style={{ height: '100%', borderRadius: 4, background: row.barColor, width: row.barW }} />
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, textAlign: 'right', minWidth: 64, color: row.up ? G : R }}>{row.roas}</div>
                  </div>
                ))}
              </div>

              <div>
                <div data-reveal="up" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: N, marginBottom: 14 }}>
                  <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, fontSize: 48, color: N, letterSpacing: '-0.02em', lineHeight: 0.8, marginRight: 4 }}>02</span>
                  Marketing Performance
                </div>
                <h2 data-reveal="up" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: '-0.025em', fontWeight: 700 }}>
                  See what actually drove revenue.{' '}
                  <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: N }}>Not just clicks.</span>
                </h2>
                <p data-reveal="up" style={{ marginTop: 18, fontSize: 18, color: '#5a6178', lineHeight: 1.6, maxWidth: 520 }}>
                  Connect every dollar of ad spend directly to closed-won deals. Multi-touch attribution built in — so you double down on what works, and shut off what doesn't.
                </p>
                <ul data-stagger style={{ margin: '28px 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['Multi-touch attribution across every paid & organic channel', 'Real-time ROAS and CAC computed per campaign and cohort', 'Campaign-to-revenue dashboards your CFO will actually trust', 'Auto-flag campaigns under your ROAS threshold'].map((f) => (
                    <li key={f} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, color: '#3a4060', lineHeight: 1.5 }}>
                      <span style={{ width: 22, height: 22, flexShrink: 0, marginTop: 1, borderRadius: 7, background: '#e6f7ee', display: 'grid', placeItems: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 6-7" stroke="#1aa86b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div data-reveal="up" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 20px 14px 18px', background: '#fff', border: '1px solid #d6e8de', borderLeft: `4px solid ${G}`, borderRadius: 12, boxShadow: `0 8px 20px -12px rgba(26,168,107,.25)` }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: '#e6f7ee', color: G, display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>⊘</span>
                  <div>
                    <div style={{ fontSize: 13.5, color: '#5a6178', fontWeight: 500 }}>Average customer outcome</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0c1030', letterSpacing: '-0.01em' }}>Eliminate ~32% wasted ad spend</div>
                  </div>
                </div>
                <div data-reveal="up" style={{ marginTop: 24 }}>
                  <Link to="/pricing" className="sol-module-cta">See pricing for Marketing</Link>
                </div>
              </div>
            </div>
          </section>

          {/* MODULE 3: TEAM */}
          <section id="team" style={{ padding: '120px 32px', background: '#fff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 80, alignItems: 'center', maxWidth: 1240, margin: '0 auto' }}>
              <div>
                <div data-reveal="up" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: N, marginBottom: 14 }}>
                  <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, fontSize: 48, color: N, letterSpacing: '-0.02em', lineHeight: 0.8, marginRight: 4 }}>03</span>
                  Team Performance
                </div>
                <h2 data-reveal="up" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: '-0.025em', fontWeight: 700 }}>
                  Coach with data.{' '}
                  <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: N }}>Not vibes.</span>
                </h2>
                <p data-reveal="up" style={{ marginTop: 18, fontSize: 18, color: '#5a6178', lineHeight: 1.6, maxWidth: 520 }}>
                  Align every rep to top-level goals. Track output. Manage workload. Build a culture of transparent accountability — without the awkward weekly stand-up.
                </p>
                <ul data-stagger style={{ margin: '28px 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['OKR tracking with individual KPI alignment', 'Workload balancing and capacity planning', 'Automated status reports — daily stand-ups in 10 seconds', 'Activity-to-outcome scoring per rep, per quarter'].map((f) => (
                    <li key={f} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, color: '#3a4060', lineHeight: 1.5 }}>
                      <span style={{ width: 22, height: 22, flexShrink: 0, marginTop: 1, borderRadius: 7, background: '#e6f7ee', display: 'grid', placeItems: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 6-7" stroke="#1aa86b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div data-reveal="up" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 20px 14px 18px', background: '#fff', border: '1px solid #d6e8de', borderLeft: `4px solid ${G}`, borderRadius: 12, boxShadow: `0 8px 20px -12px rgba(26,168,107,.25)` }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: '#e6f7ee', color: G, display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>↓</span>
                  <div>
                    <div style={{ fontSize: 13.5, color: '#5a6178', fontWeight: 500 }}>Average customer outcome</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0c1030', letterSpacing: '-0.01em' }}>−30% sync meetings, same output</div>
                  </div>
                </div>
                <div data-reveal="up" style={{ marginTop: 24 }}>
                  <Link to="/pricing" className="sol-module-cta">See pricing for Teams</Link>
                </div>
              </div>

              {/* Team Visualization */}
              <div data-reveal="scale" style={{ background: '#fff', border: '1px solid #e6e8f0', borderRadius: 18, padding: 22, boxShadow: '0 30px 60px -28px rgba(20,26,77,.18)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#0c1030' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: G }} />
                    Team Performance · This Quarter
                  </div>
                  <div style={{ display: 'inline-flex', background: '#f5f6fb', border: '1px solid #e6e8f0', borderRadius: 6, padding: 2, fontSize: 10.5, fontWeight: 600 }}>
                    <span style={{ padding: '4px 7px', borderRadius: 4, color: '#7a809a' }}>Daily</span>
                    <span style={{ padding: '4px 7px', borderRadius: 4, color: '#7a809a' }}>Weekly</span>
                    <span style={{ padding: '4px 7px', borderRadius: 4, background: N, color: '#fff' }}>Quarterly</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { initials: 'KP', gradient: 'linear-gradient(135deg,#cdd2ee,#7e8ad4)', nm: 'Kevin Park', role: 'Senior AE · Enterprise', val: 'Rp 1.2B', lbl: 'Closed', pill: '+38%', up: true },
                    { initials: 'JM', gradient: 'linear-gradient(135deg,#f5d0a3,#e0a058)', nm: 'Jennifer Martinez', role: 'AE · Mid-Market', val: 'Rp 680M', lbl: 'Closed', pill: '+22%', up: true },
                    { initials: 'RS', gradient: 'linear-gradient(135deg,#a8e6c5,#36a674)', nm: 'Rina Sari', role: 'SDR · Inbound', val: '142', lbl: 'Qualified', pill: '+14%', up: true },
                    { initials: 'MT', gradient: 'linear-gradient(135deg,#dbe1ff,#5868d6)', nm: 'Mark Thompson', role: 'AE · SMB', val: 'Rp 320M', lbl: 'Closed', pill: '+2%', up: false },
                  ].map((r) => (
                    <div key={r.nm} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 14, alignItems: 'center', padding: '12px 14px', background: '#f5f6fb', border: '1px solid #e6e8f0', borderRadius: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: r.gradient, fontSize: 11, color: '#fff', fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{r.initials}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{r.nm}</div>
                        <div style={{ fontSize: 11, color: '#9aa0bb', marginTop: 1 }}>{r.role}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0c1030', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{r.val}</div>
                        <div style={{ fontSize: 10, color: '#9aa0bb', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{r.lbl}</div>
                      </div>
                      <span style={{ padding: '5px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', background: r.up ? '#e6f7ee' : '#fff5e0', color: r.up ? G : A }}>{r.pill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* MODULE 4: EXECUTIVE */}
          <section id="exec" style={{ padding: '120px 32px', background: '#f5f6fb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 80, alignItems: 'center', maxWidth: 1240, margin: '0 auto' }}>
              {/* Vis first */}
              <div data-reveal="scale" style={{ background: '#fff', border: '1px solid #e6e8f0', borderRadius: 18, padding: 22, boxShadow: '0 30px 60px -28px rgba(20,26,77,.18)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#0c1030' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: G }} />
                    Executive Overview · Q2 2026
                  </div>
                  <div style={{ display: 'inline-flex', background: '#f5f6fb', border: '1px solid #e6e8f0', borderRadius: 6, padding: 2, fontSize: 10.5, fontWeight: 600 }}>
                    <span style={{ padding: '4px 7px', borderRadius: 4, color: '#7a809a' }}>30D</span>
                    <span style={{ padding: '4px 7px', borderRadius: 4, background: N, color: '#fff' }}>QTR</span>
                    <span style={{ padding: '4px 7px', borderRadius: 4, color: '#7a809a' }}>YTD</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { l: 'ARR', v: 'Rp 24.8B', d: '↑ +18.4% QoQ', up: true },
                    { l: 'Net Revenue', v: 'Rp 6.1B', d: '↑ +12.2%', up: true },
                    { l: 'Burn Rate', v: 'Rp 1.4B', d: '↓ −8.1%', up: false },
                    { l: 'CAC : LTV', v: '1 : 4.6', d: '↑ healthy', up: true },
                  ].map((k) => (
                    <div key={k.l} style={{ padding: '12px 14px', background: '#f5f6fb', border: '1px solid #e6e8f0', borderRadius: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa0bb', textTransform: 'uppercase', letterSpacing: '.07em' }}>{k.l}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2, fontVariantNumeric: 'tabular-nums', color: '#0c1030' }}>{k.v}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: k.up ? G : R }}>{k.d}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: 14, background: '#f5f6fb', border: '1px solid #e6e8f0', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: '#0c1030', marginBottom: 6 }}>
                    Revenue Trend · Last 12 weeks
                    <span style={{ fontSize: 10.5, color: '#9aa0bb', fontWeight: 500 }}>+38% vs prev</span>
                  </div>
                  <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{ width: '100%', height: 120, display: 'block' }}>
                    <defs>
                      <linearGradient id="execg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1d2879" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#1d2879" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <path d="M0,90 L40,82 L80,76 L120,68 L160,72 L200,58 L240,46 L280,40 L320,30 L360,22 L400,12 L400,120 L0,120 Z" fill="url(#execg)" />
                    <path d="M0,90 L40,82 L80,76 L120,68 L160,72 L200,58 L240,46 L280,40 L320,30 L360,22 L400,12" fill="none" stroke="#1d2879" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="400" cy="12" r="4" fill="#1d2879" />
                    <circle cx="400" cy="12" r="8" fill="#1d2879" opacity={0.2} />
                  </svg>
                </div>
              </div>

              <div>
                <div data-reveal="up" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: N, marginBottom: 14 }}>
                  <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, fontSize: 48, color: N, letterSpacing: '-0.02em', lineHeight: 0.8, marginRight: 4 }}>04</span>
                  Executive Dashboard
                </div>
                <h2 data-reveal="up" style={{ fontSize: 42, lineHeight: 1.08, letterSpacing: '-0.025em', fontWeight: 700 }}>
                  The single source of truth{' '}
                  <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: N }}>your board has been asking for.</span>
                </h2>
                <p data-reveal="up" style={{ marginTop: 18, fontSize: 18, color: '#5a6178', lineHeight: 1.6, maxWidth: 520 }}>
                  One screen. Every metric that matters. Built for founders, CROs, and anyone who needs the number before the meeting — not five days after.
                </p>
                <ul data-stagger style={{ margin: '28px 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['Consolidated P&L and growth charts, refreshed live', 'Cross-departmental performance comparison', 'Predictive modeling for fundraising and runway', 'Board-ready exports in one click'].map((f) => (
                    <li key={f} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 15, color: '#3a4060', lineHeight: 1.5 }}>
                      <span style={{ width: 22, height: 22, flexShrink: 0, marginTop: 1, borderRadius: 7, background: '#e6f7ee', display: 'grid', placeItems: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 6-7" stroke="#1aa86b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div data-reveal="up" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 20px 14px 18px', background: '#fff', border: '1px solid #d6e8de', borderLeft: `4px solid ${G}`, borderRadius: 12, boxShadow: `0 8px 20px -12px rgba(26,168,107,.25)` }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: '#e6f7ee', color: G, display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>⚡</span>
                  <div>
                    <div style={{ fontSize: 13.5, color: '#5a6178', fontWeight: 500 }}>Average customer outcome</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0c1030', letterSpacing: '-0.01em' }}>−50% time-to-decision on key calls</div>
                  </div>
                </div>
                <div data-reveal="up" style={{ marginTop: 24 }}>
                  <Link to="/pricing" className="sol-module-cta">See pricing for Executives</Link>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* STATS BAND */}
        <section style={{ padding: '120px 32px', background: '#fff', textAlign: 'center' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <span data-reveal="up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: '#eef0fa', color: N, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: N, boxShadow: `0 0 0 4px rgba(29,40,121,.15)` }} />
              What customers report
            </span>
            <h2 data-reveal="up" style={{ marginTop: 18, fontSize: 48, lineHeight: 1.08, letterSpacing: '-0.03em', fontWeight: 700, maxWidth: 760, margin: '18px auto 0' }}>
              Solutions that <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: N }}>move the number.</span>
            </h2>
            <div data-stagger style={{ marginTop: 64, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
              {[
                { count: 24, unit: '%', lbl: 'Faster sales velocity within 90 days' },
                { count: 32, unit: '%', lbl: 'Wasted ad spend eliminated' },
                { count: 30, unit: '%', lbl: 'Fewer status meetings per week' },
                { count: 50, unit: '%', lbl: 'Faster decisions on critical calls' },
              ].map(({ count, unit, lbl }) => (
                <div key={lbl} style={{ textAlign: 'center' }}>
                  <div data-count={count} style={{ fontSize: 64, fontWeight: 700, letterSpacing: '-0.04em', color: N, lineHeight: 1 }}>
                    <span className="stat-num-val">0</span><span className="stat-unit" style={{ fontSize: 32, fontWeight: 600 }}>{unit}</span>
                  </div>
                  <div style={{ marginTop: 12, color: '#5a6178', fontSize: 15, fontWeight: 500 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROLES STRIP */}
        <section style={{ padding: '120px 32px', background: '#f5f6fb' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span data-reveal="up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: '#eef0fa', color: N, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: N, boxShadow: `0 0 0 4px rgba(29,40,121,.15)` }} />
                Built for Every Role
              </span>
              <h2 data-reveal="up" style={{ marginTop: 18, fontSize: 48, lineHeight: 1.08, letterSpacing: '-0.03em', fontWeight: 700 }}>
                Tools tailored to <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: N }}>your role</span> in the org.
              </h2>
              <p data-reveal="up" style={{ marginTop: 18, fontSize: 18, color: '#5a6178', lineHeight: 1.6 }}>Same platform. Different superpowers — depending on who's looking.</p>
            </div>
            <div data-stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
              {[
                { ic: '$', icBg: '#e6f7ee', icColor: G, title: 'Sales Teams', body: 'Close deals faster with data-driven pipeline management and intelligent outreach automation.' },
                { ic: '◔', icBg: '#e7ebff', icColor: N, title: 'Marketing Teams', body: 'Prove your ROI with granular attribution and real-time campaign-level performance.' },
                { ic: '▤', icBg: '#ffeadb', icColor: '#d27a3a', title: 'Founders & Managers', body: "Get the bird's-eye view you need to make high-stakes decisions with confidence." },
                { ic: '◉', icBg: '#fee9ee', icColor: R, title: 'Agencies', body: 'Manage every client portfolio from one workspace — branded reports, isolated data, clean handoffs.' },
              ].map(({ ic, icBg, icColor, title, body }) => (
                <div key={title} className="sol-role-tile" style={{ background: '#fff', border: '1px solid #e6e8f0', borderRadius: 18, padding: 28 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: icBg, color: icColor, display: 'grid', placeItems: 'center', marginBottom: 18, fontSize: 18, fontWeight: 700 }}>{ic}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.025em' }}>{title}</h3>
                  <p style={{ margin: 0, color: '#5a6178', fontSize: 14, lineHeight: 1.55 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section style={{ padding: '140px 32px' }}>
          <div data-reveal="scale" className="sol-final-card" style={{ maxWidth: 1180, margin: '0 auto', background: N, color: '#fff', borderRadius: 32, padding: '80px 64px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>Ready When You Are</span>
            <h2 style={{ marginTop: 18, color: '#fff', fontSize: 56, letterSpacing: '-0.03em', fontWeight: 700 }}>
              Start operating with <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400 }}>clarity.</span>
            </h2>
            <p style={{ fontSize: 18, color: '#cdd1eb', maxWidth: 600, margin: '0 auto 40px' }}>Move from chaotic growth to predictable scaling. Free for up to 3 users. No card required.</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px 22px', borderRadius: 12, fontWeight: 600, fontSize: 15, background: '#fff', color: N, textDecoration: 'none', boxShadow: '0 2px 4px rgba(20,26,77,.25)' }}>Get Started Free →</Link>
              <Link to="/login" className="sol-btn-ghost-inv" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px 22px', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Book a Demo</Link>
            </div>
            <div style={{ marginTop: 24, fontSize: 13, color: '#a8aed6', display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
              <span>✓ Free for up to 3 users</span>
              <span>✓ 14-day Performance trial</span>
              <span>✓ Cancel anytime</span>
            </div>
          </div>
        </section>

        <LandingFooter />
      </div>
    </>
  );
}
