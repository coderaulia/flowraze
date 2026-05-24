import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
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
import { ExportControls } from '@/components/export-controls';
import { FieldError } from '@/components/ui/field-error';
import { get, post, put, del } from '@/lib/api';
import { hasFormErrors, isValidEmail, type FormErrors } from '@/lib/form-validation';
import { parseLeadImportFile, type LeadImportRow } from '@/lib/lead-import';
import { createWhatsAppChatUrl } from '@/lib/whatsapp';
import type { Lead } from '@/types';

const PAGE_LIMIT = 10;

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'warning' | 'error'> = {
  new: 'default',
  contacted: 'warning',
  qualified: 'secondary',
  unqualified: 'error',
};

type LeadFormData = {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  source: string;
  serviceType: string;
  status: Lead['status'];
  campaignId: string;
  notes: string;
};

type LeadImportResult = {
  createdCount: number;
  skippedCount: number;
  totalRows: number;
  errors: { rowNumber: number; email?: string; reason: string }[];
};

function WhatsAppLeadAction({ lead }: { lead: Lead }) {
  const chatUrl = createWhatsAppChatUrl(lead.phone || '');

  if (!chatUrl) {
    return null;
  }

  return (
    <Button asChild variant="secondary" size="sm">
      <a
        href={chatUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat with ${lead.fullName} on WhatsApp`}
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        WhatsApp
      </a>
    </Button>
  );
}

function validateLeadForm(data: LeadFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.fullName.trim()) {
    errors.fullName = 'Full name is required';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!data.source.trim()) {
    errors.source = 'Source is required';
  }

  return errors;
}

export function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const search = searchParams.get('search') ?? '';
  const statusFilter = searchParams.get('status') ?? 'all';
  const sourceFilter = searchParams.get('source') ?? '';
  const createdFrom = searchParams.get('createdFrom') ?? '';
  const createdTo = searchParams.get('createdTo') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');
  const [importRows, setImportRows] = useState<LeadImportRow[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState<LeadImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [formData, setFormData] = useState<LeadFormData>({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    source: '',
    serviceType: '',
    status: 'new' as Lead['status'],
    campaignId: '',
    notes: '',
  });

  const [lookups, setLookups] = useState<{ sources: string[], companies: string[], serviceTypes: string[] }>({
    sources: [],
    companies: [],
    serviceTypes: [],
  });

  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function fetchCampaigns() {
      const response = await get<{ id: string; name: string }[]>('/campaigns?limit=100');
      if (response.success && response.data) {
        setCampaigns(response.data);
      }
    }
    fetchCampaigns();
  }, []);

  const fetchLookups = useCallback(async () => {
    const response = await get<{ sources: string[], companies: string[], serviceTypes: string[] }>('/leads/lookups');
    if (response.success && response.data) {
      setLookups(response.data);
    }
  }, []);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) {
      params.set('search', search);
    }
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    }
    if (sourceFilter) {
      params.set('source', sourceFilter);
    }
    if (createdFrom) {
      params.set('createdFrom', createdFrom);
    }
    if (createdTo) {
      params.set('createdTo', createdTo);
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
  }, [createdFrom, createdTo, page, search, sourceFilter, statusFilter]);

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
    const validationErrors = validateLeadForm(formData);
    setFormErrors(validationErrors);
    setFormError('');

    if (hasFormErrors(validationErrors)) {
      return;
    }

    const payload = {
      ...formData,
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      companyName: formData.companyName.trim(),
      source: formData.source.trim(),
      serviceType: formData.serviceType.trim(),
      campaignId: (formData.campaignId && formData.campaignId !== 'none') ? formData.campaignId : undefined,
      notes: formData.notes.trim(),
    };

    if (editingLead) {
      const response = await put<Lead>(`/leads/${editingLead.id}`, payload);
      if (response.success) {
        fetchLeads();
        closeModal();
      } else {
        setFormError(response.error || 'Unable to save lead');
      }
    } else {
      const response = await post<Lead>('/leads', payload);
      if (response.success) {
        fetchLeads();
        closeModal();
      } else {
        setFormError(response.error || 'Unable to add lead');
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

  const handleImportFileChange = async (file: File | null) => {
    setImportError('');
    setImportResult(null);
    setImportRows([]);
    setImportFileName(file?.name ?? '');

    if (!file) {
      return;
    }

    try {
      const rows = await parseLeadImportFile(file);
      setImportRows(rows);
      if (rows.length === 0) {
        setImportError('No lead rows were found in the selected file');
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unable to read import file');
    }
  };

  const handleImportSubmit = async () => {
    if (importRows.length === 0) {
      setImportError('Choose a CSV or .xlsx file with lead rows first');
      return;
    }

    setIsImporting(true);
    setImportError('');
    const response = await post<LeadImportResult>('/leads/import', { leads: importRows });
    setIsImporting(false);

    if (response.success && response.data) {
      setImportResult(response.data);
      fetchLeads();
      fetchLookups();
    } else {
      setImportError(response.error || 'Unable to import leads');
    }
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportRows([]);
    setImportFileName('');
    setImportError('');
    setImportResult(null);
    setIsImporting(false);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone || '',
      companyName: lead.companyName || '',
      source: lead.source,
      serviceType: lead.serviceType || '',
      campaignId: lead.campaignId || '',
      status: lead.status,
      notes: lead.notes || '',
    });
    setFormErrors({});
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      companyName: '',
      source: '',
      serviceType: '',
      campaignId: '',
      status: 'new',
      notes: '',
    });
    setFormErrors({});
    setFormError('');
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

  const handleFilterChange = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (!value || value === 'all') {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Leads</h1>
          <p className="text-on-surface-variant mt-1">
            Manage your leads and track their progress
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportControls entity="leads" queryParams={searchParams} />
          <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="unqualified">Unqualified</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Source"
          value={sourceFilter}
          onChange={(e) => handleFilterChange('source', e.target.value)}
        />
        <Input
          type="date"
          value={createdFrom}
          onChange={(e) => handleFilterChange('createdFrom', e.target.value)}
        />
        <Input
          type="date"
          value={createdTo}
          onChange={(e) => handleFilterChange('createdTo', e.target.value)}
        />
      </div>

      <div className="rounded-lg bg-white border border-gray-200 overflow-x-auto">
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
                <TableHead>Service</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.fullName}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.companyName}</TableCell>
                  <TableCell>{lead.serviceType}</TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[lead.status]}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-on-surface-variant">
                    {new Date(lead.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <WhatsAppLeadAction lead={lead} />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${lead.fullName}`}
                        onClick={() => openEditModal(lead)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${lead.fullName}`}
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLead ? 'Edit Lead' : 'Add New Lead'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
                {formError}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                />
                <FieldError message={formErrors.fullName} />
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
                  required
                />
                <FieldError message={formErrors.email} />
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
                  placeholder="e.g., 0812 3456 7890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  list="companies-list"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />
                <datalist id="companies-list">
                  {lookups.companies.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  list="sources-list"
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  placeholder="e.g., Website, Referral"
                  required
                />
                <FieldError message={formErrors.source} />
                <datalist id="sources-list">
                  {lookups.sources.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceType">Project / Service</Label>
                <Input
                  id="serviceType"
                  list="service-types-list"
                  value={formData.serviceType}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceType: e.target.value })
                  }
                  placeholder="e.g., Development, Consulting"
                />
                <datalist id="service-types-list">
                  {lookups.serviceTypes.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="campaignId">Campaign / Project</Label>
                <Select
                  value={formData.campaignId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, campaignId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a campaign (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      <Dialog open={isImportModalOpen} onOpenChange={(open) => open ? setIsImportModalOpen(true) : closeImportModal()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Leads</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {importError && (
              <div className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
                {importError}
              </div>
            )}
            {importResult && (
              <div className="rounded-lg bg-secondary/10 px-3 py-2 text-sm text-on-surface">
                Imported {importResult.createdCount} of {importResult.totalRows} leads
                {importResult.skippedCount > 0 ? `, skipped ${importResult.skippedCount}` : ''}.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="leadImportFile">CSV or Excel File</Label>
              <Input
                id="leadImportFile"
                type="file"
                accept=".csv,.tsv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => handleImportFileChange(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-on-surface-variant">
                Required columns: fullName, email, source. Optional: phone, companyName, serviceType, status, campaignId, notes.
              </p>
            </div>
            {importFileName && (
              <div className="rounded-lg bg-surface px-3 py-2 text-sm text-on-surface-variant">
                {importFileName} · {importRows.length} rows ready
              </div>
            )}
            {importRows.length > 0 && (
              <div className="max-h-52 overflow-auto rounded-lg bg-white border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importRows.slice(0, 5).map((row) => (
                      <TableRow key={`${row.rowNumber}-${row.email ?? row.fullName ?? 'row'}`}>
                        <TableCell>{row.fullName || '-'}</TableCell>
                        <TableCell>{row.email || '-'}</TableCell>
                        <TableCell>{row.source || '-'}</TableCell>
                        <TableCell>{row.status || 'new'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {importResult && importResult.errors.length > 0 && (
              <div className="max-h-40 overflow-auto rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
                {importResult.errors.slice(0, 8).map((error) => (
                  <p key={`${error.rowNumber}-${error.email ?? error.reason}`}>
                    Row {error.rowNumber}: {error.reason}{error.email ? ` (${error.email})` : ''}
                  </p>
                ))}
                {importResult.errors.length > 8 && (
                  <p>And {importResult.errors.length - 8} more skipped rows.</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={closeImportModal}>
              Close
            </Button>
            <Button type="button" onClick={handleImportSubmit} disabled={isImporting || importRows.length === 0}>
              {isImporting ? 'Importing...' : 'Import Leads'}
            </Button>
          </DialogFooter>
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
