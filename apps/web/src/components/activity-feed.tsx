import { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Phone, Calendar, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { get, post } from '@/lib/api';
import type { Activity, ActivityType } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportControls } from '@/components/export-controls';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  leadId?: string;
  className?: string;
  title?: string;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  note: MessageSquare,
  call: Phone,
  follow_up: Calendar,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  note: 'bg-primary/10 text-primary',
  call: 'bg-secondary/10 text-secondary',
  follow_up: 'bg-tertiary/15 text-tertiary',
};

export function ActivityFeed({ leadId, className, title = 'Recent Activity' }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New activity form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newType, setNewType] = useState<ActivityType>('note');
  const [newContent, setNewContent] = useState('');

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    const query = leadId ? `?leadId=${leadId}` : '';
    const response = await get<Activity[]>(`/activities${query}`);
    if (response.success && response.data) {
      setActivities(response.data);
    } else {
      setError(response.error || 'Failed to load activities');
    }
    setIsLoading(false);
  }, [leadId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !newContent.trim()) return;

    setIsSubmitting(true);
    const response = await post<Activity>('/activities', {
      leadId,
      type: newType,
      content: newContent.trim(),
    });

    if (response.success && response.data) {
      setActivities((prev) => [response.data!, ...prev]);
      setNewContent('');
      setNewType('note');
    }
    setIsSubmitting(false);
  };

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>{title}</CardTitle>
        <ExportControls
          entity="activities"
          queryParams={leadId ? new URLSearchParams({ leadId }) : undefined}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 flex-1">
        {leadId && (
          <form onSubmit={handleSubmit} className="space-y-3 pb-4 border-b border-surface-container-high">
            <Select value={newType} onValueChange={(val) => setNewType(val as ActivityType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="What happened?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!newContent.trim() || isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Activity
              </Button>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-on-surface-variant" />
            </div>
          ) : error ? (
            <div className="text-sm text-error">{error}</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant text-sm">
              No recent activity
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type];
                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', ACTIVITY_COLORS[activity.type])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex flex-wrap items-center gap-x-1.5 text-sm">
                        <span className="font-semibold text-on-surface">
                          {activity.creator?.name || 'Unknown user'}
                        </span>
                        <span className="text-on-surface-variant">logged a {activity.type.replace('_', ' ')}</span>
                        {!leadId && activity.lead && (
                          <>
                            <span className="text-on-surface-variant">for</span>
                            <span className="font-medium text-on-surface">{activity.lead.fullName}</span>
                          </>
                        )}
                        <span className="text-xs text-on-surface-variant/70">
                          • {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-on-surface-variant break-words">
                        {activity.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
