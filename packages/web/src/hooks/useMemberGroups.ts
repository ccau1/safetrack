import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { MemberGroup } from '@/types';

interface UseMemberGroupsResult {
  groups: MemberGroup[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useMemberGroups(orgId: string | null): UseMemberGroupsResult {
  const [groups, setGroups] = useState<MemberGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<MemberGroup[]>(`/api/organizations/${orgId}/member-groups`);
      setGroups(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch groups'));
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { groups, isLoading, error, refetch: fetchGroups };
}
