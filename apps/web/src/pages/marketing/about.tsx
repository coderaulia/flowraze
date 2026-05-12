import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { LandingHeader, LandingFooter, LandingButton, Eyebrow } from '@/components/landing';
import '@/components/landing/landing.css';

const N = '#1d2879';
const G = '#1aa86b';

export function AboutPage() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('lp-in'); io.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('[data-reveal],[data-stagger]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="lp-root">
      <SEO 
        title="Our Story & Mission" 
        description="Born in Jakarta, FlowRaze is built by people who lived the spreadsheet nightmare. We help revenue teams finally see the whole picture."
      />
      <style>{`
        .abt-val-card{transition:transform .3s,box-shadow .3s}
        .abt-val-card:hover{transform:translateY(-4px);box-shadow:0 24px 50px -22px rgba(20,26,77,.18)}
        .abt-team-card{transition:transform .3s,box-shadow .3s}
        .abt-team-card:hover{transform:translateY(-4px);box-shadow:0 24px 50px -22px rgba(20,26,77,.18)}
        @keyframes abtPulse{0%{transform:scale(1);opacity:.5}100%{transform:scale(2);opacity:0}}
        .abt-pulse{animation:abtPulse 3s ease-out infinite}
        .abt-pulse-2{animation-delay:1s}
      `}</style>

      <LandingHeader />

      <main>
        {/* HERO */}
        <section style={{ padding: '80px 32px 64px', position: 'relative', overflow: 'hidden', background: '#fff' }}>
          <div className="lp-hero-bg">
            <div className="lp-hero-grid" />
          </div>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <Eyebrow data-reveal="up">Our Story</Eyebrow>
            <h1 data-reveal style={{ marginTop: 22, fontSize: 64, lineHeight: 1.04, letterSpacing: '-0.035em', fontWeight: 700 }}>
              We built FlowRaze because{' '}
              <span className="lp-serif lp-accent">we lived the pain.</span>
            </h1>
            <p data-reveal className="lp-lead" style={{ margin: '24px auto 0' }}>
              Three founders, six spreadsheets, and zero alignment — that was FlowRaze before FlowRaze. Now we help 2,400+ revenue teams finally see the whole picture.
            </p>
          </div>
        </section>

        {/* ORIGIN */}
        <section style={{ padding: '80px 32px', background: '#f5f6fb', borderTop: '1px solid #e6e8f0', borderBottom: '1px solid #e6e8f0' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <Eyebrow data-reveal="up">How We Started</Eyebrow>
              <h2 data-reveal style={{ marginTop: 18, fontSize: 42, lineHeight: 1.08, letterSpacing: '-0.025em', fontWeight: 700 }}>
                Born in a Jakarta co-working space.{' '}
                <span className="lp-serif lp-accent">Fuelled by frustration.</span>
              </h2>
              <p data-reveal style={{ marginTop: 18, fontSize: 17, color: '#5a6178', lineHeight: 1.7 }}>
                In 2023, our founding team was running growth for a mid-sized Indonesian SaaS company. Every Monday meant the same ritual: pulling numbers from four different tools, reconciling them in a shared spreadsheet, and praying the numbers matched before the board call.
              </p>
              <p data-reveal style={{ marginTop: 14, fontSize: 17, color: '#5a6178', lineHeight: 1.7 }}>
                They never did. So we built FlowRaze — a single operating system that connects sales, marketing, and team performance into one clear, live view. No more spreadsheet Mondays. No more guessing.
              </p>
            </div>
            <div data-reveal style={{ position: 'relative' }}>
              <div style={{ background: '#fff', border: '1px solid #e6e8f0', borderRadius: 20, padding: 32, boxShadow: '0 30px 60px -28px rgba(20,26,77,.15)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#9aa0bb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 20 }}>FlowRaze Timeline</div>
                {[
                  { year: '2023', label: 'Founded in Jakarta — 3 engineers, 1 shared spreadsheet nightmare', color: N },
                  { year: 'Q2 2023', label: 'First 10 beta customers from the Indonesian startup ecosystem', color: G },
                  { year: 'Q4 2023', label: 'Launched Growth tier; crossed 100 paying workspaces', color: N },
                  { year: '2024', label: 'Expanded across Southeast Asia — SG, MY, PH', color: G },
                  { year: '2025', label: '2,400+ revenue teams. 142% avg pipeline visibility increase.', color: N },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, width: 64, paddingTop: 2, fontSize: 11, fontWeight: 700, color: item.color, letterSpacing: '.04em' }}>{item.year}</div>
                    <div style={{ flex: 1, fontSize: 14, color: '#3a4060', lineHeight: 1.5, paddingLeft: 16, borderLeft: `2px solid ${item.color}30` }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section style={{ padding: '80px 32px', background: '#fff', textAlign: 'center' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <Eyebrow data-reveal="up">By The Numbers</Eyebrow>
            <div data-stagger style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
              {[
                { val: '2,400+', lbl: 'Revenue teams worldwide' },
                { val: 'Rp 12T+', lbl: 'Pipeline tracked this year' },
                { val: '98%', lbl: 'Customer retention rate' },
                { val: '<30 min', lbl: 'Average time to first value' },
              ].map(({ val, lbl }) => (
                <div key={lbl} style={{ padding: '32px 24px', background: '#f5f6fb', border: '1px solid #e6e8f0', borderRadius: 16 }}>
                  <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em', color: N, lineHeight: 1 }}>{val}</div>
                  <div style={{ marginTop: 10, color: '#5a6178', fontSize: 15, fontWeight: 500 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section style={{ padding: '80px 32px', background: '#f5f6fb', borderTop: '1px solid #e6e8f0' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <Eyebrow data-reveal="up">What We Believe</Eyebrow>
              <h2 data-reveal style={{ marginTop: 18, fontSize: 48, lineHeight: 1.08, letterSpacing: '-0.03em', fontWeight: 700 }}>
                Our values aren't a{' '}
                <span className="lp-serif lp-accent">wall poster.</span>
              </h2>
              <p data-reveal className="lp-lead" style={{ margin: '18px auto 0' }}>They're the decisions we make every day — in the product, the pricing, and the support.</p>
            </div>
            <div data-stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {[
                { ic: '◎', icBg: '#e6f7ee', icColor: G, title: 'Clarity over cleverness', body: 'Revenue data should be instantly readable. We obsess over making complex business signals obvious at a glance — no training required.' },
                { ic: '⬡', icBg: '#e7ebff', icColor: N, title: 'Honest pricing, always', body: 'Flat, predictable pricing. No seat traps. No hidden limits that only appear at scale. What you see is what you pay.' },
                { ic: '◈', icBg: '#ffeadb', icColor: '#d27a3a', title: 'Speed as a feature', body: 'Every second your team waits for a report is a second they could be selling. FlowRaze is built to be fast at every layer.' },
                { ic: '▲', icBg: '#fee9ee', icColor: '#e0386b', title: 'Customer success is our success', body: 'We win when you win. Onboarding is free. Support replies within the hour. Your pipeline velocity is our north star.' },
                { ic: '◐', icBg: '#eef0fa', icColor: N, title: 'Local insight, global quality', body: 'Built in Jakarta, used across Southeast Asia and beyond. We understand regional market dynamics — and we ship world-class software.' },
                { ic: '⊕', icBg: '#e6f7ee', icColor: G, title: 'Data privacy by design', body: 'Your customer data is yours. We never sell it, share it, or train models on it without consent. ISO 27001 certification in progress.' },
              ].map(({ ic, icBg, icColor, title, body }) => (
                <div key={title} className="abt-val-card" style={{ background: '#fff', border: '1px solid #e6e8f0', borderRadius: 18, padding: 28 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: icBg, color: icColor, display: 'grid', placeItems: 'center', marginBottom: 18, fontSize: 18, fontWeight: 700 }}>{ic}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</h3>
                  <p style={{ margin: 0, color: '#5a6178', fontSize: 14, lineHeight: 1.6 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section style={{ padding: '80px 32px', background: '#fff' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <Eyebrow data-reveal="up">The Team</Eyebrow>
              <h2 data-reveal style={{ marginTop: 18, fontSize: 48, lineHeight: 1.08, letterSpacing: '-0.03em', fontWeight: 700 }}>
                Built by people who{' '}
                <span className="lp-serif lp-accent">used to be you.</span>
              </h2>
              <p data-reveal className="lp-lead" style={{ margin: '18px auto 0' }}>Former sales reps, marketing leads, and engineers who've lived the spreadsheet nightmare. We build the tool we always wished we had.</p>
            </div>
            <div data-stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
              {[
                { initials: 'AS', gradient: 'linear-gradient(135deg,#cdd2ee,#1d2879)', name: 'Arya Santoso', role: 'Co-founder & CEO', bio: 'Ex-VP Sales at Tokopedia. Closed Rp 200B+ in enterprise deals before deciding to fix the CRM problem for everyone else.' },
                { initials: 'DL', gradient: 'linear-gradient(135deg,#a8e6c5,#1aa86b)', name: 'Diana Lim', role: 'Co-founder & CTO', bio: 'Previously led data infra at Gojek. Built FlowRaze\'s real-time pipeline engine from the ground up.' },
                { initials: 'RH', gradient: 'linear-gradient(135deg,#f5d0a3,#e0a058)', name: 'Reza Hakim', role: 'Co-founder & CPO', bio: '8 years designing B2B SaaS at Singapore and Jakarta startups. Believes every product decision is a trust decision.' },
                { initials: 'NS', gradient: 'linear-gradient(135deg,#dbe1ff,#5868d6)', name: 'Nadia Setiawan', role: 'Head of Customer Success', bio: 'Joined as the 4th employee. Obsessed with ensuring every customer hits their "aha moment" in the first session.' },
              ].map((m) => (
                <div key={m.name} className="abt-team-card" style={{ background: '#f5f6fb', border: '1px solid #e6e8f0', borderRadius: 18, padding: 28, textAlign: 'center' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: m.gradient, fontSize: 22, fontWeight: 700, color: '#fff', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>{m.initials}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{m.name}</div>
                  <div style={{ fontSize: 13, color: N, fontWeight: 600, marginTop: 4 }}>{m.role}</div>
                  <p style={{ fontSize: 13, color: '#5a6178', lineHeight: 1.55, marginTop: 12 }}>{m.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '120px 32px' }}>
          <div data-reveal className="lp-final-card" style={{ maxWidth: 1180, margin: '0 auto', borderRadius: 32, padding: '80px 64px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
            <Eyebrow style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}>Join the Team</Eyebrow>
            <h2 style={{ marginTop: 18, color: '#fff', fontSize: 56, letterSpacing: '-0.03em', fontWeight: 700 }}>
              Ready to build the future of{' '}
              <span className="lp-serif">revenue intelligence?</span>
            </h2>
            <p style={{ fontSize: 18, color: '#cdd1eb', maxWidth: 600, margin: '0 auto 40px' }}>We're hiring across engineering, design, and go-to-market. Remote-friendly, Jakarta-headquartered, Southeast Asia — first.</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/careers">
                <LandingButton variant="primary" style={{ background: '#fff', color: N }}>See Open Roles →</LandingButton>
              </Link>
              <Link to="/login">
                <LandingButton variant="ghost" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>Start for Free</LandingButton>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
