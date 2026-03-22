import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold tracking-tighter text-primary">FlowRaze</Link>
          <div className="hidden md:flex items-center space-x-8">
            <span className="text-primary font-semibold border-b-2 border-primary pb-1">Features</span>
            <Link to="/solutions" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Solutions</Link>
            <Link to="/pricing" className="text-on-surface-variant font-medium hover:text-primary transition-colors">Pricing</Link>
            <a className="text-on-surface-variant font-medium hover:text-primary transition-colors" href="#">Resources</a>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="text-on-surface-variant">Log In</Button>
            </Link>
            <Link to="/login">
              <Button className="bg-cta-gradient text-white shadow-lg">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[819px] flex items-center overflow-hidden px-6 lg:px-12 py-24 bg-white">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center space-x-2 bg-surface-container-low px-4 py-1.5 rounded-full">
                <span className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">🚀 Built for modern revenue teams</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-on-surface leading-[1.1]">
                The Performance Engine for <span className="text-primary">High-Growth</span> Teams.
              </h1>
              <div className="space-y-4">
                <p className="text-xl text-on-surface-variant max-w-xl leading-relaxed">
                  FlowRaze connects your sales, marketing, and team performance into one clear system—so you know exactly what drives revenue and what to improve next.
                </p>
                <p className="text-base text-on-surface-variant/80 font-medium italic">
                  No more scattered data. No more guessing. Just clarity, control, and consistent growth.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/login">
                  <Button size="lg" className="bg-cta-gradient text-white shadow-xl px-8 py-4 text-lg font-bold">Get Started Free</Button>
                </Link>
                <Button size="lg" variant="secondary" className="px-8 py-4 text-lg font-bold bg-surface-container-high text-on-surface">
                  View Product Demo
                </Button>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="aspect-square bg-surface-container-low rounded-3xl relative overflow-hidden border border-outline-variant/10 shadow-editorial p-6">
                <div className="h-full w-full rounded-2xl bg-white shadow-editorial p-8 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="h-2 w-24 bg-surface-container-high rounded-full"></div>
                    <div className="h-8 w-48 bg-primary/10 rounded-lg"></div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-12 bg-surface-container rounded-lg"></div>
                      <div className="h-12 bg-surface-container rounded-lg"></div>
                      <div className="h-12 bg-surface-container rounded-lg"></div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="h-32 w-4 bg-primary rounded-t-full"></div>
                      <div className="h-24 w-4 bg-secondary rounded-t-full"></div>
                      <div className="h-40 w-4 bg-primary rounded-t-full"></div>
                      <div className="h-28 w-4 bg-secondary rounded-t-full"></div>
                      <div className="h-48 w-4 bg-primary rounded-t-full"></div>
                    </div>
                    <div className="text-center font-bold text-primary tracking-tighter text-2xl">+142.8% Efficiency</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 bg-surface-container-low border-y border-outline-variant/30">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-bold text-on-surface-variant tracking-widest uppercase mb-12">Trusted by growing teams and ambitious businesses across Indonesia.</p>
            <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="h-8 w-32 bg-on-surface-variant/20 rounded-md"></div>
              <div className="h-8 w-32 bg-on-surface-variant/20 rounded-md"></div>
              <div className="h-8 w-32 bg-on-surface-variant/20 rounded-md"></div>
              <div className="h-8 w-32 bg-on-surface-variant/20 rounded-md"></div>
              <div className="h-8 w-32 bg-on-surface-variant/20 rounded-md"></div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="relative bg-surface-container-lowest rounded-xl p-4 shadow-editorial border border-outline-variant/10">
                  <div className="bg-surface-container-low rounded-lg p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="w-1/3 h-6 bg-surface-container-high rounded-full"></div>
                      <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
                        <span className="text-secondary text-sm">⚡</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-surface-container-high rounded-full"></div>
                      <div className="h-4 w-5/6 bg-surface-container-high rounded-full"></div>
                      <div className="h-4 w-4/6 bg-surface-container-high rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-8">
                <h2 className="text-4xl font-extrabold tracking-tight">Simplicity First. Performance Always.</h2>
                <p className="text-xl text-on-surface-variant leading-relaxed">
                  FlowRaze is built to remove complexity from your operations. From lead tracking to revenue insights, everything flows in one intuitive system—so your team can focus on what actually matters: closing deals and driving growth.
                </p>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <span className="text-secondary">✓</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">Zero-Learning Curve</h4>
                      <p className="text-on-surface-variant text-sm">Designed for immediate adoption across sales and marketing teams.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary">👁</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">Real-Time Visibility</h4>
                      <p className="text-on-surface-variant text-sm">Always know what's happening—across campaigns, deals, and performance.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <span className="text-secondary">📊</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">Actionable Insights</h4>
                      <p className="text-on-surface-variant text-sm">Turn raw data into decisions you can act on instantly.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-20 space-y-4">
              <h2 className="text-4xl font-extrabold tracking-tight">Built for How Your Business Actually Runs</h2>
              <p className="text-on-surface-variant text-xl max-w-2xl">FlowRaze connects every part of your revenue flow—from first click to closed deal.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 bg-white hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-primary text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Sales Pipeline Tracking</h3>
                <p className="text-on-surface-variant leading-relaxed">Track every deal from lead to close with a clear, visual pipeline. Know exactly where revenue is coming from—and where it's getting stuck.</p>
              </Card>
              <Card className="p-8 bg-white hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-secondary text-2xl">📢</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Marketing Attribution</h3>
                <p className="text-on-surface-variant leading-relaxed">See which campaigns actually generate revenue, not just clicks. Understand your ROI across channels with real clarity.</p>
              </Card>
              <Card className="p-8 bg-white hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-primary text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Team Performance Insights</h3>
                <p className="text-on-surface-variant leading-relaxed">Measure what matters: deals closed, response time, activity levels, revenue contribution. Build a high-performing team with real data.</p>
              </Card>
              <Card className="p-8 bg-white hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-secondary text-2xl">📈</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Unified Dashboard</h3>
                <p className="text-on-surface-variant leading-relaxed">One dashboard. Total visibility. Revenue trends, conversion rates, campaign performance, team output. Everything you need to make better decisions—instantly.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-32 bg-primary text-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="text-6xl opacity-30 mb-8">"</div>
            <blockquote className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight mb-12 max-w-5xl mx-auto">
              "FlowRaze isn't just a CRM, it's a competitive advantage. For the first time, we can clearly see how our marketing, sales, and team performance connect—and improve them fast."
            </blockquote>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-white/20 mb-4 overflow-hidden border-2 border-white/10">
                <div className="w-full h-full bg-surface-container-highest/20"></div>
              </div>
              <cite className="not-italic">
                <div className="font-bold text-xl uppercase tracking-widest">Budi Hartono</div>
                <div className="text-white/60">CTO, HyperStream Indonesia</div>
              </cite>
            </div>
          </div>
        </section>

        {/* Use Case Section */}
        <section className="py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold tracking-tight">Built for Growing Teams</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 bg-surface-container-low text-center border border-outline-variant/30">
                <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-xl font-bold mb-4">For Sales Teams</h3>
                <p className="text-on-surface-variant text-sm">Close deals faster with full pipeline visibility.</p>
              </Card>
              <Card className="p-8 bg-surface-container-low text-center border border-outline-variant/30">
                <div className="w-14 h-14 bg-secondary text-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">📣</span>
                </div>
                <h3 className="text-xl font-bold mb-4">For Marketing Teams</h3>
                <p className="text-on-surface-variant text-sm">Know which campaigns actually generate revenue.</p>
              </Card>
              <Card className="p-8 bg-surface-container-low text-center border border-outline-variant/30">
                <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold mb-4">For Founders & Managers</h3>
                <p className="text-on-surface-variant text-sm">Make smarter decisions with real-time business insights.</p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-surface-container-low text-center">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">Stop Guessing. Start Growing.</h2>
            <p className="text-on-surface-variant text-xl mb-10">FlowRaze gives you the clarity to scale with confidence.</p>
            <Link to="/login">
              <Button size="lg" className="bg-cta-gradient text-white shadow-xl px-12 py-5 text-xl font-bold">Get Started Free</Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low py-12 px-8 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="text-lg font-bold text-primary">FlowRaze</div>
            <div className="text-xs text-on-surface-variant font-medium mt-1">Understand What Drives Your Revenue.</div>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium">
            <a className="text-on-surface-variant hover:text-primary transition-opacity opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant hover:text-primary transition-opacity opacity-80 hover:opacity-100" href="#">Terms of Service</a>
            <a className="text-on-surface-variant hover:text-primary transition-opacity opacity-80 hover:opacity-100" href="#">Security</a>
          </div>
          <div className="text-sm text-on-surface-variant">
            © 2024 FlowRaze. Precision in Motion.
          </div>
        </div>
      </footer>
    </div>
  );
}
