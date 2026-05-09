import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PaginationControls, type PaginationMeta } from '@/components/pagination-controls';
import { ExportControls } from '@/components/export-controls';
import { get } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { TeamPerformance } from '@/types';

const PAGE_LIMIT = 8;

export function TeamPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
  });

  const fetchTeamPerformance = useCallback(async () => {
    setIsLoading(true);
    const response = await get<TeamPerformance[]>(
      `/team/performance?page=${page}&limit=${PAGE_LIMIT}`
    );
    if (response.success && response.data) {
      setTeamPerformance(response.data);
      setPagination(response.pagination ?? { page, limit: PAGE_LIMIT, total: response.data.length });
    }
    setIsLoading(false);
  }, [page]);

  useEffect(() => {
    fetchTeamPerformance();
  }, [fetchTeamPerformance]);

  const handlePageChange = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(nextPage));
    setSearchParams(nextParams);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-on-surface-variant">Loading team performance...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Team Performance</h1>
          <p className="text-on-surface-variant mt-1">
          Track your team's sales performance
        </p>
        </div>
        <ExportControls entity="team-performance" queryParams={searchParams} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {teamPerformance.map((member) => (
          <Card key={member.userId}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-on-surface-variant">
                {member.userName}
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Leads</span>
                <span className="text-sm font-semibold text-primary">
                  {member.leadsAssigned}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Deals Won</span>
                <Badge variant="secondary">{member.dealsWon}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Revenue</span>
                <span className="text-sm font-semibold text-secondary">
                  {formatCurrency(member.revenueClosed)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Activities</span>
                <span className="text-sm text-tertiary">
                  {member.activitiesLogged}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-secondary" />
            Detailed Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Leads Assigned</TableHead>
                <TableHead>Deals Won</TableHead>
                <TableHead>Revenue Closed</TableHead>
                <TableHead>Activities Logged</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamPerformance.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className="font-medium">{member.userName}</TableCell>
                  <TableCell>{member.leadsAssigned}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{member.dealsWon}</Badge>
                  </TableCell>
                  <TableCell className="text-secondary">
                    {formatCurrency(member.revenueClosed)}
                  </TableCell>
                  <TableCell>{member.activitiesLogged}</TableCell>
                </TableRow>
              ))}
              {teamPerformance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-on-surface-variant">
                    No team data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <PaginationControls
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
