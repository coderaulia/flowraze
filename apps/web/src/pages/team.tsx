import { useEffect, useState } from 'react';
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
import { get } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { TeamPerformance } from '@/types';

export function TeamPage() {
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeamPerformance();
  }, []);

  const fetchTeamPerformance = async () => {
    const response = await get<TeamPerformance[]>('/team/performance');
    if (response.success && response.data) {
      setTeamPerformance(response.data);
    }
    setIsLoading(false);
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
      <div>
          <h1 className="text-2xl font-bold text-primary">Team Performance</h1>
          <p className="text-on-surface-variant mt-1">
          Track your team's sales performance
        </p>
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
                <span className="text-xs text-on_surface_variant">Leads</span>
                <span className="text-sm font-semibold text-primary">
                  {member.leadsAssigned}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on_surface_variant">Deals Won</span>
                <Badge variant="secondary">{member.dealsWon}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on_surface_variant">Revenue</span>
                <span className="text-sm font-semibold text-secondary">
                  {formatCurrency(member.revenueClosed)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on_surface_variant">Activities</span>
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
                  <TableCell colSpan={5} className="text-center text-on_surface_variant">
                    No team data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
