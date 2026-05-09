import { ActivityFeed } from '@/components/activity-feed';

export function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Global Activities</h1>
        <p className="mt-1 text-on-surface-variant">
          Full history of calls, notes, and follow-ups across all leads and deals.
        </p>
      </div>

      <ActivityFeed title="All Activity" className="min-h-[600px]" />
    </div>
  );
}
