import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
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
import { get, post, put } from '@/lib/api';
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

export function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);

  const [formData, setFormData] = useState({
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
    const payload = {
      ...formData,
      value: Number(formData.value),
      expectedCloseDate: formData.expectedCloseDate || undefined,
    };
    const response = await post<Deal>('/deals', payload);
    if (response.success) {
      fetchData();
      closeModal();
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
    setFormData({
      leadId: '',
      title: '',
      value: 0,
      stage: 'new',
      expectedCloseDate: '',
      notes: '',
    });
  };

  const getDealsByStage = (stage: DealStage) =>
    deals.filter((d) => d.stage === stage);

  const getLeadName = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    return lead?.fullName || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on_surface_variant">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Deals</h1>
          <p className="text-on_surface_variant mt-1">
            Track your sales pipeline
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="rounded-round-eight bg-surface-container p-3">
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
                <Badge variant="default">
                  {getDealsByStage(stage.id).length}
                </Badge>
              </div>

              <div className="space-y-2 min-h-[200px]">
                {getDealsByStage(stage.id).map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal)}
                    className={`p-3 rounded-round-eight bg-surface cursor-move hover:bg-surface-container-high transition-colors ${
                      draggedDeal?.id === deal.id ? 'opacity-50' : ''
                    }`}
                  >
                    <h4 className="font-medium text-primary text-sm truncate">
                      {deal.title}
                    </h4>
                    <p className="text-xs text-on_surface_variant mt-1 truncate">
                      {getLeadName(deal.leadId)}
                    </p>
                    <p className="text-sm font-semibold text-secondary mt-2">
                      {formatCurrency(deal.value)}
                    </p>
                    {deal.expectedCloseDate && (
                      <p className="text-xs text-on_surface_variant mt-1">
                        Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}

                {getDealsByStage(stage.id).length === 0 && (
                  <div className="flex items-center justify-center h-32 border border-dashed border-outline-variant/15 rounded-round-eight text-sm text-on_surface_variant">
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
            <DialogTitle>Add New Deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="submit">Add Deal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
