import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Users, CreditCard, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { FieldError } from '@/components/ui/field-error';
import { get, put } from '@/lib/api';
import type { Company, User } from '@/types';

const ROLE_COLORS = {
  superadmin: 'warning',
  admin: 'secondary',
  manager: 'default',
  employee: 'default',
} as const;

export function AdminCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editError, setEditError] = useState('');
  const [nameError, setNameError] = useState('');
  const [slugError, setSlugError] = useState('');

  const fetchCompany = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const [companyRes, usersRes] = await Promise.all([
      get<Company>(`/admin/companies/${id}`),
      get<User[]>(`/admin/companies/${id}/users`),
    ]);

    if (companyRes.success && companyRes.data) {
      setCompany(companyRes.data);
      setEditName(companyRes.data.name);
      setEditSlug(companyRes.data.slug);
    } else {
      setError(companyRes.error || 'Failed to load company');
    }

    if (usersRes.success && usersRes.data) {
      setUsers(usersRes.data);
    }

    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setSlugError('');
    setEditError('');

    if (!editName.trim()) { setNameError('Name is required'); return; }
    if (!editSlug.trim()) { setSlugError('Slug is required'); return; }
    if (!/^[a-z0-9-]+$/.test(editSlug)) { setSlugError('Lowercase letters, numbers, hyphens only'); return; }

    const res = await put<Company>(`/admin/companies/${id}`, { name: editName, slug: editSlug });
    if (res.success && res.data) {
      setCompany(res.data);
      setIsEditOpen(false);
    } else {
      setEditError(res.error || 'Failed to update company');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-on-surface-variant text-sm">
        Loading...
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="space-y-4">
        <Link to="/admin/companies" className="flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Companies
        </Link>
        <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {error || 'Company not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/companies" className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Companies
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">{company.name}</h1>
            <p className="text-on-surface-variant text-sm">{company.slug}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              company.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {company.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-on-surface-variant">Users</span>
          </div>
          <p className="text-2xl font-bold text-primary">{company._count?.users ?? users.length}</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-on-surface-variant">Plan</span>
          </div>
          <p className="text-2xl font-bold text-primary capitalize">{company.billing?.plan ?? '—'}</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-on-surface-variant">Seats</span>
          </div>
          <p className="text-2xl font-bold text-primary">{company.billing?.seats ?? '—'}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-primary">Company Users</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={ROLE_COLORS[user.role] ?? 'default'}>{user.role}</Badge>
                </TableCell>
                <TableCell>
                  {user.invitePending ? (
                    <Badge variant="secondary">Invite Pending</Badge>
                  ) : (
                    <Badge variant="default">Active</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-on-surface-variant py-8">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            {editError && (
              <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{editError}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Company Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <FieldError message={nameError} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value.toLowerCase())}
              />
              <FieldError message={slugError} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
