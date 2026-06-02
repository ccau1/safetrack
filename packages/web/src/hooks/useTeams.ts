import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { TeamApi } from '@/types';

interface UseTeamsResult {
  teams: TeamApi[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTeams(orgId: string | null): UseTeamsResult {
  const [teams, setTeams] = useState<TeamApi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<TeamApi[]>(`/api/organizations/${orgId}/teams`);
      setTeams(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch teams'));
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return { teams, isLoading, error, refetch: fetchTeams };
}
