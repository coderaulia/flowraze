import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LandingHeader, LandingFooter, LandingButton, Eyebrow } from '@/components/landing';
import { SEO } from '@/components/SEO';
import '@/components/landing/landing.css';

const ROLE_DATA: Record<string, { h: string; p: string; ul: string[] }> = {
  sales: {
    h: 'Close more deals — without chasing dashboards.',
    p: 'Give every rep a real-time view of where each deal stands, what to do next, and which conversations actually matter today.',
    ul: [
      'Automated pipeline stage tracking with deal health scoring',
      'Smart follow-up reminders based on actual rep activity',
      'Forecasts grounded in conversion data — not gut feel',
    ],
  },
  marketing: {
    h: 'Prove your worth with attribution that actually adds up.',
    p: 'Connect every campaign — from ads to email — directly to closed revenue. Multi-touch by default, no extra setup required.',
    ul: [
      'Multi-touch attribution across every channel',
      'Real-time ROAS and CAC by campaign',
      'Campaign-to-revenue dashboards your CFO will trust',
    ],
  },
  founders: {
    h: 'The single source of truth your board has been asking for.',
    p: 'One screen. Every metric. Get the numbers your business actually runs on — without waiting for someone to send the deck.',
    ul: [
      'Consolidated revenue, pipeline, and team output',
      'Cross-departmental performance comparison',
      'Predictive modeling for fundraising and planning',
    ],
  },
  agencies: {
    h: 'Manage every client portfolio from one unified workspace.',
    p: 'Run multiple clients without juggling logins or rebuilding reports. Branded dashboards, role-based access, and clean handoffs.',
    ul: [
      'Multi-client workspaces with isolated data',
      'White-label reporting and client portals',
      'Automated weekly performance digests',
    ],
  },
};

export function LandingPage() {
  const [activeRole, setActiveRole] = useState('sales');
  const [roleTransitioning, setRoleTransitioning] = useState(false);
  const [displayedRole, setDisplayedRole] = useState('sales');
  const [swapMode, setSwapMode] = useState<'without' | 'with'>('without');

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('lp-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    document
      .querySelectorAll('[data-reveal],[data-stagger]')
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const cIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const target = parseFloat(el.dataset.count ?? '0');
          const unit = el.dataset.unit ?? '';
          const dur = 1400;
          const start = performance.now();
          const frame = (now: number) => {
            const t = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - t, 3);
            const v = target * eased;
            const display =
              target % 1 === 0 ? Math.round(v).toString() : v.toFixed(1);
            el.textContent = display + unit;
            if (t < 1) requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
          cIO.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll('[data-count]').forEach((c) => cIO.observe(c));
    return () => cIO.disconnect();
  }, []);

  function switchRole(role: string) {
    if (role === activeRole) return;
    setActiveRole(role);
    setRoleTransitioning(true);
    setTimeout(() => {
      setDisplayedRole(role);
      setRoleTransitioning(false);
    }, 180);
  }

  const role = ROLE_DATA[displayedRole];

  return (
    <div className="lp-root">
      <SEO 
        title="CRM & Operations Analytics for Modern Teams" 
        description="FlowRaze unifies sales, marketing, and team performance into one clear system. Stop juggling dashboards. Start making decisions that move the number."
      />
      <LandingHeader />

      {/* HERO */}
      <section className="lp-hero lp-section">
        <div className="lp-hero-bg">
          <div className="lp-hero-grid" />
        </div>
        <div className="lp-container lp-hero-inner">
          <div>
            <Eyebrow data-reveal="up">Built for Modern Revenue Teams</Eyebrow>
            <h1 data-reveal="up" style={{ marginTop: 22 }}>
              See what's{' '}
              <span className="lp-accent lp-hero-accent">driving revenue</span>
              <br />— and what's holding it back.
            </h1>
            <p className="lp-lead" data-reveal="up" style={{ marginTop: 24 }}>
              FlowRaze unifies sales, marketing, and team performance into one clear system.
              Stop juggling dashboards. Start making decisions that move the number.
            </p>
            <p className="lp-hero-meta lp-serif" data-reveal="up">
              No more scattered data. Just clarity, control, and consistent growth.
            </p>
            <div className="lp-hero-ctas" data-reveal="up">
              <LandingButton asChild size="lg">
                <Link to="/register">Start Free — No Card Required →</Link>
              </LandingButton>
              <LandingButton variant="ghost" size="lg">▶ Watch 2-min Demo</LandingButton>
            </div>
            <div className="lp-hero-trust" data-reveal="up">
              <div className="lp-avatars">
                <span /><span /><span /><span />
              </div>
              <div>
                <div className="lp-stars">★★★★★</div>
                <div>Trusted by <strong style={{ color: '#0c1030' }}>2,400+</strong> revenue teams</div>
              </div>
            </div>
          </div>

          <div data-reveal="scale" style={{ position: 'relative' }}>
            <div className="lp-app-shell">
              <aside className="lp-app-side">
                <div className="lp-app-logo">
                  <span className="lp-app-logo-mark" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1d2879', letterSpacing: '-.01em' }}>FlowRaze</div>
                    <div style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '.12em', color: '#7a809a', marginTop: 3 }}>GROWTH ENGINE</div>
                  </div>
                </div>
                <div className="lp-side-item active">⌗ Dashboard</div>
                <div className="lp-side-item">◎ Targets</div>
                <div className="lp-side-item">◔ Leads</div>
                <div className="lp-side-item">▤ Deals</div>
                <div className="lp-side-item">◇ Campaigns</div>
              </aside>
              <div className="lp-app-main">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="lp-search-pill">⌕ Search CRM…</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: '#0c1030' }}>Super Admin</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <h4 style={{ fontSize: 15, letterSpacing: '-.02em', margin: 0, color: '#0c1030', fontWeight: 700 }}>Performance Overview</h4>
                  <div className="lp-range-tabs">
                    <span>7D</span><span className="on">30D</span><span>90D</span><span>12M</span>
                  </div>
                </div>
                <div className="lp-kpi-row">
                  <div className="lp-kpi">
                    <div className="lp-kpi-head"><span className="lp-kpi-ic green">$</span><span className="lp-live-pill">Live</span></div>
                    <div className="lbl">Won Revenue</div>
                    <div className="val">Rp 35.0M</div>
                    <div className="sub">Closed-won deal value</div>
                  </div>
                  <div className="lp-kpi">
                    <div className="lp-kpi-head"><span className="lp-kpi-ic blue">◔</span><span className="lp-live-pill">Live</span></div>
                    <div className="lbl">New Leads</div>
                    <div className="val">3</div>
                    <div className="sub">Leads created in range</div>
                  </div>
                  <div className="lp-kpi">
                    <div className="lp-kpi-head"><span className="lp-kpi-ic peach">▤</span><span className="lp-live-pill">Live</span></div>
                    <div className="lbl">Conversion</div>
                    <div className="val">33.3%</div>
                    <div className="sub">Won deals ÷ leads</div>
                  </div>
                </div>
                <div className="lp-chart-card">
                  <div className="lp-chart-head">
                    <div className="lp-chart-ttl"><span className="lp-green-dot" />Leads by Source</div>
                  </div>
                  <div className="lp-bars">
                    <div className="lp-bar-col"><div className="lp-bar-stack"><div className="lp-bar" style={{ height: '60%' }} /></div><div className="lp-bar-lbl">LinkedIn</div></div>
                    <div className="lp-bar-col"><div className="lp-bar-stack"><div className="lp-bar green" style={{ height: '78%' }} /></div><div className="lp-bar-lbl">Referral</div></div>
                    <div className="lp-bar-col"><div className="lp-bar-stack"><div className="lp-bar peach" style={{ height: '50%' }} /></div><div className="lp-bar-lbl">Website</div></div>
                    <div className="lp-bar-col"><div className="lp-bar-stack"><div className="lp-bar" style={{ height: '42%' }} /></div><div className="lp-bar-lbl">Ads</div></div>
                    <div className="lp-bar-col"><div className="lp-bar-stack"><div className="lp-bar green" style={{ height: '34%' }} /></div><div className="lp-bar-lbl">Email</div></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lp-float-card deal">
              <div className="lp-float-ico">$</div>
              <div>
                <div className="lp-float-t">Deal Won — Rp 35.0M</div>
                <div className="lp-float-s">Growth Package · Kevin Park</div>
              </div>
            </div>
            <div className="lp-float-card alert">
              <div className="lp-float-ico">⚡</div>
              <div>
                <div className="lp-float-t">Conversion +4.8 pts MoM</div>
                <div className="lp-float-s">Q2 — pacing above target</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <section className="lp-logos">
        <div className="lp-container">
          <div className="lp-logos-lab" data-reveal="fade">Trusted by growing teams across Indonesia</div>
          <div className="lp-logos-row" data-stagger>
            <div className="lp-logo-mark">◆ NORTHWIND</div>
            <div className="lp-logo-mark">⬢ Stratos</div>
            <div className="lp-logo-mark">◐ Lumino</div>
            <div className="lp-logo-mark">▲ Ascend.io</div>
            <div className="lp-logo-mark">⬣ Velora</div>
            <div className="lp-logo-mark">◉ Helix Co.</div>
          </div>
        </div>
      </section>

      {/* PAIN → GAIN */}
      <section className="lp-split">
        <div className="lp-container lp-split-grid">
          <div>
            <Eyebrow data-reveal="up">The Real Problem</Eyebrow>
            <h2 data-reveal="up" style={{ marginTop: 18 }}>
              Your data isn't the issue.<br />
              Your <span className="lp-serif lp-accent">disconnected tools</span> are.
            </h2>
            <p className="lp-lead" data-reveal="up" style={{ marginTop: 18 }}>
              Every Monday, your team rebuilds the same spreadsheets. Every quarter, you reconcile numbers
              that should already agree. FlowRaze ends the data gymnastics — for good.
            </p>
          </div>
          <div data-stagger>
            <div className="lp-swap-tabs" data-reveal="up">
              <button
                className={swapMode === 'without' ? 'active' : ''}
                onClick={() => setSwapMode('without')}
              >Without FlowRaze</button>
              <button
                className={swapMode === 'with' ? 'active' : ''}
                onClick={() => setSwapMode('with')}
              >With FlowRaze</button>
            </div>
            <div className="lp-split-list">
              {swapMode === 'without' ? (
                <>
                  <div className="lp-pain-row"><span className="lp-pain-icon">✕</span>Sales numbers don't match marketing's report</div>
                  <div className="lp-pain-row"><span className="lp-pain-icon">✕</span>6 different tools, 0 shared source of truth</div>
                  <div className="lp-pain-row"><span className="lp-pain-icon">✕</span>Forecasts based on gut feel, not pipeline data</div>
                </>
              ) : (
                <>
                  <div className="lp-gain-row"><span className="lp-gain-icon">✓</span>One dashboard. Every team. Same numbers.</div>
                  <div className="lp-gain-row"><span className="lp-gain-icon">✓</span>Real-time pipeline forecasting from day one</div>
                  <div className="lp-gain-row"><span className="lp-gain-icon">✓</span>Your team ships decisions, not status updates</div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-features">
        <div className="lp-container">
          <div className="lp-features-head">
            <div>
              <Eyebrow data-reveal="up">The Platform</Eyebrow>
              <h2 data-reveal="up" style={{ marginTop: 18 }}>
                Built for how your business <span className="lp-serif lp-accent">actually runs.</span>
              </h2>
            </div>
            <p className="lp-lead" data-reveal="up">
              Six purposeful modules. Zero bloat. Each one solves a specific revenue problem,
              and they all speak the same language.
            </p>
          </div>
          <div className="lp-feat-grid" data-stagger>
            <div className="lp-feat big">
              <div className="lp-feat-ico">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 17l4-4 4 4 7-7" /><path d="M14 6h7v7" />
                </svg>
              </div>
              <h3>Sales Pipeline that forecasts itself.</h3>
              <p>Track every deal from first touch to closed-won. AI-assisted scoring tells you which deals are real — and which need rescue.</p>
              <div className="lp-mini-vis lp-kanban">
                <div className="lp-kb-col">
                  <div className="lp-kb-head"><span className="lp-sd" />Qualified<span className="lp-kb-amt">Rp 75M</span></div>
                  <div className="lp-kb-card"><div className="lp-kb-ttl">Logistics Platform</div><div className="lp-kb-name">Mark Thompson</div><div className="lp-kb-val">Rp 60.000.000</div></div>
                  <div className="lp-kb-card"><div className="lp-kb-ttl">Starter Package</div><div className="lp-kb-name">Jennifer Martinez</div><div className="lp-kb-val">Rp 15.000.000</div></div>
                </div>
                <div className="lp-kb-col">
                  <div className="lp-kb-head"><span className="lp-sd won" />Won<span className="lp-kb-amt">Rp 285M</span></div>
                  <div className="lp-kb-card"><div className="lp-kb-ttl">Growth Package</div><div className="lp-kb-name">Kevin Park</div><div className="lp-kb-val">Rp 35.000.000</div></div>
                  <div className="lp-kb-card"><div className="lp-kb-ttl">Annual Subscription</div><div className="lp-kb-name">William Johnson</div><div className="lp-kb-val">Rp 50.000.000</div></div>
                </div>
              </div>
            </div>
            <div className="lp-feat span-2">
              <div className="lp-feat-ico">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                </svg>
              </div>
              <h3>Real-Time Visibility</h3>
              <p>Always know what's happening — across deals, campaigns, and team output. No refresh required.</p>
            </div>
            <div className="lp-feat span-2">
              <div className="lp-feat-ico">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 12h4l3-9 4 18 3-9h4" />
                </svg>
              </div>
              <h3>Marketing Attribution</h3>
              <p>See which campaigns actually generate revenue — not just clicks. Multi-touch by default.</p>
            </div>
            <div className="lp-feat span-2">
              <div className="lp-feat-ico">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" />
                  <path d="M3 19c0-3 3-5 6-5s6 2 6 5" /><path d="M14 19c0-2 2-4 4.5-4S22 17 22 19" />
                </svg>
              </div>
              <h3>Team Performance</h3>
              <p>Measure deals closed, response time, and revenue per rep. Coach with data, not vibes.</p>
            </div>
            <div className="lp-feat span-3">
              <div className="lp-feat-ico">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16v6H4z" /><path d="M4 14h7v6H4z" /><path d="M14 14h6v6h-6z" />
                </svg>
              </div>
              <h3>Unified Executive Dashboard</h3>
              <p>One screen. Every metric that matters. Built for founders, CROs, and anyone who needs the truth before the meeting.</p>
            </div>
            <div className="lp-feat span-3">
              <div className="lp-feat-ico">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 7h16M4 12h16M4 17h10" /><circle cx="20" cy="17" r="2" />
                </svg>
              </div>
              <h3>Workflow Automation</h3>
              <p>Trigger follow-ups, route leads, escalate stuck deals — without writing a single line of code.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="lp-stats">
        <div className="lp-container">
          <Eyebrow data-reveal="up">Real Customer Outcomes</Eyebrow>
          <h2 data-reveal="up" style={{ marginTop: 18 }}>
            The numbers our customers <span className="lp-serif lp-accent">actually report.</span>
          </h2>
          <div className="lp-stat-grid" data-stagger>
            <div className="lp-stat">
              <div className="num" data-count="142.8" data-unit="%">0%</div>
              <div className="lbl">Average increase in pipeline visibility</div>
            </div>
            <div className="lp-stat">
              <div className="num" data-count="24" data-unit="%">0%</div>
              <div className="lbl">Faster sales velocity within 90 days</div>
            </div>
            <div className="lp-stat">
              <div className="num" data-count="30" data-unit="%">0%</div>
              <div className="lbl">Fewer status meetings per week</div>
            </div>
            <div className="lp-stat">
              <div className="num" data-count="6" data-unit="×">0×</div>
              <div className="lbl">Faster onboarding vs. legacy CRMs</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-flow">
        <div className="lp-container">
          <div className="lp-flow-head">
            <Eyebrow data-reveal="up">How it Works</Eyebrow>
            <h2 data-reveal="up" style={{ marginTop: 18 }}>
              Set up in an afternoon.<br />See results in <span className="lp-serif lp-accent">a week.</span>
            </h2>
            <p className="lp-lead" data-reveal="up" style={{ margin: '18px auto 0' }}>
              No 6-month rollout. No mandatory consultants. FlowRaze is engineered so your team is productive on day one.
            </p>
          </div>
          <div className="lp-steps" data-stagger>
            <div className="lp-step">
              <div className="lp-step-num">01</div>
              <h3>Connect your stack</h3>
              <p>One-click integrations with Gmail, WhatsApp Business, Meta Ads, and your existing spreadsheets.</p>
              <div className="lp-step-vis">
                <div className="lp-ssrow"><div className="av" /><div className="nm">Gmail</div><div className="tg">Connected</div></div>
                <div className="lp-ssrow"><div className="av" style={{ background: 'linear-gradient(135deg,#a8e6c5,#36a674)' }} /><div className="nm">WhatsApp Business</div><div className="tg">Connected</div></div>
                <div className="lp-ssrow"><div className="av" style={{ background: 'linear-gradient(135deg,#dbe1ff,#5868d6)' }} /><div className="nm">Meta Ads</div><div className="tg">Connected</div></div>
              </div>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">02</div>
              <h3>Map your pipeline</h3>
              <p>Drag-and-drop your stages. Bring your real process — we don't force you into someone else's.</p>
              <div className="lp-step-vis">
                <div className="lp-ssrow"><div className="av" /><div className="nm">PT Anindita</div><div className="tg cold">New Lead</div></div>
                <div className="lp-ssrow"><div className="av" style={{ background: 'linear-gradient(135deg,#f5d0a3,#e0a058)' }} /><div className="nm">Surya Mandiri</div><div className="tg warm">Discovery</div></div>
                <div className="lp-ssrow"><div className="av" style={{ background: 'linear-gradient(135deg,#a8e6c5,#36a674)' }} /><div className="nm">HyperStream Co.</div><div className="tg">Closing</div></div>
              </div>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">03</div>
              <h3>Watch the signal emerge</h3>
              <p>Within a week, your dashboard tells you the story your spreadsheets couldn't — for everyone, in real time.</p>
              <div className="lp-step-vis">
                <div className="lp-donut">
                  <svg viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#e6e8f0" strokeWidth="4" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#1d2879" strokeWidth="4" strokeDasharray="68 100" strokeDashoffset="0" transform="rotate(-90 18 18)" strokeLinecap="round" />
                  </svg>
                  <div>
                    <div className="val">68%</div>
                    <div className="v-lbl">Pipeline Health</div>
                  </div>
                </div>
                <div className="lp-ovrows">
                  <div className="lp-ovbar"><span className="nm">Hot</span><span className="pb"><i style={{ width: '78%' }} /></span><span className="v">78%</span></div>
                  <div className="lp-ovbar"><span className="nm">Warm</span><span className="pb"><i style={{ width: '54%', background: '#1aa86b' }} /></span><span className="v">54%</span></div>
                  <div className="lp-ovbar"><span className="nm">Cold</span><span className="pb"><i style={{ width: '22%', background: '#f5a524' }} /></span><span className="v">22%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="lp-quote">
        <div className="lp-container">
          <span className="lp-qmark" data-reveal="fade">"</span>
          <p className="lp-qtext" data-reveal="up">
            FlowRaze isn't just a CRM — it's a <span className="lp-qem">competitive advantage</span>.
            For the first time, we can clearly see how marketing, sales, and team performance connect — and improve them, fast.
          </p>
          <div className="lp-qauthor" data-reveal="up">
            <div className="av" />
            <div>
              <div className="nm">Budi Kurniawan</div>
              <div className="role">CTO, Vanaila Digital Indonesia</div>
            </div>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="lp-roles">
        <div className="lp-container">
          <div className="lp-roles-head">
            <Eyebrow data-reveal="up">Built for Every Role</Eyebrow>
            <h2 data-reveal="up" style={{ marginTop: 18 }}>
              One platform.<br /><span className="lp-serif lp-accent">Every revenue role.</span>
            </h2>
          </div>
          <div className="lp-role-tabs" data-reveal="up">
            {(['sales', 'marketing', 'founders', 'agencies'] as const).map((r) => (
              <button
                key={r}
                className={activeRole === r ? 'active' : ''}
                onClick={() => switchRole(r)}
              >
                {r === 'sales' ? 'For Sales Teams' : r === 'marketing' ? 'For Marketing' : r === 'founders' ? 'For Founders & Managers' : 'For Agencies'}
              </button>
            ))}
          </div>
          <div className={`lp-role-card${roleTransitioning ? ' transitioning' : ''}`} data-reveal="up">
            <div>
              <h3>{role.h}</h3>
              <p className="lead lp-lead">{role.p}</p>
              <ul>
                {role.ul.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <LandingButton asChild>
                <Link to="/register">Explore Solution →</Link>
              </LandingButton>
            </div>
            <div className="lp-role-vis">
              <div className="lp-dash-tabs">
                <span className="lp-tab active">My Deals</span>
                <span className="lp-tab">Forecast</span>
                <span className="lp-tab">Activity</span>
              </div>
              <div className="lp-ssrow"><div className="av" /><div className="nm">PT Anindita Pharma</div><div className="tg">Hot · Rp 480M</div></div>
              <div className="lp-ssrow"><div className="av" style={{ background: 'linear-gradient(135deg,#f5d0a3,#e0a058)' }} /><div className="nm">Surya Mandiri</div><div className="tg warm">Warm · Rp 320M</div></div>
              <div className="lp-ssrow"><div className="av" style={{ background: 'linear-gradient(135deg,#a8e6c5,#36a674)' }} /><div className="nm">HyperStream Co.</div><div className="tg">Closing · Rp 1.1B</div></div>
              <div className="lp-ssrow"><div className="av" style={{ background: 'linear-gradient(135deg,#dbe1ff,#5868d6)' }} /><div className="nm">Velora Group</div><div className="tg cold">Cold · Rp 220M</div></div>
              <div className="lp-next-action">
                <strong style={{ color: '#1aa86b' }}>Next best action:</strong> Send proposal to PT Anindita — last touch 5 days ago.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lp-final">
        <div className="lp-final-card" data-reveal="scale">
          <Eyebrow style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}>
            Stop Guessing. Start Growing.
          </Eyebrow>
          <h2 style={{ marginTop: 18 }}>
            Ready to see what's <span className="lp-serif">really</span> driving your revenue?
          </h2>
          <p>Set up in under 30 minutes. No credit card. No mandatory call. Just clarity.</p>
          <div className="lp-final-btns">
            <LandingButton asChild size="lg">
              <Link to="/register">Get Started Free →</Link>
            </LandingButton>
            <LandingButton variant="ghost" size="lg">Talk to a Specialist</LandingButton>
          </div>
          <div className="lp-final-meta">
            <span>✓ Free for up to 3 users</span>
            <span>✓ 14-day Performance trial</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
