import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field-error';
import { post } from '@/lib/api';
import { hasFormErrors, isValidEmail, type FormErrors } from '@/lib/form-validation';
import { getAuthenticatedHomePath } from '@/lib/routes';
import { useAuthStore } from '@/hooks/useAuthStore';
import type { User } from '@/types';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState(searchParams.get('token') ?? '');
  const [resetPassword, setResetPassword] = useState('');
  const urlToken = searchParams.get('token') ?? '';
  const [verificationToken, setVerificationToken] = useState(urlToken);
  const [securityMessage, setSecurityMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: FormErrors = {};
    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    }

    setFormErrors(nextErrors);
    setError('');

    if (hasFormErrors(nextErrors)) {
      return;
    }

    setIsLoading(true);

    const response = await post<{ token: string; user: User }>('/auth/login', {
      email: email.trim(),
      password,
    });

    if (response.success && response.data) {
      setAuth(response.data.user, response.data.token);
      navigate(getAuthenticatedHomePath(response.data.user.role));
    } else {
      setError(response.error || 'Login failed');
    }
    setIsLoading(false);
  };

  const handleRequestReset = async () => {
    setSecurityMessage('');
    const response = await post<{ resetToken?: string }>('/auth/password-reset/request', {
      email: resetEmail || email,
    });
    if (response.success) {
      if (response.data?.resetToken) {
        setResetToken(response.data.resetToken);
      }
      setSecurityMessage('Password reset token generated.');
    } else {
      setSecurityMessage(response.error || 'Unable to request password reset.');
    }
  };

  const handleConfirmReset = async () => {
    setSecurityMessage('');
    const response = await post<{ reset: boolean }>('/auth/password-reset/confirm', {
      token: resetToken,
      password: resetPassword,
    });
    if (response.success) {
      setResetToken('');
      setResetPassword('');
      setSecurityMessage('Password reset confirmed.');
    } else {
      setSecurityMessage(response.error || 'Unable to reset password.');
    }
  };

  const handleVerifyEmail = async () => {
    setSecurityMessage('');
    const response = await post<{ user: User }>('/auth/verify-email', {
      token: verificationToken,
    });
    setSecurityMessage(response.success ? 'Email verified.' : response.error || 'Unable to verify email.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Flow<span className="text-secondary">Raze</span>
          </CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-round-eight bg-error/10 p-3 text-sm text-error">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@flowraze.com"
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <FieldError message={formErrors.password} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-secondary hover:underline"
                onClick={() => { setShowReset(!showReset); setSecurityMessage(''); }}
              >
                Forgot password?
              </button>
            </div>
            <div className="text-center mt-4 pt-4 border-t border-surface-container-high">
              <p className="text-sm text-on-surface-variant/70">
                Don't have an account?{' '}
                <Link to="/register" className="text-secondary font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
          {(showReset || urlToken) && (
            <div className="mt-6 space-y-4 border-t border-surface-container-high pt-5">
              {securityMessage && (
                <div className="rounded-round-eight bg-surface-container p-3 text-sm text-on-surface-variant">
                  {securityMessage}
                </div>
              )}
              {showReset && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">Password Reset Email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="resetEmail"
                        type="email"
                        value={resetEmail}
                        onChange={(event) => setResetEmail(event.target.value)}
                        placeholder="you@company.com"
                      />
                      <Button type="button" variant="secondary" onClick={handleRequestReset}>
                        Request
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={resetToken}
                      onChange={(event) => setResetToken(event.target.value)}
                      placeholder="Reset token"
                    />
                    <Input
                      type="password"
                      value={resetPassword}
                      onChange={(event) => setResetPassword(event.target.value)}
                      placeholder="New password"
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    variant="secondary"
                    disabled={!resetToken || !resetPassword}
                    onClick={handleConfirmReset}
                  >
                    Confirm Password Reset
                  </Button>
                </>
              )}
              {urlToken && (
                <div className="space-y-2">
                  <Label htmlFor="verifyToken">Email Verification Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="verifyToken"
                      value={verificationToken}
                      onChange={(event) => setVerificationToken(event.target.value)}
                      placeholder="Verification token"
                    />
                    <Button type="button" variant="secondary" disabled={!verificationToken} onClick={handleVerifyEmail}>
                      Verify
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
