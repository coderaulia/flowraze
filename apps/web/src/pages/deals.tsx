import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import { get, post, put, del } from '@/lib/api';
import {
  hasFormErrors,
  isPositiveNumber,
  isValidDateValue,
  type FormErrors,
} from '@/lib/form-validation';
import { formatCurrency } from '@/lib/utils';
import type { Deal, DealStage, Lead } from '@/types';

const STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: 'new', label: 'New', color: '#bcc3ff' },
  { id: 'qualified', label: 'Qualified', color: '#4ae176' },
  { id: 'proposal', label: 'Proposal', color: '#ffb595' },
  { id: 'negotiation', label: 'Negotiation', color: '#ff6b6b' },
  { id: 'won', label: 'Won', color: '#4ae176' },
  { id: 'lost', label: 'Lost', color: '#ffb4ab' },
];

type DealFormData = {
  leadId: string;
  title: string;
  value: number;
  stage: DealStage;
  expectedCloseDate: string;
  notes: string;
};

function validateDealForm(data: DealFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.leadId) {
    errors.leadId = 'Lead is required';
  }

  if (!data.title.trim()) {
    errors.title = 'Deal title is required';
  }

  if (!isPositiveNumber(data.value)) {
    errors.value = 'Value must be greater than zero';
  }

  if (data.expectedCloseDate && !isValidDateValue(data.expectedCloseDate)) {
    errors.expectedCloseDate = 'Enter a valid close date';
  }

  return errors;
}

export function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState<DealFormData>({
    leadId: '',
    title: '',
    value: 0,
    stage: 'new' as DealStage,
    expectedCloseDate: '',
    notes: '',
  });

  const fetchData = async () => {
    const [dealsRes, leadsRes] = await Promise.all([
      get<Deal[]>('/deals'),
      get<Lead[]>('/leads'),
    ]);
    if (dealsRes.success && dealsRes.data) setDeals(dealsRes.data);
    if (leadsRes.success && leadsRes.data) setLeads(leadsRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateDealForm(formData);
    setFormErrors(validationErrors);
    setFormError('');

    if (hasFormErrors(validationErrors)) {
      return;
    }

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

  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stage: DealStage) => {
    e.preventDefault();
    if (draggedDeal && draggedDeal.stage !== stage) {
      const response = await put<Deal>(`/deals/${draggedDeal.id}`, { stage });
      if (response.success) {
        fetchData();
      }
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
      stage: 'new',
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
      stage: deal.stage,
      expectedCloseDate: deal.expectedCloseDate
        ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
        : '',
      notes: '',
    });
    setFormErrors({});
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingDeal) {
      return;
    }

    const response = await del<void>(`/deals/${deletingDeal.id}`);
    if (response.success) {
      fetchData();
      setIsDeleteModalOpen(false);
      setDeletingDeal(null);
    }
  };

  const getDealsByStage = (stage: DealStage) =>
    deals.filter((d) => d.stage === stage);

  const getStageValue = (stage: DealStage) =>
    getDealsByStage(stage).reduce((sum, deal) => sum + deal.value, 0);

  const getLeadName = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    return lead?.fullName || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Deals</h1>
          <p className="text-on-surface-variant mt-1">
            Track your sales pipeline
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-p-4">
        {STAGES.map((stage) => (
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
                    {stage.label}
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
                onValueChange={(value) =>
                  setFormData({ ...formData, leadId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.fullName} - {lead.companyName}
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
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
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
                  onChange={(e) =>
                    setFormData({ ...formData, value: Number(e.target.value) })
                  }
                  required
                />
                <FieldError message={formErrors.value} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) =>
                    setFormData({ ...formData, stage: value as DealStage })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.label}
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
                onChange={(e) =>
                  setFormData({ ...formData, expectedCloseDate: e.target.value })
                }
              />
              <FieldError message={formErrors.expectedCloseDate} />
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
