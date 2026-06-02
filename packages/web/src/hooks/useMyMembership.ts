import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Member } from '@/types';

interface UseMyMembershipResult {
  member: Member | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useMyMembership(orgId: string | null): UseMyMembershipResult {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMember = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<Member>(`/api/organizations/${orgId}/members/me`);
      setMember(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch membership'));
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  return { member, isLoading, error, refetch: fetchMember };
}
