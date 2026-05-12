import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { LandingHeader, LandingFooter, LandingButton, Eyebrow } from '@/components/landing';
import '@/components/landing/landing.css';

const N = '#1d2879';

const CATEGORIES = [
  {
    id: 'getting-started',
    ic: '🚀',
    icBg: '#e7ebff',
    title: 'Getting Started',
    desc: 'Set up your workspace, invite your team, and connect your first integrations.',
    articles: 8,
    articles_list: [
      'Creating your FlowRaze account',
      'Setting up your company workspace',
      'Inviting team members and setting roles',
      'Connecting Gmail and WhatsApp Business',
      'Importing your leads from a spreadsheet',
      'Your first pipeline: a step-by-step guide',
      'Understanding the dashboard overview',
      'Setting company-level sales targets',
    ],
  },
  {
    id: 'sales-pipeline',
    ic: '$',
    icBg: '#e6f7ee',
    title: 'Sales Pipeline',
    desc: 'Manage leads, move deals through stages, and track your team\'s activity.',
    articles: 12,
    articles_list: [
      'How deal stages work in FlowRaze',
      'Creating and editing deals',
      'Deal health scoring explained',
      'Moving deals between stages',
      'Setting deal values and probability',
      'Attaching leads to deals',
      'Using the Kanban board view',
      'Archiving and deleting deals',
    ],
  },
  {
    id: 'campaigns',
    ic: '◔',
    icBg: '#e7ebff',
    title: 'Campaigns & Attribution',
    desc: 'Track marketing performance, attribution, and campaign ROI end-to-end.',
    articles: 9,
    articles_list: [
      'Creating your first campaign',
      'Multi-touch attribution: how it works',
      'Linking campaigns to deals',
      'Reading your ROAS and CAC metrics',
      'Campaign status and lifecycle',
      'Exporting campaign performance reports',
      'Setting campaign targets',
      'Archiving completed campaigns',
    ],
  },
  {
    id: 'team',
    ic: '◉',
    icBg: '#ffeadb',
    title: 'Team Performance',
    desc: 'Understand individual and team OKRs, activity scores, and performance reviews.',
    articles: 7,
    articles_list: [
      'Understanding team performance metrics',
      'Setting individual OKRs and targets',
      'How activity scoring works',
      'Comparing performance across periods',
      'Exporting team performance data',
      'Managing roles: Admin vs Employee',
      'Viewing team leaderboards',
    ],
  },
  {
    id: 'settings',
    ic: '⚙',
    icBg: '#f5f6fb',
    title: 'Account & Billing',
    desc: 'Update your profile, manage your plan, and configure API access and webhooks.',
    articles: 10,
    articles_list: [
      'Changing your email or password',
      'Managing your subscription plan',
      'Understanding your invoice and billing cycle',
      'Upgrading from Free to Growth',
      'Adding and removing team seats',
      'Generating API keys',
      'Setting up webhooks',
      'Cancelling your subscription',
    ],
  },
  {
    id: 'exports',
    ic: '↓',
    icBg: '#eef0fa',
    title: 'Exports & Integrations',
    desc: 'Export CSV and PDF reports, and connect FlowRaze to your existing stack.',
    articles: 6,
    articles_list: [
      'Exporting leads to CSV',
      'Generating a PDF campaign report',
      'Scheduling recurring exports',
      'Available integrations overview',
      'Using the REST API',
      'Webhook payload reference',
    ],
  },
];

const FAQS = [
  { q: 'Can I migrate data from my existing CRM?', a: 'Yes. FlowRaze supports CSV import for leads, deals, and contacts. For larger migrations from Salesforce or HubSpot, our Customer Success team can assist you with a guided migration at no extra cost.' },
  { q: 'How do roles and permissions work?', a: 'FlowRaze has three roles: Admin, Manager, and Employee. Admins can access all settings and billing. Managers can view team performance data. Employees see only their own pipeline and assigned leads. Superadmin is a platform-level role for FlowRaze internal use.' },
  { q: 'Is my data stored securely?', a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We use isolated database schemas per company workspace. We never share or sell your data. ISO 27001 certification is in progress for 2026.' },
  { q: 'What happens if I exceed my plan limits?', a: 'We\'ll notify you when you approach 80% of any plan limit. If you exceed user or feature limits, affected features will be read-only until you upgrade — we never delete your data.' },
  { q: 'Can I cancel at any time?', a: 'Yes. You can cancel from Settings → Billing with one click. You\'ll retain full access until the end of your current billing period. We don\'t charge cancellation fees.' },
  { q: 'Do you offer a free trial of paid plans?', a: 'Every new account gets a 14-day Growth trial automatically. No credit card required. After the trial, you can continue on the Free tier or upgrade.' },
];

export function HelpPage() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('lp-in'); io.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('[data-reveal],[data-stagger]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const filteredCats = search.trim()
    ? CATEGORIES.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.desc.toLowerCase().includes(search.toLowerCase()) ||
        c.articles_list.some(a => a.toLowerCase().includes(search.toLowerCase()))
      )
    : CATEGORIES;

  return (
    <div className="lp-root">
      <SEO 
        title="Support & Documentation" 
        description="Find guides, tutorials, and documentation for FlowRaze. Get the most out of your revenue operations platform."
      />
      <style>{`
        .hlp-cat-card{transition:transform .3s,box-shadow .3s,border-color .2s;cursor:pointer}
        .hlp-cat-card:hover{transform:translateY(-4px);box-shadow:0 24px 50px -22px rgba(20,26,77,.18);border-color:#c0c8ee}
        .hlp-search{width:100%;padding:16px 24px 16px 52px;border-radius:16px;border:1px solid #d0d6ee;font-size:16px;font-family:inherit;outline:none;background:#fff;transition:border-color .2s,box-shadow .2s}
        .hlp-search:focus{border-color:#1d2879;box-shadow:0 0 0 4px rgba(29,40,121,.1)}
        .hlp-faq-row{border-bottom:1px solid #e6e8f0;cursor:pointer}
        .hlp-faq-row:last-child{border-bottom:none}
        .hlp-article-row:hover{background:#f5f6fb}
      `}</style>

      <LandingHeader />

      <main>
        {/* HERO */}
        <section style={{ padding: '72px 32px 56px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#f0f2fd 0%,#fff 100%)' }}>
          <div className="lp-hero-bg">
            <div className="lp-hero-grid" />
          </div>
          <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <Eyebrow data-reveal="up">Help Center</Eyebrow>
            <h1 data-reveal style={{ marginTop: 22, fontSize: 56, lineHeight: 1.06, letterSpacing: '-0.03em', fontWeight: 700 }}>
              How can we{' '}
              <span className="lp-serif lp-accent">help you?</span>
            </h1>
            <p data-reveal style={{ marginTop: 16, fontSize: 17, color: '#5a6178', lineHeight: 1.6 }}>Search our knowledge base or browse articles by topic below.</p>

            {/* Search */}
            <div data-reveal style={{ marginTop: 28, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#9aa0bb', pointerEvents: 'none' }}>⌕</span>
              <input
                className="hlp-search"
                type="text"
                placeholder="Search articles… e.g. 'import leads', 'billing', 'API key'"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Quick links */}
            <div data-reveal style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Import leads', 'Invite team', 'Upgrade plan', 'API keys', 'Webhooks'].map(q => (
                <button key={q} onClick={() => setSearch(q)} style={{ padding: '6px 14px', borderRadius: 999, background: '#fff', border: '1px solid #d0d6ee', fontSize: 13, color: '#5a6178', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}>{q}</button>
              ))}
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <div style={{ background: '#f5f6fb', borderTop: '1px solid #e6e8f0', borderBottom: '1px solid #e6e8f0' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 32px', display: 'flex', gap: 48, justifyContent: 'center' }}>
            {[
              { val: '52+', lbl: 'Help articles' },
              { val: '<1 hr', lbl: 'Avg support reply time' },
              { val: '98%', lbl: 'Issues resolved on first contact' },
            ].map(({ val, lbl }) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: N, letterSpacing: '-0.02em' }}>{val}</div>
                <div style={{ fontSize: 12.5, color: '#9aa0bb', marginTop: 3 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CATEGORIES */}
        <section style={{ padding: '64px 32px' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            {search && (
              <div style={{ marginBottom: 16, fontSize: 14, color: '#7a809a' }}>
                Showing results for <strong style={{ color: N }}>"{search}"</strong> — {filteredCats.length} categor{filteredCats.length === 1 ? 'y' : 'ies'} found
              </div>
            )}
            <div data-stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {filteredCats.map((cat) => (
                <div key={cat.id}>
                  <div
                    className="hlp-cat-card"
                    onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
                    style={{ background: '#fff', border: '1px solid #e6e8f0', borderRadius: 18, padding: 28 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: cat.icBg, display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>{cat.ic}</div>
                      <span style={{ padding: '4px 10px', borderRadius: 999, background: '#f5f6fb', border: '1px solid #e6e8f0', fontSize: 11.5, fontWeight: 600, color: '#7a809a' }}>{cat.articles} articles</span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>{cat.title}</h3>
                    <p style={{ margin: 0, fontSize: 14, color: '#5a6178', lineHeight: 1.55 }}>{cat.desc}</p>
                    <div style={{ marginTop: 16, fontSize: 13.5, fontWeight: 600, color: N, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {openCategory === cat.id ? '▲ Collapse' : '▼ Browse articles'}
                    </div>
                  </div>

                  {/* Expanded articles */}
                  {openCategory === cat.id && (
                    <div style={{ marginTop: 8, background: '#fff', border: '1px solid #e6e8f0', borderRadius: 14, overflow: 'hidden' }}>
                      {cat.articles_list.map((article, i) => (
                        <div key={i} className="hlp-article-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid #f0f2f8', cursor: 'pointer', transition: 'background .15s' }}>
                          <span style={{ fontSize: 14, color: '#3a4060', fontWeight: 500 }}>{article}</span>
                          <span style={{ color: N, fontSize: 14, fontWeight: 700 }}>→</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: '48px 32px 80px', background: '#f5f6fb', borderTop: '1px solid #e6e8f0' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <Eyebrow data-reveal="up">FAQ</Eyebrow>
              <h2 data-reveal style={{ marginTop: 18, fontSize: 42, letterSpacing: '-0.03em', fontWeight: 700 }}>
                Frequently asked{' '}
                <span className="lp-serif lp-accent">questions.</span>
              </h2>
            </div>
            <div data-reveal style={{ background: '#fff', border: '1px solid #e6e8f0', borderRadius: 18, overflow: 'hidden' }}>
              {FAQS.map((faq, i) => (
                <div key={i} className="hlp-faq-row" onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ fontSize: 15.5, fontWeight: 600, color: '#0c1030', lineHeight: 1.4 }}>{faq.q}</span>
                    <span style={{ fontSize: 18, color: N, fontWeight: 700, flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform .2s' }}>+</span>
                  </div>
                  {openFaq === i && (
                    <p style={{ marginTop: 12, fontSize: 14.5, color: '#5a6178', lineHeight: 1.7, paddingRight: 32 }}>{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT SUPPORT */}
        <section style={{ padding: '64px 32px', background: '#fff' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <Eyebrow data-reveal="up">Still need help?</Eyebrow>
              <h2 data-reveal style={{ marginTop: 18, fontSize: 40, letterSpacing: '-0.03em', fontWeight: 700 }}>
                Our team replies{' '}
                <span className="lp-serif lp-accent">within the hour.</span>
              </h2>
            </div>
            <div data-stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {[
                { ic: '💬', title: 'Live Chat', body: 'Chat with a support specialist directly inside the FlowRaze app. Available Monday–Friday, 08:00–20:00 WIB.', cta: 'Open Chat', href: '#' },
                { ic: '📧', title: 'Email Support', body: 'Send us a detailed message and we\'ll get back to you within 1 business hour. We track every ticket to resolution.', cta: 'Email Us', href: 'mailto:support@flowraze.id' },
                { ic: '📞', title: 'Schedule a Call', body: 'On Growth or Pro? Book a 30-minute screen-share with our Customer Success team to solve your problem together.', cta: 'Book a Call', href: '#' },
              ].map(({ ic, title, body, cta, href }) => (
                <div key={title} style={{ background: '#f5f6fb', border: '1px solid #e6e8f0', borderRadius: 18, padding: 28, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 14 }}>{ic}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: '#5a6178', lineHeight: 1.6, marginBottom: 20 }}>{body}</p>
                  <a href={href} style={{ textDecoration: 'none' }}>
                    <LandingButton variant="primary" style={{ background: N }}>{cta} →</LandingButton>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '80px 32px 120px' }}>
          <div data-reveal className="lp-final-card" style={{ maxWidth: 1180, margin: '0 auto', borderRadius: 32, padding: '72px 64px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
            <h2 style={{ color: '#fff', fontSize: 48, letterSpacing: '-0.03em', fontWeight: 700, margin: 0 }}>
              Everything you need to{' '}
              <span className="lp-serif">get going fast.</span>
            </h2>
            <p style={{ fontSize: 18, color: '#cdd1eb', maxWidth: 520, margin: '18px auto 36px' }}>Free onboarding. Live support. Extensive documentation. We're invested in your success from day one.</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <Link to="/register">
                <LandingButton variant="primary" style={{ background: '#fff', color: N }}>Start for Free →</LandingButton>
              </Link>
              <Link to="/about">
                <LandingButton variant="ghost" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>Learn About Us</LandingButton>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
