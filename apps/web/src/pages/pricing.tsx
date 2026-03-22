import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white">
        <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
          <Link to="/" className="text-xl font-bold tracking-tighter text-primary">FlowRaze</Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Features</Link>
            <Link to="/solutions" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Solutions</Link>
            <Link to="/pricing" className="text-primary font-semibold border-b-2 border-primary pb-1">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="px-4 py-2 text-on-surface-variant font-medium">Log In</Button>
            </Link>
            <Link to="/login">
              <Button className="bg-cta-gradient text-white shadow-lg px-6 py-2.5 font-semibold">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 mb-20">
          <div className="max-w-3xl">
            <span className="text-primary font-bold tracking-widest text-xs uppercase mb-4 block">Precision Plans</span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-on-surface">
              Simple Pricing.<br/>Built to Grow With You.
            </h1>
            <p className="text-xl text-on-surface-variant leading-relaxed max-w-2xl">
              Start free. Scale as your business grows. No hidden fees, no complexity. Experience the power of curated data.
            </p>
          </div>
        </section>

        {/* Pricing Bento Grid */}
        <section className="max-w-7xl mx-auto px-8 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
            {/* FREE Card */}
            <Card className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
              <div>
                <h3 className="font-bold text-lg mb-2">Starter Flow</h3>
                <div className="mb-6">
                  <span className="text-4xl font-black tracking-tight">Rp 0</span>
                  <span className="text-on-surface-variant text-sm">/ month</span>
                </div>
                <p className="text-sm text-on-surface-variant mb-8">Perfect for small teams getting started.</p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-primary text-lg">✓</span>
                    <span>Up to 3 users</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-primary text-lg">✓</span>
                    <span>Lead & contact management</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-primary text-lg">✓</span>
                    <span>Basic deal pipeline</span>
                  </li>
                </ul>
              </div>
              <Link to="/login">
                <Button className="w-full py-3 rounded-lg font-semibold bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors">Start Free</Button>
              </Link>
            </Card>

            {/* GROWTH Card (Most Popular) */}
            <Card className="bg-surface-container-lowest p-8 rounded-xl ring-2 ring-primary flex flex-col justify-between relative shadow-2xl hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-4 py-1 rounded-full tracking-widest uppercase">Best Value</div>
              <div>
                <h3 className="font-bold text-lg mb-2">Growth Flow</h3>
                <div className="mb-6">
                  <span className="text-4xl font-black tracking-tight">Rp 149k</span>
                  <span className="text-on-surface-variant text-sm">/ user / mo</span>
                </div>
                <p className="text-sm text-on-surface-variant mb-8">Built for growing teams that want clarity.</p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-primary font-semibold">Everything in Free, plus:</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-secondary text-lg">📈</span>
                    <span>Full sales pipeline tracking</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-secondary text-lg">📊</span>
                    <span>Revenue dashboard</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-secondary text-lg">👥</span>
                    <span>Team performance tracking</span>
                  </li>
                </ul>
              </div>
              <Link to="/login">
                <Button className="w-full py-4 rounded-lg font-bold bg-cta-gradient text-white shadow-lg hover:opacity-95 transition-opacity">Start Free Trial (14 Days)</Button>
              </Link>
            </Card>

            {/* PRO Card */}
            <Card className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
              <div>
                <h3 className="font-bold text-lg mb-2">Performance Flow</h3>
                <div className="mb-6">
                  <span className="text-4xl font-black tracking-tight">Rp 299k</span>
                  <span className="text-on-surface-variant text-sm">/ user / mo</span>
                </div>
                <p className="text-sm text-on-surface-variant mb-8">For teams serious about scaling performance.</p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-primary font-semibold">Everything in Growth, plus:</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-primary text-lg">📊</span>
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-primary text-lg">🔍</span>
                    <span>Conversion funnel tracking</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-primary text-lg">⚙️</span>
                    <span>API access & Automation</span>
                  </li>
                </ul>
              </div>
              <Link to="/login">
                <Button className="w-full py-3 rounded-lg font-semibold bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors">Upgrade to Pro</Button>
              </Link>
            </Card>

            {/* CUSTOM Card */}
            <Card className="bg-surface-container-low p-8 rounded-xl flex flex-col justify-between border-2 border-transparent hover:-translate-y-1 transition-transform duration-300">
              <div>
                <h3 className="font-bold text-lg mb-2">Enterprise Flow</h3>
                <div className="mb-6">
                  <span className="text-4xl font-black tracking-tight">Custom</span>
                </div>
                <p className="text-sm text-on-surface-variant mb-8">For organizations that need full control and customization.</p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-primary text-lg">🔒</span>
                    <span>Custom Integrations</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-primary text-lg">🎧</span>
                    <span>Dedicated Success Manager</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <span className="text-primary text-lg">📋</span>
                    <span>SLA & Security Audit</span>
                  </li>
                </ul>
              </div>
              <Link to="/login">
                <Button className="w-full py-3 rounded-lg font-semibold bg-on-surface text-surface-container-lowest hover:bg-opacity-90 transition-opacity">Talk to Sales</Button>
              </Link>
            </Card>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="max-w-7xl mx-auto px-8 mb-32 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-2 text-on-surface">Compare Features</h2>
              <p className="text-on-surface-variant">Detailed breakdown of what fits your architecture.</p>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-container-high">
                    <th className="py-6 px-4 font-bold text-sm uppercase tracking-widest text-on-surface-variant">Core Features</th>
                    <th className="py-6 px-4 font-bold text-center">Free</th>
                    <th className="py-6 px-4 font-bold text-center text-primary">Growth</th>
                    <th className="py-6 px-4 font-bold text-center">Pro</th>
                    <th className="py-6 px-4 font-bold text-center">Custom</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-surface-container-high/50">
                    <td className="py-4 px-4 font-medium">Users</td>
                    <td className="py-4 px-4 text-center">Up to 3</td>
                    <td className="py-4 px-4 text-center">Unlimited</td>
                    <td className="py-4 px-4 text-center">Unlimited</td>
                    <td className="py-4 px-4 text-center">Unlimited</td>
                  </tr>
                  <tr className="border-b border-surface-container-high/50">
                    <td className="py-4 px-4 font-medium">Leads & Contacts</td>
                    <td className="py-4 px-4 text-center"><span className="text-primary">✓</span></td>
                    <td className="py-4 px-4 text-center"><span className="text-primary">✓</span></td>
                    <td className="py-4 px-4 text-center"><span className="text-primary">✓</span></td>
                    <td className="py-4 px-4 text-center"><span className="text-primary">✓</span></td>
                  </tr>
                  <tr className="border-b border-surface-container-high/50">
                    <td className="py-4 px-4 font-medium">Deal Pipeline</td>
                    <td className="py-4 px-4 text-center">Basic</td>
                    <td className="py-4 px-4 text-center">Custom Stages</td>
                    <td className="py-4 px-4 text-center">Multi-Pipeline</td>
                    <td className="py-4 px-4 text-center">Multi-Pipeline</td>
                  </tr>
                  <tr className="border-b border-surface-container-high/50">
                    <td className="py-4 px-4 font-medium">Campaign Tracking</td>
                    <td className="py-4 px-4 text-center">—</td>
                    <td className="py-4 px-4 text-center"><span className="text-primary">✓</span></td>
                    <td className="py-4 px-4 text-center">Advanced</td>
                    <td className="py-4 px-4 text-center">Advanced</td>
                  </tr>
                  <tr className="border-b border-surface-container-high/50">
                    <td className="py-4 px-4 font-medium">Revenue Dashboard</td>
                    <td className="py-4 px-4 text-center">Basic</td>
                    <td className="py-4 px-4 text-center"><span className="text-primary">✓</span></td>
                    <td className="py-4 px-4 text-center">Real-time</td>
                    <td className="py-4 px-4 text-center">Real-time</td>
                  </tr>
                  <tr className="border-b border-surface-container-high/50">
                    <td className="py-4 px-4 font-medium">Automation</td>
                    <td className="py-4 px-4 text-center">—</td>
                    <td className="py-4 px-4 text-center">Manual Triggers</td>
                    <td className="py-4 px-4 text-center">Workflow Engine</td>
                    <td className="py-4 px-4 text-center">Custom API Flows</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">API Access</td>
                    <td className="py-4 px-4 text-center">—</td>
                    <td className="py-4 px-4 text-center">—</td>
                    <td className="py-4 px-4 text-center"><span className="text-primary">✓</span></td>
                    <td className="py-4 px-4 text-center">Enterprise API</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Free Trial Banner */}
        <section className="max-w-7xl mx-auto px-8 mb-32">
          <div className="bg-primary-container text-white rounded-2xl p-12 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="relative z-10 max-w-xl text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">Try the Full Power of FlowRaze — Free for 14 Days</h2>
              <p className="text-lg opacity-90 mb-8">No credit card required. Experience how FlowRaze transforms your operations from day one.</p>
              <Link to="/login">
                <Button className="bg-white text-primary px-10 py-4 rounded-xl font-bold text-lg hover:bg-surface-container-low transition-colors shadow-lg">Start 14-Day Trial</Button>
              </Link>
            </div>
            <div className="relative z-10 hidden lg:flex w-72 h-72 bg-white/10 backdrop-blur-3xl rounded-full items-center justify-center border border-white/20">
              <span className="text-8xl">🚀</span>
            </div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-secondary rounded-full blur-3xl opacity-30"></div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-8 mb-32">
          <h2 className="text-3xl font-bold text-center mb-16 tracking-tight text-on-surface">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card className="p-6 bg-surface-container-lowest rounded-xl">
              <h4 className="font-bold mb-3 flex items-center justify-between">
                <span>Can I start for free without a credit card?</span>
                <span className="text-on-surface-variant">▾</span>
              </h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">Yes! You can start the Free plan or any 14-day trial without providing any billing information. We only ask for payment when you're ready to commit.</p>
            </Card>
            <Card className="p-6 bg-surface-container-lowest rounded-xl">
              <h4 className="font-bold mb-3 flex items-center justify-between">
                <span>How does per-user pricing work?</span>
                <span className="text-on-surface-variant">▾</span>
              </h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">For Growth and Pro plans, you are billed based on the number of active seats in your team. You can add or remove users at any time, and your billing will be adjusted proportionally.</p>
            </Card>
            <Card className="p-6 bg-surface-container-lowest rounded-xl">
              <h4 className="font-bold mb-3 flex items-center justify-between">
                <span>Can I upgrade or downgrade later?</span>
                <span className="text-on-surface-variant">▾</span>
              </h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">Absolutely. You can change your plan at any time through your dashboard settings. If you upgrade, changes are effective immediately. If you downgrade, changes take effect at the start of your next billing cycle.</p>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-8">
          <div className="text-center bg-surface-container-low py-24 rounded-3xl">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-on-surface">Start Understanding Your Business Today</h2>
            <p className="text-xl text-on-surface-variant mb-12">No setup complexity. No learning curve. Just clarity.</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <Link to="/login">
                <Button className="bg-cta-gradient text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:opacity-90 active:scale-95 transition-all">Get Started Free</Button>
              </Link>
              <Button variant="secondary" className="px-10 py-4 rounded-xl font-bold text-lg text-primary bg-transparent border-2 border-primary hover:bg-primary/5">Book a Demo</Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-outline-variant/10 bg-surface-container-low py-12 px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <div>
            <div className="text-lg font-black text-on-surface mb-6">FlowRaze</div>
            <p className="text-on-surface-variant text-sm">© 2024 FlowRaze Inc. Built for the Precision Architect.</p>
          </div>
          <div>
            <h5 className="font-bold text-on-surface mb-4">Product</h5>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Features</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Integrations</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-on-surface mb-4">Company</h5>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">About Us</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Careers</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-on-surface mb-4">Support</h5>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Documentation</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Contact</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Privacy</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
