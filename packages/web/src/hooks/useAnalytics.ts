import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface AnalyticsFilters {
  teamIds: string[];
  memberIds: string[];
  eventIds: string[];
  from: string | null;
  to: string | null;
}

export interface EventPoint {
  eventId: string;
  eventTitle: string;
  eventType: string;
  startedAt: string;
  totalMembers: number;
  respondedCount: number;
  responseRate: number;
  avgResponseMinutes: number | null;
  p50ResponseMinutes: number | null;
  p90ResponseMinutes: number | null;
  p99ResponseMinutes: number | null;
}

export interface TeamEventPoint {
  eventId: string;
  eventTitle: string;
  startedAt: string;
  totalMembers: number;
  respondedCount: number;
  responseRate: number;
  avgResponseMinutes: number | null;
  p90ResponseMinutes: number | null;
}

export interface TeamPerformance {
  teamId: string;
  teamName: string;
  eventsParticipated: number;
  totalMembersAcrossEvents: number;
  respondedCount: number;
  responseRate: number;
  avgResponseMinutes: number | null;
  p50ResponseMinutes: number | null;
  p90ResponseMinutes: number | null;
  p99ResponseMinutes: number | null;
  slaComplianceRate: number;
  distressRate: number;
  eventPoints: TeamEventPoint[];
}

export interface MemberDistressRecovery {
  eventId: string;
  eventTitle: string;
  startedAt: string;
  memberId: string;
  memberName: string;
  teamName: string;
  distressToSafeMinutes: number | null;
}

export interface OrganizationSla {
  totalEvents: number;
  totalMembersAffected: number;
  overallResponseRate: number;
  overallAvgResponseMinutes: number | null;
  overallP50ResponseMinutes: number | null;
  overallP90ResponseMinutes: number | null;
  overallP99ResponseMinutes: number | null;
  overallSlaComplianceRate: number;
  overallDistressRate: number;
}

export interface EventAnalyticsResponse {
  events: EventPoint[];
  teamPerformances: TeamPerformance[];
  distressRecoveries: MemberDistressRecovery[];
  orgSla: OrganizationSla;
}

function localDatetimeToUtcIso(local: string | null): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function useAnalytics(orgId: string | null, filters: AnalyticsFilters) {
  const [data, setData] = useState<EventAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.teamIds.length) params.set('teamIds', filters.teamIds.join(','));
    if (filters.memberIds.length) params.set('memberIds', filters.memberIds.join(','));
    if (filters.eventIds.length) params.set('eventIds', filters.eventIds.join(','));
    const fromUtc = localDatetimeToUtcIso(filters.from);
    const toUtc = localDatetimeToUtcIso(filters.to);
    if (fromUtc) params.set('from', fromUtc);
    if (toUtc) params.set('to', toUtc);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [filters]);

  const fetchAnalytics = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<EventAnalyticsResponse>(
        `/api/organizations/${orgId}/analytics/events${buildQuery()}`
      );
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
    } finally {
      setIsLoading(false);
    }
  }, [orgId, buildQuery]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, isLoading, error, refetch: fetchAnalytics };
}
