import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

const N = '#1d2879';
const G = '#1aa86b';

const JOBS = [
  { id: 1, title: 'Senior Full-Stack Engineer', dept: 'Engineering', location: 'Jakarta / Remote', type: 'Full-time', level: 'Senior', deptColor: N, deptBg: '#e7ebff' },
  { id: 2, title: 'Product Designer (0-to-1)', dept: 'Design', location: 'Jakarta / Remote', type: 'Full-time', level: 'Mid', deptColor: '#d27a3a', deptBg: '#ffeadb' },
  { id: 3, title: 'Go-To-Market Lead — SEA', dept: 'Sales', location: 'Singapore / Remote', type: 'Full-time', level: 'Senior', deptColor: G, deptBg: '#e6f7ee' },
  { id: 4, title: 'Customer Success Manager', dept: 'Customer Success', location: 'Jakarta', type: 'Full-time', level: 'Mid', deptColor: '#e0386b', deptBg: '#fee9ee' },
  { id: 5, title: 'Data / Analytics Engineer', dept: 'Engineering', location: 'Remote', type: 'Full-time', level: 'Mid-Senior', deptColor: N, deptBg: '#e7ebff' },
  { id: 6, title: 'Growth Marketing Manager', dept: 'Marketing', location: 'Jakarta / Remote', type: 'Full-time', level: 'Mid', deptColor: '#5868d6', deptBg: '#eef0fa' },
];

const DEPTS = ['All', 'Engineering', 'Design', 'Sales', 'Customer Success', 'Marketing'];

const PERKS = [
  { ic: '🌏', title: 'Remote-first', body: 'Work from anywhere in Southeast Asia. We have a Jakarta HQ for those who want it, but remote is fully supported — and celebrated.' },
  { ic: '📈', title: 'Equity for everyone', body: 'Every full-time employee gets meaningful equity. We win together, and that includes you at the cap table.' },
  { ic: '🏥', title: 'Full health coverage', body: 'Comprehensive health insurance for you and your dependents. We negotiate hard with providers so your premiums are low.' },
  { ic: '📚', title: 'Rp 12M/year learning budget', body: 'Courses, conferences, books, certifications — spend it how it helps you grow. No approval theatre.' },
  { ic: '🤝', title: 'Generous parental leave', body: '16 weeks primary, 8 weeks secondary. Fully paid. We believe parents shouldn\'t have to choose between family and career.' },
  { ic: '🎯', title: 'Async-first culture', body: 'We write things down. We don\'t schedule meetings that could be a Notion doc. Your deep work is protected.' },
];

export function CareersPage() {
  const [activeDept, setActiveDept] = useState('All');

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('[data-reveal],[data-stagger]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const filteredJobs = activeDept === 'All' ? JOBS : JOBS.filter(j => j.dept === activeDept);

  return (
    <>
      <SEO 
        title="Join the Revenue Revolution" 
        description="We're hiring! Join FlowRaze and help us build the future of revenue intelligence. We're a Jakarta-headquartered team scaling across SE Asia."
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
        [data-reveal]{opacity:0;transform:translateY(28px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
        [data-reveal].in{opacity:1;transform:none}
        [data-stagger]>*{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}
        [data-stagger].in>*{opacity:1;transform:none}
        [data-stagger].in>*:nth-child(1){transition-delay:.05s}
        [data-stagger].in>*:nth-child(2){transition-delay:.12s}
        [data-stagger].in>*:nth-child(3){transition-delay:.19s}
        [data-stagger].in>*:nth-child(4){transition-delay:.26s}
        [data-stagger].in>*:nth-child(5){transition-delay:.33s}
        [data-stagger].in>*:nth-child(6){transition-delay:.40s}
        .car-logo-dot{width:22px;height:22px;border-radius:7px;background:#1d2879;position:relative;overflow:hidden;flex-shrink:0}
        .car-logo-dot::before{content:"";position:absolute;inset:5px 4px 4px 5px;background:#fff;border-radius:3px;clip-path:polygon(0 60%,40% 60%,40% 0,70% 0,70% 40%,100% 40%,100% 100%,0 100%)}
        .car-job-row{transition:background .2s,box-shadow .2s;cursor:pointer}
        .car-job-row:hover{background:#f0f2fd;box-shadow:0 4px 16px -8px rgba(20,26,77,.15)}
        .car-dept-btn{padding:8px 16px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s,color .2s;border:1px solid #e6e8f0;background:#fff;color:#5a6178}
        .car-dept-btn.active{background:#1d2879;color:#fff;border-color:#1d2879}
        .car-dept-btn:hover:not(.active){background:#f5f6fb;color:#1d2879}
        .car-perk-card{transition:transform .3s,box-shadow .3s}
        .car-perk-card:hover{transform:translateY(-4px);box-shadow:0 24px 50px -22px rgba(20,26,77,.18)}
        .car-cta::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 15% 30%,rgba(94,114,228,.45),transparent 40%),radial-gradient(circle at 85% 70%,rgba(45,202,140,.3),transparent 40%);pointer-events:none}
        .car-ghost-btn{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.3);padding:14px 22px;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;transition:background .2s}
        .car-ghost-btn:hover{background:rgba(255,255,255,.08)}
      `}</style>

      <div style={{ minHeight: '100vh', background: '#fff', fontFamily: '"Inter", system-ui, sans-serif', color: '#0c1030' }}>

        {/* NAV */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.88)', backdropFilter: 'saturate(180%) blur(14px)', borderBottom: '1px solid #e6e8f0' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 48, height: 64 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 20, color: N, letterSpacing: '-0.01em', textDecoration: 'none' }}>
              <span className="car-logo-dot" />FlowRaze
            </Link>
            <div style={{ display: 'flex', gap: 36, fontSize: 14.5, fontWeight: 500, color: '#3a4060' }}>
              <Link to="/" style={{ color: '#3a4060', textDecoration: 'none' }}>Features</Link>
              <Link to="/solutions" style={{ color: '#3a4060', textDecoration: 'none' }}>Solutions</Link>
              <Link to="/pricing" style={{ color: '#3a4060', textDecoration: 'none' }}>Pricing</Link>
              <Link to="/careers" style={{ color: N, fontWeight: 600, textDecoration: 'none' }}>Careers</Link>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18, fontSize: 14.5, fontWeight: 500 }}>
              <Link to="/login" style={{ color: '#3a4060', textDecoration: 'none' }}>Log In</Link>
              <Link to="/login" style={{ background: N, color: '#fff', padding: '10px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none', boxShadow: '0 1px 2px rgba(20,26,77,.2),0 6px 18px -8px rgba(20,26,77,.45)' }}>Start Trial</Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ padding: '80px 32px 64px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: '50%', top: -200, width: 1100, height: 1100, transform: 'translateX(-50%)', background: 'radial-gradient(closest-side,rgba(29,40,121,.07),transparent 70%)' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(230,232,240,1) 1px,transparent 1px),linear-gradient(90deg,rgba(230,232,240,1) 1px,transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%,black 30%,transparent 75%)', opacity: 0.45 }} />
          </div>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <span data-reveal style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: '#e6f7ee', color: G, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: G }} />{JOBS.length} Open Roles
            </span>
            <h1 data-reveal style={{ marginTop: 22, fontSize: 64, lineHeight: 1.04, letterSpacing: '-0.035em', fontWeight: 700 }}>
              Build the future of{' '}
              <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: N }}>revenue intelligence.</span>
            </h1>
            <p data-reveal style={{ marginTop: 24, fontSize: 18, color: '#5a6178', lineHeight: 1.7, maxWidth: 580, margin: '24px auto 0' }}>
              We're a small team solving a hard problem: helping revenue teams see and act on the truth. If that excites you, you belong here.
            </p>
            <div data-reveal style={{ marginTop: 36, display: 'flex', gap: 14, justifyContent: 'center' }}>
              <a href="#openings" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 22px', borderRadius: 12, background: N, color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none', boxShadow: '0 2px 4px rgba(20,26,77,.25),0 12px 24px -10px rgba(20,26,77,.55)' }}>See Open Roles →</a>
              <Link to="/about" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 22px', borderRadius: 12, background: '#fff', color: '#0c1030', border: '1px solid #e6e8f0', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>About FlowRaze</Link>
            </div>
          </div>
        </section>

        {/* TEAM PHOTO / SOCIAL PROOF */}
        <section style={{ padding: '0 32px 64px' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div data-reveal style={{ background: 'linear-gradient(135deg, #0c1030 0%, #1d2879 100%)', borderRadius: 24, padding: '48px 56px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%,rgba(26,168,107,.2),transparent 50%)' }} />
              {[
                { val: '38 people', lbl: 'and growing fast' },
                { val: '8 countries', lbl: 'represented on the team' },
                { val: '4.9/5', lbl: 'Glassdoor rating' },
              ].map(({ val, lbl }) => (
                <div key={lbl} style={{ position: 'relative', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 700, color: '#fff', letterSpacing: '-0.04em' }}>{val}</div>
                  <div style={{ fontSize: 15, color: '#a8aed6', marginTop: 8 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section style={{ padding: '48px 32px 64px', background: '#f5f6fb', borderTop: '1px solid #e6e8f0', borderBottom: '1px solid #e6e8f0' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span data-reveal style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: '#eef0fa', color: N, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: N }} />Why FlowRaze
              </span>
              <h2 data-reveal style={{ marginTop: 18, fontSize: 42, letterSpacing: '-0.03em', fontWeight: 700 }}>
                We build it with you,{' '}
                <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: N }}>not at you.</span>
              </h2>
              <p data-reveal style={{ marginTop: 14, fontSize: 17, color: '#5a6178', lineHeight: 1.6, maxWidth: 500, margin: '14px auto 0' }}>Our best ideas come from the team. Every engineer owns their domain. Every designer shapes the product direction.</p>
            </div>
            <div data-stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {PERKS.map(({ ic, title, body }) => (
                <div key={title} className="car-perk-card" style={{ background: '#fff', border: '1px solid #e6e8f0', borderRadius: 16, padding: 24 }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{ic}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#5a6178', lineHeight: 1.6 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OPENINGS */}
        <section id="openings" style={{ padding: '80px 32px' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <span data-reveal style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: '#eef0fa', color: N, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: G, boxShadow: `0 0 0 4px rgba(26,168,107,.2)` }} />Open Positions
              </span>
              <h2 data-reveal style={{ marginTop: 18, fontSize: 42, letterSpacing: '-0.03em', fontWeight: 700 }}>
                Find your{' '}
                <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: N }}>next role.</span>
              </h2>
            </div>

            {/* Dept filter */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, justifyContent: 'center' }}>
              {DEPTS.map(d => (
                <button key={d} className={`car-dept-btn${activeDept === d ? ' active' : ''}`} onClick={() => setActiveDept(d)}>{d}</button>
              ))}
            </div>

            <div style={{ border: '1px solid #e6e8f0', borderRadius: 16, overflow: 'hidden' }}>
              {filteredJobs.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#9aa0bb', fontSize: 15 }}>No open roles in this department right now. Check back soon or send us a speculative application.</div>
              ) : filteredJobs.map((job, i) => (
                <div key={job.id} className="car-job-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 24, alignItems: 'center', padding: '20px 24px', borderTop: i === 0 ? 'none' : '1px solid #e6e8f0', background: '#fff' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{job.title}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                      <span style={{ padding: '3px 9px', borderRadius: 999, background: job.deptBg, color: job.deptColor, fontSize: 11.5, fontWeight: 700 }}>{job.dept}</span>
                      <span style={{ fontSize: 12.5, color: '#9aa0bb' }}>{job.level}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13.5, color: '#5a6178', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>📍</span>{job.location}
                  </div>
                  <div style={{ padding: '4px 12px', borderRadius: 999, background: '#f5f6fb', border: '1px solid #e6e8f0', fontSize: 12, fontWeight: 600, color: '#5a6178', whiteSpace: 'nowrap' }}>{job.type}</div>
                  <a href="#" style={{ padding: '10px 18px', borderRadius: 10, background: N, color: '#fff', fontWeight: 600, fontSize: 13.5, textDecoration: 'none', whiteSpace: 'nowrap' }}>Apply →</a>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <p style={{ fontSize: 15, color: '#7a809a' }}>Don't see the right role? <a href="mailto:careers@flowraze.id" style={{ color: N, fontWeight: 600, textDecoration: 'none' }}>Send us a speculative application →</a></p>
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section style={{ padding: '64px 32px 80px', background: '#f5f6fb', borderTop: '1px solid #e6e8f0' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span data-reveal style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: '#eef0fa', color: N, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: N }} />Interview Process
              </span>
              <h2 data-reveal style={{ marginTop: 18, fontSize: 42, letterSpacing: '-0.03em', fontWeight: 700 }}>
                Transparent, fast,{' '}
                <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: N }}>human.</span>
              </h2>
              <p data-reveal style={{ marginTop: 14, fontSize: 17, color: '#5a6178', lineHeight: 1.6, maxWidth: 480, margin: '14px auto 0' }}>We respect your time. Our entire process takes 2–3 weeks, not months.</p>
            </div>
            <div data-stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
              {[
                { step: '01', title: 'Apply', body: 'Submit your application. We review every one within 5 business days and reply with a clear next step.' },
                { step: '02', title: 'Intro Call', body: '30-minute video call with our recruiter. We\'ll share more about the role, team, and what success looks like.' },
                { step: '03', title: 'Technical / Craft', body: 'A focused, realistic exercise relevant to the role. No LeetCode for non-engineering roles. We value your actual work.' },
                { step: '04', title: 'Final Interview', body: 'Meet the team you\'d work with. Two conversations, max. Offer decision within 48 hours of the final round.' },
              ].map(({ step, title, body }) => (
                <div key={step} style={{ background: '#fff', border: '1px solid #e6e8f0', borderRadius: 16, padding: 24 }}>
                  <div style={{ fontSize: 36, fontWeight: 700, fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', color: N, opacity: 0.4, lineHeight: 1 }}>{step}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 12, marginBottom: 8 }}>{title}</h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#5a6178', lineHeight: 1.6 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '120px 32px' }}>
          <div data-reveal className="car-cta" style={{ maxWidth: 1180, margin: '0 auto', background: N, color: '#fff', borderRadius: 32, padding: '80px 64px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>We're Hiring</span>
            <h2 style={{ marginTop: 18, color: '#fff', fontSize: 52, letterSpacing: '-0.03em', fontWeight: 700 }}>
              Let's build something{' '}
              <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400 }}>meaningful.</span>
            </h2>
            <p style={{ fontSize: 18, color: '#cdd1eb', maxWidth: 520, margin: '18px auto 36px' }}>Join a team that ships fast, writes honestly, and genuinely cares about the customers we serve.</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <a href="#openings" style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 22px', borderRadius: 12, fontWeight: 600, fontSize: 15, background: '#fff', color: N, textDecoration: 'none' }}>View All Openings →</a>
              <Link to="/about" className="car-ghost-btn">Learn About Us</Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: '64px 32px 40px', borderTop: '1px solid #e6e8f0', background: '#fff' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 48 }}>
            <div>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 20, color: N, textDecoration: 'none' }}>
                <span className="car-logo-dot" />FlowRaze
              </Link>
              <p style={{ color: '#5a6178', fontSize: 14, marginTop: 14, maxWidth: 300, lineHeight: 1.6 }}>Understand what drives your revenue. Precision-engineered for the modern revenue team.</p>
            </div>
            {[
              { title: 'Product', links: [['Features', '/'], ['Solutions', '/solutions'], ['Pricing', '/pricing'], ['Integrations', '#']] },
              { title: 'Company', links: [['About', '/about'], ['Careers', '/careers'], ['Blog', '/blog'], ['Customers', '#']] },
              { title: 'Support', links: [['Help Center', '/help'], ['Documentation', '#'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.08em', color: '#7a809a', marginBottom: 16, fontWeight: 600 }}>{title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {links.map(([label, href]) => (
                    <li key={label}><Link to={href} style={{ fontSize: 14, color: '#3a4060', textDecoration: 'none' }}>{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ maxWidth: 1240, margin: '48px auto 0', paddingTop: 24, borderTop: '1px solid #e6e8f0', display: 'flex', justifyContent: 'space-between', color: '#7a809a', fontSize: 13 }}>
            <span>© 2026 FlowRaze. Precision in Motion.</span>
            <span>Made in Jakarta · Built for the world</span>
          </div>
        </footer>
      </div>
    </>
  );
}
