import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound, MailPlus, Pencil, Plus, Search, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaginationControls, type PaginationMeta } from '@/components/pagination-controls';
import { del, get, post, put } from '@/lib/api';
import type { Company, User, UserRole } from '@/types';

const PAGE_LIMIT = 20;
const COMPANY_USER_ROLES: UserRole[] = ['admin', 'manager', 'employee'];

const ROLE_COLORS: Record<UserRole, 'default' | 'secondary' | 'warning'> = {
  superadmin: 'warning',
  admin: 'secondary',
  manager: 'default',
  employee: 'default',
};

type UserActionResponse = {
  user: User;
  inviteToken?: string;
};

type ResetTokenResponse = {
  resetToken: string;
};

const EMPTY_FORM = {
  name: '',
  email: '',
  role: 'employee' as UserRole,
  companyId: '',
  isActive: true,
};

export function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: PAGE_LIMIT, total: 0 });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
    if (search) params.set('search', search);
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (companyFilter !== 'all') params.set('companyId', companyFilter);
    const res = await get<User[]>(`/admin/users?${params}`);
    if (res.success && res.data) {
      setUsers(res.data);
      setPagination(res.pagination ?? { page, limit: PAGE_LIMIT, total: res.data.length });
    } else {
      setError(res.error || 'Failed to load users');
    }
    setIsLoading(false);
  }, [companyFilter, page, roleFilter, search]);

  const fetchCompanies = useCallback(async () => {
    const res = await get<Company[]>('/admin/companies?limit=100');
    if (res.success && res.data) {
      setCompanies(res.data);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  const resetDialog = () => {
    setIsCreateOpen(false);
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setFormError('');
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId ?? '',
      isActive: user.isActive,
    });
    setFormError('');
  };

  const handleSave = async () => {
    setFormError('');
    setNotice('');
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    if (formData.role !== 'superadmin' && !formData.companyId) {
      setFormError('Select a company for this user.');
      return;
    }

    if (editingUser) {
      const res = await put<User>(`/admin/users/${editingUser.id}`, formData);
      if (res.success && res.data) {
        setUsers((prev) => prev.map((user) => (user.id === res.data?.id ? res.data : user)));
        resetDialog();
      } else {
        setFormError(res.error || 'Failed to update user.');
      }
      return;
    }

    const res = await post<UserActionResponse>('/admin/users', formData);
    if (res.success && res.data) {
      const action = res.data;
      setUsers((prev) => [action.user, ...prev]);
      setNotice(`Invite token for ${action.user.email}: ${action.inviteToken}`);
      resetDialog();
    } else {
      setFormError(res.error || 'Failed to create user.');
    }
  };

  const handleResendInvite = async (user: User) => {
    setNotice('');
    const res = await post<UserActionResponse>(`/admin/users/${user.id}/resend-invite`, {});
    if (res.success && res.data) {
      setUsers((prev) => prev.map((item) => (item.id === user.id ? res.data!.user : item)));
      setNotice(`Invite token for ${res.data.user.email}: ${res.data.inviteToken}`);
    } else {
      setError(res.error || 'Failed to resend invite.');
    }
  };

  const handleResetPassword = async (user: User) => {
    setNotice('');
    const res = await post<ResetTokenResponse>(`/admin/users/${user.id}/reset-password-token`, {});
    if (res.success && res.data) {
      setNotice(`Password reset token for ${user.email}: ${res.data.resetToken}`);
    } else {
      setError(res.error || 'Failed to create reset token.');
    }
  };

  const handleDeactivate = async (user: User) => {
    if (!window.confirm(`Deactivate ${user.email}?`)) return;
    const res = await del<{ deactivated: boolean }>(`/admin/users/${user.id}`);
    if (res.success) {
      setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, isActive: false } : item)));
    } else {
      setError(res.error || 'Failed to deactivate user.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">All Users</h1>
          <p className="text-on-surface-variant mt-1">Cross-company users, roles, invites, and access state</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {(['superadmin', ...COMPANY_USER_ROLES] as UserRole[]).map((role) => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {notice && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 break-all">{notice}</div>
      )}
      {error && (
        <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      )}

      <div className="rounded-lg bg-white border border-gray-200 overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-on-surface-variant text-sm">
            Loading users...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-sm text-on-surface-variant">
                    {user.company && user.companyId ? (
                      <Link to={`/admin/companies/${user.companyId}`} className="text-primary hover:underline">
                        {user.company.name}
                      </Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ROLE_COLORS[user.role]}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {!user.isActive ? (
                      <Badge variant="secondary">Inactive</Badge>
                    ) : user.invitePending ? (
                      <Badge variant="secondary">Invite Pending</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {user.role !== 'superadmin' && (
                        <Button variant="ghost" size="icon" title="Edit user" onClick={() => openEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {user.role !== 'superadmin' && (
                        <Button variant="ghost" size="icon" title="Resend invite" onClick={() => handleResendInvite(user)}>
                          <MailPlus className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" title="Create reset token" onClick={() => handleResetPassword(user)}>
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      {user.isActive && user.role !== 'superadmin' && (
                        <Button variant="ghost" size="icon" title="Deactivate user" onClick={() => handleDeactivate(user)}>
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-on-surface-variant py-12">
                    No users found
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

      <Dialog open={isCreateOpen || !!editingUser} onOpenChange={resetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Invite User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{formError}</div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-user-name">Name</Label>
                <Input id="admin-user-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-user-email">Email</Label>
                <Input id="admin-user-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Company</Label>
                <Select value={formData.companyId} onValueChange={(value) => setFormData({ ...formData, companyId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_USER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editingUser && (
              <label className="flex items-center gap-2 text-sm text-on-surface">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active account
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={resetDialog}>Cancel</Button>
            <Button onClick={handleSave}>{editingUser ? 'Save Changes' : 'Create Invite'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
