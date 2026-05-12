import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { post } from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuthStore';
import { getAuthenticatedHomePath } from '@/lib/routes';
import type { User, Company } from '@/types';

type OnboardingStep = 'company' | 'details' | 'success';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setAuth, token } = useAuthStore();
  const [step, setStep] = useState<OnboardingStep>('company');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');

  // If user already has a company, redirect them
  if (user?.companyId) {
    navigate(getAuthenticatedHomePath(user.role));
    return null;
  }

  const handleSetupCompany = async () => {
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    const response = await post<{ company: Company; user: User }>('/onboarding/setup-company', {
      name: companyName.trim(),
      industry,
      companySize,
    });

    if (response.success && response.data && token) {
      // Update local auth state with the new user data (which now has companyId and admin role)
      setAuth(response.data.user, token);
      setStep('success');
    } else {
      setError(response.error || 'Failed to setup company');
    }
    setIsLoading(false);
  };

  const handleFinish = () => {
    navigate('/company/dashboard');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase mb-4">
            Welcome to FlowRaze
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Let's set up your workspace
          </h1>
          <p className="text-on-surface-variant/70 text-lg">
            A few details to help us customize your experience.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8 px-12">
          <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step === 'company' || step === 'details' || step === 'success' ? 'bg-primary' : 'bg-surface-container-high'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step === 'details' || step === 'success' ? 'bg-primary' : 'bg-surface-container-high'}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step === 'success' ? 'bg-primary' : 'bg-surface-container-high'}`} />
        </div>

        <Card className="border-none shadow-2xl bg-surface-container/40 backdrop-blur-xl overflow-hidden">
          <CardContent className="p-8 md:p-12">
            {step === 'company' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">What's your company name?</h2>
                  <p className="text-on-surface-variant/70">This will be the name of your shared workspace.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-base">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="e.g. Acme Revenue Corp"
                      className="h-14 text-lg bg-surface/50 border-surface-container-high focus:border-primary/50"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-round-eight bg-error/10 text-error text-sm border border-error/20">
                      {error}
                    </div>
                  )}

                  <Button 
                    className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20" 
                    onClick={() => setStep('details')}
                    disabled={!companyName.trim()}
                  >
                    Continue →
                  </Button>
                </div>
              </div>
            )}

            {step === 'details' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">A bit more context</h2>
                  <p className="text-on-surface-variant/70">Help us tailor the dashboard to your team size.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base">Industry</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Technology', 'Agencies', 'SaaS', 'E-commerce', 'Consulting', 'Other'].map((ind) => (
                        <button
                          key={ind}
                          className={`p-3 rounded-round-eight border text-left transition-all ${industry === ind ? 'bg-primary/10 border-primary text-primary' : 'bg-surface/50 border-surface-container-high hover:border-on-surface-variant/30'}`}
                          onClick={() => setIndustry(ind)}
                        >
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base">Company Size</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {['1-10', '11-50', '51-200', '201-500', '500+'].map((size) => (
                        <button
                          key={size}
                          className={`p-3 rounded-round-eight border text-center transition-all ${companySize === size ? 'bg-primary/10 border-primary text-primary' : 'bg-surface/50 border-surface-container-high hover:border-on-surface-variant/30'}`}
                          onClick={() => setCompanySize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="ghost" 
                      className="h-14 flex-1 text-lg font-bold" 
                      onClick={() => setStep('company')}
                    >
                      Back
                    </Button>
                    <Button 
                      className="h-14 flex-[2] text-lg font-bold shadow-lg shadow-primary/20" 
                      onClick={handleSetupCompany}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Setting up...' : 'Create Workspace →'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-4 space-y-8 animate-in zoom-in-95 duration-500">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center animate-bounce">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">You're all set!</h2>
                  <p className="text-on-surface-variant/70 text-lg">
                    Your workspace <strong>{companyName}</strong> is ready for your team.
                  </p>
                </div>

                <div className="bg-surface/50 rounded-round-twelve p-6 border border-surface-container-high text-left">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-primary mb-3">What's Next?</h4>
                  <ul className="space-y-3">
                    <li className="flex gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</span>
                      Connect your first lead source in Settings
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</span>
                      Invite your sales reps to join the workspace
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</span>
                      Set your first quarterly revenue target
                    </li>
                  </ul>
                </div>

                <Button className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20" onClick={handleFinish}>
                  Go to Dashboard →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-on-surface-variant/50 text-sm">
          Need help? <a href="/help" className="underline hover:text-primary transition-colors">Visit our Help Center</a> or <a href="mailto:support@flowraze.com" className="underline hover:text-primary transition-colors">contact support</a>.
        </div>
      </div>
    </div>
  );
}
