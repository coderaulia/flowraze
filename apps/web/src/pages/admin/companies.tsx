import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, ChevronRight, Plus, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaginationControls, type PaginationMeta } from '@/components/pagination-controls';
import { FieldError } from '@/components/ui/field-error';
import { get, post, put } from '@/lib/api';
import { hasFormErrors, type FormErrors } from '@/lib/form-validation';
import type { Company } from '@/types';

const PAGE_LIMIT = 15;

type CreateCompanyForm = {
  name: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

function validateCreateForm(data: CreateCompanyForm): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = 'Company name is required';
  if (!data.slug.trim()) errors.slug = 'Slug is required';
  else if (!/^[a-z0-9-]+$/.test(data.slug)) errors.slug = 'Slug: lowercase letters, numbers, hyphens only';
  if (!data.adminName.trim()) errors.adminName = 'Admin name is required';
  if (!data.adminEmail.trim()) errors.adminEmail = 'Admin email is required';
  if (!data.adminPassword || data.adminPassword.length < 8) errors.adminPassword = 'Password must be at least 8 characters';
  return errors;
}

export function AdminCompaniesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: PAGE_LIMIT, total: 0 });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateCompanyForm>({
    name: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
    if (search) params.set('search', search);
    const res = await get<Company[]>(`/admin/companies?${params}`);
    if (res.success && res.data) {
      setCompanies(res.data);
      setPagination(res.pagination ?? { page, limit: PAGE_LIMIT, total: res.data.length });
    } else {
      setError(res.error || 'Failed to load companies');
    }
    setIsLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateCreateForm(formData);
    setFormErrors(errors);
    setFormError('');
    if (hasFormErrors(errors)) return;

    const res = await post<Company>('/admin/companies', formData);
    if (res.success) {
      fetchCompanies();
      closeCreate();
    } else {
      setFormError(res.error || 'Failed to create company');
    }
  };

  const handleToggleActive = async (company: Company) => {
    const res = await put<Company>(`/admin/companies/${company.id}`, {
      isActive: !company.isActive,
    });
    if (res.success) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, isActive: !c.isActive } : c))
      );
    }
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    setFormData({ name: '', slug: '', adminName: '', adminEmail: '', adminPassword: '' });
    setFormErrors({});
    setFormError('');
  };

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Companies</h1>
          <p className="text-on-surface-variant mt-1">All tenant companies on the platform</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Onboard Company
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          className="w-full max-w-sm rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      )}

      <div className="rounded-lg bg-white border border-gray-200 overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-on-surface-variant text-sm">
            Loading companies...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{company.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-on-surface-variant text-sm">{company.slug}</TableCell>
                  <TableCell className="text-sm capitalize">
                    {company.billing?.plan ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">{company._count?.users ?? '—'}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        company.isActive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {company.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        title={company.isActive ? 'Deactivate' : 'Activate'}
                        className="p-1 rounded text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors"
                        onClick={() => handleToggleActive(company)}
                      >
                        {company.isActive ? (
                          <ToggleRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                      <Link
                        to={`/admin/companies/${company.id}`}
                        className="p-1 rounded text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-on-surface-variant py-12">
                    No companies found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        {!isLoading && (
          <PaginationControls pagination={pagination} onPageChange={handlePageChange} />
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Onboard New Company</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{formError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Acme Corp"
              />
              <FieldError message={formErrors.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-slug">Slug</Label>
              <Input
                id="company-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="acme-corp"
              />
              <FieldError message={formErrors.slug} />
            </div>
            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide pt-1">
              First Admin User
            </p>
            <div className="space-y-2">
              <Label htmlFor="admin-name">Name</Label>
              <Input
                id="admin-name"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                placeholder="Jane Smith"
              />
              <FieldError message={formErrors.adminName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                placeholder="jane@acme.com"
              />
              <FieldError message={formErrors.adminEmail} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={formData.adminPassword}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
              />
              <FieldError message={formErrors.adminPassword} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeCreate}>
                Cancel
              </Button>
              <Button type="submit">Create Company</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
