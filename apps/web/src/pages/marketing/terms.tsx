import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

const N = '#1d2879';

export function TermsPage() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <SEO 
        title="Terms of Service" 
        description="Read the terms and conditions for using the FlowRaze platform and services."
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
        [data-reveal]{opacity:0;transform:translateY(28px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
        [data-reveal].in{opacity:1;transform:none}
        .legal-logo-dot{width:22px;height:22px;border-radius:7px;background:#1d2879;position:relative;overflow:hidden;flex-shrink:0}
        .legal-logo-dot::before{content:"";position:absolute;inset:5px 4px 4px 5px;background:#fff;border-radius:3px;clip-path:polygon(0 60%,40% 60%,40% 0,70% 0,70% 40%,100% 40%,100% 100%,0 100%)}
        .legal-content h2 { font-size: 24px; font-weight: 700; color: #0c1030; margin-top: 48px; margin-bottom: 16px; letter-spacing: -0.01em; }
        .legal-content h3 { font-size: 19px; font-weight: 600; color: #0c1030; margin-top: 32px; margin-bottom: 12px; }
        .legal-content p { font-size: 16px; color: #5a6178; line-height: 1.7; margin-bottom: 20px; }
        .legal-content ul { padding-left: 20px; margin-bottom: 24px; }
        .legal-content li { color: #5a6178; margin-bottom: 10px; line-height: 1.6; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#fff', fontFamily: '"Inter", system-ui, sans-serif', color: '#0c1030' }}>
        {/* NAV */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.88)', backdropFilter: 'saturate(180%) blur(14px)', borderBottom: '1px solid #e6e8f0' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 48, height: 64 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 20, color: N, letterSpacing: '-0.01em', textDecoration: 'none' }}>
              <span className="legal-logo-dot" />
              FlowRaze
            </Link>
            <div style={{ display: 'flex', gap: 36, fontSize: 14.5, fontWeight: 500, color: '#3a4060' }}>
              <Link to="/" style={{ color: '#3a4060', textDecoration: 'none' }}>Features</Link>
              <Link to="/solutions" style={{ color: '#3a4060', textDecoration: 'none' }}>Solutions</Link>
              <Link to="/pricing" style={{ color: '#3a4060', textDecoration: 'none' }}>Pricing</Link>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18, fontSize: 14.5, fontWeight: 500 }}>
              <Link to="/login" style={{ color: '#3a4060', textDecoration: 'none' }}>Log In</Link>
              <Link to="/register" style={{ background: N, color: '#fff', padding: '10px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none', boxShadow: '0 1px 2px rgba(20,26,77,.2),0 6px 18px -8px rgba(20,26,77,.45)' }}>Get Started</Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <header style={{ padding: '80px 32px 48px', textAlign: 'center', background: '#f5f6fb', borderBottom: '1px solid #e6e8f0' }}>
          <div data-reveal style={{ maxWidth: 800, margin: '0 auto' }}>
            <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Terms of Service</h1>
            <p style={{ marginTop: 16, fontSize: 16, color: '#7a809a', fontWeight: 500 }}>Last Updated: May 10, 2026</p>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ padding: '80px 32px', maxWidth: 800, margin: '0 auto' }} className="legal-content">
          <div data-reveal>
            <p>Please read these Terms of Service ("Terms") carefully before using the FlowRaze platform operated by FlowRaze ("us", "we", or "our").</p>
            
            <h2>1. Account Registration</h2>
            <p>To use FlowRaze, you must create an account. You agree to provide accurate information and are responsible for maintaining the security of your account credentials. You are responsible for all activities that occur under your account.</p>

            <h2>2. Use of Service</h2>
            <p>FlowRaze provides a workspace for managing leads, deals, and marketing campaigns. You agree not to:</p>
            <ul>
              <li>Use the service for any illegal purposes</li>
              <li>Attempt to gain unauthorized access to other workspaces</li>
              <li>Upload malicious code or interfere with platform integrity</li>
              <li>Use the platform to send unsolicited marketing communications (SPAM)</li>
            </ul>

            <h2>3. Subscription and Billing</h2>
            <ul>
              <li><strong>Tiers</strong>: We offer various tiers (Free, Growth, Pro, Custom). Features and limits depend on your selected plan.</li>
              <li><strong>Payments</strong>: Fees are billed in advance on a recurring basis. All payments are non-refundable unless required by law.</li>
              <li><strong>Cancellation</strong>: You may cancel your subscription at any time through your workspace settings.</li>
            </ul>

            <h2>4. Intellectual Property</h2>
            <p><strong>Our Content</strong>: FlowRaze and its original content, features, and functionality are owned by FlowRaze.</p>
            <p><strong>Your Content</strong>: You retain all rights to the data you input into the platform. By using the service, you grant us a limited license to process this data solely to provide the service to you.</p>

            <h2>5. Limitation of Liability</h2>
            <p>FlowRaze is provided "as is" without warranty of any kind. In no event shall FlowRaze be liable for any indirect, incidental, or consequential damages resulting from the use of the service.</p>

            <h2>6. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice, if you breach these Terms.</p>

            <h2>7. Governing Law</h2>
            <p>These Terms shall be governed by the laws of Indonesia, without regard to its conflict of law provisions.</p>

            <h2>8. Changes</h2>
            <p>We reserve the right to modify these terms at any time. We will notify you of any significant changes by posting the new Terms on this site.</p>
          </div>
        </main>

        {/* FOOTER */}
        <footer style={{ padding: '64px 32px 40px', borderTop: '1px solid #e6e8f0', background: '#fff' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 48 }}>
            <div>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 20, color: N, textDecoration: 'none' }}>
                <span className="legal-logo-dot" />FlowRaze
              </Link>
              <p style={{ color: '#5a6178', fontSize: 14, marginTop: 14, maxWidth: 300, lineHeight: 1.6 }}>Precision-engineered for the modern revenue team.</p>
            </div>
            {[
              { title: 'Product', links: [['Features', '/'], ['Solutions', '/solutions'], ['Pricing', '/pricing']] },
              { title: 'Company', links: [['About', '/about'], ['Careers', '/careers'], ['Blog', '/blog']] },
              { title: 'Legal', links: [['Privacy', '/privacy'], ['Terms', '/terms']] },
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
