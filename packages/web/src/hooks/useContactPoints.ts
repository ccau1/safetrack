import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ContactPoint, CreateContactPointRequest } from '@/types';

interface UseContactPointsResult {
  contactPoints: ContactPoint[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  addContactPoint: (data: CreateContactPointRequest) => Promise<ContactPoint>;
  deleteContactPoint: (id: string) => Promise<void>;
  verifyContactPoint: (id: string) => Promise<void>;
  resendVerification: (id: string) => Promise<void>;
  confirmVerification: (id: string, code: string) => Promise<ContactPoint>;
  reorderContactPoints: (orderedIds: string[]) => Promise<void>;
}

function getDefaultMethod(type: ContactPoint['type']): string {
  switch (type) {
    case 'EMAIL':
      return 'EMAIL_CODE';
    case 'WHATSAPP':
      return 'WHATSAPP_CODE';
    case 'PHONE':
    case 'SMS':
    default:
      return 'SMS_CODE';
  }
}

export function useContactPoints(): UseContactPointsResult {
  const [contactPoints, setContactPoints] = useState<ContactPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchContactPoints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ContactPoint[]>('/api/users/me/contact-points');
      setContactPoints(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch contact points'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addContactPoint = useCallback(
    async (data: CreateContactPointRequest) => {
      const res = await api.post<ContactPoint>('/api/users/me/contact-points', data);
      setContactPoints((prev) => [...prev, res.data]);
      return res.data;
    },
    []
  );

  const deleteContactPoint = useCallback(async (id: string) => {
    await api.delete<void>(`/api/users/me/contact-points/${id}`);
    setContactPoints((prev) => prev.filter((cp) => cp.id !== id));
  }, []);

  const verifyContactPoint = useCallback(async (id: string) => {
    const cp = contactPoints.find((c) => c.id === id);
    const method = cp ? getDefaultMethod(cp.type) : 'SMS_CODE';
    await api.post<void>(`/api/users/me/contact-points/${id}/verify`, { method });
  }, [contactPoints]);

  const resendVerification = useCallback(async (id: string) => {
    const cp = contactPoints.find((c) => c.id === id);
    const method = cp ? getDefaultMethod(cp.type) : 'SMS_CODE';
    await api.post<void>(`/api/users/me/contact-points/${id}/verify/resend`, { method });
  }, [contactPoints]);

  const confirmVerification = useCallback(async (id: string, code: string) => {
    const res = await api.post<ContactPoint>('/api/contact-points/verify/confirm', {
      contactPointId: id,
      code,
    });
    setContactPoints((prev) => prev.map((cp) => (cp.id === id ? res.data : cp)));
    return res.data;
  }, []);

  const reorderContactPoints = useCallback(async (orderedIds: string[]) => {
    await api.post<void>('/api/users/me/contact-points/reorder', {
      contactPointIds: orderedIds,
    });
    // Optimistically reorder local state to match
    setContactPoints((prev) => {
      const map = new Map(prev.map((cp) => [cp.id, cp]));
      return orderedIds
        .map((id) => map.get(id))
        .filter((cp): cp is ContactPoint => cp !== undefined)
        .map((cp, index) => ({ ...cp, priority: index }));
    });
  }, []);

  useEffect(() => {
    fetchContactPoints();
  }, [fetchContactPoints]);

  return {
    contactPoints,
    isLoading,
    error,
    refetch: fetchContactPoints,
    addContactPoint,
    deleteContactPoint,
    verifyContactPoint,
    resendVerification,
    confirmVerification,
    reorderContactPoints,
  };
}
