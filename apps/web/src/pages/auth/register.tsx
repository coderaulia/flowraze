import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field-error';
import { post } from '@/lib/api';
import { hasFormErrors, isValidEmail, type FormErrors } from '@/lib/form-validation';
import { useAuthStore } from '@/hooks/useAuthStore';
import type { User } from '@/types';
import { LandingHeader, LandingFooter, LandingButton } from '@/components/landing';
import '@/components/landing/landing.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: FormErrors = {};
    
    if (!name.trim()) {
      nextErrors.name = 'Full name is required';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters';
    }

    if (!consent) {
      nextErrors.consent = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setFormErrors(nextErrors);
    setError('');

    if (hasFormErrors(nextErrors)) {
      return;
    }

    setIsLoading(true);

    const response = await post<{ token: string; user: User }>('/auth/register', {
      name: name.trim(),
      email: email.trim(),
      password,
      consent: true,
    });

    if (response.success && response.data) {
      setAuth(response.data.user, response.data.token);
      // New users who register themselves go to onboarding
      navigate('/onboarding');
    } else {
      setError(response.error || 'Registration failed');
    }
    setIsLoading(false);
  };

  return (
    <div className="lp-root min-h-screen flex flex-col">
      <LandingHeader />
      
      <main className="flex-1 flex items-center justify-center p-4 py-20 relative">
        <div className="lp-hero-bg opacity-30">
          <div className="lp-hero-grid" />
        </div>
        
        <Card className="w-full max-w-md relative z-10 border-none shadow-2xl bg-surface-container/60 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-round-twelve bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-2xl font-bold">F</span>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Create your account
            </CardTitle>
            <CardDescription className="text-on-surface-variant/70 text-base mt-2">
              Join 2,400+ revenue teams growing with FlowRaze
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-round-eight bg-error/10 p-4 text-sm text-error border border-error/20 animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Alex Rivera"
                  className="bg-surface/50 border-surface-container-high focus:border-primary/50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <FieldError message={formErrors.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alex@company.com"
                  className="bg-surface/50 border-surface-container-high focus:border-primary/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <FieldError message={formErrors.email} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  className="bg-surface/50 border-surface-container-high focus:border-primary/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <FieldError message={formErrors.password} />
              </div>

              <div className="rounded-round-eight bg-surface/40 p-4 mt-2 space-y-3">
                <p className="text-[11.5px] text-on-surface-variant/60 leading-relaxed font-medium uppercase tracking-wide">Data Collection Notice</p>
                <p className="text-[12px] text-on-surface-variant/70 leading-relaxed">
                  By creating an account, we will collect and process: your name, email address, and password (hashed). 
                  During use, we also collect usage data (IP address, browser type, pages visited) for service improvement and security.
                  Your data is stored in Indonesia and protected under Indonesian Law No. 27 of 2022 (UU PDP).
                </p>
                <div className="flex items-start gap-3">
                  <input
                    id="consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-surface-container-high text-primary focus:ring-primary/50 cursor-pointer flex-shrink-0"
                  />
                  <label htmlFor="consent" className="text-[12.5px] text-on-surface-variant/70 leading-relaxed cursor-pointer select-none">
                    I have read and agree to the{' '}
                    <Link to="/terms" target="_blank" className="text-[#1d2879] font-semibold hover:underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" target="_blank" className="text-[#1d2879] font-semibold hover:underline">
                      Privacy Policy
                    </Link>
                    . I give my explicit consent to the collection and processing of my personal data as described, in accordance with UU PDP (Law No. 27/2022), UU ITE (Law No. 11/2008 as amended), and applicable international data protection regulations including GDPR where applicable.
                  </label>
                </div>
                <FieldError message={formErrors.consent} />
              </div>

              <LandingButton type="submit" className="w-full h-11 text-base font-semibold mt-4 shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Get Started Free →'}
              </LandingButton>

              <div className="text-center mt-6 pt-4 border-t border-surface-container-high">
                <p className="text-sm text-on-surface-variant/70">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#1d2879] font-bold hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <LandingFooter />
    </div>
  );
}
