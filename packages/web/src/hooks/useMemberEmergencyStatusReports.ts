import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { MemberEmergencyStatusReportApi, StatusHistoryEntry } from '@/types';

interface UseMemberEmergencyStatusReportsResult {
  reports: MemberEmergencyStatusReportApi[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createReport: (status: MemberEmergencyStatusReportApi['status'], location?: string, note?: string) => Promise<void>;
  getMyHistory: (memberId: string) => StatusHistoryEntry[];
}

export function useMemberEmergencyStatusReports(
  emergencyEventId: string | null,
  memberId: string | null
): UseMemberEmergencyStatusReportsResult {
  const [reports, setReports] = useState<MemberEmergencyStatusReportApi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchReports = useCallback(async () => {
    if (!emergencyEventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<MemberEmergencyStatusReportApi[]>(
        `/api/emergency-events/${emergencyEventId}/member-emergency-status-reports`
      );
      setReports(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch reports'));
    } finally {
      setIsLoading(false);
    }
  }, [emergencyEventId]);

  const createReport = useCallback(
    async (status: MemberEmergencyStatusReportApi['status'], location?: string, note?: string) => {
      if (!emergencyEventId || !memberId) return;
      await api.post(`/api/emergency-events/${emergencyEventId}/member-emergency-status-reports`, {
        status,
        location: location || null,
        note: note || null,
      });
      await fetchReports();
    },
    [emergencyEventId, memberId, fetchReports]
  );

  const getMyHistory = useCallback(
    (myMemberId: string): StatusHistoryEntry[] => {
      const myReports = reports
        .filter((r) => r.memberId === myMemberId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return myReports.map((r) => ({
        status: mapBackendStatusToFrontend(r.status),
        timestamp: formatTimestamp(r.createdAt),
        note: r.note || undefined,
      }));
    },
    [reports]
  );

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, isLoading, error, refetch: fetchReports, createReport, getMyHistory };
}

function mapBackendStatusToFrontend(status: MemberEmergencyStatusReportApi['status']): StatusHistoryEntry['status'] {
  switch (status) {
    case 'SAFE':
      return 'safe';
    case 'NEEDS_HELP':
      return 'distress';
    case 'MISSING':
    case 'EN_ROUTE':
      return 'unknown';
    default:
      return 'unknown';
  }
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
