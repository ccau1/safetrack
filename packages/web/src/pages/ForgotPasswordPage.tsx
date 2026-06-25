import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { api, ApiError } from '@/lib/api';
import { Logo } from '@/components/Logo';

interface ForgotPasswordResponse {
  status: string;
  message: string;
}

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await api.post<ForgotPasswordResponse>('/api/auth/forgot-password', { email });
      setResult(res.data);
    } catch (err) {
      let message = t('auth.forgotPassword.errorGeneric');
      if (err instanceof ApiError) {
        message = err.message || message;
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
            {t('auth.forgotPassword.title')}
          </h1>
          <p className="text-sm text-[#8A8A8A] mb-6">
            {t('auth.forgotPassword.subtitle')}
          </p>

          {result?.status === 'EMAIL_SENT' && (
            <div className="mb-4 p-3 bg-[#ECFDF3] border border-[#A6F4C5] rounded-[10px] text-sm text-[#027A48]">
              {t('auth.forgotPassword.emailSent')}
            </div>
          )}

          {result?.status === 'SSO_ONLY' && (
            <div className="mb-4 p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-[10px] text-sm text-[#C44536]">
              {t('auth.ssoOnlyAccount')}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-[10px] text-sm text-[#C44536]">
              {error}
            </div>
          )}

          {!result && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                  placeholder="you@company.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mail size={16} />
                )}
                {t('auth.forgotPassword.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
