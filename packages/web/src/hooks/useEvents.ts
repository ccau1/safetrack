import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { EventApi } from '@/types';

interface UseEventsResult {
  events: EventApi[];
  activeEvent: EventApi | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createEvent: (title: string, description: string, type: EventApi['type']) => Promise<void>;
  resolveEvent: (eventId: string) => Promise<void>;
}

export function useEvents(orgId: string | null): UseEventsResult {
  const [events, setEvents] = useState<EventApi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<EventApi[]>(`/api/organizations/${orgId}/events`);
      setEvents(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch events'));
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  const createEvent = useCallback(
    async (title: string, description: string, type: EventApi['type']) => {
      if (!orgId) return;
      await api.post(`/api/organizations/${orgId}/events`, {
        title,
        description,
        type,
      });
      await fetchEvents();
    },
    [orgId, fetchEvents]
  );

  const resolveEvent = useCallback(
    async (eventId: string) => {
      await api.patch(`/api/events/${eventId}/resolve`);
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
