import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Organization } from '@/types';

interface UseOrganizationResult {
  organization: Organization | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useOrganization(): UseOrganizationResult {
  const { selectedOrganization, selectOrganization } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrgs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<Organization[]>('/api/organizations');
      const fetched = res.data;
      if (fetched.length === 0) {
        selectOrganization(null);
        setOrganization(null);
        return;
      }
      const stillMember = selectedOrganization
        ? fetched.find((o) => o.id === selectedOrganization.id)
        : null;
      if (!stillMember) {
        selectOrganization(fetched[0].id);
        setOrganization(fetched[0]);
      } else {
        setOrganization(stillMember);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch organizations'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrganization, selectOrganization]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  return { organization, isLoading, error, refetch: fetchOrgs };
}
