import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ChangePasswordRequest } from '@/types';

function PasswordTab({ addToast }: { addToast: (message: string, type: 'success' | 'error' | 'info') => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ChangePasswordRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.newPassword.length < 8) {
      setError(t('settings.password.errorMinLength'));
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError(t('settings.password.errorMismatch'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/change-password', form);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess(true);
      addToast(t('settings.password.success'), 'success');
    } catch (err) {
      let message = t('settings.password.errorGeneric');
      if (err instanceof ApiError) {
        if (err.code === 'AUTH_INVALID_CREDENTIALS') {
          message = t('settings.password.errorCurrentPassword');
        } else if (err.code === 'BAD_REQUEST') {
          message = err.reason || message;
        } else {
          message = err.message || message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
          {t('settings.password.currentPassword')}
        </label>
        <input
          type="password"
          required
          value={form.currentPassword}
          onChange={(e) => handleChange('currentPassword', e.target.value)}
          className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
          {t('settings.password.newPassword')}
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={form.newPassword}
          onChange={(e) => handleChange('newPassword', e.target.value)}
          className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
          {t('settings.password.confirmPassword')}
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={form.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
        />
      </div>

      {error && (
        <div className="p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-[10px] text-sm text-[#C44536]">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-[#ECFDF3] border border-[#A6F4C5] rounded-[10px] text-sm text-[#027A48]">
          {t('settings.password.success')}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="h-10 px-4 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <KeyRound size={16} />
        )}
        {t('settings.password.submit')}
      </button>
    </form>
  );
}

interface SettingsPageProps {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function SettingsPage({ addToast }: SettingsPageProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">{t('settings.title')}</h1>
        <p className="text-sm text-[#8A8A8A] mt-1">{t('settings.subtitle')}</p>
      </div>

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] p-1">
          <TabsTrigger
            value="password"
            className="data-[state=active]:bg-white data-[state=active]:text-[#4A5548] data-[state=active]:shadow-sm text-sm font-medium text-[#5C5C5C] px-4 py-2 rounded-[8px] transition-all"
          >
            {t('settings.tabs.password')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password" className="mt-6">
          <div className="bg-white border border-[#E5E4E0] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-base font-semibold text-[#1A1A1A] mb-1">
              {t('settings.password.title')}
            </h2>
            <p className="text-sm text-[#8A8A8A] mb-6">{t('settings.password.subtitle')}</p>
            <PasswordTab addToast={addToast} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
