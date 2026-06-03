import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Invitation, CreateInvitationRequest, BatchInvitationResponse, InvitationValidationResponse, AcceptInvitationRequest } from '@/types';

interface UseInvitationsResult {
  invitations: Invitation[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createInvitation: (request: CreateInvitationRequest) => Promise<void>;
  batchInvite: (file: File) => Promise<BatchInvitationResponse>;
  cancelInvitation: (id: string) => Promise<void>;
  resendInvitation: (id: string) => Promise<void>;
}

export function useInvitations(orgId: string | null): UseInvitationsResult {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<Invitation[]>(`/api/organizations/${orgId}/invitations`);
      setInvitations(res.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch invitations'));
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  const createInvitation = async (request: CreateInvitationRequest) => {
    if (!orgId) throw new Error('No organization selected');
    await api.post(`/api/organizations/${orgId}/invitations`, request);
    await fetchInvitations();
  };

  const batchInvite = async (file: File): Promise<BatchInvitationResponse> => {
    if (!orgId) throw new Error('No organization selected');
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<BatchInvitationResponse>(`/api/organizations/${orgId}/invitations/batch`, formData, {
      skipOfflineQueue: true,
    });
    await fetchInvitations();
    return res.data;
  };

  const cancelInvitation = async (id: string) => {
    await api.delete(`/api/invitations/${id}`);
    await fetchInvitations();
  };

  const resendInvitation = async (id: string) => {
    await api.post(`/api/invitations/${id}/resend`);
    await fetchInvitations();
  };

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return { invitations, isLoading, error, refetch: fetchInvitations, createInvitation, batchInvite, cancelInvitation, resendInvitation };
}

interface UseValidateInviteResult {
  data: InvitationValidationResponse | null;
  isLoading: boolean;
  error: Error | null;
}

export function useValidateInviteToken(token: string | null): UseValidateInviteResult {
  const [data, setData] = useState<InvitationValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    api.get<InvitationValidationResponse>(`/api/invitations/validate?token=${encodeURIComponent(token)}`, { skipAuth: true })
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err : new Error('Invalid or expired invitation')))
      .finally(() => setIsLoading(false));
  }, [token]);

  return { data, isLoading, error };
}

interface UseAcceptInviteResult {
  accept: (request: AcceptInvitationRequest) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useAcceptInvite(): UseAcceptInviteResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const accept = async (request: AcceptInvitationRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/api/invitations/accept', request, { skipAuth: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(err instanceof Error ? err : new Error(message));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { accept, isLoading, error };
}
