import { useCallback, useEffect, useState } from 'react';
import { Bot, Play, RefreshCw, Trash2, Workflow } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { del, get, post, put } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type {
  ActivityType,
  AutomationActionType,
  AutomationRule,
  AutomationTriggerEvent,
  LeadStatus,
} from '@/types';

type Message = { type: 'success' | 'error' | 'info'; text: string };
type RecipientRole = 'all' | 'admin' | 'manager';

const TRIGGER_EVENTS: { value: AutomationTriggerEvent; label: string }[] = [
  { value: 'manual', label: 'Manual trigger' },
  { value: 'lead_created', label: 'Lead created' },
  { value: 'lead_updated', label: 'Lead updated' },
  { value: 'deal_created', label: 'Deal created' },
  { value: 'deal_won', label: 'Deal won' },
  { value: 'deal_lost', label: 'Deal lost' },
  { value: 'deal_stage_changed', label: 'Deal stage changed' },
  { value: 'activity_created', label: 'Activity created' },
];

const ACTION_TYPES: { value: AutomationActionType; label: string }[] = [
  { value: 'create_activity', label: 'Create activity' },
  { value: 'update_lead_status', label: 'Update lead status' },
  { value: 'assign_owner', label: 'Assign owner' },
  { value: 'send_notification', label: 'Send notification' },
  { value: 'fire_webhook', label: 'Fire webhook' },
];

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Call' },
  { value: 'follow_up', label: 'Follow up' },
];

const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'unqualified', label: 'Unqualified' },
];

const RECIPIENT_ROLES: { value: RecipientRole; label: string }[] = [
  { value: 'all', label: 'All company members' },
  { value: 'admin', label: 'Admins only' },
  { value: 'manager', label: 'Managers only' },
];

const WEBHOOK_METHODS = ['POST', 'PUT', 'PATCH', 'GET'];

const emptyForm = {
  name: '',
  triggerEvent: 'lead_created' as AutomationTriggerEvent,
  actionType: 'create_activity' as AutomationActionType,
  activityType: 'follow_up' as ActivityType,
  content: '',
  status: 'contacted' as LeadStatus,
  ownerId: '',
  notifTitle: '',
  notifBody: '',
  recipientRole: 'all' as RecipientRole,
  webhookUrl: '',
  webhookMethod: 'POST',
  webhookSecret: '',
  isActive: 'true',
};

function AlertMessage({ message }: { message: Message }) {
  const classes = {
    error: 'bg-error/10 text-error',
    success: 'bg-secondary/10 text-secondary',
    info: 'bg-surface-container text-on-surface-variant',
  };

  return <div className={`rounded-lg px-3 py-2 text-sm font-medium ${classes[message.type]}`}>{message.text}</div>;
}

function actionSummary(rule: AutomationRule) {
  switch (rule.actionType) {
    case 'create_activity':
      return `${rule.actionConfig.activityType?.replace('_', ' ') ?? 'Activity'}: ${rule.actionConfig.content ?? ''}`;
    case 'update_lead_status':
      return `Set lead status → ${rule.actionConfig.status ?? 'selected'}`;
    case 'assign_owner':
      return `Assign owner (user: ${rule.actionConfig.userId ?? '?'})`;
    case 'send_notification':
      return `Notify ${rule.actionConfig.recipientRole ?? 'all'}: ${rule.actionConfig.title ?? ''}`;
    case 'fire_webhook':
      return `${rule.actionConfig.method ?? 'POST'} ${rule.actionConfig.url ?? ''}`;
    default:
      return rule.actionType;
  }
}

function buildActionConfig(form: typeof emptyForm): Record<string, unknown> {
  switch (form.actionType) {
    case 'create_activity':
      return { activityType: form.activityType, content: form.content };
    case 'update_lead_status':
      return { status: form.status };
    case 'assign_owner':
      return { userId: form.ownerId.trim() };
    case 'send_notification':
      return { title: form.notifTitle.trim(), body: form.notifBody.trim(), recipientRole: form.recipientRole };
    case 'fire_webhook': {
      const config: Record<string, unknown> = { url: form.webhookUrl.trim(), method: form.webhookMethod };
      if (form.webhookSecret.trim()) config.secret = form.webhookSecret.trim();
      return config;
    }
    default:
      return {};
  }
}

function needsLeadId(actionType: AutomationActionType) {
  return actionType !== 'send_notification' && actionType !== 'fire_webhook';
}

function runBadgeVariant(status?: string) {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'running') return 'warning';
  return 'default';
}

export function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [message, setMessage] = useState<Message | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [manualLeadIds, setManualLeadIds] = useState<Record<string, string>>({});

  const fetchRules = useCallback(async () => {
    const response = await get<AutomationRule[]>('/automations');
    if (response.success && response.data) {
      setRules(response.data);
    } else {
      setMessage({ type: 'error', text: response.error || 'Unable to load automations.' });
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreateRule = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const response = await post<AutomationRule>('/automations', {
      name: form.name,
      triggerEvent: form.triggerEvent,
      actionType: form.actionType,
      actionConfig: buildActionConfig(form),
      isActive: form.isActive === 'true',
    });

    if (response.success) {
      setForm(emptyForm);
      setMessage({ type: 'success', text: 'Automation rule created.' });
      await fetchRules();
    } else {
      setMessage({ type: 'error', text: response.error || 'Unable to create automation.' });
    }
  };

  const handleToggleRule = async (rule: AutomationRule) => {
    const response = await put<AutomationRule>(`/automations/${rule.id}`, { isActive: !rule.isActive });
    setMessage({
      type: response.success ? 'success' : 'error',
      text: response.success ? 'Automation updated.' : response.error || 'Unable to update automation.',
    });
    await fetchRules();
  };

  const handleDeleteRule = async (rule: AutomationRule) => {
    const response = await del<void>(`/automations/${rule.id}`);
    setMessage({
      type: response.success ? 'success' : 'error',
      text: response.success ? 'Automation deleted.' : response.error || 'Unable to delete automation.',
    });
    await fetchRules();
  };

  const handleManualRun = async (rule: AutomationRule) => {
    const requiresLead = needsLeadId(rule.actionType);
    const leadId = manualLeadIds[rule.id]?.trim();

    if (requiresLead && !leadId) {
      setMessage({ type: 'error', text: 'Lead ID is required for a manual run of this action type.' });
      return;
    }

    const payload = requiresLead ? { leadId } : {};
    const response = await post(`/automations/${rule.id}/run`, payload);
    setMessage({
      type: response.success ? 'success' : 'error',
      text: response.success ? 'Automation run queued.' : response.error || 'Unable to run automation.',
    });
    await fetchRules();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">Automations</h1>
          <p className="text-on-surface-variant">Rule-based CRM actions with retry history.</p>
        </div>
        <Button type="button" variant="secondary" onClick={fetchRules}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {message && <AlertMessage message={message} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-secondary" />
            New Rule
          </CardTitle>
          <CardDescription>Create a trigger/action rule for this company workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleCreateRule}>
            <div className="space-y-2">
              <Label htmlFor="automation-name">Name</Label>
              <Input
                id="automation-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Auto follow up new leads"
              />
            </div>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select
                value={form.triggerEvent}
                onValueChange={(value) => setForm({ ...form, triggerEvent: value as AutomationTriggerEvent })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map((event) => (
                    <SelectItem key={event.value} value={event.value}>{event.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={form.actionType}
                onValueChange={(value) => setForm({ ...form, actionType: value as AutomationActionType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.isActive} onValueChange={(value) => setForm({ ...form, isActive: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.actionType === 'create_activity' && (
              <>
                <div className="space-y-2">
                  <Label>Activity type</Label>
                  <Select
                    value={form.activityType}
                    onValueChange={(value) => setForm({ ...form, activityType: value as ActivityType })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="automation-content">Activity content</Label>
                  <Textarea
                    id="automation-content"
                    value={form.content}
                    onChange={(event) => setForm({ ...form, content: event.target.value })}
                    placeholder="Schedule a follow-up within 24 hours."
                  />
                </div>
              </>
            )}

            {form.actionType === 'update_lead_status' && (
              <div className="space-y-2">
                <Label>Lead status</Label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as LeadStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.actionType === 'assign_owner' && (
              <div className="space-y-2">
                <Label htmlFor="owner-user-id">Owner user ID</Label>
                <Input
                  id="owner-user-id"
                  value={form.ownerId}
                  onChange={(event) => setForm({ ...form, ownerId: event.target.value })}
                  placeholder="User ID to assign as owner"
                />
              </div>
            )}

            {form.actionType === 'send_notification' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="notif-title">Notification title</Label>
                  <Input
                    id="notif-title"
                    value={form.notifTitle}
                    onChange={(event) => setForm({ ...form, notifTitle: event.target.value })}
                    placeholder="Deal won!"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Select
                    value={form.recipientRole}
                    onValueChange={(value) => setForm({ ...form, recipientRole: value as RecipientRole })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RECIPIENT_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="notif-body">Notification body</Label>
                  <Textarea
                    id="notif-body"
                    value={form.notifBody}
                    onChange={(event) => setForm({ ...form, notifBody: event.target.value })}
                    placeholder="A deal was just marked as won."
                  />
                </div>
              </>
            )}

            {form.actionType === 'fire_webhook' && (
              <>
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    value={form.webhookUrl}
                    onChange={(event) => setForm({ ...form, webhookUrl: event.target.value })}
                    placeholder="https://hooks.example.com/flowraze"
                  />
                </div>
                <div className="space-y-2">
                  <Label>HTTP method</Label>
                  <Select value={form.webhookMethod} onValueChange={(value) => setForm({ ...form, webhookMethod: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WEBHOOK_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-secret">Secret header (optional)</Label>
                  <Input
                    id="webhook-secret"
                    value={form.webhookSecret}
                    onChange={(event) => setForm({ ...form, webhookSecret: event.target.value })}
                    placeholder="Sent as X-FlowRaze-Secret"
                  />
                </div>
              </>
            )}

            <div className="lg:col-span-2">
              <Button type="submit">
                <Bot className="mr-2 h-4 w-4" />
                Create Automation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
          <CardDescription>Latest runs are shown under each rule.</CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="rounded-lg bg-surface-container-low p-6 text-sm text-on-surface-variant">
              No automation rules yet.
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-lg bg-surface-container-low p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-primary">{rule.name}</h3>
                        <Badge variant={rule.isActive ? 'secondary' : 'warning'}>{rule.isActive ? 'Active' : 'Paused'}</Badge>
                      </div>
                      <p className="text-sm text-on-surface-variant">
                        {rule.triggerEvent.replaceAll('_', ' ')} {'->'} {actionSummary(rule)}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {rule.lastTriggeredAt ? `Last triggered ${formatDate(rule.lastTriggeredAt)}` : 'Not triggered yet'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {needsLeadId(rule.actionType) && (
                        <Input
                          className="h-8 w-56"
                          placeholder="Lead ID for manual run"
                          value={manualLeadIds[rule.id] ?? ''}
                          onChange={(event) => setManualLeadIds({ ...manualLeadIds, [rule.id]: event.target.value })}
                        />
                      )}
                      <Button type="button" size="sm" variant="secondary" onClick={() => handleManualRun(rule)}>
                        <Play className="mr-2 h-3.5 w-3.5" />
                        Run
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => handleToggleRule(rule)}>
                        {rule.isActive ? 'Pause' : 'Resume'}
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => handleDeleteRule(rule)}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {rule.runs && rule.runs.length > 0 && (
                    <div className="mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Run</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Retries</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rule.runs.map((run) => (
                            <TableRow key={run.id}>
                              <TableCell>{formatDate(run.createdAt)}</TableCell>
                              <TableCell>
                                <Badge variant={runBadgeVariant(run.status)}>{run.status}</Badge>
                              </TableCell>
                              <TableCell>{run.retryCount}</TableCell>
                              <TableCell className="max-w-xs truncate text-on-surface-variant">{run.error ?? '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
