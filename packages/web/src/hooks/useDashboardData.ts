import { useMemo } from 'react';
import { useOrganization } from './useOrganization';
import { useMembers } from './useMembers';
import { useTeams } from './useTeams';
import { useEvents } from './useEvents';
import { useStatusReports } from './useStatusReports';
import { useMyMembership } from './useMyMembership';
import type { Employee, Team, EmergencyEvent, Member, StatusReportApi } from '@/types';

export function useDashboardData() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const orgId = organization?.id || null;

  const { members, isLoading: membersLoading, refetch: refetchMembers } = useMembers(orgId);
  const { teams, isLoading: teamsLoading, refetch: refetchTeams } = useTeams(orgId);
  const { activeEvent, isLoading: eventsLoading, refetch: refetchEvents } = useEvents(orgId);
  const { reports, isLoading: reportsLoading, refetch: refetchReports } = useStatusReports(
    activeEvent?.id || null,
    null
  );
  const { member: myMembership } = useMyMembership(orgId);

  const isLoading = orgLoading || membersLoading || teamsLoading || eventsLoading || reportsLoading;

  // Map backend data to frontend Employee model
  const employees: Employee[] = useMemo(() => {
    if (!members.length) return [];

    // Build a map of memberId -> latest report
    const latestReportMap = new Map<string, StatusReportApi>();
    reports.forEach((report) => {
      const existing = latestReportMap.get(report.memberId);
      if (!existing || new Date(report.createdAt) > new Date(existing.createdAt)) {
        latestReportMap.set(report.memberId, report);
      }
    });

    return members.map((m) => mapMemberToEmployee(m, latestReportMap.get(m.id)));
  }, [members, reports]);

  const teamList: Team[] = useMemo(() => {
    // Count members per team
    const counts = new Map<string, number>();
    members.forEach((m) => {
      const team = m.teamName || 'Unassigned';
      counts.set(team, (counts.get(team) || 0) + 1);
    });

    // Include teams from API even if empty
    const result: Team[] = [];
    teams.forEach((t) => {
      result.push({ name: t.name, memberCount: counts.get(t.name) || 0 });
      counts.delete(t.name);
    });
    // Add any teams that only exist via member assignments
    counts.forEach((count, name) => {
      result.push({ name, memberCount: count });
    });

    return result;
  }, [teams, members]);

  const event: EmergencyEvent | null = useMemo(() => {
    if (!activeEvent) return null;
    return {
      id: 1, // Frontend uses number IDs
      name: activeEvent.title,
      type: activeEvent.type,
      status: activeEvent.status,
      started: formatStartedAt(activeEvent.startedAt),
    };
  }, [activeEvent]);

  const stats = useMemo(() => {
    const safe = employees.filter((e) => e.status === 'safe').length;
    const distress = employees.filter((e) => e.status === 'distress').length;
    const unknown = employees.filter((e) => e.status === 'unknown').length;
    return { total: employees.length, safe, distress, unknown };
  }, [employees]);

  const currentUser = employees.find((e) => {
    const member = members.find((m) => m.userId === myMembership?.userId);
    return member && e.id === hashId(member.id);
  }) || employees[0] || null;

  const currentUserId = currentUser?.id || 0;

  const refetch = () => {
    refetchMembers();
    refetchTeams();
    refetchEvents();
    refetchReports();
  };

  return {
    employees,
    teams: teamList,
    rawTeams: teams,
    rawMembers: members,
    event,
    stats,
    currentUser,
    currentUserId,
    isLoading,
    myMembership,
    organization,
    activeEvent,
    refetch,
  };
}

function mapMemberToEmployee(member: Member, report?: StatusReportApi): Employee {
  const status = report ? mapStatus(report.status) : 'unknown';
  return {
    id: hashId(member.id),
    memberId: member.id,
    name: `${member.firstName} ${member.lastName}`,
    role: member.orgRole,
    team: member.teamName || 'Unassigned',
    status,
    location: report?.location || '-',
    lastUpdated: report ? formatRelativeTime(report.createdAt) : '-',
    severity: status === 'distress' ? 'medium' : undefined,
    details: report?.note || undefined,
  };
}

function mapStatus(status: StatusReportApi['status']): Employee['status'] {
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

function hashId(uuid: string): number {
  // Simple hash to convert UUID to a stable number for frontend compatibility
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffMs / 86400000);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function formatStartedAt(iso: string): string {
  return formatRelativeTime(iso);
}
