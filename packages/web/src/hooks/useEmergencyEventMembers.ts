import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ScopedMember } from '@/types';

interface UseEmergencyEventMembersResult {
  members: ScopedMember[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useEmergencyEventMembers(eventId: string | null): UseEmergencyEventMembersResult {
  const [members, setMembers] = useState<ScopedMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ScopedMember[]>(`/api/emergency-events/${eventId}/members`);
      setMembers(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch scoped members'));
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, isLoading, error, refetch: fetchMembers };
}
