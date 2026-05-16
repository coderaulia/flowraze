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
        .legal-content strong { color: #0c1030; }
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
            <p style={{ marginTop: 16, fontSize: 16, color: '#7a809a', fontWeight: 500 }}>Last Updated: May 16, 2026 · Version 2026-05-16</p>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ padding: '80px 32px', maxWidth: 800, margin: '0 auto' }} className="legal-content">
          <div data-reveal>
            <p>Please read these Terms of Service ("Terms") carefully before using the FlowRaze platform operated by PT FlowRaze Teknologi ("FlowRaze", "us", "we", or "our"), a company incorporated under the laws of the Republic of Indonesia.</p>
            <p>By creating an account or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms, our <Link to="/privacy" style={{ color: N, fontWeight: 600 }}>Privacy Policy</Link>, and all applicable laws and regulations, including but not limited to Indonesian Law No. 27 of 2022 on Personal Data Protection (UU PDP), Law No. 11 of 2008 on Electronic Information and Transactions (UU ITE) as amended by Law No. 1 of 2024, and Government Regulation No. 71 of 2019 on the Implementation of Electronic Systems and Transactions (PP PSTE).</p>
            
            <h2>1. Definitions</h2>
            <ul>
              <li><strong>"Platform"</strong> means the FlowRaze web application, APIs, and all related services.</li>
              <li><strong>"User"</strong> means any individual who creates an account on the Platform.</li>
              <li><strong>"Workspace"</strong> means a company-scoped environment within the Platform containing CRM data, team members, and configurations.</li>
              <li><strong>"Personal Data"</strong> means any data about an identified or identifiable individual, as defined under UU PDP Article 1(1) and GDPR Article 4(1).</li>
              <li><strong>"Data Controller"</strong> means the entity that determines the purposes and means of processing Personal Data. For workspace CRM data, the Workspace owner is the Data Controller.</li>
              <li><strong>"Data Processor"</strong> means FlowRaze, which processes Personal Data on behalf of the Data Controller.</li>
            </ul>

            <h2>2. Account Registration and Eligibility</h2>
            <p>To use FlowRaze, you must:</p>
            <ul>
              <li>Be at least 17 years of age or the age of legal majority in your jurisdiction</li>
              <li>Provide accurate, current, and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Provide explicit consent for the collection and processing of your Personal Data</li>
            </ul>
            <p>You must not create an account using false or misleading information. We reserve the right to suspend or terminate accounts that violate these requirements in accordance with UU ITE Article 35.</p>

            <h2>3. Consent and Legal Basis for Data Processing</h2>
            <p>In accordance with UU PDP Article 20 and GDPR Article 6, we process your Personal Data based on the following legal grounds:</p>
            <ul>
              <li><strong>Explicit Consent (UU PDP Art. 20(2)(a)):</strong> You provide explicit consent during registration by checking the consent checkbox. This consent is specific, informed, and unambiguous.</li>
              <li><strong>Contractual Necessity:</strong> Processing is necessary for the performance of this agreement and the provision of our services.</li>
              <li><strong>Legitimate Interest:</strong> Processing is necessary for our legitimate interests in improving the Platform, provided such interests do not override your fundamental rights.</li>
              <li><strong>Legal Obligation:</strong> Processing is necessary for compliance with applicable Indonesian and international laws.</li>
            </ul>
            <p>You may withdraw your consent at any time by contacting us at <strong>privacy@flowraze.com</strong> or through your account settings. Withdrawal of consent does not affect the lawfulness of processing based on consent before its withdrawal (UU PDP Article 9).</p>

            <h2>4. Use of Service</h2>
            <p>FlowRaze provides a workspace for managing leads, deals, campaigns, and marketing operations. You agree not to:</p>
            <ul>
              <li>Use the service for any illegal purposes or in violation of any applicable laws</li>
              <li>Attempt to gain unauthorized access to other workspaces or user accounts</li>
              <li>Upload malicious code, viruses, or interfere with platform integrity</li>
              <li>Use the platform to send unsolicited marketing communications (SPAM) in violation of UU ITE Article 26</li>
              <li>Process Personal Data of third parties without a valid legal basis</li>
              <li>Use the platform to collect or store sensitive personal data (as defined in UU PDP Article 4(2)) without explicit consent from the data subjects</li>
              <li>Circumvent or disable any security features of the Platform</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Platform</li>
            </ul>

            <h2>5. Data Controller Responsibilities</h2>
            <p>When you input third-party Personal Data into your Workspace (such as lead contact information), you act as the Data Controller under UU PDP and are responsible for:</p>
            <ul>
              <li>Ensuring you have a valid legal basis (consent or legitimate interest) to collect and process such data (UU PDP Article 20)</li>
              <li>Providing appropriate privacy notices to data subjects whose information you store in FlowRaze</li>
              <li>Responding to data subject access, correction, and deletion requests (UU PDP Articles 5-12)</li>
              <li>Ensuring the accuracy and currency of Personal Data stored in your Workspace</li>
              <li>Complying with data retention limitations and deleting data that is no longer necessary</li>
            </ul>
            <p>FlowRaze acts as a Data Processor and will process workspace data solely according to your instructions and for the purpose of providing the service.</p>

            <h2>6. Subscription and Billing</h2>
            <ul>
              <li><strong>Tiers:</strong> We offer various tiers (Starter, Growth, Pro, Custom). Features and limits depend on your selected plan.</li>
              <li><strong>Payments:</strong> Fees are billed in advance on a recurring basis in Indonesian Rupiah (IDR). All payments are processed through Midtrans, a licensed payment service provider regulated by Bank Indonesia.</li>
              <li><strong>Refunds:</strong> All payments are non-refundable unless required by applicable consumer protection law (UU No. 8 of 1999 on Consumer Protection).</li>
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time through your workspace settings. Upon cancellation, your access continues until the end of the current billing period.</li>
              <li><strong>Data After Cancellation:</strong> Upon account termination, we will retain your data for 30 days to allow for reactivation. After this period, your data will be permanently deleted in accordance with our data retention policy.</li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <p><strong>Our Content:</strong> The FlowRaze platform, including its source code, design, features, documentation, and functionality, is owned by PT FlowRaze Teknologi and protected under Indonesian Copyright Law (UU No. 28 of 2014) and international intellectual property treaties.</p>
            <p><strong>Your Content:</strong> You retain all rights to the data you input into the Platform. By using the service, you grant us a limited, non-exclusive, non-transferable license to process this data solely to provide the service to you. This license terminates when you delete your data or close your account.</p>
            <p><strong>Feedback:</strong> Any suggestions, ideas, or feedback you provide about the Platform may be used by us without obligation to you.</p>

            <h2>8. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your data, including:</p>
            <ul>
              <li>Encryption of data in transit (TLS/HTTPS)</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>Role-based access control and multi-tenant data isolation</li>
              <li>Regular security assessments and monitoring</li>
              <li>Rate limiting and abuse prevention</li>
            </ul>
            <p>In the event of a data breach that poses a high risk to your rights and freedoms, we will notify you and the relevant authorities within 72 hours as required by UU PDP Article 46 and GDPR Article 33.</p>

            <h2>9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law:</p>
            <ul>
              <li>FlowRaze is provided "as is" and "as available" without warranty of any kind, express or implied.</li>
              <li>We do not warrant that the service will be uninterrupted, error-free, or secure.</li>
              <li>In no event shall FlowRaze be liable for any indirect, incidental, special, consequential, or punitive damages.</li>
              <li>Our total liability shall not exceed the amount paid by you in the twelve (12) months preceding the claim.</li>
            </ul>
            <p>Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable Indonesian law, including liability for fraud or willful misconduct.</p>

            <h2>10. Indemnification</h2>
            <p>You agree to indemnify and hold harmless FlowRaze from any claims, damages, losses, or expenses arising from:</p>
            <ul>
              <li>Your violation of these Terms</li>
              <li>Your violation of any applicable law or regulation</li>
              <li>Your processing of third-party Personal Data without a valid legal basis</li>
              <li>Any third-party claims related to data you store in your Workspace</li>
            </ul>

            <h2>11. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice, if:</p>
            <ul>
              <li>You breach these Terms or any applicable law</li>
              <li>Your use of the Platform poses a security risk to other users</li>
              <li>We are required to do so by law or a court order</li>
              <li>Your account has been inactive for more than 12 consecutive months</li>
            </ul>
            <p>Upon termination, your right to use the Platform ceases immediately. We will provide you with the opportunity to export your data within 30 days of termination, after which your data will be permanently deleted.</p>

            <h2>12. Dispute Resolution</h2>
            <p>Any dispute arising from or relating to these Terms shall be resolved as follows:</p>
            <ul>
              <li><strong>Negotiation:</strong> The parties shall first attempt to resolve the dispute through good-faith negotiation within 30 days.</li>
              <li><strong>Mediation:</strong> If negotiation fails, the parties shall submit the dispute to mediation under the rules of the Indonesian National Arbitration Board (BANI).</li>
              <li><strong>Arbitration:</strong> If mediation fails, the dispute shall be finally resolved by arbitration administered by BANI in Jakarta, Indonesia, in accordance with its rules. The language of arbitration shall be Bahasa Indonesia or English.</li>
            </ul>

            <h2>13. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the Republic of Indonesia, including but not limited to:</p>
            <ul>
              <li>Law No. 27 of 2022 on Personal Data Protection (UU PDP)</li>
              <li>Law No. 11 of 2008 on Electronic Information and Transactions (UU ITE), as amended</li>
              <li>Government Regulation No. 71 of 2019 (PP PSTE)</li>
              <li>Law No. 8 of 1999 on Consumer Protection</li>
              <li>Indonesian Civil Code (KUHPerdata)</li>
            </ul>
            <p>For users located in the European Economic Area (EEA), these Terms do not affect your rights under the General Data Protection Regulation (GDPR) or local consumer protection laws that cannot be waived by contract.</p>

            <h2>14. International Users</h2>
            <p>FlowRaze is operated from Indonesia. If you access the Platform from outside Indonesia, you do so at your own initiative and are responsible for compliance with local laws. We make reasonable efforts to comply with internationally recognized data protection principles, including those established by the GDPR and APEC Cross-Border Privacy Rules.</p>

            <h2>15. Changes to These Terms</h2>
            <p>We reserve the right to modify these Terms at any time. We will notify you of material changes by:</p>
            <ul>
              <li>Posting the updated Terms on this page with a new "Last Updated" date</li>
              <li>Sending an email notification to your registered email address</li>
              <li>Displaying a prominent notice within the Platform</li>
            </ul>
            <p>Continued use of the Platform after changes take effect constitutes acceptance of the revised Terms. If you do not agree to the new Terms, you must stop using the Platform and may request deletion of your account and data.</p>

            <h2>16. Severability</h2>
            <p>If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect.</p>

            <h2>17. Contact Information</h2>
            <p>For questions about these Terms, please contact:</p>
            <ul>
              <li><strong>Email:</strong> legal@flowraze.com</li>
              <li><strong>Data Protection Officer:</strong> dpo@flowraze.com</li>
              <li><strong>Address:</strong> PT FlowRaze Teknologi, Jakarta, Indonesia</li>
            </ul>
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
