import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Settings</h1>
        <p className="text-on_surface_variant mt-1">
          Manage your account settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
          </div>
          <Button>Save Changes</Button>
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
          <p className="text-on_surface_variant text-sm">
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
