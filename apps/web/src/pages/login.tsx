import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { post } from '@/lib/api';
import { formatFieldErrorId, hasFormErrors, isBlank, isValidEmail, type FormErrors } from '@/lib/form-validation';
import { useAuthStore } from '@/hooks/useAuthStore';
import type { User } from '@/types';

const LOGIN_FORM_ID = 'login-form';
type LoginFormField = 'email' | 'password';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors<LoginFormField>>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateLoginForm(email, password);
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
      navigate('/dashboard');
    } else {
      setError(response.error || 'Login failed');
    }
    setIsLoading(false);
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
                aria-invalid={Boolean(formErrors.email)}
                aria-describedby={formErrors.email ? formatFieldErrorId(LOGIN_FORM_ID, 'email') : undefined}
                required
              />
              <FieldError id={formatFieldErrorId(LOGIN_FORM_ID, 'email')} message={formErrors.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(formErrors.password)}
                aria-describedby={formErrors.password ? formatFieldErrorId(LOGIN_FORM_ID, 'password') : undefined}
                required
              />
              <FieldError id={formatFieldErrorId(LOGIN_FORM_ID, 'password')} message={formErrors.password} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function validateLoginForm(email: string, password: string) {
  const errors: FormErrors<LoginFormField> = {};

  if (isBlank(email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address';
  }

  if (isBlank(password)) {
    errors.password = 'Password is required';
  }

  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-sm text-error" role="alert">
      {message}
    </p>
  );
}
