import { Building2, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';

export function NoOrganizationPage() {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-[#4A5548]/10 flex items-center justify-center mx-auto mb-6">
          <Building2 size={32} className="text-[#4A5548]" />
        </div>
        <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          {t('noOrg.title', 'No Organization')}
        </h1>
        <p className="text-sm text-[#8A8A8A] mb-6 leading-relaxed">
          {t(
            'noOrg.description',
            "You're not a member of any organization. Ask an organization admin to send you an invitation, or sign in with a different account."
          )}
        </p>
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium text-[#1A1A1A] border border-[#E5E4E0] rounded-[10px] hover:bg-[#F7F6F2] transition-colors duration-150"
        >
          <LogOut size={16} />
          {t('auth.signOut', 'Sign Out')}
        </button>
      </div>
    </div>
  );
}
