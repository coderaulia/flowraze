import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, GitBranch, KeyRound, Plus, ShieldCheck, Trash2, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckoutDialog } from '@/components/checkout-dialog';
import { useAuthStore } from '@/hooks/useAuthStore';
import { del, get, post, put } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { COMPANY_ROUTES } from '@/lib/routes';
import type {
  ApiKey,
  BillingAccount,
  Pipeline,
  PipelineStage,
  User,
  WebhookEndpoint,
  WebhookEvent,
} from '@/types';

type Message = { type: 'success' | 'error' | 'info'; text: string };

const WEBHOOK_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: 'lead_created', label: 'Lead created' },
  { value: 'lead_updated', label: 'Lead updated' },
  { value: 'lead_deleted', label: 'Lead deleted' },
  { value: 'deal_created', label: 'Deal created' },
  { value: 'deal_updated', label: 'Deal updated' },
  { value: 'deal_stage_changed', label: 'Deal stage changed' },
  { value: 'deal_won', label: 'Deal won' },
  { value: 'deal_lost', label: 'Deal lost' },
  { value: 'deal_deleted', label: 'Deal deleted' },
  { value: 'activity_created', label: 'Activity created' },
  { value: 'activity_updated', label: 'Activity updated' },
  { value: 'activity_deleted', label: 'Activity deleted' },
];

function AlertMessage({ message }: { message: Message }) {
  const classes = {
    error: 'bg-error/10 text-error',
    success: 'bg-secondary/10 text-secondary',
    info: 'bg-surface-container text-on-surface-variant',
  };

  return (
    <div className={`rounded-lg px-3 py-2 text-sm font-medium ${classes[message.type]}`}>
      {message.text}
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateUser, isSuperadmin, isAdmin, hasFeature } = useAuthStore();
  const canManageAdminTools = isSuperadmin();
  const canManageIntegrations = isSuperadmin() || (isAdmin() && (hasFeature('apiKeys') || hasFeature('webhooks')));
  const canManagePipelines = isAdmin() || isSuperadmin();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<Message | null>(null);
  const [securityMessage, setSecurityMessage] = useState<Message | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [resetEmail, setResetEmail] = useState(user?.email || '');
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdApiKey, setCreatedApiKey] = useState('');
  const [apiKeyMessage, setApiKeyMessage] = useState<Message | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [webhookMessage, setWebhookMessage] = useState<Message | null>(null);
  const [webhookForm, setWebhookForm] = useState({
    name: '',
    url: '',
    event: 'lead_created' as WebhookEvent,
    isActive: 'true',
  });
  const [billing, setBilling] = useState<BillingAccount | null>(null);
  const [billingMessage, setBillingMessage] = useState<Message | null>(null);
  const [billingForm, setBillingForm] = useState({
    workspaceName: '',
  });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [pipelineMessage, setPipelineMessage] = useState<Message | null>(null);
  const [newStageName, setNewStageName] = useState<Record<string, string>>({});
  const [newStageColor, setNewStageColor] = useState<Record<string, string>>({});

  const fetchAdminTools = useCallback(async () => {
    const billingResponse = await get<BillingAccount>('/billing');
    if (billingResponse.success && billingResponse.data) {
      const account = billingResponse.data;
      setBilling(account);
      setBillingForm({
        workspaceName: account.workspaceName,
      });
    }

    if (canManagePipelines) {
      const pipelinesRes = await get<Pipeline[]>('/pipelines');
      if (pipelinesRes.success && pipelinesRes.data) setPipelines(pipelinesRes.data);
    }

    if (!canManageIntegrations) {
      return;
    }

    const [keysResponse, webhooksResponse] = await Promise.all([
      get<ApiKey[]>('/api-keys'),
      get<WebhookEndpoint[]>('/webhooks'),
    ]);

    if (keysResponse.success && keysResponse.data) {
      setApiKeys(keysResponse.data);
    }

    if (webhooksResponse.success && webhooksResponse.data) {
      setWebhooks(webhooksResponse.data);
    }
  }, [canManageIntegrations, canManagePipelines]);

  useEffect(() => {
    fetchAdminTools();
  }, [fetchAdminTools]);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);

    const payload: Record<string, string> = {};
    if (name.trim() && name.trim() !== user?.name) payload.name = name.trim();
    if (password) payload.password = password;

    if (Object.keys(payload).length === 0) {
      setProfileMessage({ type: 'info', text: 'No changes to save.' });
      setIsSavingProfile(false);
      return;
    }

    const response = await put<User>('/users/me', payload);
    if (response.success && response.data) {
      updateUser({ name: response.data.name });
      setPassword('');
      setProfileMessage({ type: 'success', text: 'Profile updated.' });
    } else {
      setProfileMessage({ type: 'error', text: response.error || 'Failed to update profile.' });
    }

    setIsSavingProfile(false);
  };

  const handleRequestVerification = async () => {
    setSecurityMessage(null);
    const response = await post<{
      verified: boolean;
      verificationToken?: string;
      verificationUrl?: string;
      message?: string;
    }>('/auth/email-verification/request', {});

    if (response.success && response.data) {
      if (response.data.verificationToken) {
        setVerificationToken(response.data.verificationToken);
      }
      setSecurityMessage({
        type: response.data.verified ? 'success' : 'info',
        text: response.data.message || 'Verification token generated.',
      });
    } else {
      setSecurityMessage({ type: 'error', text: response.error || 'Unable to request verification.' });
    }
  };

  const handleVerifyEmail = async () => {
    setSecurityMessage(null);
    const response = await post<{ user: User }>('/auth/verify-email', { token: verificationToken });
    if (response.success && response.data) {
      updateUser({ emailVerifiedAt: response.data.user.emailVerifiedAt });
      setVerificationToken('');
      setSecurityMessage({ type: 'success', text: 'Email verified.' });
    } else {
      setSecurityMessage({ type: 'error', text: response.error || 'Unable to verify email.' });
    }
  };

  const handleRequestPasswordReset = async () => {
    setSecurityMessage(null);
    const response = await post<{ resetToken?: string; sent: boolean }>('/auth/password-reset/request', {
      email: resetEmail,
    });

    if (response.success && response.data) {
      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);
      }
      setSecurityMessage({ type: 'info', text: 'Password reset token generated.' });
    } else {
      setSecurityMessage({ type: 'error', text: response.error || 'Unable to request reset.' });
    }
  };

  const handleConfirmPasswordReset = async () => {
    setSecurityMessage(null);
    const response = await post<{ reset: boolean }>('/auth/password-reset/confirm', {
      token: resetToken,
      password: resetPassword,
    });

    if (response.success) {
      setResetToken('');
      setResetPassword('');
      setSecurityMessage({ type: 'success', text: 'Password reset confirmed.' });
    } else {
      setSecurityMessage({ type: 'error', text: response.error || 'Unable to reset password.' });
    }
  };

  const handleCreateApiKey = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiKeyMessage(null);
    const response = await post<ApiKey & { key: string }>('/api-keys', { name: newKeyName });

    if (response.success && response.data) {
      setCreatedApiKey(response.data.key);
      setNewKeyName('');
      setApiKeyMessage({ type: 'success', text: 'API key created.' });
      fetchAdminTools();
    } else {
      setApiKeyMessage({ type: 'error', text: response.error || 'Unable to create API key.' });
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    const response = await del<void>(`/api-keys/${id}`);
    if (response.success) {
      setApiKeyMessage({ type: 'success', text: 'API key revoked.' });
      fetchAdminTools();
    } else {
      setApiKeyMessage({ type: 'error', text: response.error || 'Unable to revoke API key.' });
    }
  };

  const handleCreateWebhook = async (event: React.FormEvent) => {
    event.preventDefault();
    setWebhookMessage(null);
    const response = await post<WebhookEndpoint>('/webhooks', {
      ...webhookForm,
      isActive: webhookForm.isActive === 'true',
    });

    if (response.success) {
      setWebhookForm({ name: '', url: '', event: 'lead_created', isActive: 'true' });
      setWebhookMessage({ type: 'success', text: 'Webhook saved.' });
      fetchAdminTools();
    } else {
      setWebhookMessage({ type: 'error', text: response.error || 'Unable to save webhook.' });
    }
  };

  const handleToggleWebhook = async (webhook: WebhookEndpoint) => {
    const response = await put<WebhookEndpoint>(`/webhooks/${webhook.id}`, {
      isActive: !webhook.isActive,
    });

    if (response.success) {
      fetchAdminTools();
    } else {
      setWebhookMessage({ type: 'error', text: response.error || 'Unable to update webhook.' });
    }
  };

  const handleTestWebhook = async (id: string) => {
    const response = await post<{ sent: boolean }>(`/webhooks/${id}/test`, {});
    setWebhookMessage({
      type: response.success ? 'success' : 'error',
      text: response.success ? 'Test webhook sent.' : response.error || 'Unable to test webhook.',
    });
    fetchAdminTools();
  };

  const handleDeleteWebhook = async (id: string) => {
    const response = await del<void>(`/webhooks/${id}`);
    if (response.success) {
      setWebhookMessage({ type: 'success', text: 'Webhook deleted.' });
      fetchAdminTools();
    } else {
      setWebhookMessage({ type: 'error', text: response.error || 'Unable to delete webhook.' });
    }
  };

  const handleReplayWebhook = async (id: string, deliveryId: string) => {
    const response = await post<{ replayed: boolean }>(`/webhooks/${id}/deliveries/${deliveryId}/replay`, {});
    setWebhookMessage({
      type: response.success ? 'success' : 'error',
      text: response.success ? 'Webhook delivery replay scheduled.' : response.error || 'Unable to replay delivery.',
    });
    // Optional: wait a moment for the replay to process before fetching
    setTimeout(fetchAdminTools, 1000);
  };

  const handleSaveBilling = async (event: React.FormEvent) => {
    event.preventDefault();
    setBillingMessage(null);
    const response = await put<BillingAccount>('/billing', {
      workspaceName: billingForm.workspaceName,
    });

    if (response.success && response.data) {
      setBilling(response.data);
      setBillingMessage({ type: 'success', text: 'Billing settings saved.' });
    } else {
      setBillingMessage({ type: 'error', text: response.error || 'Unable to save billing settings.' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Settings</h1>
        <p className="mt-1 text-on-surface-variant">Manage account access, integrations, and subscription state</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your visible name and password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileMessage && <AlertMessage message={profileMessage} />}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-secondary" />
            Security
          </CardTitle>
          <CardDescription>Email verification and password reset controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {securityMessage && <AlertMessage message={securityMessage} />}
          <div className="flex flex-col gap-3 rounded-lg bg-surface-container p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-on-surface">Email status</p>
              <p className="text-sm text-on-surface-variant">
                {user?.emailVerifiedAt ? `Verified ${formatDate(user.emailVerifiedAt)}` : 'Not verified'}
              </p>
            </div>
            <Badge variant={user?.emailVerifiedAt ? 'secondary' : 'warning'}>
              {user?.emailVerifiedAt ? 'Verified' : 'Pending'}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <Input
              value={verificationToken}
              onChange={(event) => setVerificationToken(event.target.value)}
              placeholder="Verification token"
            />
            <Button type="button" variant="secondary" onClick={handleRequestVerification}>
              Request Token
            </Button>
            <Button type="button" onClick={handleVerifyEmail} disabled={!verificationToken}>
              Verify Email
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="Email" />
            <Input value={resetToken} onChange={(event) => setResetToken(event.target.value)} placeholder="Reset token" />
            <Input
              type="password"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              placeholder="New password"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handleRequestPasswordReset}>
              Request Reset
            </Button>
            <Button type="button" onClick={handleConfirmPasswordReset} disabled={!resetToken || !resetPassword}>
              Confirm Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-secondary" />
            Billing
          </CardTitle>
          <CardDescription>Workspace plan and subscription state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {billingMessage && <AlertMessage message={billingMessage} />}
          {billing && !canManageAdminTools && (
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase text-on-surface-variant">Plan</p>
                <p className="font-semibold text-on-surface">{billing.plan}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-on-surface-variant">Status</p>
                <p className="font-semibold text-on-surface">{billing.status}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-on-surface-variant">Users Included</p>
                <p className="font-semibold text-on-surface">
                  {billing.plan === 'starter' ? 'Up to 5' : 'Unlimited'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-on-surface-variant">Renewal</p>
                <p className="font-semibold text-on-surface">
                  {billing.renewalDate ? formatDate(billing.renewalDate) : '-'}
                </p>
              </div>
            </div>
          )}
          {billing && !canManageAdminTools && billing.plan !== 'custom' && (
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" onClick={() => setCheckoutOpen(true)}>
                {billing.status === 'canceled' ? 'Subscribe Again' : 'Change Plan'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(COMPANY_ROUTES.subscription)}
              >
                Manage Subscription
              </Button>
            </div>
          )}
          {canManageAdminTools && (
            <form onSubmit={handleSaveBilling} className="space-y-4">
              <div className="grid gap-3 md:max-w-md">
                <Input
                  value={billingForm.workspaceName}
                  onChange={(event) => setBillingForm({ ...billingForm, workspaceName: event.target.value })}
                  placeholder="Workspace name"
                />
              </div>
              <Button type="submit">Save Workspace Name</Button>
            </form>
          )}
        </CardContent>
      </Card>

      {canManageIntegrations && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-secondary" />
                API Keys
              </CardTitle>
              <CardDescription>Generate and revoke integration keys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeyMessage && <AlertMessage message={apiKeyMessage} />}
              {createdApiKey && (
                <div className="rounded-lg bg-surface-container p-3 font-mono text-sm text-on-surface">
                  {createdApiKey}
                </div>
              )}
              <form onSubmit={handleCreateApiKey} className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input
                  value={newKeyName}
                  onChange={(event) => setNewKeyName(event.target.value)}
                  placeholder="Key name"
                  required
                />
                <Button type="submit">Create Key</Button>
              </form>
              <div className="space-y-2">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="flex flex-col gap-3 rounded-lg bg-surface-container p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-on-surface">{apiKey.name}</p>
                      <p className="text-sm text-on-surface-variant">
                        {apiKey.keyPrefix}... • Created {formatDate(apiKey.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={apiKey.revokedAt ? 'error' : 'secondary'}>
                        {apiKey.revokedAt ? 'Revoked' : 'Active'}
                      </Badge>
                      {!apiKey.revokedAt && (
                        <Button type="button" size="sm" variant="secondary" onClick={() => handleRevokeApiKey(apiKey.id)}>
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-secondary" />
                Webhooks
              </CardTitle>
              <CardDescription>Send CRM events to external systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {webhookMessage && <AlertMessage message={webhookMessage} />}
              <form onSubmit={handleCreateWebhook} className="grid gap-3 xl:grid-cols-[1fr_1.5fr_1fr_1fr_auto]">
                <Input
                  value={webhookForm.name}
                  onChange={(event) => setWebhookForm({ ...webhookForm, name: event.target.value })}
                  placeholder="Name"
                  required
                />
                <Input
                  type="url"
                  value={webhookForm.url}
                  onChange={(event) => setWebhookForm({ ...webhookForm, url: event.target.value })}
                  placeholder="https://example.com/webhook"
                  required
                />
                <Select
                  value={webhookForm.event}
                  onValueChange={(value) => setWebhookForm({ ...webhookForm, event: value as WebhookEvent })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEBHOOK_EVENTS.map((event) => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={webhookForm.isActive}
                  onValueChange={(value) => setWebhookForm({ ...webhookForm, isActive: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Paused</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit">Add</Button>
              </form>
              <div className="space-y-2">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="rounded-lg bg-surface-container p-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-on-surface">{webhook.name}</p>
                        <p className="truncate text-sm text-on-surface-variant">{webhook.url}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {webhook.event.replace('_', ' ')}
                          {webhook.lastTriggeredAt ? ` • Last ${formatDate(webhook.lastTriggeredAt)}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={webhook.isActive ? 'secondary' : 'warning'}>
                          {webhook.isActive ? 'Active' : 'Paused'}
                        </Badge>
                        <Button type="button" size="sm" variant="secondary" onClick={() => handleToggleWebhook(webhook)}>
                          {webhook.isActive ? 'Pause' : 'Resume'}
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => handleTestWebhook(webhook.id)}>
                          Test
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => handleDeleteWebhook(webhook.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                    {webhook.deliveries?.[0] && (
                      <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
                        <span>
                          Last delivery: {webhook.deliveries[0].status}
                          {webhook.deliveries[0].responseStatus ? ` (${webhook.deliveries[0].responseStatus})` : ''}
                        </span>
                        {(webhook.deliveries[0].status === 'failed' || webhook.deliveries[0].status === 'pending') && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-6 text-xs"
                            onClick={() => handleReplayWebhook(webhook.id, webhook.deliveries![0].id)}
                          >
                            Replay
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {canManagePipelines && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Pipelines
            </CardTitle>
            <p className="text-sm text-on-surface-variant">Manage deal pipelines and custom stages</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {pipelineMessage && <AlertMessage message={pipelineMessage} />}
            {pipelines.map((pipeline) => (
              <div key={pipeline.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-primary">{pipeline.name}</span>
                    {pipeline.isDefault && (
                      <span className="ml-2 text-xs text-on-surface-variant">(default)</span>
                    )}
                  </div>
                  {!pipeline.isDefault && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const res = await del(`/pipelines/${pipeline.id}`);
                        if (res.success) {
                          fetchAdminTools();
                        } else {
                          setPipelineMessage({ type: 'error', text: res.error || 'Unable to delete pipeline' });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {pipeline.stages.map((stage: PipelineStage) => (
                    <div key={stage.id} className="flex items-center justify-between py-1.5 px-3 rounded bg-surface-container">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                        <span className="text-sm">{stage.name}</span>
                        {stage.isWon && <span className="text-xs text-secondary font-medium">Won</span>}
                        {stage.isLost && <span className="text-xs text-error font-medium">Lost</span>}
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          const res = await del(`/pipelines/${pipeline.id}/stages/${stage.id}`);
                          if (res.success) {
                            fetchAdminTools();
                          } else {
                            setPipelineMessage({ type: 'error', text: res.error || 'Unable to delete stage' });
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="New stage name"
                    value={newStageName[pipeline.id] ?? ''}
                    onChange={(e) => setNewStageName((prev) => ({ ...prev, [pipeline.id]: e.target.value }))}
                    className="flex-1"
                  />
                  <input
                    type="color"
                    value={newStageColor[pipeline.id] ?? '#bcc3ff'}
                    onChange={(e) => setNewStageColor((prev) => ({ ...prev, [pipeline.id]: e.target.value }))}
                    className="w-10 h-10 rounded border cursor-pointer"
                    title="Stage color"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      const name = newStageName[pipeline.id]?.trim();
                      if (!name) return;
                      const res = await post(`/pipelines/${pipeline.id}/stages`, {
                        name,
                        color: newStageColor[pipeline.id] ?? '#bcc3ff',
                      });
                      if (res.success) {
                        setNewStageName((prev) => ({ ...prev, [pipeline.id]: '' }));
                        fetchAdminTools();
                      } else {
                        setPipelineMessage({ type: 'error', text: res.error || 'Unable to add stage' });
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Stage
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <CheckoutDialog
        billing={billing}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={() => fetchAdminTools()}
      />
    </div>
  );
}
