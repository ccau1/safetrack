import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import type { LoginRequest, RegisterRequest } from '@/types';
import { Logo } from '@/components/Logo';

function getAuthErrorMessage(err: unknown, t: (key: string) => string): string {
  if (err instanceof ApiError) {
    if (err.code === 'AUTH_INVALID_CREDENTIALS') {
      if (err.reason === 'Account is deactivated') {
        return t('auth.accountDeactivated');
      }
      if (err.reason === 'Please use SSO login for this account') {
        return t('auth.ssoOnlyAccount');
      }
      return t('auth.invalidCredentials');
    }
    if (err.code === 'AUTH_UNAUTHORIZED') {
      return t('auth.invalidCredentials');
    }
  }
  return t('auth.authFailed');
}

function setPostAuthRedirectCookie(url: string) {
  document.cookie = `post_auth_redirect=${encodeURIComponent(url)}; path=/; max-age=300; SameSite=Lax`;
}

function getOAuthUrl(provider: string) {
  return `${import.meta.env.VITE_API_BASE_URL || ''}/oauth2/authorization/${provider}`;
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, isLoading } = useAuth();
  const inviteToken = searchParams.get('inviteToken');
  const redirect = searchParams.get('redirect');
  const prefillEmail = searchParams.get('email');
  const modeParam = searchParams.get('mode');
  const [isRegister, setIsRegister] = useState(() => modeParam === 'register');
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: prefillEmail || '',
    password: '',
    firstName: '',
    lastName: '',
    organizationName: '',
  });

  useEffect(() => {
    if (prefillEmail) {
      setForm((prev) => ({ ...prev, email: prefillEmail }));
    }
  }, [prefillEmail]);

  const reason = searchParams.get('reason');

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isRegister) {
        const data: RegisterRequest = {
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          organizationName: inviteToken ? undefined : (form.organizationName || undefined),
          inviteToken: inviteToken || undefined,
        };
        await register(data);
      } else {
        const data: LoginRequest = {
          email: form.email,
          password: form.password,
        };
        await login(data);
      }

      if (redirect) {
        navigate(redirect, { replace: true });
      } else if (inviteToken) {
        navigate(`/accept-invite?token=${encodeURIComponent(inviteToken)}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, t));
    }
  };

  const handleSsoLogin = (provider: string) => {
    if (redirect) {
      setPostAuthRedirectCookie(redirect);
    } else if (inviteToken) {
      setPostAuthRedirectCookie(`/accept-invite?token=${encodeURIComponent(inviteToken)}`);
    }
    window.location.href = getOAuthUrl(provider);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo iconSize={28} textClassName="text-xl font-bold text-[#1A1A1A]" />
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E4E0] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-1">
            {isRegister ? t('auth.createAccount') : t('auth.signIn')}
          </h1>
          <p className="text-sm text-[#8A8A8A] mb-6">
            {isRegister
              ? t('auth.registerSubtitle')
              : t('auth.signInSubtitle')}
          </p>

          {reason === 'session_expired' && (
            <div className="mb-4 p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-[10px] text-sm text-[#C44536]">
              {t('auth.sessionExpired')}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-[10px] text-sm text-[#C44536]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                      {t('auth.firstName')}
                    </label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                      {t('auth.lastName')}
                    </label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                {!inviteToken && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                      {t('auth.organizationName')}
                    </label>
                    <input
                      type="text"
                      value={form.organizationName}
                      onChange={(e) => handleChange('organizationName', e.target.value)}
                      className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                      placeholder="Acme Corp"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                {t('auth.email')}
              </label>
              <input
                type="email"
                required
                disabled={!!prefillEmail}
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150 disabled:bg-[#F7F6F2] disabled:text-[#8A8A8A]"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                {t('auth.password')}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isRegister ? (
                t('auth.createAccount')
              ) : (
                t('auth.signIn')
              )}
            </button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E4E0]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-[#8A8A8A]">or</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled
                onClick={() => handleSsoLogin('google')}
                className="flex items-center justify-center gap-2 h-9 border border-[#E5E4E0] rounded-[10px] text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F6F2] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button
                type="button"
                disabled
                onClick={() => handleSsoLogin('azure')}
                className="flex items-center justify-center gap-2 h-9 border border-[#E5E4E0] rounded-[10px] text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F6F2] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 23 23" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                Microsoft
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-sm text-[#5B7B8A] hover:text-[#4A5548] transition-colors duration-150"
            >
              {isRegister
                ? t('auth.alreadyHaveAccount')
                : t('auth.dontHaveAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
