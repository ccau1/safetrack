import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Loader2, Mail, CheckCircle, Lock, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useValidateInviteToken, useAcceptInvite } from '@/hooks/useInvitations';
import { Logo } from '@/components/Logo';

export function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { reloadUser } = useAuth();
  const { data, isLoading: validating, error: validateError } = useValidateInviteToken(token);
  const { accept, isLoading: accepting, error: acceptError } = useAcceptInvite();

  const [accepted, setAccepted] = useState(false);
  const [regForm, setRegForm] = useState({ password: '', firstName: '', lastName: '' });

  const handleAccept = async () => {
    if (!token) return;
    try {
      await accept({ token });
      setAccepted(true);
      await reloadUser();
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch {
      // error handled by hook
    }
  };

  const handleAcceptAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await accept({ token, password: regForm.password, firstName: regForm.firstName, lastName: regForm.lastName });
      setAccepted(true);
      await reloadUser();
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch {
      // error handled by hook
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Invalid Invitation</h1>
          <p className="text-sm text-[#8A8A8A]">No invitation token was provided.</p>
        </div>
      </div>
    );
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#4A5548]" />
          <p className="text-sm text-[#8A8A8A]">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (validateError || !data) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo iconSize={28} textClassName="text-xl font-bold text-[#1A1A1A]" />
          </div>
          <div className="bg-white border border-[#E5E4E0] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-center">
            <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Invitation Expired or Invalid</h1>
            <p className="text-sm text-[#8A8A8A]">
              This invitation link is no longer valid. Please ask your organization admin to send a new invitation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-8">
            <Logo iconSize={28} textClassName="text-xl font-bold text-[#1A1A1A]" />
          </div>
          <div className="bg-white border border-[#E5E4E0] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CheckCircle size={48} className="mx-auto text-[#4A5548] mb-4" />
            <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Welcome to {data.organizationName}!</h1>
            <p className="text-sm text-[#8A8A8A]">You've successfully joined the organization. Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo iconSize={28} textClassName="text-xl font-bold text-[#1A1A1A]" />
        </div>
        <div className="bg-white border border-[#E5E4E0] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#4A5548]/10 flex items-center justify-center">
              <Mail size={20} className="text-[#4A5548]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#1A1A1A]">Organization Invitation</h1>
              <p className="text-xs text-[#8A8A8A]">Expires in 24 hours</p>
            </div>
          </div>

          <p className="text-sm text-[#8A8A8A] mb-6">
            You've been invited to join <strong className="text-[#1A1A1A]">{data.organizationName}</strong>
            {data.teamName ? (
              <> on team <strong className="text-[#1A1A1A]">{data.teamName}</strong></>
            ) : null}{' '}
            as <strong className="text-[#1A1A1A]">{data.orgRole}</strong>.
          </p>

          {acceptError && (
            <div className="mb-4 p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-[10px] text-sm text-[#C44536]">
              {acceptError instanceof Error ? acceptError.message : 'Failed to accept invitation'}
            </div>
          )}

          {data.existingUser ? (
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {accepting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle size={16} />
                  Accept Invitation
                </>
              )}
            </button>
          ) : (
            <form onSubmit={handleAcceptAndJoin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  disabled
                  value={data.email}
                  className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#8A8A8A] bg-[#F7F6F2]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                    First Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                    <input
                      type="text"
                      required
                      value={regForm.firstName}
                      onChange={(e) => setRegForm((f) => ({ ...f, firstName: e.target.value }))}
                      className="w-full h-10 border border-[#E5E4E0] rounded-[10px] pl-9 pr-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                      placeholder="John"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.lastName}
                    onChange={(e) => setRegForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={regForm.password}
                    onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full h-10 border border-[#E5E4E0] rounded-[10px] pl-9 pr-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={accepting}
                className="w-full h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Accept & Join
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
