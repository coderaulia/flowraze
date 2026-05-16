import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

const N = '#1d2879';

export function PrivacyPage() {
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
        title="Privacy Policy" 
        description="Your data privacy is our priority. Learn how FlowRaze protects your information and adheres to Indonesian and international data protection standards."
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
        .legal-content strong { color: #0c1030; }
        .legal-content table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 15px; }
        .legal-content th { text-align: left; padding: 12px 16px; background: #f5f6fb; color: #0c1030; font-weight: 600; border-bottom: 2px solid #e6e8f0; }
        .legal-content td { padding: 12px 16px; border-bottom: 1px solid #e6e8f0; color: #5a6178; }
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
            <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Privacy Policy</h1>
            <p style={{ marginTop: 16, fontSize: 16, color: '#7a809a', fontWeight: 500 }}>Effective Date: May 16, 2026 · Version 2026-05-16</p>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ padding: '80px 32px', maxWidth: 800, margin: '0 auto' }} className="legal-content">
          <div data-reveal>
            <p>At FlowRaze, we are committed to protecting your privacy and ensuring the security of your Personal Data. This Privacy Policy explains how PT FlowRaze Teknologi ("FlowRaze", "we", "us", or "our") collects, uses, discloses, and safeguards your information in compliance with Indonesian Law No. 27 of 2022 on Personal Data Protection (UU PDP), the General Data Protection Regulation (GDPR) where applicable, and other relevant data protection laws.</p>
            <p>This policy applies to all users of the FlowRaze platform, including our website, CRM tools, APIs, and related services.</p>
            
            <h2>1. Data Controller and Data Protection Officer</h2>
            <p><strong>Data Controller:</strong> PT FlowRaze Teknologi, Jakarta, Indonesia</p>
            <p><strong>Data Protection Officer (DPO):</strong> You may contact our DPO at <strong>dpo@flowraze.com</strong> for any questions regarding the processing of your Personal Data or to exercise your data subject rights.</p>
            <p>For workspace CRM data (lead contacts, deal information, etc.), the Workspace owner acts as the Data Controller and FlowRaze acts as the Data Processor.</p>

            <h2>2. Information We Collect</h2>
            
            <h3>A. Account Data (Personal Data)</h3>
            <p>When you register for FlowRaze, we collect the following Personal Data with your explicit consent (UU PDP Article 20(2)(a)):</p>
            <ul>
              <li>Full name</li>
              <li>Email address</li>
              <li>Password (stored in hashed form only)</li>
              <li>Company name (during onboarding)</li>
              <li>Consent timestamp and version</li>
            </ul>

            <h3>B. Workspace Data (Processed on Behalf of Data Controller)</h3>
            <p>As a CRM platform, we process data that Workspace owners input, including:</p>
            <ul>
              <li>Lead contact information (names, emails, phone numbers, company names)</li>
              <li>Deal details, pipeline stages, and sales history</li>
              <li>Marketing campaign metrics and attribution data</li>
              <li>Team performance records and activity logs</li>
              <li>Support tickets and internal communications</li>
            </ul>
            <p>This data is processed solely on behalf of the Workspace owner (Data Controller) and in accordance with their instructions.</p>

            <h3>C. Payment Data</h3>
            <p>Payment information is processed by Midtrans (PT Midtrans), a licensed payment service provider regulated by Bank Indonesia. We do not store full credit card numbers or bank account details. We only retain:</p>
            <ul>
              <li>Transaction references and payment status</li>
              <li>Invoice amounts and billing history</li>
              <li>Payment method type (for display purposes only)</li>
            </ul>

            <h3>D. Technical and Usage Data</h3>
            <p>We automatically collect:</p>
            <ul>
              <li>IP address and approximate geolocation</li>
              <li>Browser type, version, and operating system</li>
              <li>Pages visited, features used, and session duration</li>
              <li>Error logs and performance metrics</li>
            </ul>
            <p>This data is collected based on our legitimate interest in maintaining and improving the Platform (UU PDP Article 20(2)(f)).</p>

            <h2>3. Legal Basis for Processing</h2>
            <p>We process your Personal Data based on the following legal grounds, in accordance with UU PDP Article 20 and GDPR Article 6:</p>
            <table>
              <thead>
                <tr>
                  <th>Purpose</th>
                  <th>Legal Basis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Account creation and authentication</td>
                  <td>Explicit consent (UU PDP Art. 20(2)(a))</td>
                </tr>
                <tr>
                  <td>Providing CRM services</td>
                  <td>Contractual necessity</td>
                </tr>
                <tr>
                  <td>Processing payments</td>
                  <td>Contractual necessity</td>
                </tr>
                <tr>
                  <td>Sending transactional emails</td>
                  <td>Contractual necessity</td>
                </tr>
                <tr>
                  <td>Platform security and abuse prevention</td>
                  <td>Legitimate interest</td>
                </tr>
                <tr>
                  <td>Analytics and service improvement</td>
                  <td>Legitimate interest</td>
                </tr>
                <tr>
                  <td>Legal compliance and dispute resolution</td>
                  <td>Legal obligation</td>
                </tr>
              </tbody>
            </table>

            <h2>4. Data Isolation and Multi-Tenancy</h2>
            <p>FlowRaze is a multi-tenant platform with strict logical data isolation:</p>
            <ul>
              <li>Each company Workspace is isolated at the database level using company-scoped queries</li>
              <li>Role-based access control (admin, manager, employee) restricts data visibility within a Workspace</li>
              <li>API authentication ensures requests are scoped to the authenticated user's company</li>
              <li>We do not share, sell, or provide access to your CRM data to other companies or third parties for their own purposes</li>
            </ul>

            <h2>5. Data Sharing and Disclosure</h2>
            <p>We may share your Personal Data only in the following circumstances:</p>
            <ul>
              <li><strong>Payment Processing:</strong> With Midtrans for payment transactions</li>
              <li><strong>Email Delivery:</strong> With our SMTP provider for transactional emails (verification, password reset, invitations)</li>
              <li><strong>Legal Requirements:</strong> When required by Indonesian law, court order, or government regulation (UU PDP Article 25)</li>
              <li><strong>Business Transfer:</strong> In connection with a merger, acquisition, or sale of assets, with prior notice to you</li>
              <li><strong>With Your Consent:</strong> For any other purpose with your explicit consent</li>
            </ul>
            <p>We do not sell your Personal Data to third parties. We do not use your CRM data for advertising or profiling purposes.</p>

            <h2>6. Cross-Border Data Transfer</h2>
            <p>In accordance with UU PDP Article 56 and Government Regulation on cross-border data transfer:</p>
            <ul>
              <li>Your data is primarily stored and processed in Indonesia</li>
              <li>If data transfer to another country is necessary (e.g., for infrastructure or service providers), we ensure the receiving country provides an equivalent level of data protection, or we implement appropriate safeguards such as Standard Contractual Clauses</li>
              <li>We will notify you before any cross-border transfer of your Personal Data and obtain your consent where required</li>
            </ul>
            <p>For users in the EEA, transfers outside the EEA are conducted in compliance with GDPR Chapter V requirements.</p>

            <h2>7. Data Retention</h2>
            <p>We retain your Personal Data only for as long as necessary to fulfill the purposes described in this policy:</p>
            <ul>
              <li><strong>Active accounts:</strong> Data is retained for the duration of your account</li>
              <li><strong>After account deletion:</strong> Personal Data is permanently deleted within 30 days</li>
              <li><strong>Billing records:</strong> Retained for 5 years as required by Indonesian tax law (UU No. 28 of 2007)</li>
              <li><strong>Audit logs:</strong> Retained for 3 years for security and compliance purposes</li>
              <li><strong>Backup data:</strong> Removed from backups within 90 days of deletion</li>
            </ul>
            <p>Upon expiration of the retention period, data is securely deleted or anonymized in accordance with UU PDP Article 47.</p>

            <h2>8. Your Rights as a Data Subject</h2>
            <p>Under UU PDP (Articles 5-12) and GDPR (Articles 15-22), you have the following rights:</p>
            <ul>
              <li><strong>Right to Information (UU PDP Art. 5):</strong> Know what data we collect, how it is used, and who it is shared with</li>
              <li><strong>Right of Access (UU PDP Art. 6):</strong> Request a copy of your Personal Data in a structured, machine-readable format</li>
              <li><strong>Right to Correction (UU PDP Art. 7):</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Right to Deletion (UU PDP Art. 8):</strong> Request deletion of your Personal Data when it is no longer necessary or when you withdraw consent</li>
              <li><strong>Right to Withdraw Consent (UU PDP Art. 9):</strong> Withdraw your consent at any time without affecting the lawfulness of prior processing</li>
              <li><strong>Right to Object (UU PDP Art. 10):</strong> Object to processing based on legitimate interest</li>
              <li><strong>Right to Restrict Processing (UU PDP Art. 11):</strong> Request restriction of processing in certain circumstances</li>
              <li><strong>Right to Data Portability (UU PDP Art. 12):</strong> Receive your data in a portable format and transfer it to another service</li>
              <li><strong>Right to Lodge a Complaint:</strong> File a complaint with the Indonesian Personal Data Protection Authority or relevant supervisory authority</li>
            </ul>
            <p>To exercise any of these rights, contact us at <strong>dpo@flowraze.com</strong>. We will respond within 3x24 hours of receiving your request (UU PDP Article 13) and fulfill valid requests within 30 days.</p>

            <h2>9. Data Security Measures</h2>
            <p>We implement technical and organizational measures appropriate to the risk, including:</p>
            <ul>
              <li>TLS/HTTPS encryption for all data in transit</li>
              <li>Bcrypt password hashing with salt</li>
              <li>JWT-based authentication with token expiration</li>
              <li>Multi-tenant data isolation at the application and database level</li>
              <li>Rate limiting and brute-force protection</li>
              <li>Security headers (HSTS, X-Content-Type-Options, X-Frame-Options)</li>
              <li>Regular security assessments and code reviews</li>
              <li>Access logging and audit trails for sensitive operations</li>
            </ul>

            <h2>10. Data Breach Notification</h2>
            <p>In the event of a Personal Data breach (UU PDP Article 46):</p>
            <ul>
              <li>We will notify affected data subjects within 3x24 hours of becoming aware of the breach</li>
              <li>We will notify the Indonesian Personal Data Protection Authority as required by law</li>
              <li>The notification will include: the nature of the breach, data affected, potential consequences, and remedial measures taken</li>
              <li>We maintain an internal breach register documenting all incidents</li>
            </ul>

            <h2>11. Children's Privacy</h2>
            <p>FlowRaze is not intended for use by individuals under 17 years of age. We do not knowingly collect Personal Data from children. If we become aware that we have collected data from a child without parental consent, we will take steps to delete that information promptly.</p>

            <h2>12. Cookies and Tracking</h2>
            <p>FlowRaze uses essential cookies for authentication and session management. We do not use third-party advertising cookies or cross-site tracking. Technical cookies used include:</p>
            <ul>
              <li><strong>Authentication token:</strong> Stored in localStorage for session persistence</li>
              <li><strong>Preference settings:</strong> UI preferences stored locally in your browser</li>
            </ul>
            <p>No data is shared with advertising networks or social media platforms through our cookies.</p>

            <h2>13. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. When we make material changes:</p>
            <ul>
              <li>We will update the "Effective Date" and version number at the top of this page</li>
              <li>We will notify you via email and/or an in-app notification</li>
              <li>Where required by law, we will obtain your renewed consent before applying changes that affect the legal basis of processing</li>
            </ul>

            <h2>14. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or wish to exercise your data subject rights:</p>
            <ul>
              <li><strong>Data Protection Officer:</strong> dpo@flowraze.com</li>
              <li><strong>General Privacy Inquiries:</strong> privacy@flowraze.com</li>
              <li><strong>Legal Department:</strong> legal@flowraze.com</li>
              <li><strong>Address:</strong> PT FlowRaze Teknologi, Jakarta, Indonesia</li>
            </ul>
            <p>You also have the right to lodge a complaint with the Indonesian Personal Data Protection Authority or, for EEA residents, your local data protection supervisory authority.</p>
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
