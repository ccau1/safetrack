import { useMemo } from 'react';
import i18n from '@/i18n';
import { useOrganization } from './useOrganization';
import { useMembers } from './useMembers';
import { useTeams } from './useTeams';
import { useMemberGroups } from './useMemberGroups';
import { useEmergencyEvents } from './useEmergencyEvents';
import { useEmergencyEventMembers } from './useEmergencyEventMembers';
import { useMyMembership } from './useMyMembership';

import type { Employee, Team, EmergencyEvent, Member, ScopedMember } from '@/types';

export function useDashboardData() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const orgId = organization?.id || null;

  const { members, isLoading: membersLoading, refetch: refetchMembers } = useMembers(orgId);
  const { teams, isLoading: teamsLoading, refetch: refetchTeams } = useTeams(orgId);
  const { groups, isLoading: groupsLoading, refetch: refetchGroups } = useMemberGroups(orgId);
  const { events, activeEvent, isLoading: eventsLoading, refetch: refetchEvents, createEvent, resolveEvent } = useEmergencyEvents(orgId);
  const { members: scopedMembers, isLoading: scopedMembersLoading, refetch: refetchScopedMembers } = useEmergencyEventMembers(
    activeEvent?.id || null
  );
  const { member: myMembership } = useMyMembership(orgId);

  const isLoading = orgLoading || membersLoading || teamsLoading || groupsLoading || eventsLoading || scopedMembersLoading;

  // Build a map of memberId -> latest status from scoped members
  const statusMap = useMemo(() => {
    const map = new Map<string, ScopedMember>();
    scopedMembers.forEach((sm) => {
      map.set(sm.memberId, sm);
    });
    return map;
  }, [scopedMembers]);

  // Map backend data to frontend Employee model
  const employees: Employee[] = useMemo(() => {
    if (!members.length) return [];

    return members.map((m) => {
      const scoped = statusMap.get(m.id);
      return mapMemberToEmployee(m, scoped);
    });
  }, [members, statusMap]);

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
      id: hashId(activeEvent.id),
      uuid: activeEvent.id,
      name: activeEvent.title,
      type: activeEvent.type,
      status: activeEvent.status,
      started: formatStartedAt(activeEvent.startedAt),
      description: activeEvent.description || undefined,
      startedAt: activeEvent.startedAt,
      resolvedAt: activeEvent.resolvedAt,
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
    refetchGroups();
    refetchEvents();
    refetchScopedMembers();
  };

  const activeEventCount = events.filter((e) => e.status === 'ACTIVE').length;

  return {
    employees,
    teams: teamList,
    rawTeams: teams,
    groups,
    rawMembers: members,
    event,
    events,
    stats,
    currentUser,
    currentUserId,
    isLoading,
    myMembership,
    activeEvent,
    activeEventCount,
    organization,
    refetch,
    createEvent,
    resolveEvent,
  };
}

function mapMemberToEmployee(member: Member, scoped?: ScopedMember): Employee {
  const status = scoped?.latestStatus ? mapStatus(scoped.latestStatus) : 'unknown';
  return {
    id: hashId(member.id),
    memberId: member.id,
    userId: member.userId,
    name: `${member.firstName} ${member.lastName}`,
    role: member.orgRole,
    team: member.teamName || 'Unassigned',
    status,
    location: scoped?.latestLocation || '-',
    lastUpdated: scoped?.latestReportAt || '-',
    severity: status === 'distress' ? 'medium' : undefined,
    details: undefined,
  };
}

function mapStatus(status: ScopedMember['latestStatus']): Employee['status'] {
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

function formatStartedAt(iso: string): string {
  const date = new Date(iso);
  const locale = i18n.language || 'en';
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: locale.startsWith('en'),
  }).format(date);
}
