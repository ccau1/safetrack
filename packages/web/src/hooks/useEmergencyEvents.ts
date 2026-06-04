import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { EmergencyEventApi } from '@/types';

interface UseEmergencyEventsResult {
  events: EmergencyEventApi[];
  activeEvent: EmergencyEventApi | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createEvent: (title: string, description: string, type: EmergencyEventApi['type'], startedAt: string, targetTeamIds?: string[], targetGroupIds?: string[]) => Promise<void>;
  resolveEvent: (eventId: string, comment?: string) => Promise<void>;
}

export function useEmergencyEvents(orgId: string | null): UseEmergencyEventsResult {
  const [events, setEvents] = useState<EmergencyEventApi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<EmergencyEventApi[]>(`/api/organizations/${orgId}/emergency-events`);
      setEvents(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch events'));
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  const createEvent = useCallback(
    async (title: string, description: string, type: EmergencyEventApi['type'], startedAt: string, targetTeamIds?: string[], targetGroupIds?: string[]) => {
      if (!orgId) return;
      await api.post(`/api/organizations/${orgId}/emergency-events`, {
        title,
        description,
        type,
        startedAt,
        targetTeamIds,
        targetGroupIds,
      });
      await fetchEvents();
    },
    [orgId, fetchEvents]
  );

  const resolveEvent = useCallback(
    async (eventId: string, comment?: string) => {
      await api.patch(`/api/emergency-events/${eventId}/resolve`, { comment: comment || '' });
      await fetchEvents();
    },
    [fetchEvents]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const activeEvent = events.find((e) => e.status === 'ACTIVE') || events[0] || null;

  return { events, activeEvent, isLoading, error, refetch: fetchEvents, createEvent, resolveEvent };
}
