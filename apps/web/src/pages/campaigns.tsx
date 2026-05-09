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
import { ExportControls } from '@/components/export-controls';
import { FieldError } from '@/components/ui/field-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { get, post, put } from '@/lib/api';
import {
  hasFormErrors,
  isNonNegativeNumber,
  isValidDateValue,
  type FormErrors,
} from '@/lib/form-validation';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Campaign } from '@/types';

const PAGE_LIMIT = 10;

const CHANNEL_COLORS: Record<string, 'default' | 'secondary' | 'warning'> = {
  email: 'default',
  social: 'secondary',
  paid: 'warning',
  organic: 'default',
};

type CampaignFormData = {
  name: string;
  type: string;
  channel: string;
  cost: number;
  startDate: string;
  endDate: string;
  ownerId: string;
  salesOwnerId: string;
};

function validateCampaignForm(data: CampaignFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Campaign name is required';
  }

  if (!data.channel.trim()) {
    errors.channel = 'Channel is required';
  }

  if (!isNonNegativeNumber(data.cost)) {
    errors.cost = 'Cost cannot be negative';
  }

  if (!isValidDateValue(data.startDate)) {
    errors.startDate = 'Start date is required';
  }

  if (data.endDate && !isValidDateValue(data.endDate)) {
    errors.endDate = 'Enter a valid end date';
  } else if (
    data.endDate &&
    data.startDate &&
    new Date(data.endDate).getTime() < new Date(data.startDate).getTime()
  ) {
    errors.endDate = 'End date cannot be before start date';
  }

  return errors;
}

export function CampaignsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const search = searchParams.get('search') ?? '';
  const channelFilter = searchParams.get('channel') ?? '';
  const startFrom = searchParams.get('startFrom') ?? '';
  const startTo = searchParams.get('startTo') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    type: '',
    channel: '',
    cost: 0,
    startDate: '',
    endDate: '',
    ownerId: '',
    salesOwnerId: '',
  });

  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      const response = await get<{ id: string; name: string; email: string }[]>('/users/lookup');
      if (response.success && response.data) {
        setUsers(response.data);
      }
    }
    fetchUsers();
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) {
      params.set('search', search);
    }
    if (channelFilter) {
      params.set('channel', channelFilter);
    }
    if (startFrom) {
      params.set('startFrom', startFrom);
    }
    if (startTo) {
      params.set('startTo', startTo);
    }
    params.set('page', String(page));
    params.set('limit', String(PAGE_LIMIT));

    const response = await get<Campaign[]>(`/campaigns?${params.toString()}`);
    if (response.success && response.data) {
      setCampaigns(response.data);
      setPagination(response.pagination ?? { page, limit: PAGE_LIMIT, total: response.data.length });
    }
    setIsLoading(false);
  }, [channelFilter, page, search, startFrom, startTo]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateCampaignForm(formData);
    setFormErrors(validationErrors);
    setFormError('');

    if (hasFormErrors(validationErrors)) {
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      type: formData.type.trim(),
      channel: formData.channel.trim(),
      cost: Number(formData.cost) || undefined,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      ownerId: (formData.ownerId && formData.ownerId !== 'none') ? formData.ownerId : undefined,
      salesOwnerId: (formData.salesOwnerId && formData.salesOwnerId !== 'none') ? formData.salesOwnerId : undefined,
    };

    if (editingId) {
      const response = await put<Campaign>(`/campaigns/${editingId}`, payload);
      if (response.success) {
        fetchCampaigns();
        closeModal();
      } else {
        setFormError(response.error || 'Unable to save campaign');
      }
    } else {
      const response = await post<Campaign>('/campaigns', payload);
      if (response.success) {
        fetchCampaigns();
        closeModal();
      } else {
        setFormError(response.error || 'Unable to add campaign');
      }
    }
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setFormData({
      name: campaign.name,
      type: campaign.type || '',
      channel: campaign.channel,
      cost: campaign.cost || 0,
      startDate: new Date(campaign.startDate).toISOString().split('T')[0],
      endDate: campaign.endDate
        ? new Date(campaign.endDate).toISOString().split('T')[0]
        : '',
      ownerId: campaign.ownerId || '',
      salesOwnerId: campaign.salesOwnerId || '',
    });
    setFormErrors({});
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      type: '',
      channel: '',
      cost: 0,
      startDate: '',
      endDate: '',
      ownerId: '',
      salesOwnerId: '',
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

    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
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
          <h1 className="text-2xl font-bold text-primary">Campaigns</h1>
          <p className="text-on-surface-variant mt-1">
            Track your marketing campaigns and their performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportControls entity="campaigns" queryParams={searchParams} />
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Campaign
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Input
          placeholder="Channel"
          value={channelFilter}
          onChange={(e) => handleFilterChange('channel', e.target.value)}
        />
        <Input
          type="date"
          value={startFrom}
          onChange={(e) => handleFilterChange('startFrom', e.target.value)}
        />
        <Input
          type="date"
          value={startTo}
          onChange={(e) => handleFilterChange('startTo', e.target.value)}
        />
      </div>

      <div className="rounded-lg bg-white border border-gray-200 overflow-x-auto">
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
                <TableHead>Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Owner (PM)</TableHead>
                <TableHead>Sales Owner</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{campaign.type || '-'}</TableCell>
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
                  <TableCell>{campaign.owner?.name || '-'}</TableCell>
                  <TableCell>{campaign.salesOwner?.name || '-'}</TableCell>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Campaign' : 'Add New Campaign'}
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
                <Label htmlFor="name">Campaign / Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
                <FieldError message={formErrors.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  placeholder="e.g., Marketing, Internal Project"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ownerId">Owner</Label>
                <Select
                  value={formData.ownerId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ownerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign a PM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesOwnerId">Sales Owner</Label>
                <Select
                  value={formData.salesOwnerId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, salesOwnerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign a Sales Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  required
                />
                <FieldError message={formErrors.channel} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (IDR)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: Number(e.target.value) })
                  }
                />
                <FieldError message={formErrors.cost} />
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
                  required
                />
                <FieldError message={formErrors.startDate} />
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
                />
                <FieldError message={formErrors.endDate} />
              </div>
            </div>

            <DialogFooter>
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
