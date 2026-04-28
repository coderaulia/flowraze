import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationControls, type PaginationMeta } from '@/components/pagination-controls';
import { get, post, put, del } from '@/lib/api';
import { formatFieldErrorId, hasFormErrors, isBlank, isValidEmail, type FormErrors } from '@/lib/form-validation';
import type { Lead } from '@/types';

const PAGE_LIMIT = 10;
const LEAD_FORM_ID = 'lead-form';

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'warning' | 'error'> = {
  new: 'default',
  contacted: 'warning',
  qualified: 'secondary',
  unqualified: 'error',
};

type LeadFormField = 'fullName' | 'email' | 'source';

export function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const search = searchParams.get('search') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors<LeadFormField>>({});
  const [submitError, setSubmitError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    source: '',
    status: 'new' as Lead['status'],
    notes: '',
  });

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) {
      params.set('search', search);
    }
    params.set('page', String(page));
    params.set('limit', String(PAGE_LIMIT));

    const query = params.toString();
    const response = await get<Lead[]>(`/leads${query ? `?${query}` : ''}`);
    if (response.success && response.data) {
      setLeads(response.data);
      setPagination(response.pagination ?? { page, limit: PAGE_LIMIT, total: response.data.length });
    }
    setIsLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsModalOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateLeadForm(formData);
    setFormErrors(nextErrors);
    setSubmitError('');

    if (hasFormErrors(nextErrors)) {
      return;
    }

    const payload = {
      ...formData,
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      source: formData.source.trim(),
      phone: formData.phone.trim(),
      companyName: formData.companyName.trim(),
      notes: formData.notes.trim(),
    };

    if (editingLead) {
      const response = await put<Lead>(`/leads/${editingLead.id}`, payload);
      if (response.success) {
        fetchLeads();
        closeModal();
      } else {
        setSubmitError(response.error || 'Unable to save lead');
      }
    } else {
      const response = await post<Lead>('/leads', payload);
      if (response.success) {
        fetchLeads();
        closeModal();
      } else {
        setSubmitError(response.error || 'Unable to add lead');
      }
    }
  };

  const handleDelete = async () => {
    if (deletingId) {
      const response = await del<void>(`/leads/${deletingId}`);
      if (response.success) {
        fetchLeads();
        setIsDeleteModalOpen(false);
        setDeletingId(null);
      }
    }
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.companyName,
      source: lead.source,
      status: lead.status,
      notes: lead.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
    setFormErrors({});
    setSubmitError('');
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      companyName: '',
      source: '',
      status: 'new',
      notes: '',
    });
  };

  const handleModalOpenChange = (open: boolean) => {
    if (open) {
      setIsModalOpen(true);
      return;
    }

    closeModal();
  };

  const handleSearchChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value) {
      nextParams.set('search', value);
    } else {
      nextParams.delete('search');
    }
    nextParams.set('page', '1');

    setSearchParams(nextParams, { replace: true });
  };

  const handlePageChange = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(nextPage));
    setSearchParams(nextParams);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Leads</h1>
          <p className="text-on-surface-variant mt-1">
            Manage your leads and track their progress
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-on-surface-variant">
            Loading leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
            <p>{search ? 'No matching leads found' : 'No leads found'}</p>
            <Button variant="link" onClick={() => setIsModalOpen(true)}>
              Add your first lead
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.fullName}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.companyName}</TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[lead.status]}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(lead)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingId(lead.id);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-error" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!isLoading && (
          <PaginationControls
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLead ? 'Edit Lead' : 'Add New Lead'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  aria-invalid={Boolean(formErrors.fullName)}
                  aria-describedby={formErrors.fullName ? formatFieldErrorId(LEAD_FORM_ID, 'fullName') : undefined}
                  required
                />
                <FieldError id={formatFieldErrorId(LEAD_FORM_ID, 'fullName')} message={formErrors.fullName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  aria-invalid={Boolean(formErrors.email)}
                  aria-describedby={formErrors.email ? formatFieldErrorId(LEAD_FORM_ID, 'email') : undefined}
                  required
                />
                <FieldError id={formatFieldErrorId(LEAD_FORM_ID, 'email')} message={formErrors.email} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  placeholder="e.g., Website, Referral"
                  aria-invalid={Boolean(formErrors.source)}
                  aria-describedby={formErrors.source ? formatFieldErrorId(LEAD_FORM_ID, 'source') : undefined}
                  required
                />
                <FieldError id={formatFieldErrorId(LEAD_FORM_ID, 'source')} message={formErrors.source} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as Lead['status'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="unqualified">Unqualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              {submitError && (
                <p className="mr-auto text-sm text-error" role="alert">
                  {submitError}
                </p>
              )}
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingLead ? 'Save Changes' : 'Add Lead'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
          </DialogHeader>
          <p className="text-on-surface-variant">
            Are you sure you want to delete this lead? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="default" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function validateLeadForm(formData: {
  fullName: string;
  email: string;
  source: string;
}) {
  const errors: FormErrors<LeadFormField> = {};

  if (isBlank(formData.fullName)) {
    errors.fullName = 'Full name is required';
  }

  if (isBlank(formData.email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (isBlank(formData.source)) {
    errors.source = 'Source is required';
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
