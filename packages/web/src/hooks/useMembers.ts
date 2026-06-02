import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Member } from '@/types';

interface UseMembersResult {
  members: Member[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useMembers(orgId: string | null): UseMembersResult {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<Member[]>(`/api/organizations/${orgId}/members`);
      setMembers(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch members'));
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, isLoading, error, refetch: fetchMembers };
}
