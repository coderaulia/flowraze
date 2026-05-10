import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { LandingHeader, LandingFooter, LandingButton, Eyebrow } from '@/components/landing';
import '@/components/landing/landing.css';

const PRICES = {
  growth: { monthly: '149k', annual: '119k' },
  performance: { monthly: '299k', annual: '239k' },
};

type FaqItem = { q: string; a: React.ReactNode };

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Can I start for free without a credit card?',
    a: <><strong>Yes.</strong> The Starter plan is free forever for up to 3 users. Our 14-day Performance trial also requires no card — we only ask for payment when you're ready to commit.</>,
  },
  {
    q: 'How does per-user pricing work?',
    a: <>Growth and Performance plans are billed based on the number of <strong>active seats</strong> in your team. You can add or remove users at any time, and your invoice adjusts proportionally on the next cycle.</>,
  },
  {
    q: 'Can I upgrade or downgrade later?',
    a: <><strong>Absolutely.</strong> Change plans anytime from your dashboard. Upgrades take effect immediately. Downgrades apply at the start of your next billing cycle — no penalties, no friction.</>,
  },
  {
    q: 'What payment methods do you accept?',
    a: <>We accept all major credit cards, virtual accounts (BCA, Mandiri, BNI, BRI), GoPay, OVO, and bank transfer for annual plans. Enterprise customers can request invoicing with PO terms.</>,
  },
  {
    q: 'Is my data secure?',
    a: <>Your data is encrypted at rest and in transit. We're SOC 2 Type II audited and compliant with Indonesian data protection regulations (UU PDP). Enterprise customers can opt for in-region data residency.</>,
  },
  {
    q: 'Do you offer discounts for startups or non-profits?',
    a: <>Yes — we offer 50% off Growth and Performance plans for early-stage startups (under 18 months old) and registered non-profits. Reach out to our team and we'll get you set up.</>,
  },
];

const Ck = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#e6f7ee', color: '#1aa86b', fontWeight: 700, fontSize: 12 }}>✓</span>
);
const Dash = () => <span style={{ color: '#cfd3e3', fontWeight: 600 }}>—</span>;

export function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-reveal],[data-stagger]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const gAmt = PRICES.growth[billing];
  const pAmt = PRICES.performance[billing];

  return (
    <>
      <SEO 
        title="Transparent Plans for Every Team" 
        description="FlowRaze pricing is simple and scales with you. No hidden fees, no seat traps. Start for free today."
      />
      <style>{`
        [data-reveal]{opacity:0;transform:translateY(28px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
        [data-reveal="scale"]{transform:scale(.96)}
        [data-reveal].in{opacity:1;transform:none}
        [data-stagger]>*{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}
        [data-stagger].in>*{opacity:1;transform:none}
        [data-stagger].in>*:nth-child(1){transition-delay:.05s}
        [data-stagger].in>*:nth-child(2){transition-delay:.12s}
        [data-stagger].in>*:nth-child(3){transition-delay:.19s}
        [data-stagger].in>*:nth-child(4){transition-delay:.26s}
        @media(prefers-reduced-motion:reduce){[data-reveal],[data-stagger]>*{opacity:1!important;transform:none!important;transition:none!important}}

        .pr-hero{padding:88px 32px 56px;text-align:center;position:relative;overflow:hidden;background:#fff}
        .pr-hero::before{content:"";position:absolute;left:50%;top:-160px;width:1200px;height:1200px;transform:translateX(-50%);background:radial-gradient(closest-side,rgba(29,40,121,.07),transparent 70%);pointer-events:none}
        .pr-hero-grid{position:absolute;inset:0;background-image:linear-gradient(#e6e8f0 1px,transparent 1px),linear-gradient(90deg,#e6e8f0 1px,transparent 1px);background-size:64px 64px;mask-image:radial-gradient(ellipse 60% 70% at 50% 30%,black 30%,transparent 75%);opacity:.45;pointer-events:none}
        .pr-hero h1{margin:22px auto 0;max-width:920px;font-size:clamp(42px,6vw,72px);line-height:1.02;letter-spacing:-.035em;color:#0c1030;font-weight:700}
        .pr-hero .pr-lead{margin:24px auto 0;font-size:18px;color:#5a6178;line-height:1.6;max-width:560px}
        .pr-accent{color:#1d2879;position:relative;display:inline-block}
        .pr-accent::after{content:"";position:absolute;left:0;right:0;bottom:6px;height:14px;background:linear-gradient(180deg,transparent 50%,rgba(29,40,121,.15) 50%);z-index:-1;border-radius:2px}
        .pr-serif{font-family:"Instrument Serif",serif;font-style:italic;font-weight:400;letter-spacing:-.01em}

        .billing-toggle{display:inline-flex;align-items:center;gap:10px;margin-top:36px;padding:5px;background:#f5f6fb;border:1px solid #e6e8f0;border-radius:999px;font-size:13.5px;font-weight:600}
        .billing-toggle button{padding:9px 18px;border-radius:999px;color:#5a6178;transition:all .25s;display:inline-flex;align-items:center;gap:8px;background:none;border:none;font-family:inherit;font-size:13.5px;font-weight:600;cursor:pointer}
        .billing-toggle button.on{background:#fff;color:#0c1030;box-shadow:0 1px 2px rgba(20,26,77,.06),0 4px 12px -4px rgba(20,26,77,.08)}
        .save-pill{font-size:10px;font-weight:700;background:#e6f7ee;color:#1aa86b;padding:3px 8px;border-radius:999px;letter-spacing:.04em}

        .pr-plans{padding:48px 32px 96px;background:#fff}
        .pr-plans-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;max-width:1240px;margin:0 auto}
        .pr-plan{position:relative;background:#fff;border:1px solid #e6e8f0;border-radius:18px;padding:32px 28px;display:flex;flex-direction:column;gap:18px;transition:transform .3s,box-shadow .3s,border-color .25s}
        .pr-plan:hover{transform:translateY(-4px);box-shadow:0 30px 60px -28px rgba(20,26,77,.18);border-color:#d0d6ee}
        .pr-plan.popular{background:#1d2879;border-color:#1d2879;color:#fff;box-shadow:0 30px 60px -25px rgba(20,26,77,.5),0 12px 28px -16px rgba(20,26,77,.35)}
        .pr-plan.popular:hover{transform:translateY(-6px)}
        .pr-plan-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:#fff;color:#1d2879;font-size:11px;font-weight:700;letter-spacing:.1em;padding:6px 14px;border-radius:999px;text-transform:uppercase;box-shadow:0 6px 16px -6px rgba(20,26,77,.3);white-space:nowrap}
        .pr-plan-name{font-size:13.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#1d2879}
        .pr-plan.popular .pr-plan-name{color:#a8b3ff}
        .pr-plan-tagline{font-size:13.5px;color:#5a6178;line-height:1.5;min-height:42px}
        .pr-plan.popular .pr-plan-tagline{color:#cdd1eb}
        .pr-plan-price{display:flex;align-items:baseline;gap:6px;margin-top:2px;flex-wrap:wrap}
        .pr-plan-price .pre{font-size:14px;font-weight:600;color:#5a6178}
        .pr-plan.popular .pr-plan-price .pre{color:#a8b3ff}
        .pr-plan-price .amt{font-size:42px;font-weight:700;letter-spacing:-.03em;line-height:1;color:#0c1030}
        .pr-plan.popular .pr-plan-price .amt{color:#fff}
        .pr-plan-price .per{font-size:13px;color:#5a6178}
        .pr-plan.popular .pr-plan-price .per{color:#a8b3ff}
        .pr-plan-price .strike{font-size:14px;color:#9aa0bb;text-decoration:line-through;margin-left:6px}
        .pr-plan-cta{display:flex;align-items:center;justify-content:center;width:100%;padding:13px 16px;border-radius:11px;font-weight:600;font-size:14.5px;transition:all .2s;cursor:pointer;border:1px solid #e6e8f0;background:#fff;color:#0c1030;font-family:inherit}
        .pr-plan-cta:hover{border-color:#1d2879;color:#1d2879}
        .pr-plan.popular .pr-plan-cta{background:#fff;color:#1d2879;border-color:#fff}
        .pr-plan.popular .pr-plan-cta:hover{background:#f3f4ff;transform:translateY(-1px)}
        .pr-plan.featured-cta .pr-plan-cta{background:#1d2879;color:#fff;border-color:#1d2879}
        .pr-plan.featured-cta .pr-plan-cta:hover{background:#141a4d;transform:translateY(-1px)}
        .pr-plan-divider{border-top:1px solid #e6e8f0;margin:0;opacity:.7}
        .pr-plan.popular .pr-plan-divider{border-color:rgba(255,255,255,.18)}
        .pr-plan-feats{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:11px}
        .pr-plan-feats li{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:#3a4060;line-height:1.45}
        .pr-plan-feats li::before{content:"";display:block;width:18px;height:18px;flex-shrink:0;margin-top:2px;border-radius:50%;background:#e6f7ee url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path d='M3 8.5l3 3 6-7' fill='none' stroke='%231aa86b' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/></svg>") center/12px no-repeat}
        .pr-plan.popular .pr-plan-feats li{color:#dfe2f4}
        .pr-plan.popular .pr-plan-feats li::before{background:rgba(34,201,122,.18) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path d='M3 8.5l3 3 6-7' fill='none' stroke='%2322c97a' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/></svg>") center/12px no-repeat}
        .pr-plan-feats .head-row{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#0c1030;padding-top:6px}
        .pr-plan-feats .head-row::before{display:none}
        .pr-plan.popular .pr-plan-feats .head-row{color:#fff}

        .pr-compare{padding:120px 32px;background:#f5f6fb;border-top:1px solid #e6e8f0}
        .pr-compare-head{text-align:center;margin-bottom:48px}
        .pr-compare-head h2{margin-top:18px;font-size:clamp(32px,4vw,48px);line-height:1.08;letter-spacing:-.03em;color:#0c1030}
        .pr-ctab{max-width:1100px;margin:0 auto;background:#fff;border:1px solid #e6e8f0;border-radius:18px;overflow:hidden;box-shadow:0 18px 40px -22px rgba(20,26,77,.12)}
        .pr-crow{display:grid;grid-template-columns:2fr repeat(4,1fr);align-items:center;border-bottom:1px solid #e6e8f0}
        .pr-crow:last-child{border-bottom:none}
        .pr-crow.section-h{background:#f5f6fb}
        .pr-ccell{padding:18px 22px;font-size:14px;color:#3a4060;text-align:center;font-weight:500}
        .pr-ccell:first-child{text-align:left;font-weight:600;color:#0c1030}
        .pr-crow.head-row .pr-ccell{font-size:14px;font-weight:700;color:#0c1030;background:#fff;padding:22px;letter-spacing:-.01em}
        .pr-crow.head-row .pr-ccell.pop{background:#1d2879;color:#fff}
        .pr-crow.head-row .pr-ccell.pop .small{font-size:11px;font-weight:600;color:#a8b3ff;display:block;margin-top:2px;letter-spacing:.04em}
        .pr-crow.head-row .pr-ccell .small{font-size:11px;font-weight:500;color:#5a6178;display:block;margin-top:2px}
        .pr-crow.section-h .pr-ccell{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#7a809a;padding:14px 22px;text-align:left}
        .pr-ccell.pop{background:rgba(29,40,121,.025)}

        .pr-trial{padding:96px 32px}
        .pr-trial-card{max-width:1180px;margin:0 auto;background:linear-gradient(135deg,#1d2879 0%,#28349c 100%);color:#fff;border-radius:32px;padding:64px;display:grid;grid-template-columns:1.4fr 1fr;align-items:center;gap:48px;position:relative;overflow:hidden}
        .pr-trial-card::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 15% 30%,rgba(94,114,228,.5),transparent 40%),radial-gradient(circle at 85% 70%,rgba(45,202,140,.3),transparent 40%);pointer-events:none}
        .pr-trial-card>*{position:relative;z-index:1}
        .pr-trial-card h2{color:#fff;font-size:clamp(28px,3.5vw,42px);line-height:1.1;margin-bottom:14px}
        .pr-trial-card p{color:#cdd1eb;font-size:16px;margin:0 0 28px;max-width:480px}
        .pr-trial-meta{margin-top:18px;font-size:13px;color:#a8aed6}
        .pr-trial-vis{position:relative;display:flex;justify-content:center}
        .pr-trial-clock{width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.12),rgba(255,255,255,.04));border:1.5px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff;position:relative}
        .pr-trial-clock::before,.pr-trial-clock::after{content:"";position:absolute;border-radius:50%;border:1px dashed rgba(255,255,255,.15)}
        .pr-trial-clock::before{inset:14px;animation:prRot 30s linear infinite}
        .pr-trial-clock::after{inset:32px;animation:prRot 22s linear infinite reverse;border-color:rgba(45,202,140,.3)}
        @keyframes prRot{to{transform:rotate(360deg)}}
        .pr-clock-num{font-size:96px;font-weight:700;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
        .pr-clock-lbl{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#b6bce3;margin-top:4px}
        .pr-trial-dots{position:absolute;width:100%;height:100%;left:0;top:0;pointer-events:none}
        .pr-trial-dots i{position:absolute;width:8px;height:8px;border-radius:50%;background:#22c97a;box-shadow:0 0 0 3px rgba(34,201,122,.25);font-style:normal}
        .pr-trial-dots i:nth-child(1){top:8%;left:50%;animation:prOrb 8s linear infinite}
        .pr-trial-dots i:nth-child(2){top:50%;right:8%;background:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.15);animation:prOrb 8s linear -2.6s infinite}
        .pr-trial-dots i:nth-child(3){bottom:8%;left:50%;background:#a8b3ff;box-shadow:0 0 0 3px rgba(168,179,255,.2);animation:prOrb 8s linear -5.3s infinite}
        @keyframes prOrb{0%{transform:rotate(0) translateY(-110px) rotate(0)}100%{transform:rotate(360deg) translateY(-110px) rotate(-360deg)}}

        .pr-faq{padding:120px 32px;background:#fff}
        .pr-faq-head{text-align:center;margin-bottom:56px}
        .pr-faq-head h2{margin-top:18px;font-size:clamp(32px,4vw,48px);line-height:1.08;letter-spacing:-.03em;color:#0c1030}
        .pr-faq-list{max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
        .pr-faq-item{background:#fff;border:1px solid #e6e8f0;border-radius:14px;overflow:hidden;transition:border-color .25s,box-shadow .25s}
        .pr-faq-item:hover{border-color:#c8ccdb}
        .pr-faq-item.open{border-color:#1d2879;box-shadow:0 18px 40px -22px rgba(20,26,77,.18)}
        .pr-faq-q{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 26px;font-weight:600;font-size:16px;color:#0c1030;cursor:pointer;width:100%;text-align:left;letter-spacing:-.01em;background:none;border:none;font-family:inherit}
        .pr-faq-chev{width:32px;height:32px;border-radius:50%;background:#f5f6fb;display:grid;place-items:center;font-size:14px;color:#1d2879;transition:transform .3s ease,background .25s;flex-shrink:0}
        .pr-faq-item.open .pr-faq-chev{transform:rotate(180deg);background:#1d2879;color:#fff}
        .pr-faq-a{max-height:0;overflow:hidden;transition:max-height .35s cubic-bezier(.2,.7,.2,1)}
        .pr-faq-a.open{max-height:200px}
        .pr-faq-a-inner{padding:0 26px 26px;color:#5a6178;font-size:15px;line-height:1.6}

        .pr-final{padding:120px 32px}
        .pr-final-card{max-width:1180px;margin:0 auto;background:#f5f6fb;border:1px solid #e6e8f0;border-radius:32px;padding:80px 64px;text-align:center;position:relative;overflow:hidden}
        .pr-final-card h2{font-size:clamp(32px,4vw,48px);letter-spacing:-.03em;color:#0c1030;margin-bottom:16px}
        .pr-final-card p{font-size:17px;color:#5a6178;max-width:560px;margin:0 auto 32px}
        .pr-final-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}

        @media(max-width:1024px){
          .pr-plans-grid{grid-template-columns:repeat(2,1fr)}
          .pr-ctab{overflow-x:auto}
          .pr-trial-card{grid-template-columns:1fr;padding:48px 32px}
          .pr-trial-vis{order:-1}
        }
        @media(max-width:640px){
          .pr-plans-grid{grid-template-columns:1fr}
          .pr-hero{padding:64px 20px 40px}
          .pr-plans{padding:32px 20px 64px}
          .pr-final-card{padding:48px 24px}
        }
      `}</style>

      <div className="lp-root">
        <LandingHeader />

        <main>
          {/* Hero */}
          <section className="pr-hero">
            <div className="pr-hero-grid" />
            <div className="lp-container" style={{ position: 'relative' }}>
              <Eyebrow data-reveal="fade">Pricing</Eyebrow>
              <h1 data-reveal="up">
                Simple pricing.<br />
                Built to <span className="pr-accent pr-serif">grow with you.</span>
              </h1>
              <p className="pr-lead" data-reveal="up">
                Start free. Scale as your business grows. No hidden fees. No setup tax. No surprises on the invoice.
              </p>
              <div className="billing-toggle" data-reveal="up">
                <button
                  className={billing === 'monthly' ? 'on' : ''}
                  onClick={() => setBilling('monthly')}
                >
                  Monthly
                </button>
                <button
                  className={billing === 'annual' ? 'on' : ''}
                  onClick={() => setBilling('annual')}
                >
                  Annual <span className="save-pill">SAVE 20%</span>
                </button>
              </div>
            </div>
          </section>

          {/* Plan Cards */}
          <section className="pr-plans">
            <div className="pr-plans-grid" data-stagger>
              {/* Starter */}
              <div className="pr-plan">
                <div>
                  <div className="pr-plan-name">Starter</div>
                  <div className="pr-plan-tagline">Perfect for solo founders or small teams getting their first system off spreadsheets.</div>
                </div>
                <div className="pr-plan-price">
                  <span className="amt">Rp 0</span>
                  <span className="per">/ forever</span>
                </div>
                <Link to="/login"><button className="pr-plan-cta">Start Free</button></Link>
                <hr className="pr-plan-divider" />
                <ul className="pr-plan-feats">
                  <li>Up to 3 users</li>
                  <li>Lead &amp; contact management</li>
                  <li>Basic deal pipeline (1 board)</li>
                  <li>Mobile app (iOS &amp; Android)</li>
                  <li>Email support</li>
                </ul>
              </div>

              {/* Growth */}
              <div className="pr-plan popular">
                <div className="pr-plan-badge">Most Popular</div>
                <div>
                  <div className="pr-plan-name">Growth</div>
                  <div className="pr-plan-tagline">For growing teams that want clarity, automation, and real revenue insight.</div>
                </div>
                <div className="pr-plan-price">
                  <span className="pre">Rp</span>
                  <span className="amt">{gAmt}</span>
                  <span className="per">/ user / mo</span>
                  {billing === 'annual' && <span className="strike">Rp 149k</span>}
                </div>
                <Link to="/login"><button className="pr-plan-cta">Start 14-Day Trial</button></Link>
                <hr className="pr-plan-divider" />
                <ul className="pr-plan-feats">
                  <li className="head-row">Everything in Starter, plus:</li>
                  <li>Unlimited users &amp; pipelines</li>
                  <li>Full sales pipeline tracking with stages</li>
                  <li>Revenue dashboard &amp; forecasting</li>
                  <li>Team performance tracking</li>
                  <li>WhatsApp + email integrations</li>
                  <li>Priority support (chat + email)</li>
                </ul>
              </div>

              {/* Performance */}
              <div className="pr-plan featured-cta">
                <div>
                  <div className="pr-plan-name">Performance</div>
                  <div className="pr-plan-tagline">For teams serious about scaling — with attribution, automation, and APIs.</div>
                </div>
                <div className="pr-plan-price">
                  <span className="pre">Rp</span>
                  <span className="amt">{pAmt}</span>
                  <span className="per">/ user / mo</span>
                  {billing === 'annual' && <span className="strike">Rp 299k</span>}
                </div>
                <Link to="/login"><button className="pr-plan-cta">Upgrade to Performance</button></Link>
                <hr className="pr-plan-divider" />
                <ul className="pr-plan-feats">
                  <li className="head-row">Everything in Growth, plus:</li>
                  <li>Advanced analytics &amp; cohorts</li>
                  <li>Multi-touch attribution &amp; ROAS</li>
                  <li>Conversion funnel tracking</li>
                  <li>API access &amp; workflow automation</li>
                  <li>Custom roles &amp; permissions</li>
                  <li>Dedicated onboarding specialist</li>
                </ul>
              </div>

              {/* Enterprise */}
              <div className="pr-plan">
                <div>
                  <div className="pr-plan-name">Enterprise</div>
                  <div className="pr-plan-tagline">For organizations that need full control, security, and white-glove support.</div>
                </div>
                <div className="pr-plan-price">
                  <span className="amt">Custom</span>
                </div>
                <Link to="/login"><button className="pr-plan-cta">Talk to Sales</button></Link>
                <hr className="pr-plan-divider" />
                <ul className="pr-plan-feats">
                  <li className="head-row">Everything in Performance, plus:</li>
                  <li>Custom integrations &amp; SSO</li>
                  <li>Dedicated success manager</li>
                  <li>SLA &amp; security audit</li>
                  <li>Data residency options</li>
                  <li>Custom contracts &amp; invoicing</li>
                  <li>24/7 priority support</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Compare */}
          <section className="pr-compare">
            <div className="lp-container">
              <div className="pr-compare-head">
                <Eyebrow data-reveal="fade">Detailed Comparison</Eyebrow>
                <h2 data-reveal="up">Compare every feature, <span className="pr-serif pr-accent">side by side.</span></h2>
                <p className="lp-lead" style={{ margin: '18px auto 0', textAlign: 'center' }} data-reveal="up">
                  No fine print. No mystery upsells. Pick the plan that matches your stage.
                </p>
              </div>

              <div className="pr-ctab" data-reveal="up">
                <div className="pr-crow head-row">
                  <div className="pr-ccell">Core Features</div>
                  <div className="pr-ccell">Starter<span className="small">Free forever</span></div>
                  <div className="pr-ccell pop">Growth<span className="small">Most popular</span></div>
                  <div className="pr-ccell">Performance<span className="small">For scaling teams</span></div>
                  <div className="pr-ccell">Enterprise<span className="small">Custom</span></div>
                </div>

                <div className="pr-crow section-h"><div className="pr-ccell">Core platform</div><div className="pr-ccell" /><div className="pr-ccell pop" /><div className="pr-ccell" /><div className="pr-ccell" /></div>
                <div className="pr-crow"><div className="pr-ccell">Users</div><div className="pr-ccell">Up to 3</div><div className="pr-ccell pop">Unlimited</div><div className="pr-ccell">Unlimited</div><div className="pr-ccell">Unlimited</div></div>
                <div className="pr-crow"><div className="pr-ccell">Leads &amp; contacts</div><div className="pr-ccell"><Ck /></div><div className="pr-ccell pop"><Ck /></div><div className="pr-ccell"><Ck /></div><div className="pr-ccell"><Ck /></div></div>
                <div className="pr-crow"><div className="pr-ccell">Deal pipelines</div><div className="pr-ccell">1 (basic)</div><div className="pr-ccell pop">Custom stages</div><div className="pr-ccell">Multi-pipeline</div><div className="pr-ccell">Multi-pipeline</div></div>
                <div className="pr-crow"><div className="pr-ccell">Mobile apps</div><div className="pr-ccell"><Ck /></div><div className="pr-ccell pop"><Ck /></div><div className="pr-ccell"><Ck /></div><div className="pr-ccell"><Ck /></div></div>

                <div className="pr-crow section-h"><div className="pr-ccell">Insights &amp; analytics</div><div className="pr-ccell" /><div className="pr-ccell pop" /><div className="pr-ccell" /><div className="pr-ccell" /></div>
                <div className="pr-crow"><div className="pr-ccell">Revenue dashboard</div><div className="pr-ccell">Basic</div><div className="pr-ccell pop">Real-time</div><div className="pr-ccell">Real-time</div><div className="pr-ccell">Real-time</div></div>
                <div className="pr-crow"><div className="pr-ccell">Campaign attribution</div><div className="pr-ccell"><Dash /></div><div className="pr-ccell pop">Single-touch</div><div className="pr-ccell">Multi-touch</div><div className="pr-ccell">Multi-touch + custom</div></div>
                <div className="pr-crow"><div className="pr-ccell">Conversion funnel</div><div className="pr-ccell"><Dash /></div><div className="pr-ccell pop"><Ck /></div><div className="pr-ccell"><Ck /></div><div className="pr-ccell"><Ck /></div></div>
                <div className="pr-crow"><div className="pr-ccell">Forecasting</div><div className="pr-ccell"><Dash /></div><div className="pr-ccell pop">Linear</div><div className="pr-ccell">Predictive ML</div><div className="pr-ccell">Custom models</div></div>

                <div className="pr-crow section-h"><div className="pr-ccell">Automation &amp; integrations</div><div className="pr-ccell" /><div className="pr-ccell pop" /><div className="pr-ccell" /><div className="pr-ccell" /></div>
                <div className="pr-crow"><div className="pr-ccell">Workflow automation</div><div className="pr-ccell"><Dash /></div><div className="pr-ccell pop">Manual triggers</div><div className="pr-ccell">Workflow engine</div><div className="pr-ccell">Custom flows</div></div>
                <div className="pr-crow"><div className="pr-ccell">API access</div><div className="pr-ccell"><Dash /></div><div className="pr-ccell pop"><Dash /></div><div className="pr-ccell"><Ck /></div><div className="pr-ccell">Enterprise API</div></div>
                <div className="pr-crow"><div className="pr-ccell">Webhooks</div><div className="pr-ccell"><Dash /></div><div className="pr-ccell pop">Limited</div><div className="pr-ccell">Unlimited</div><div className="pr-ccell">Unlimited</div></div>

                <div className="pr-crow section-h"><div className="pr-ccell">Security &amp; support</div><div className="pr-ccell" /><div className="pr-ccell pop" /><div className="pr-ccell" /><div className="pr-ccell" /></div>
                <div className="pr-crow"><div className="pr-ccell">SSO &amp; SAML</div><div className="pr-ccell"><Dash /></div><div className="pr-ccell pop"><Dash /></div><div className="pr-ccell"><Ck /></div><div className="pr-ccell"><Ck /></div></div>
                <div className="pr-crow"><div className="pr-ccell">Dedicated success manager</div><div className="pr-ccell"><Dash /></div><div className="pr-ccell pop"><Dash /></div><div className="pr-ccell">Onboarding</div><div className="pr-ccell"><Ck /></div></div>
                <div className="pr-crow"><div className="pr-ccell">Support</div><div className="pr-ccell">Email</div><div className="pr-ccell pop">Chat + email</div><div className="pr-ccell">Priority</div><div className="pr-ccell">24/7 + SLA</div></div>
              </div>
            </div>
          </section>

          {/* Trial Banner */}
          <section className="pr-trial">
            <div className="pr-trial-card" data-reveal="scale">
              <div>
                <Eyebrow style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}>Try Before You Decide</Eyebrow>
                <h2 style={{ marginTop: 18 }}>
                  Try the full power of FlowRaze — <span className="pr-serif">free for 14 days.</span>
                </h2>
                <p>No credit card. No setup call. Just full access to every Performance feature, on us. Experience how FlowRaze transforms your operations from day one.</p>
                <Link to="/login">
                  <LandingButton size="lg">Start 14-Day Trial →</LandingButton>
                </Link>
                <div className="pr-trial-meta">Cancel anytime · Your data stays yours</div>
              </div>
              <div className="pr-trial-vis">
                <div className="pr-trial-clock">
                  <div className="pr-clock-num">14</div>
                  <div className="pr-clock-lbl">Days Free</div>
                  <div className="pr-trial-dots">
                    <i /><i /><i />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="pr-faq">
            <div className="lp-container">
              <div className="pr-faq-head">
                <Eyebrow data-reveal="fade">Frequently Asked</Eyebrow>
                <h2 data-reveal="up">The questions <span className="pr-serif pr-accent">everyone asks.</span></h2>
              </div>
              <div className="pr-faq-list" data-stagger>
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} className={`pr-faq-item${openFaq === i ? ' open' : ''}`}>
                    <button className="pr-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span>{item.q}</span>
                      <span className="pr-faq-chev">▾</span>
                    </button>
                    <div className={`pr-faq-a${openFaq === i ? ' open' : ''}`}>
                      <p className="pr-faq-a-inner">{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="pr-final">
            <div className="pr-final-card" data-reveal="scale">
              <Eyebrow>Stop Guessing. Start Growing.</Eyebrow>
              <h2 style={{ marginTop: 18 }}>
                Start understanding your business <span className="pr-serif pr-accent">today.</span>
              </h2>
              <p>No setup complexity. No learning curve. Just clarity — from day one.</p>
              <div className="pr-final-btns">
                <Link to="/login">
                  <LandingButton size="lg">Get Started Free →</LandingButton>
                </Link>
                <LandingButton variant="ghost" size="lg">Book a Demo</LandingButton>
              </div>
            </div>
          </section>
        </main>

        <LandingFooter />
      </div>
    </>
  );
}
