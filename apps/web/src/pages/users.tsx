import { useEffect, useState } from 'react';
import { Plus, Pencil, Shield, Trash2 } from 'lucide-react';
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
import { useAuthStore, type UserRole } from '@/hooks/useAuthStore';
import { get, post, put, del } from '@/lib/api';
import type { User } from '@/types';

const ROLE_COLORS: Record<UserRole, 'default' | 'secondary' | 'warning'> = {
  superadmin: 'warning',
  admin: 'secondary',
  staff: 'default',
};

export function UsersPage() {
  const { user: currentUser, isSuperadmin } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'staff' as UserRole,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!isSuperadmin()) return;
    const response = await get<User[]>('/users');
    if (response.success && response.data) {
      setUsers(response.data);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const response = await put<User>(`/users/${editingUser.id}`, formData);
      if (response.success) {
        fetchUsers();
        closeModal();
      }
    } else {
      const response = await post<User>('/users', formData);
      if (response.success) {
        fetchUsers();
        closeModal();
      }
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

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'staff',
    });
  };

  if (!isSuperadmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">Access Denied</h2>
          <p className="text-on_surface_variant">
            You need superadmin privileges to access this page.
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
          <p className="text-on_surface_variant mt-1">
            Manage team members and their access levels
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="rounded-round-eight bg-surface-container overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-on_surface_variant">
            Loading users...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
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

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-on_surface_variant">
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
