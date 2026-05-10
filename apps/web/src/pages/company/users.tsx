import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Pencil, Plus, RefreshCw, Shield, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaginationControls, type PaginationMeta } from '@/components/pagination-controls';
import { useAuthStore, type UserRole } from '@/hooks/useAuthStore';
import { FieldError } from '@/components/ui/field-error';
import { get, post, put, del } from '@/lib/api';
import { hasFormErrors, isValidEmail, type FormErrors } from '@/lib/form-validation';
import type { User } from '@/types';

const PAGE_LIMIT = 10;

const ROLE_COLORS: Record<UserRole, 'default' | 'secondary' | 'warning'> = {
  superadmin: 'warning',
  admin: 'secondary',
  manager: 'default',
  employee: 'default',
};

type UserFormData = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
};

type InviteFormData = {
  email: string;
  name: string;
  role: UserRole;
};

function validateUserForm(data: UserFormData, isEditing: boolean): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!isEditing && !data.password) {
    errors.password = 'Password is required';
  } else if (data.password && data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return errors;
}

function validateInviteForm(data: InviteFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Enter a valid email address';
  }

  return errors;
}

export function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser, isAdmin } = useAuthStore();
  const canManageUsers = isAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteErrors, setInviteErrors] = useState<FormErrors>({});
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteData, setInviteData] = useState<InviteFormData>({
    email: '',
    name: '',
    role: 'employee',
  });

  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'employee' as UserRole,
  });

  const fetchUsers = useCallback(async () => {
    if (!canManageUsers) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const response = await get<User[]>(`/users?page=${page}&limit=${PAGE_LIMIT}`);
    if (response.success && response.data) {
      setUsers(response.data);
      setPagination(response.pagination ?? { page, limit: PAGE_LIMIT, total: response.data.length });
    }
    setIsLoading(false);
  }, [canManageUsers, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateUserForm(formData, Boolean(editingUser));
    setFormErrors(validationErrors);
    setFormError('');

    if (hasFormErrors(validationErrors)) {
      return;
    }

    const payload = {
      ...formData,
      email: formData.email.trim(),
      name: formData.name.trim(),
    };

    if (editingUser) {
      const response = await put<User>(`/users/${editingUser.id}`, payload);
      if (response.success) {
        fetchUsers();
        closeModal();
      } else {
        setFormError(response.error || 'Unable to save user');
      }
    } else {
      const response = await post<User>('/users', payload);
      if (response.success) {
        fetchUsers();
        closeModal();
      } else {
        setFormError(response.error || 'Unable to add user');
      }
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateInviteForm(inviteData);
    setInviteErrors(validationErrors);
    setInviteError('');
    setInviteSuccess('');

    if (hasFormErrors(validationErrors)) {
      return;
    }

    const response = await post<User>('/users/invite', {
      email: inviteData.email.trim(),
      name: inviteData.name.trim(),
      role: inviteData.role,
    });

    if (response.success) {
      setInviteSuccess(`Invitation sent to ${inviteData.email}`);
      fetchUsers();
      setTimeout(() => closeInviteModal(), 1500);
    } else {
      setInviteError(response.error || 'Unable to send invitation');
    }
  };

  const handleResendInvite = async (userId: string) => {
    setResendingId(userId);
    setResendSuccess(null);
    const response = await post<void>(`/users/${userId}/resend-invite`, {});
    setResendingId(null);
    if (response.success) {
      setResendSuccess(userId);
      setTimeout(() => setResendSuccess(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (deletingId && deletingId !== currentUser?.id) {
      const response = await del<void>(`/users/${deletingId}`);
      if (response.success) {
        fetchUsers();
        setIsDeleteModalOpen(false);
        setDeletingId(null);
      }
    }
  };

  const handlePageChange = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(nextPage));
    setSearchParams(nextParams);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
    });
    setFormErrors({});
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ email: '', password: '', name: '', role: 'employee' });
    setFormErrors({});
    setFormError('');
  };

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteData({ email: '', name: '', role: 'employee' });
    setInviteErrors({});
    setInviteError('');
    setInviteSuccess('');
  };

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">Access Denied</h2>
          <p className="text-on-surface-variant">
            You need admin or superadmin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">User Management</h1>
          <p className="text-on-surface-variant mt-1">
            Manage team members and their access levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsInviteModalOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Invite User
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <div className="rounded-lg bg-white border border-gray-200 overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-on-surface-variant">
            Loading users...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
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
                  <TableCell>
                    <Badge variant={ROLE_COLORS[user.role]}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.invitePending ? (
                      <Badge variant="secondary">Invite Pending</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.invitePending && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Resend invite"
                          disabled={resendingId === user.id}
                          onClick={() => handleResendInvite(user.id)}
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${resendSuccess === user.id ? 'text-green-600' : ''} ${resendingId === user.id ? 'animate-spin' : ''}`}
                          />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingId(user.id);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      )}
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

      {/* Invite User Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            {inviteError && (
              <div className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                {inviteSuccess}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="invite-name">Name</Label>
              <Input
                id="invite-name"
                value={inviteData.name}
                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                placeholder="Full name"
              />
              <FieldError message={inviteErrors.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                placeholder="user@example.com"
              />
              <FieldError message={inviteErrors.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteData.role}
                onValueChange={(value) => setInviteData({ ...inviteData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-on-surface-variant">
              An invitation email will be sent. The user sets their own password when they accept.
            </p>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeInviteModal}>
                Cancel
              </Button>
              <Button type="submit">Send Invitation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-error/10 px-3 py-2 text-sm font-medium text-error">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editingUser && '(leave blank to keep current)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required={!editingUser}
              />
              <FieldError message={formErrors.password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as UserRole })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingUser ? 'Save Changes' : 'Add User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-on-surface-variant">
            Are you sure you want to delete this user? This action cannot be undone.
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
