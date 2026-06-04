import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { EmergencyEventUpdateApi } from '@/types';

interface UseEmergencyEventUpdatesResult {
  updates: EmergencyEventUpdateApi[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createUpdate: (text: string, type: EmergencyEventUpdateApi['type']) => Promise<void>;
}

export function useEmergencyEventUpdates(emergencyEventId: string | null): UseEmergencyEventUpdatesResult {
  const [updates, setUpdates] = useState<EmergencyEventUpdateApi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUpdates = useCallback(async () => {
    if (!emergencyEventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<EmergencyEventUpdateApi[]>(`/api/emergency-events/${emergencyEventId}/updates`);
      setUpdates(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch updates'));
    } finally {
      setIsLoading(false);
    }
  }, [emergencyEventId]);

  const createUpdate = useCallback(
    async (text: string, type: EmergencyEventUpdateApi['type']) => {
      if (!emergencyEventId) return;
      await api.post(`/api/emergency-events/${emergencyEventId}/updates`, { text, type });
      await fetchUpdates();
    },
    [emergencyEventId, fetchUpdates]
  );

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  return { updates, isLoading, error, refetch: fetchUpdates, createUpdate };
}
