import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { LandingHeader, LandingFooter, LandingButton } from '@/components/landing';
import '@/components/landing/landing.css';

const N = '#1d2879';
const G = '#1aa86b';

const POSTS = [
  // ... (keeping posts same)
  {
    id: 1,
    category: 'Sales Strategy',
    catColor: G,
    catBg: '#e6f7ee',
    title: 'Why Your Sales Forecast Is Always Wrong (And How to Fix It)',
    excerpt: 'Most forecasts fail before the quarter starts — because they\'re built on gut feel, not conversion data. Here\'s the framework FlowRaze customers use to get within 5% every time.',
    author: 'Arya Santoso',
    authorRole: 'Co-founder & CEO',
    initials: 'AS',
    gradient: 'linear-gradient(135deg,#cdd2ee,#1d2879)',
    date: 'May 7, 2026',
    readTime: '6 min read',
    featured: true,
  },
  {
    id: 2,
    category: 'Marketing',
    catColor: N,
    catBg: '#e7ebff',
    title: 'Multi-Touch Attribution Is Not Optional in 2026',
    excerpt: 'Last-click attribution still haunts most Indonesian marketing teams. Here\'s why multi-touch matters and how to implement it without a data science team.',
    author: 'Diana Lim',
    authorRole: 'Co-founder & CTO',
    initials: 'DL',
    gradient: 'linear-gradient(135deg,#a8e6c5,#1aa86b)',
    date: 'Apr 30, 2026',
    readTime: '8 min read',
    featured: false,
  },
  {
    id: 3,
    category: 'Leadership',
    catColor: '#d27a3a',
    catBg: '#ffeadb',
    title: 'How Southeast Asian Founders Can Run Better Board Meetings',
    excerpt: 'Your board deserves real numbers, not a narrative built around missing data. The metrics that matter — and how to present them without spending a weekend on slides.',
    author: 'Reza Hakim',
    authorRole: 'Co-founder & CPO',
    initials: 'RH',
    gradient: 'linear-gradient(135deg,#f5d0a3,#e0a058)',
    date: 'Apr 22, 2026',
    readTime: '5 min read',
    featured: false,
  },
  {
    id: 4,
    category: 'Product',
    catColor: '#e0386b',
    catBg: '#fee9ee',
    title: 'Introducing Sales Target Tracking: OKRs That Actually Close Deals',
    excerpt: 'We shipped a feature we\'ve wanted for two years. Here\'s how Sales Target Tracking works, why it\'s different from a generic KPI tool, and how your team can start using it today.',
    author: 'Nadia Setiawan',
    authorRole: 'Head of Customer Success',
    initials: 'NS',
    gradient: 'linear-gradient(135deg,#dbe1ff,#5868d6)',
    date: 'Apr 15, 2026',
    readTime: '4 min read',
    featured: false,
  },
  {
    id: 5,
    category: 'Sales Strategy',
    catColor: G,
    catBg: '#e6f7ee',
    title: 'The Deal Health Score: How to Know Which Deals Are Really Moving',
    excerpt: 'Not every deal in your pipeline deserves the same attention. Our deal health scoring model surfaces the signals most reps miss — before it\'s too late.',
    author: 'Arya Santoso',
    authorRole: 'Co-founder & CEO',
    initials: 'AS',
    gradient: 'linear-gradient(135deg,#cdd2ee,#1d2879)',
    date: 'Apr 8, 2026',
    readTime: '7 min read',
    featured: false,
  },
  {
    id: 6,
    category: 'Operations',
    catColor: N,
    catBg: '#e7ebff',
    title: 'From 6 Tools to 1: How HyperStream Cut Their Stack and Tripled Output',
    excerpt: 'A behind-the-scenes look at how HyperStream Indonesia consolidated their revenue stack onto FlowRaze — and what happened to their pipeline visibility in the first 30 days.',
    author: 'Nadia Setiawan',
    authorRole: 'Head of Customer Success',
    initials: 'NS',
    gradient: 'linear-gradient(135deg,#dbe1ff,#5868d6)',
    date: 'Mar 29, 2026',
    readTime: '9 min read',
    featured: false,
  },
];

const ALL_CATS = ['All', 'Sales Strategy', 'Marketing', 'Leadership', 'Product', 'Operations'];

export function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('lp-in'); io.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('[data-reveal],[data-stagger]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const filtered = activeCategory === 'All' ? POSTS : POSTS.filter(p => p.category === activeCategory);
  const [featured, ...rest] = filtered;

  return (
    <div className="lp-root">
      <SEO 
        title="Insights on Revenue Operations" 
        description="Read our latest articles on sales pipeline management, marketing attribution, and building high-performance revenue teams."
      />
      <style>{`
        .blg-post-card{transition:transform .3s,box-shadow .3s;cursor:pointer}
        .blg-post-card:hover{transform:translateY(-5px);box-shadow:0 28px 56px -24px rgba(20,26,77,.2)}
        .blg-cat-btn{padding:8px 16px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s,color .2s;border:1px solid #e6e8f0;background:#fff;color:#5a6178}
        .blg-cat-btn.active{background:#1d2879;color:#fff;border-color:#1d2879}
        .blg-cat-btn:hover:not(.active){background:#f5f6fb;color:#1d2879}
        .blg-ghost-btn{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.3);padding:14px 22px;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;transition:background .2s}
        .blg-ghost-btn:hover{background:rgba(255,255,255,.08)}
        .blg-cta::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 15% 30%,rgba(94,114,228,.45),transparent 40%),radial-gradient(circle at 85% 70%,rgba(45,202,140,.3),transparent 40%);pointer-events:none}
      `}</style>

      <LandingHeader />

      <main style={{ minHeight: '100vh', background: '#fff' }}>
        {/* HERO */}
        <section style={{ padding: '72px 32px 48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: '50%', top: -200, width: 1000, height: 1000, transform: 'translateX(-50%)', background: 'radial-gradient(closest-side,rgba(29,40,121,.06),transparent 70%)' }} />
          </div>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <span data-reveal style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: '#eef0fa', color: N, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              <span className="lp-pill-dot" />The FlowRaze Blog
            </span>
            <h1 data-reveal style={{ marginTop: 22, fontSize: 60, lineHeight: 1.05, letterSpacing: '-0.035em', fontWeight: 700 }}>
              Insights for modern{' '}
              <span className="lp-serif lp-accent">revenue teams.</span>
            </h1>
            <p data-reveal style={{ marginTop: 20, fontSize: 18, color: '#5a6178', lineHeight: 1.7, maxWidth: 560, margin: '20px auto 0' }}>
              Practical frameworks, product updates, and stories from the field — written by operators who've run the plays themselves.
            </p>
          </div>
        </section>

        {/* FILTER */}
        <div style={{ padding: '0 32px 32px', maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ALL_CATS.map(cat => (
              <button key={cat} className={`blg-cat-btn${activeCategory === cat ? ' active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
            ))}
          </div>
        </div>

        {/* FEATURED */}
        {featured && (
          <section style={{ padding: '0 32px 48px' }}>
            <div style={{ maxWidth: 1240, margin: '0 auto' }}>
              <div data-reveal className="blg-post-card" style={{ background: '#f5f6fb', border: '1px solid #e6e8f0', borderRadius: 20, padding: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 999, background: featured.catBg, color: featured.catColor, fontSize: 12, fontWeight: 700 }}>{featured.category}</span>
                    <span style={{ fontSize: 12, color: '#9aa0bb' }}>Featured</span>
                  </div>
                  <h2 style={{ fontSize: 32, lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 700, margin: 0 }}>{featured.title}</h2>
                  <p style={{ marginTop: 16, fontSize: 16, color: '#5a6178', lineHeight: 1.65 }}>{featured.excerpt}</p>
                  <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: featured.gradient, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{featured.initials}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{featured.author}</div>
                      <div style={{ fontSize: 12, color: '#9aa0bb' }}>{featured.date} · {featured.readTime}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 28 }}>
                    <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 10, background: N, color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Read Article →</a>
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e6e8f0', borderRadius: 16, padding: 28, boxShadow: '0 20px 40px -24px rgba(20,26,77,.15)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9aa0bb', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>Pipeline Forecast Accuracy</div>
                  {[
                    { label: 'Gut-feel forecast', pct: 58, color: '#e0386b' },
                    { label: 'Data-driven (FlowRaze)', pct: 95, color: G },
                  ].map(({ label, pct, color }) => (
                    <div key={label} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                        <span style={{ color: '#3a4060' }}>{label}</span>
                        <span style={{ color }}>{pct}%</span>
                      </div>
                      <div style={{ height: 8, background: '#e6e8f0', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 24, padding: '14px 16px', background: '#f5f6fb', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 20 }}>⚡</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0c1030' }}>+37% accuracy in Q1 alone</div>
                      <div style={{ fontSize: 11.5, color: '#9aa0bb', marginTop: 2 }}>Avg across FlowRaze customers</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* GRID */}
        <section style={{ padding: '0 32px 80px' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div data-stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
              {rest.map((post) => (
                <div key={post.id} className="blg-post-card" style={{ background: '#fff', border: '1px solid #e6e8f0', borderRadius: 18, overflow: 'hidden' }}>
                  <div style={{ height: 8, background: post.catColor, opacity: 0.7 }} />
                  <div style={{ padding: 28 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 999, background: post.catBg, color: post.catColor, fontSize: 11.5, fontWeight: 700 }}>{post.category}</span>
                    <h3 style={{ marginTop: 14, fontSize: 18, lineHeight: 1.3, letterSpacing: '-0.02em', fontWeight: 700 }}>{post.title}</h3>
                    <p style={{ marginTop: 10, fontSize: 14, color: '#5a6178', lineHeight: 1.6 }}>{post.excerpt}</p>
                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16, borderTop: '1px solid #e6e8f0' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: post.gradient, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{post.initials}</div>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{post.author}</div>
                        <div style={{ fontSize: 11, color: '#9aa0bb' }}>{post.date} · {post.readTime}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NEWSLETTER */}
        <section style={{ padding: '64px 32px', background: '#f5f6fb', borderTop: '1px solid #e6e8f0' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
            <span data-reveal style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: '#eef0fa', color: N, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              <span className="lp-pill-dot" />Stay Ahead
            </span>
            <h2 data-reveal style={{ marginTop: 18, fontSize: 40, letterSpacing: '-0.03em', fontWeight: 700, lineHeight: 1.1 }}>
              Revenue insights, straight to your inbox.
            </h2>
            <p data-reveal style={{ marginTop: 14, fontSize: 16, color: '#5a6178', lineHeight: 1.6 }}>One email per week. No filler. Just the frameworks, case studies, and product updates your team actually needs.</p>
            <div data-reveal style={{ marginTop: 28, display: 'flex', gap: 10 }}>
              <input type="email" placeholder="your@company.com" style={{ flex: 1, padding: '13px 16px', borderRadius: 10, border: '1px solid #d0d6ee', fontSize: 15, fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
              <button style={{ padding: '13px 22px', borderRadius: 10, background: N, color: '#fff', fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>Subscribe →</button>
            </div>
            <p data-reveal style={{ marginTop: 12, fontSize: 12, color: '#9aa0bb' }}>2,400+ subscribers. Unsubscribe any time.</p>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '120px 32px' }}>
          <div data-reveal className="blg-cta lp-final-card" style={{ maxWidth: 1180, margin: '0 auto', borderRadius: 32, padding: '80px 64px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
            <h2 style={{ color: '#fff', fontSize: 52, letterSpacing: '-0.03em', fontWeight: 700, margin: 0 }}>
              Ready to stop reading and{' '}
              <span className="lp-serif">start growing?</span>
            </h2>
            <p style={{ fontSize: 18, color: '#cdd1eb', maxWidth: 540, margin: '18px auto 36px' }}>Put these frameworks into action with FlowRaze. Start with a 14-day Growth trial. No card required.</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <Link to="/register">
                <LandingButton variant="primary" style={{ background: '#fff', color: N }}>Start 14-Day Trial →</LandingButton>
              </Link>
              <Link to="/help">
                <LandingButton variant="ghost" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>Explore Help Center</LandingButton>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
