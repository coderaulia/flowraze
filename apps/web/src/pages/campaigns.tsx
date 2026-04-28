import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Search } from 'lucide-react';
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
import { PaginationControls, type PaginationMeta } from '@/components/pagination-controls';
import { get, post, put } from '@/lib/api';
import { formatFieldErrorId, hasFormErrors, isBlank, parseOptionalNumber, type FormErrors } from '@/lib/form-validation';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Campaign } from '@/types';

const PAGE_LIMIT = 10;
const CAMPAIGN_FORM_ID = 'campaign-form';

const CHANNEL_COLORS: Record<string, 'default' | 'secondary' | 'warning'> = {
  email: 'default',
  social: 'secondary',
  paid: 'warning',
  organic: 'default',
};

type CampaignFormField = 'name' | 'channel' | 'cost' | 'startDate' | 'endDate';
type CampaignFormData = {
  name: string;
  channel: string;
  cost: string;
  startDate: string;
  endDate: string;
};

export function CampaignsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const search = searchParams.get('search') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors<CampaignFormField>>({});
  const [submitError, setSubmitError] = useState('');

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    channel: '',
    cost: '',
    startDate: '',
    endDate: '',
  });

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) {
      params.set('search', search);
    }
    params.set('page', String(page));
    params.set('limit', String(PAGE_LIMIT));

    const response = await get<Campaign[]>(`/campaigns?${params.toString()}`);
    if (response.success && response.data) {
      setCampaigns(response.data);
      setPagination(response.pagination ?? { page, limit: PAGE_LIMIT, total: response.data.length });
    }
    setIsLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateCampaignForm(formData);
    setFormErrors(nextErrors);
    setSubmitError('');

    if (hasFormErrors(nextErrors)) {
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      channel: formData.channel.trim(),
      cost: parseOptionalNumber(formData.cost),
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
    };

    if (editingId) {
      const response = await put<Campaign>(`/campaigns/${editingId}`, payload);
      if (response.success) {
        fetchCampaigns();
        closeModal();
      } else {
        setSubmitError(response.error || 'Unable to save campaign');
      }
    } else {
      const response = await post<Campaign>('/campaigns', payload);
      if (response.success) {
        fetchCampaigns();
        closeModal();
      } else {
        setSubmitError(response.error || 'Unable to add campaign');
      }
    }
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setFormErrors({});
    setSubmitError('');
    setFormData({
      name: campaign.name,
      channel: campaign.channel,
      cost: campaign.cost ? String(campaign.cost) : '',
      startDate: new Date(campaign.startDate).toISOString().split('T')[0],
      endDate: campaign.endDate
        ? new Date(campaign.endDate).toISOString().split('T')[0]
        : '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormErrors({});
    setSubmitError('');
    setFormData({
      name: '',
      channel: '',
      cost: '',
      startDate: '',
      endDate: '',
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
          <h1 className="text-2xl font-bold text-primary">Campaigns</h1>
          <p className="text-on-surface-variant mt-1">
            Track your marketing campaigns and their performance
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Campaign
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-on-surface-variant">
            Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
            <p>{search ? 'No matching campaigns found' : 'No campaigns found'}</p>
            <Button variant="link" onClick={() => setIsModalOpen(true)}>
              Add your first campaign
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant={CHANNEL_COLORS[campaign.channel] || 'default'}>
                      {campaign.channel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {campaign.cost ? formatCurrency(campaign.cost) : '-'}
                  </TableCell>
                  <TableCell>{formatDate(campaign.startDate)}</TableCell>
                  <TableCell>
                    {campaign.endDate ? formatDate(campaign.endDate) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(campaign)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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
              {editingId ? 'Edit Campaign' : 'Add New Campaign'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                aria-invalid={Boolean(formErrors.name)}
                aria-describedby={formErrors.name ? formatFieldErrorId(CAMPAIGN_FORM_ID, 'name') : undefined}
                required
              />
              <FieldError id={formatFieldErrorId(CAMPAIGN_FORM_ID, 'name')} message={formErrors.name} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="channel">Channel</Label>
                <Input
                  id="channel"
                  value={formData.channel}
                  onChange={(e) =>
                    setFormData({ ...formData, channel: e.target.value })
                  }
                  placeholder="e.g., Email, Social, Paid"
                  aria-invalid={Boolean(formErrors.channel)}
                  aria-describedby={formErrors.channel ? formatFieldErrorId(CAMPAIGN_FORM_ID, 'channel') : undefined}
                  required
                />
                <FieldError id={formatFieldErrorId(CAMPAIGN_FORM_ID, 'channel')} message={formErrors.channel} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (IDR)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: e.target.value })
                  }
                  min={0}
                  aria-invalid={Boolean(formErrors.cost)}
                  aria-describedby={formErrors.cost ? formatFieldErrorId(CAMPAIGN_FORM_ID, 'cost') : undefined}
                />
                <FieldError id={formatFieldErrorId(CAMPAIGN_FORM_ID, 'cost')} message={formErrors.cost} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  aria-invalid={Boolean(formErrors.startDate)}
                  aria-describedby={formErrors.startDate ? formatFieldErrorId(CAMPAIGN_FORM_ID, 'startDate') : undefined}
                  required
                />
                <FieldError id={formatFieldErrorId(CAMPAIGN_FORM_ID, 'startDate')} message={formErrors.startDate} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  aria-invalid={Boolean(formErrors.endDate)}
                  aria-describedby={formErrors.endDate ? formatFieldErrorId(CAMPAIGN_FORM_ID, 'endDate') : undefined}
                />
                <FieldError id={formatFieldErrorId(CAMPAIGN_FORM_ID, 'endDate')} message={formErrors.endDate} />
              </div>
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
                {editingId ? 'Save Changes' : 'Add Campaign'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function validateCampaignForm(formData: CampaignFormData) {
  const errors: FormErrors<CampaignFormField> = {};
  const parsedCost = parseOptionalNumber(formData.cost);

  if (isBlank(formData.name)) {
    errors.name = 'Campaign name is required';
  }

  if (isBlank(formData.channel)) {
    errors.channel = 'Channel is required';
  }

  if (parsedCost !== undefined && Number.isNaN(parsedCost)) {
    errors.cost = 'Cost must be a number';
  } else if (parsedCost !== undefined && parsedCost < 0) {
    errors.cost = 'Cost cannot be negative';
  }

  if (isBlank(formData.startDate)) {
    errors.startDate = 'Start date is required';
  } else if (Number.isNaN(new Date(formData.startDate).getTime())) {
    errors.startDate = 'Enter a valid start date';
  }

  if (formData.endDate) {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (Number.isNaN(endDate.getTime())) {
      errors.endDate = 'Enter a valid end date';
    } else if (!Number.isNaN(startDate.getTime()) && endDate < startDate) {
      errors.endDate = 'End date cannot be before start date';
    }
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
