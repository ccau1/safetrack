import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2, LogOut, Loader2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { OrganizationResponse } from '@/types';

export function NoOrganizationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout, reloadUser } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setError(null);
    setIsCreating(true);
    try {
      await api.post<OrganizationResponse>('/api/organizations', { name: orgName.trim() });
      await reloadUser();
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create organization';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#4A5548]/10 flex items-center justify-center mx-auto mb-6">
            <Building2 size={32} className="text-[#4A5548]" />
          </div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">
            {t('noOrg.title', 'No Organization')}
          </h1>
          <p className="text-sm text-[#8A8A8A] leading-relaxed">
            {t(
              'noOrg.description',
              "You're not a member of any organization. Create one below, ask an admin to invite you, or sign in with a different account."
            )}
          </p>
        </div>

        <div className="bg-white border border-[#E5E4E0] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-6">
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">
            {t('noOrg.createOrg', 'Create Organization')}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-[10px] text-sm text-[#C44536]">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                {t('noOrg.orgName', 'Organization Name')}
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                placeholder={t('noOrg.orgNamePlaceholder', 'Acme Corp')}
              />
            </div>
            <button
              type="submit"
              disabled={isCreating || !orgName.trim()}
              className="w-full h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Plus size={16} />
                  {t('noOrg.createButton', 'Create Organization')}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium text-[#1A1A1A] border border-[#E5E4E0] rounded-[10px] hover:bg-[#F7F6F2] transition-colors duration-150"
          >
            <LogOut size={16} />
            {t('auth.signOut', 'Sign Out')}
          </button>
        </div>
      </div>
    </div>
  );
}
