import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Users, Briefcase, TrendingUp, CheckCircle2 } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-glass border-b border-outline-variant/15">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary tracking-tight">
            Flow<span className="text-secondary">Raze</span>
          </h1>
          <nav className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/login">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-primary tracking-tight leading-tight mb-6">
            CRM & Operations Analytics
            <br />
            <span className="text-secondary">Built for Growing Teams</span>
          </h2>
          <p className="text-xl text-on_surface_variant mb-10 max-w-2xl mx-auto">
            Track leads, deals, campaigns, and team performance in one place.
            Get clarity on what's working and what needs attention.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="gap-2">
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-surface-container">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-primary text-center mb-16">
            Everything You Need to Grow
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Users}
              title="Lead Management"
              description="Track and manage your sales leads with full visibility"
            />
            <FeatureCard
              icon={Briefcase}
              title="Deal Pipeline"
              description="Visual kanban-style pipeline to track deal progress"
            />
            <FeatureCard
              icon={BarChart3}
              title="Campaign Analytics"
              description="Understand which sources drive the most revenue"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Team Performance"
              description="Monitor team activity and individual performance"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-primary text-center mb-4">
            Simple, Transparent Pricing
          </h3>
          <p className="text-on_surface_variant text-center mb-16 max-w-xl mx-auto">
            Start free, scale as your business grows. No hidden fees.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PricingCard
              tier="Free"
              price="Rp 0"
              period="/month"
              description="Perfect for small teams getting started"
              features={[
                "Up to 3 users",
                "Lead & contact management",
                "Basic deal pipeline",
                "Simple dashboard",
              ]}
              cta="Start Free"
              featured={false}
            />
            <PricingCard
              tier="Growth"
              price="Rp 149k"
              period="/user/month"
              description="Built for growing teams that want clarity"
              features={[
                "Everything in Free",
                "Campaign & source analytics",
                "Revenue dashboard",
                "Team performance tracking",
                "Activity logs",
              ]}
              cta="Start Free Trial"
              featured={true}
            />
            <PricingCard
              tier="Pro"
              price="Rp 299k"
              period="/user/month"
              description="For teams serious about scaling"
              features={[
                "Everything in Growth",
                "Advanced analytics & reports",
                "Conversion funnel tracking",
                "Automation",
                "API access",
              ]}
              cta="Upgrade to Pro"
              featured={false}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-surface-container">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-primary mb-4">
            Start Understanding Your Business Today
          </h3>
          <p className="text-on_surface_variant mb-8">
            No setup complexity. No learning curve. Just clarity.
          </p>
          <Link to="/login">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-outline-variant/15">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary tracking-tight">
            Flow<span className="text-secondary">Raze</span>
          </h1>
          <p className="text-sm text-on_surface_variant">
            &copy; 2024 FlowRaze. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-surface rounded-round-eight p-6 hover:bg-surface-container-high transition-colors">
      <div className="w-12 h-12 rounded-round-eight bg-primary-container flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h4 className="text-lg font-semibold text-primary mb-2">{title}</h4>
      <p className="text-sm text-on_surface_variant">{description}</p>
    </div>
  );
}

function PricingCard({
  tier,
  price,
  period,
  description,
  features,
  cta,
  featured,
}: {
  tier: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  featured: boolean;
}) {
  return (
    <div
      className={`rounded-round-eight p-6 ${
        featured
          ? 'bg-gradient-to-br from-primary-container to-primary text-surface'
          : 'bg-surface-container'
      }`}
    >
      <h4 className={`text-lg font-semibold mb-2 ${featured ? 'text-surface' : 'text-primary'}`}>
        {tier}
        {featured && (
          <span className="ml-2 text-xs bg-secondary text-surface px-2 py-0.5 rounded-full">
            Most Popular
          </span>
        )}
      </h4>
      <div className="mb-4">
        <span className={`text-3xl font-bold ${featured ? 'text-surface' : 'text-primary'}`}>
          {price}
        </span>
        <span className={`text-sm ${featured ? 'text-surface/80' : 'text-on_surface_variant'}`}>
          {period}
        </span>
      </div>
      <p className={`text-sm mb-6 ${featured ? 'text-surface/80' : 'text-on_surface_variant'}`}>
        {description}
      </p>
      <ul className="space-y-2 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className={`h-4 w-4 ${featured ? 'text-secondary' : 'text-secondary'}`} />
            <span className={featured ? 'text-surface' : 'text-primary'}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link to="/login" className="block">
        <Button
          variant={featured ? 'default' : 'secondary'}
          className="w-full"
        >
          {cta}
        </Button>
      </Link>
    </div>
  );
}
