import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Lock, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import type { AuthResponse, ResetPasswordRequest } from '@/types';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { setAuthenticatedUser } = useAuth();

  const [form, setForm] = useState<ResetPasswordRequest>({
    token,
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(t('auth.resetPassword.invalidToken'));
    }
  }, [token, t]);

  const handleChange = (field: keyof ResetPasswordRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      const res = await api.post<AuthResponse>('/api/auth/reset-password', form, { skipAuthRetry: true });
      // The response already set auth cookies; just persist user state.
      setAuthenticatedUser(res.data);
      setSuccess(true);
      setTimeout(() => navigate('/', { replace: true }), 1000);
    } catch (err) {
      let message = t('auth.resetPassword.errorGeneric');
      if (err instanceof ApiError) {
        if (err.code === 'AUTH_INVALID_CREDENTIALS' || err.code === 'AUTH_UNAUTHORIZED') {
          message = t('auth.resetPassword.invalidToken');
        } else if (err.code === 'BAD_REQUEST') {
          message = err.reason || message;
        } else {
          message = err.message || message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo iconSize={28} textClassName="text-xl font-bold text-[#1A1A1A]" />
        </div>

        <div className="bg-white border border-[#E5E4E0] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs text-[#5B7B8A] hover:text-[#4A5548] transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            {t('auth.forgotPassword.backToSignIn')}
          </Link>

          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-1">
            {t('auth.resetPassword.title')}
          </h1>
          <p className="text-sm text-[#8A8A8A] mb-6">
            {t('auth.resetPassword.subtitle')}
          </p>

          {success && (
            <div className="mb-4 p-3 bg-[#ECFDF3] border border-[#A6F4C5] rounded-[10px] text-sm text-[#027A48]">
              {t('auth.resetPassword.success')}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-[10px] text-sm text-[#C44536]">
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Lock size={16} />
                )}
                {t('auth.resetPassword.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
