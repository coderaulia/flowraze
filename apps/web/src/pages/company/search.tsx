import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { get } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Activity, SearchResults } from '@/types';

type SearchSection = 'leads' | 'deals' | 'campaigns' | 'activities';

function resultCount(results: SearchResults | null, section: SearchSection) {
  return results?.[section].length ?? 0;
}

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      if (!q) {
        setResults(null);
        return;
      }
      setIsLoading(true);
      const response = await get<SearchResults>(`/search?q=${encodeURIComponent(q)}`);
      if (response.success && response.data) {
        setResults(response.data);
      }
      setIsLoading(false);
    }
    fetchResults();
  }, [q]);

  if (!q) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
        <p>Type in the search bar to find leads, deals, campaigns, and activities.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Search Results</h1>
        <p className="text-on-surface-variant mt-1">Showing results for "{q}"</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32 text-on-surface-variant">
          Searching...
        </div>
      ) : results ? (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-primary mb-4">Leads ({resultCount(results, 'leads')})</h2>
            {results.leads.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No leads found.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.leads.map(lead => (
                  <Card key={lead.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{lead.fullName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-on-surface-variant mb-2">{lead.companyName}</p>
                      <p className="text-sm">{lead.email}</p>
                      <div className="mt-4"><Badge>{lead.status}</Badge></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-4">Deals ({resultCount(results, 'deals')})</h2>
            {results.deals.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No deals found.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.deals.map(deal => (
                  <Card key={deal.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{deal.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-semibold mb-2">IDR {deal.value?.toLocaleString()}</p>
                      <div className="mt-4"><Badge variant="default">{deal.pipelineStage?.name ?? 'Unknown'}</Badge></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-4">Campaigns ({resultCount(results, 'campaigns')})</h2>
            {results.campaigns.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No campaigns found.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.campaigns.map(campaign => (
                  <Card key={campaign.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{campaign.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-on-surface-variant mb-2">{campaign.channel}</p>
                      <div className="mt-4"><Badge variant="secondary">IDR {campaign.cost?.toLocaleString() || 0}</Badge></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-primary mb-4">Activities ({resultCount(results, 'activities')})</h2>
            {results.activities.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No activities found.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.activities.map((activity: Activity) => (
                  <Card key={activity.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{activity.type.replace('_', ' ')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-on-surface-variant line-clamp-3">{activity.content}</p>
                      <p className="mt-3 text-xs text-on-surface-variant">
                        {activity.creator?.name || 'Unknown user'}
                        {activity.lead ? ` • ${activity.lead.fullName}` : ''}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
