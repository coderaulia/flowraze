import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldError } from '@/components/ui/field-error';
import { ExportControls } from '@/components/export-controls';
import { get, post, put, del } from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
  hasFormErrors,
  isPositiveNumber,
  isValidDateValue,
  type FormErrors,
} from '@/lib/form-validation';
import { formatCurrency } from '@/lib/utils';
import type { Deal, Lead, Pipeline, PipelineStage } from '@/types';

type DealFormData = {
  leadId: string;
  title: string;
  value: number;
  pipelineStageId: string;
  expectedCloseDate: string;
  notes: string;
};

function validateDealForm(data: DealFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.leadId) errors.leadId = 'Lead is required';
  if (!data.title.trim()) errors.title = 'Deal title is required';
  if (!isPositiveNumber(data.value)) errors.value = 'Value must be greater than zero';
  if (data.expectedCloseDate && !isValidDateValue(data.expectedCloseDate)) {
    errors.expectedCloseDate = 'Enter a valid close date';
  }
  return errors;
}

export function DealsPage() {
  const { user } = useAuthStore();
  const dealLabel = user?.entitlements?.dealLabel ?? 'Deals';
  const [searchParams, setSearchParams] = useSearchParams();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');
  const search = searchParams.get('search') ?? '';
  const stageFilter = searchParams.get('stage') ?? 'all';
  const statusFilter = searchParams.get('status') ?? 'all';
  const minValue = searchParams.get('minValue') ?? '';
  const maxValue = searchParams.get('maxValue') ?? '';

  const stages: PipelineStage[] = pipeline?.stages ?? [];
  const defaultStageId = stages[0]?.id ?? '';

  const [formData, setFormData] = useState<DealFormData>({
    leadId: '',
    title: '',
    value: 0,
    pipelineStageId: '',
    expectedCloseDate: '',
    notes: '',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (stageFilter !== 'all') params.set('pipelineStageId', stageFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (minValue) params.set('minValue', minValue);
    if (maxValue) params.set('maxValue', maxValue);
    const query = params.toString();

    const [dealsRes, leadsRes, pipelinesRes] = await Promise.all([
      get<Deal[]>(`/deals${query ? `?${query}` : ''}`),
      get<Lead[]>('/leads'),
      get<Pipeline[]>('/pipelines'),
    ]);
    if (dealsRes.success && dealsRes.data) setDeals(dealsRes.data);
    if (leadsRes.success && leadsRes.data) setLeads(leadsRes.data);
    if (pipelinesRes.success && pipelinesRes.data) {
      const defaultPipeline = pipelinesRes.data.find((p) => p.isDefault) ?? pipelinesRes.data[0] ?? null;
      setPipeline(defaultPipeline);
      setFormData((prev) => ({
        ...prev,
        pipelineStageId: prev.pipelineStageId || defaultPipeline?.stages[0]?.id || '',
      }));
    }
    setIsLoading(false);
  }, [maxValue, minValue, search, stageFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateDealForm(formData);
    setFormErrors(validationErrors);
    setFormError('');

    if (hasFormErrors(validationErrors)) return;

    const payload = {
      ...formData,
      title: formData.title.trim(),
      value: Number(formData.value),
      expectedCloseDate: formData.expectedCloseDate || undefined,
      notes: formData.notes.trim(),
    };
    const response = editingDeal
      ? await put<Deal>(`/deals/${editingDeal.id}`, payload)
      : await post<Deal>('/deals', payload);

    if (response.success) {
      fetchData();
      closeModal();
    } else {
      setFormError(response.error || `Unable to ${editingDeal ? 'save' : 'add'} deal`);
    }
  };

  const handleDragStart = (deal: Deal) => setDraggedDeal(deal);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedDeal && draggedDeal.pipelineStageId !== stageId) {
      const response = await put<Deal>(`/deals/${draggedDeal.id}`, { pipelineStageId: stageId });
      if (response.success) fetchData();
    }
    setDraggedDeal(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDeal(null);
    setFormData({
      leadId: '',
      title: '',
      value: 0,
      pipelineStageId: defaultStageId,
      expectedCloseDate: '',
      notes: '',
    });
    setFormErrors({});
    setFormError('');
  };

  const openEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      leadId: deal.leadId,
      title: deal.title,
      value: deal.value,
      pipelineStageId: deal.pipelineStageId,
      expectedCloseDate: deal.expectedCloseDate
        ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] ?? ''
        : '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingDeal) return;
    const response = await del(`/deals/${deletingDeal.id}`);
    if (response.success) {
      fetchData();
      setIsDeleteModalOpen(false);
      setDeletingDeal(null);
    }
  };

  const getDealsByStage = (stageId: string) =>
    deals.filter((d) => d.pipelineStageId === stageId);

  const getStageValue = (stageId: string) =>
    getDealsByStage(stageId).reduce((sum, deal) => sum + deal.value, 0);

  const getLeadName = (leadId: string) =>
    leads.find((l) => l.id === leadId)?.fullName || 'Unknown';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{dealLabel}</h1>
          <p className="text-on-surface-variant mt-1">
            {pipeline ? pipeline.name : 'Track your sales pipeline'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportControls entity="deals" queryParams={searchParams} />
          <Button onClick={() => { setFormData((f) => ({ ...f, pipelineStageId: defaultStageId })); setIsModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <Select value={stageFilter} onValueChange={(value) => handleFilterChange('stage', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Input
          min="0"
          placeholder="Min value"
          type="number"
          value={minValue}
          onChange={(e) => handleFilterChange('minValue', e.target.value)}
        />
        <Input
          min="0"
          placeholder="Max value"
          type="number"
          value={maxValue}
          onChange={(e) => handleFilterChange('maxValue', e.target.value)}
        />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-p-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-[85vw] sm:w-72 snap-center"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="rounded-lg bg-gray-100 p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm font-medium text-primary">
                    {stage.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-on-surface-variant">
                    {formatCurrency(getStageValue(stage.id))}
                  </span>
                  <Badge variant="default">
                    {getDealsByStage(stage.id).length}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 min-h-[200px]">
                {getDealsByStage(stage.id).map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal)}
                    className={`p-3 rounded-lg bg-white cursor-move hover:bg-gray-50 transition-colors ${
                      draggedDeal?.id === deal.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-primary text-sm truncate">
                        {deal.title}
                      </h4>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          aria-label={`Edit ${deal.title}`}
                          className="rounded p-1 text-slate-500 hover:bg-gray-100 hover:text-primary"
                          type="button"
                          onClick={() => openEditModal(deal)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          aria-label={`Delete ${deal.title}`}
                          className="rounded p-1 text-slate-500 hover:bg-gray-100 hover:text-error"
                          type="button"
                          onClick={() => {
                            setDeletingDeal(deal);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 truncate">
                      {getLeadName(deal.leadId)}
                    </p>
                    <p className="text-sm font-semibold text-secondary mt-2">
                      {formatCurrency(deal.value)}
                    </p>
                    {deal.expectedCloseDate && (
                      <p className="text-xs text-on-surface-variant mt-1">
                        Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}

                {getDealsByStage(stage.id).length === 0 && (
                  <div className="flex items-center justify-center h-32 border border-dashed border-gray-300 rounded-lg text-sm text-on-surface-variant">
                    No deals
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDeal ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="leadId">Lead</Label>
              <Select
                value={formData.leadId}
                onValueChange={(value) => setFormData({ ...formData, leadId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.fullName} {lead.companyName ? `— ${lead.companyName}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={formErrors.leadId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Deal Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <FieldError message={formErrors.title} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="value">Value (IDR)</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  required
                />
                <FieldError message={formErrors.value} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={formData.pipelineStageId}
                  onValueChange={(value) => setFormData({ ...formData, pipelineStageId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
              <Input
                id="expectedCloseDate"
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              />
              <FieldError message={formErrors.expectedCloseDate} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">{editingDeal ? 'Save Changes' : 'Add Deal'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
          </DialogHeader>
          <p className="text-on-surface-variant">
            Are you sure you want to delete {deletingDeal?.title || 'this deal'}?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingDeal(null);
              }}
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
