import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function SolutionsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 h-20">
          <h1 className="text-2xl font-extrabold tracking-tighter text-primary">FlowRaze</h1>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-on-surface-variant font-medium hover:text-primary transition-all" href="#">Features</a>
            <a className="text-primary font-bold border-b-2 border-primary pb-1" href="#">Solutions</a>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-all" href="#">Pricing</a>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-all" href="#">Resources</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="px-5 py-2 text-sm font-semibold text-on-surface-variant">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button className="bg-cta-gradient text-white shadow-lg px-6 py-2.5 font-bold">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-8 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="max-w-4xl">
              <span className="inline-flex items-center bg-surface-container-low px-4 py-1.5 rounded-full text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-8">
                The Kinetic Architect
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface leading-[1.1] mb-8">
                Solutions Built for How Your Business <span className="text-primary">Actually</span> Operates
              </h1>
              <p className="text-xl text-on-surface-variant leading-relaxed mb-10 max-w-2xl">
                From sales pipelines to marketing performance and team productivity—FlowRaze connects every part of your business into one clear, actionable system.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <Link to="/login">
                  <Button size="lg" className="bg-cta-gradient text-white shadow-xl px-8 py-4 text-lg font-bold">Start Operating with Clarity</Button>
                </Link>
                <p className="text-secondary font-bold tracking-tight">Stop managing tools. Start managing results.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Overview Section */}
        <section className="py-24 px-8 bg-surface-container-low border-y border-outline-variant/20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="flex-1">
                <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-6">One Platform. Multiple Business Solutions.</h2>
                <p className="text-lg text-on-surface-variant leading-relaxed">
                  B2B complexity shouldn't mean operational chaos. FlowRaze was engineered to solve the fundamental problem of fragmented data and disconnected workflows that stall growth. We don't just add another layer; we unify the architecture.
                </p>
              </div>
              <div className="flex-1 flex justify-end">
                <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 shadow-editorial max-w-md">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-primary text-3xl">🔗</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">The Connectivity Core</span>
                  </div>
                  <p className="text-sm text-on-surface-variant font-medium italic">"From lead to revenue, fully connected"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Blocks */}
        <section className="py-24 space-y-32">
          {/* Sales Management */}
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-3xl font-extrabold text-on-surface">1. Sales Management</h3>
              <h4 className="text-xl text-secondary font-bold">Sales Pipeline Visibility</h4>
              <p className="text-on-surface-variant leading-relaxed">Stop guessing where deals stand. Get a real-time visual of your entire revenue engine from first touch to closed-won.</p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-secondary text-xl">✓</span>
                  <span className="font-medium">Automated pipeline stage tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary text-xl">✓</span>
                  <span className="font-medium">Revenue forecasting based on historical velocity</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary text-xl">✓</span>
                  <span className="font-medium">Deal health scoring and bottleneck alerts</span>
                </li>
              </ul>
              <div className="p-6 bg-surface-container-low rounded-lg border-l-4 border-secondary shadow-editorial">
                <p className="font-bold text-on-surface">Outcome: 🚀 24% increase in sales velocity by focusing on high-intent deals.</p>
              </div>
            </div>
            <div className="h-96 bg-surface-container-high rounded-2xl relative overflow-hidden border border-outline-variant/10 shadow-editorial">
              <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
                Sales Pipeline UI Preview
              </div>
            </div>
          </div>

          {/* Marketing Performance */}
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="h-96 bg-surface-container-high rounded-2xl relative overflow-hidden border border-outline-variant/10 shadow-editorial order-2 lg:order-1">
              <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
                Marketing Analytics UI Preview
              </div>
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-3xl font-extrabold text-on-surface">2. Marketing Performance</h3>
              <h4 className="text-xl text-secondary font-bold">Marketing Attribution & ROI Tracking</h4>
              <p className="text-on-surface-variant leading-relaxed">Connect your ad spend directly to revenue. Understand exactly which campaigns are driving profit, not just clicks.</p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-secondary text-xl">✓</span>
                  <span className="font-medium">Multi-touch attribution across all channels</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary text-xl">✓</span>
                  <span className="font-medium">Real-time ROAS and CAC calculation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary text-xl">✓</span>
                  <span className="font-medium">Campaign performance deep-dives</span>
                </li>
              </ul>
              <div className="p-6 bg-surface-container-low rounded-lg border-l-4 border-secondary shadow-editorial">
                <p className="font-bold text-on-surface">Outcome: 🎯 Eliminate wasted ad spend and double down on winning channels.</p>
              </div>
            </div>
          </div>

          {/* Team Performance */}
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-3xl font-extrabold text-on-surface">3. Team Performance</h3>
              <h4 className="text-xl text-secondary font-bold">Team Performance & Accountability</h4>
              <p className="text-on-surface-variant leading-relaxed">Align every team member with top-level goals. Track output, manage workloads, and foster a culture of transparent accountability.</p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-secondary text-xl">✓</span>
                  <span className="font-medium">OKR tracking and individual KPI alignment</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary text-xl">✓</span>
                  <span className="font-medium">Workload balancing and capacity planning</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary text-xl">✓</span>
                  <span className="font-medium">Automated status reporting and daily stand-ups</span>
                </li>
              </ul>
              <div className="p-6 bg-surface-container-low rounded-lg border-l-4 border-secondary shadow-editorial">
                <p className="font-bold text-on-surface">Outcome: 🤝 30% reduction in sync meetings through radical transparency.</p>
              </div>
            </div>
            <div className="h-96 bg-surface-container-high rounded-2xl relative overflow-hidden border border-outline-variant/10 shadow-editorial">
              <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
                Team Dashboard UI Preview
              </div>
            </div>
          </div>

          {/* Executive Dashboard */}
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="h-96 bg-surface-container-high rounded-2xl relative overflow-hidden border border-outline-variant/10 shadow-editorial order-2 lg:order-1">
              <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
                Executive Dashboard UI Preview
              </div>
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-3xl font-extrabold text-on-surface">4. Executive Dashboard</h3>
              <h4 className="text-xl text-secondary font-bold">Business Intelligence Dashboard</h4>
              <p className="text-on-surface-variant leading-relaxed">The single source of truth for founders and CEOs. High-level metrics that let you lead with confidence, not hunches.</p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-secondary text-xl">✓</span>
                  <span className="font-medium">Consolidated P&L and growth charts</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary text-xl">✓</span>
                  <span className="font-medium">Cross-departmental performance comparison</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary text-xl">✓</span>
                  <span className="font-medium">Predictive modeling for future scaling</span>
                </li>
              </ul>
              <div className="p-6 bg-surface-container-low rounded-lg border-l-4 border-secondary shadow-editorial">
                <p className="font-bold text-on-surface">Outcome: 🧠 Strategic clarity that reduces decision-making time by 50%.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Case Section */}
        <section className="py-24 px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">Built for Growing Teams</h2>
              <p className="text-on-surface-variant text-lg">Precision tools tailored to your specific role in the organization.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-all">
                <h5 className="text-lg font-bold mb-3 text-primary">Sales Teams</h5>
                <p className="text-sm text-on-surface-variant leading-relaxed">Close faster with data-driven pipeline management and outreach automation.</p>
              </Card>
              <Card className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-all">
                <h5 className="text-lg font-bold mb-3 text-primary">Marketing Teams</h5>
                <p className="text-sm text-on-surface-variant leading-relaxed">Prove your worth with granular attribution and performance tracking across channels.</p>
              </Card>
              <Card className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-all">
                <h5 className="text-lg font-bold mb-3 text-primary">Founders & Managers</h5>
                <p className="text-sm text-on-surface-variant leading-relaxed">Get the birds-eye view you need to make high-stakes decisions with absolute confidence.</p>
              </Card>
              <Card className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-all">
                <h5 className="text-lg font-bold mb-3 text-primary">Agencies</h5>
                <p className="text-sm text-on-surface-variant leading-relaxed">Manage client portfolios with unified reporting and centralized resource management.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-8 relative overflow-hidden bg-white">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-8 text-on-surface">Start Operating with Clarity</h2>
            <p className="text-xl text-on-surface-variant mb-12">The architectural shift your business needs to move from chaotic growth to predictable scaling.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-cta-gradient text-white shadow-2xl px-10 py-5 text-lg font-bold">Book a Demo</Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary" className="px-10 py-5 text-lg font-bold border-2 border-primary text-primary bg-transparent hover:bg-primary/5">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low py-16 px-8 border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12">
          <div className="col-span-2">
            <div className="text-xl font-extrabold text-primary mb-6">FlowRaze</div>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-4">Precision-engineered for the modern enterprise. Scale with clarity, lead with data.</p>
          </div>
          <div>
            <h6 className="text-xs uppercase tracking-widest text-on-surface font-bold mb-6">Product</h6>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#">Features</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#">Solutions</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h6 className="text-xs uppercase tracking-widest text-on-surface font-bold mb-6">Company</h6>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#">About</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#">Careers</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <h6 className="text-xs uppercase tracking-widest text-on-surface font-bold mb-6">Support</h6>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#">Help Center</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#">API Docs</a></li>
            </ul>
          </div>
          <div>
            <h6 className="text-xs uppercase tracking-widest text-on-surface font-bold mb-6">Legal</h6>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#">Privacy</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-outline-variant/10 text-center">
          <p className="text-on-surface-variant text-xs">© 2024 FlowRaze. Precision in Motion.</p>
        </div>
      </footer>
    </div>
  );
}
