import { useCallback, useEffect, useState } from 'react';
import { Bug, LifeBuoy, RefreshCw, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { get, post, put } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/hooks/useAuthStore';
import type {
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
  SupportTicketType,
  User,
} from '@/types';

type Message = { type: 'success' | 'error' | 'info'; text: string };

const TICKET_TYPES: { value: SupportTicketType; label: string }[] = [
  { value: 'bug', label: 'Bug report' },
  { value: 'question', label: 'Product question' },
  { value: 'onboarding', label: 'Onboarding help' },
  { value: 'billing', label: 'Billing support' },
  { value: 'feature_request', label: 'Feature request' },
];

const PRIORITIES: { value: SupportTicketPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUSES: { value: SupportTicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_on_customer', label: 'Waiting on customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const emptyForm = {
  type: 'bug' as SupportTicketType,
  priority: 'medium' as SupportTicketPriority,
  subject: '',
  description: '',
};

function AlertMessage({ message }: { message: Message }) {
  const classes = {
    error: 'bg-error/10 text-error',
    success: 'bg-secondary/10 text-secondary',
    info: 'bg-surface-container text-on-surface-variant',
  };

  return <div className={`rounded-lg px-3 py-2 text-sm font-medium ${classes[message.type]}`}>{message.text}</div>;
}

function labelFor<T extends string>(options: { value: T; label: string }[], value: T) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function priorityVariant(priority: SupportTicketPriority) {
  if (priority === 'urgent') return 'error';
  if (priority === 'high') return 'warning';
  if (priority === 'medium') return 'secondary';
  return 'default';
}

function statusVariant(status: SupportTicketStatus) {
  if (status === 'resolved' || status === 'closed') return 'success';
  if (status === 'waiting_on_customer') return 'warning';
  if (status === 'in_progress') return 'secondary';
  return 'default';
}

export function SupportPage() {
  const { isAdmin } = useAuthStore();
  const admin = isAdmin();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState<Message | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchSupportData = useCallback(async () => {
    const ticketsResponse = await get<SupportTicket[]>('/support');
    if (ticketsResponse.success && ticketsResponse.data) {
      setTickets(ticketsResponse.data);
    } else {
      setMessage({ type: 'error', text: ticketsResponse.error || 'Unable to load support tickets.' });
    }

    if (admin) {
      const usersResponse = await get<User[]>('/users');
      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data.filter((user) => user.role === 'admin' || user.role === 'manager'));
      }
    }
  }, [admin]);

  useEffect(() => {
    fetchSupportData();
  }, [fetchSupportData]);

  const handleCreateTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const response = await post<SupportTicket>('/support', {
      ...form,
      pageUrl: window.location.href,
      browserInfo: navigator.userAgent,
    });

    if (response.success) {
      setForm(emptyForm);
      setMessage({ type: 'success', text: 'Support ticket submitted.' });
      await fetchSupportData();
    } else {
      setMessage({ type: 'error', text: response.error || 'Unable to submit ticket.' });
    }
  };

  const handleUpdateTicket = async (ticket: SupportTicket, payload: Partial<SupportTicket>) => {
    const response = await put<SupportTicket>(`/support/${ticket.id}`, payload);
    setMessage({
      type: response.success ? 'success' : 'error',
      text: response.success ? 'Support ticket updated.' : response.error || 'Unable to update ticket.',
    });
    await fetchSupportData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">Support</h1>
          <p className="text-on-surface-variant">Report bugs, ask for help, and track support follow-up.</p>
        </div>
        <Button type="button" variant="secondary" onClick={fetchSupportData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {message && <AlertMessage message={message} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-secondary" />
            New Request
          </CardTitle>
          <CardDescription>Share the issue, question, or onboarding need with enough detail to reproduce it.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleCreateTicket}>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as SupportTicketType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TICKET_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) => setForm({ ...form, priority: value as SupportTicketPriority })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="support-subject">Subject</Label>
              <Input
                id="support-subject"
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
                placeholder="Unable to import leads from CSV"
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="support-description">Details</Label>
              <Textarea
                id="support-description"
                className="min-h-32"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="What happened, what did you expect, and what steps reproduce it?"
              />
            </div>
            <div className="lg:col-span-2">
              <Button type="submit">
                <Send className="mr-2 h-4 w-4" />
                Submit Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-secondary" />
            {admin ? 'Workspace Tickets' : 'My Tickets'}
          </CardTitle>
          <CardDescription>{admin ? 'Review, assign, and resolve incoming support tickets.' : 'Track your submitted requests.'}</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="rounded-lg bg-surface-container-low p-6 text-sm text-on-surface-variant">
              No support tickets yet.
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg bg-surface-container-low p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-primary">{ticket.subject}</h3>
                        <Badge variant={statusVariant(ticket.status)}>{labelFor(STATUSES, ticket.status)}</Badge>
                        <Badge variant={priorityVariant(ticket.priority)}>{labelFor(PRIORITIES, ticket.priority)}</Badge>
                      </div>
                      <p className="text-sm text-on-surface-variant">{ticket.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                        <span>{labelFor(TICKET_TYPES, ticket.type)}</span>
                        <span>Created {formatDate(ticket.createdAt)}</span>
                        {ticket.slaDueAt && <span>SLA due {formatDate(ticket.slaDueAt)}</span>}
                        {ticket.requester && <span>Requester {ticket.requester.name}</span>}
                        {ticket.assignedTo && <span>Assigned {ticket.assignedTo.name}</span>}
                      </div>
                    </div>

                    {admin && (
                      <div className="grid gap-2 sm:grid-cols-2 xl:w-[28rem]">
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => handleUpdateTicket(ticket, { status: value as SupportTicketStatus })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={ticket.assignedToId ?? 'unassigned'}
                          onValueChange={(value) => {
                            if (value !== 'unassigned') {
                              void handleUpdateTicket(ticket, { assignedToId: value });
                            }
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Assign" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
