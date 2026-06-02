import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { UserContact } from '@/types';

interface UseContactsResult {
  contact: UserContact | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateContact: (data: Partial<Omit<UserContact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
}

export function useContacts(): UseContactsResult {
  const [contact, setContact] = useState<UserContact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchContact = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<UserContact>('/api/users/me/contacts');
      setContact(res.data);
    } catch (err) {
      // 404 means no contact record yet — that's okay
      if (err instanceof Error && err.message.includes('404')) {
        setContact(null);
      } else {
        setError(err instanceof Error ? err : new Error('Failed to fetch contacts'));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateContact = useCallback(
    async (data: Partial<Omit<UserContact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
      const res = await api.put<UserContact>('/api/users/me/contacts', data);
      setContact(res.data);
    },
    []
  );

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  return { contact, isLoading, error, refetch: fetchContact, updateContact };
}
