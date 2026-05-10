import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/ui/field-error';
import { post } from '@/lib/api';
import { getAuthenticatedHomePath } from '@/lib/routes';
import { useAuthStore } from '@/hooks/useAuthStore';
import type { User } from '@/types';

type FormErrors = { password?: string; confirm?: string };

function validate(password: string, confirm: string): FormErrors {
  const errors: FormErrors = {};
  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  if (password && confirm !== password) {
    errors.confirm = 'Passwords do not match';
  }
  return errors;
}

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(password, confirm);
    setErrors(validationErrors);
    setSubmitError('');

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    const response = await post<{ token: string; user: User }>('/auth/accept-invite', {
      token,
      password,
    });
    setIsSubmitting(false);

    if (response.success && response.data) {
      setAuth(response.data.user, response.data.token);
      navigate(getAuthenticatedHomePath(response.data.user.role), { replace: true });
    } else {
      setSubmitError(response.error || 'Invalid or expired invitation link');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary">Accept Invitation</h1>
            <p className="text-on-surface-variant mt-2">
              Set a password to activate your FlowRaze account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {submitError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoFocus
              />
              <FieldError message={errors.password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
              />
              <FieldError message={errors.confirm} />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Activating...' : 'Activate Account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
