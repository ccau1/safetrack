import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { EmergencyEventApi } from '@/types';

interface UseEmergencyEventResult {
  event: EmergencyEventApi | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useEmergencyEvent(eventId: string | null): UseEmergencyEventResult {
  const [event, setEvent] = useState<EmergencyEventApi | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<EmergencyEventApi>(`/api/emergency-events/${eventId}`);
      setEvent(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch event'));
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, isLoading, error, refetch: fetchEvent };
}
