import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/hooks/useAuthStore';
import { put } from '@/lib/api';

export function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    const payload: Record<string, string> = {};
    if (name.trim() && name !== user?.name) payload.name = name.trim();
    if (password) payload.password = password;

    if (Object.keys(payload).length === 0) {
      setMessage({ type: 'info', text: 'No changes to save.' });
      setIsLoading(false);
      return;
    }

    const response = await put<{ name: string; email: string }>('/users/me', payload);

    if (response.success && response.data) {
      updateUser({ name: response.data.name });
      setPassword('');
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } else {
      setMessage({ type: 'error', text: response.error || 'Failed to update profile.' });
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Settings</h1>
          <p className="text-on-surface-variant mt-1">
          Manage your account settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {message.text && (
              <div className={`rounded-lg px-3 py-2 text-sm font-medium ${
                message.type === 'error' ? 'bg-error/10 text-error' :
                message.type === 'success' ? 'bg-secondary/10 text-secondary' :
                'bg-blue-100 text-blue-800'
              }`}>
                {message.text}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  placeholder="Your name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Cannot be changed)</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password (leave blank to keep current)</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="New password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-on-surface-variant text-sm">
            Notification settings coming soon...
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-on_surface_variant text-sm">
            Billing settings coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
