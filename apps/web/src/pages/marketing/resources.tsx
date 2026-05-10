import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { LandingHeader, LandingFooter, LandingButton, Eyebrow } from '@/components/landing';
import '@/components/landing/landing.css';

const RESOURCES = [
  {
    title: 'Documentation',
    description: 'Comprehensive guides to setting up and scaling with FlowRaze.',
    icon: '📚',
    link: '#',
    items: ['Quickstart Guide', 'API Reference', 'Developer SDK', 'Architecture'],
    color: '#1d2879',
    bg: '#e7ebff'
  },
  {
    title: 'Integrations',
    description: 'Connect FlowRaze to the tools your team already uses.',
    icon: '🔌',
    link: '#',
    items: ['Gmail & WhatsApp', 'Meta & Google Ads', 'Salesforce Sync', 'Zapier Flows'],
    color: '#1aa86b',
    bg: '#e6f7ee'
  },
  {
    title: 'Help Center',
    description: 'Get answers to common questions and troubleshooting tips.',
    icon: '🤝',
    link: '/help',
    items: ['Account Setup', 'Billing & Plans', 'Role Management', 'Data Privacy'],
    color: '#d27a3a',
    bg: '#ffeadb'
  },
  {
    title: 'Blog',
    description: 'Insights, frameworks, and stories from the revenue field.',
    icon: '✍️',
    link: '/blog',
    items: ['Sales Strategy', 'Marketing Attribution', 'Product Updates', 'Customer Stories'],
    color: '#e0386b',
    bg: '#fee9ee'
  }
];

export function ResourcesPage() {
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
      { threshold: 0.12 }
    );
    document.querySelectorAll('[data-reveal],[data-stagger]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="lp-root">
      <SEO 
        title="Revenue Ops Resource Center" 
        description="Access our documentation, integrations, community, and expert insights to scale your revenue operations."
      />
      <LandingHeader />

      <main>
        {/* HERO */}
        <section className="lp-section" style={{ paddingTop: 80, paddingBottom: 64, textAlign: 'center' }}>
          <div className="lp-hero-bg">
            <div className="lp-hero-grid" />
          </div>
          <div className="lp-container">
            <Eyebrow data-reveal="fade">Resources</Eyebrow>
            <h1 data-reveal="up" style={{ marginTop: 22, fontSize: 'clamp(40px, 6vw, 64px)' }}>
              Everything you need to <br />
              <span className="lp-serif lp-accent">master FlowRaze.</span>
            </h1>
            <p className="lp-lead" data-reveal="up" style={{ margin: '24px auto 0' }}>
              From deep-dive documentation to expert strategy guides — we've built the ultimate library for modern revenue teams.
            </p>
          </div>
        </section>

        {/* RESOURCE GRID */}
        <section className="lp-section" style={{ background: '#f5f6fb', borderTop: '1px solid #e6e8f0' }}>
          <div className="lp-container">
            <div className="lp-feat-grid" data-stagger style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 32 }}>
              {RESOURCES.map((res) => (
                <div key={res.title} className="lp-feat" style={{ padding: 40, background: '#fff' }}>
                  <div style={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: 14, 
                    background: res.bg, 
                    fontSize: 28, 
                    display: 'grid', 
                    placeItems: 'center',
                    marginBottom: 24 
                  }}>
                    {res.icon}
                  </div>
                  <h2 style={{ fontSize: 28, marginBottom: 12 }}>{res.title}</h2>
                  <p className="lp-lead" style={{ fontSize: 16, marginBottom: 24 }}>{res.description}</p>
                  
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    margin: '0 0 32px', 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px 24px'
                  }}>
                    {res.items.map(item => (
                      <li key={item} style={{ 
                        fontSize: 14.5, 
                        color: '#3a4060', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        fontWeight: 500
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: res.color, opacity: 0.4 }} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link to={res.link} style={{ textDecoration: 'none' }}>
                    <LandingButton variant="ghost" style={{ width: '100%', borderColor: '#e6e8f0' }}>
                      Explore {res.title} →
                    </LandingButton>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMMUNITY / HELP */}
        <section className="lp-section">
          <div className="lp-container">
            <div data-reveal="scale" style={{ 
              background: '#1d2879', 
              borderRadius: 32, 
              padding: '64px', 
              color: '#fff',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 64,
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, rgba(45,202,140,0.15), transparent 40%)', pointerEvents: 'none' }} />
              <div>
                <h2 style={{ color: '#fff', fontSize: 40, marginBottom: 20 }}>Can't find what you're looking for?</h2>
                <p style={{ color: '#cdd1eb', fontSize: 18, marginBottom: 32 }}>
                  Our support team is available 24/7 to help you with any technical or strategic questions.
                </p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <Link to="/help">
                    <LandingButton variant="primary" style={{ background: '#fff', color: '#1d2879' }}>
                      Visit Help Center
                    </LandingButton>
                  </Link>
                  <LandingButton variant="ghost" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
                    Contact Support
                  </LandingButton>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: 24, 
                  padding: 32,
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#4ae176', display: 'grid', placeItems: 'center', fontWeight: 700 }}>AS</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Arya Santoso</div>
                      <div style={{ fontSize: 12, color: '#a8aed6' }}>Replied in 4 mins</div>
                    </div>
                  </div>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    padding: 16, 
                    borderRadius: '0 12px 12px 12px',
                    fontSize: 14,
                    lineHeight: 1.5,
                    marginBottom: 12
                  }}>
                    "Hi there! You can find the multi-tenant setup guide in the Documentation section under Architecture. Let me know if you need anything else!"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="lp-section" style={{ textAlign: 'center', paddingBottom: 120 }}>
          <div className="lp-container">
            <h2 data-reveal="up">Ready to get started?</h2>
            <p className="lp-lead" data-reveal="up" style={{ margin: '18px auto 32px' }}>
              Join 2,400+ revenue teams growing with FlowRaze.
            </p>
            <div data-reveal="up" style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link to="/register">
                <LandingButton size="lg">Get Started Free →</LandingButton>
              </Link>
              <Link to="/pricing">
                <LandingButton variant="ghost" size="lg">View Pricing</LandingButton>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
