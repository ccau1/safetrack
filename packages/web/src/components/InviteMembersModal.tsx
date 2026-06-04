import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Upload, Download, Loader2, Trash2, Send, Users } from 'lucide-react';
import { useInvitations } from '@/hooks/useInvitations';
import { useTeams } from '@/hooks/useTeams';
import type { CreateInvitationRequest, ToastItem } from '@/types';

interface InviteMembersModalProps {
  orgId: string | null;
  open: boolean;
  onClose: () => void;
  addToast: (message: string, type: ToastItem['type']) => void;
}

export function InviteMembersModal({ orgId, open, onClose, addToast }: InviteMembersModalProps) {
  const { t } = useTranslation();
  const { teams } = useTeams(orgId);
  const {
    invitations,
    isLoading: invitesLoading,
    createInvitation,
    batchInvite,
    cancelInvitation,
    resendInvitation,
  } = useInvitations(orgId);

  const [tab, setTab] = useState<'single' | 'batch'>('single');
  const [form, setForm] = useState<CreateInvitationRequest>({
    email: '',
    firstName: '',
    lastName: '',
    teamId: '',
    orgRole: 'ORG_MEMBER',
    phoneNumber: '',
    alternatePhoneNumber: '',
    nextOfKinName: '',
    nextOfKinRelationship: '',
    nextOfKinPhone: '',
    nextOfKinEmail: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [batchResult, setBatchResult] = useState<{ created: number; skipped: number; errors: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;
    setSubmitting(true);
    try {
      await createInvitation(form);
      addToast(`Invitation sent to ${form.email}`, 'success');
      setForm({
        email: '',
        firstName: '',
        lastName: '',
        teamId: '',
        orgRole: 'ORG_MEMBER',
        phoneNumber: '',
        alternatePhoneNumber: '',
        nextOfKinName: '',
        nextOfKinRelationship: '',
        nextOfKinPhone: '',
        nextOfKinEmail: '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation';
      addToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitting(true);
    setBatchResult(null);
    try {
      const result = await batchInvite(file);
      setBatchResult({
        created: result.createdCount,
        skipped: result.skippedCount,
        errors: result.errors.length,
      });
      addToast(`Batch invite complete: ${result.createdCount} sent, ${result.skippedCount} skipped`, 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process CSV';
      addToast(message, 'error');
    } finally {
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelInvitation(id);
      addToast('Invitation cancelled', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel invitation';
      addToast(message, 'error');
    }
  };

  const handleResend = async (id: string) => {
    try {
      await resendInvitation(id);
      addToast('Invitation resent', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend invitation';
      addToast(message, 'error');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-[14px] w-full max-w-xl max-h-[90vh] flex flex-col shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4E0]">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-[#4A5548]" />
            <h3 className="text-lg font-semibold text-[#1A1A1A]">Invite Members</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E5E4E0]">
          <button
            onClick={() => setTab('single')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'single' ? 'text-[#4A5548] border-b-2 border-[#4A5548]' : 'text-[#8A8A8A] hover:text-[#5C5C5C]'
            }`}
          >
            Single Invite
          </button>
          <button
            onClick={() => setTab('batch')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'batch' ? 'text-[#4A5548] border-b-2 border-[#4A5548]' : 'text-[#8A8A8A] hover:text-[#5C5C5C]'
            }`}
          >
            Batch CSV
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {tab === 'single' ? (
              <motion.div
                key="single"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                      {t('common.email')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                      placeholder="colleague@company.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                        {t('common.firstName')}
                      </label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                        {t('common.lastName')}
                      </label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                        Team
                      </label>
                      <select
                        value={form.teamId}
                        onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
                        className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                      >
                        <option value="">{t('common.notAssigned')}</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                        Role
                      </label>
                      <select
                        value={form.orgRole}
                        onChange={(e) => setForm((f) => ({ ...f, orgRole: e.target.value }))}
                        className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                      >
                        <option value="ORG_MEMBER">{t('roles.ORG_MEMBER')}</option>
                        <option value="SAFETY_OFFICER">{t('roles.SAFETY_OFFICER')}</option>
                        <option value="ORG_ADMIN">{t('roles.ORG_ADMIN')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                        {t('common.phone')}
                      </label>
                      <input
                        type="tel"
                        value={form.phoneNumber}
                        onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                        className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                        placeholder="+1-555-0100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                        {t('contacts.fields.alternatePhone')}
                      </label>
                      <input
                        type="tel"
                        value={form.alternatePhoneNumber}
                        onChange={(e) => setForm((f) => ({ ...f, alternatePhoneNumber: e.target.value }))}
                        className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                        placeholder="+1-555-0101"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                      {t('contacts.fields.fullName')}
                    </label>
                    <input
                      type="text"
                      value={form.nextOfKinName}
                      onChange={(e) => setForm((f) => ({ ...f, nextOfKinName: e.target.value }))}
                      className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                        {t('contacts.fields.relationship')}
                      </label>
                      <input
                        type="text"
                        value={form.nextOfKinRelationship}
                        onChange={(e) => setForm((f) => ({ ...f, nextOfKinRelationship: e.target.value }))}
                        className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                        placeholder="Spouse"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                        {t('contacts.fields.nextOfKinPhone')}
                      </label>
                      <input
                        type="tel"
                        value={form.nextOfKinPhone}
                        onChange={(e) => setForm((f) => ({ ...f, nextOfKinPhone: e.target.value }))}
                        className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                        placeholder="+1-555-0200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                      {t('contacts.fields.nextOfKinEmail')}
                    </label>
                    <input
                      type="email"
                      value={form.nextOfKinEmail}
                      onChange={(e) => setForm((f) => ({ ...f, nextOfKinEmail: e.target.value }))}
                      className="w-full h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                      placeholder="jane.doe@example.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={16} />
                        Send Invitation
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="batch"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <p className="text-sm text-[#8A8A8A]">
                  Upload a CSV file with member details. Each row will create an invitation.
                </p>

                <a
                  href="/invite-template.csv"
                  download
                  className="inline-flex items-center gap-2 text-sm text-[#4A5548] hover:text-[#3D463B] font-medium"
                >
                  <Download size={16} />
                  Download CSV template
                </a>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E5E4E0] rounded-[14px] p-8 text-center cursor-pointer hover:border-[#4A5548] hover:bg-[#F7F6F2] transition-colors"
                >
                  <Upload size={24} className="mx-auto text-[#8A8A8A] mb-2" />
                  <p className="text-sm text-[#8A8A8A]">Click to upload CSV file</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {batchResult && (
                  <div className="bg-[#F7F6F2] rounded-[10px] p-4 space-y-1">
                    <p className="text-sm font-medium text-[#1A1A1A]">Batch Results</p>
                    <p className="text-sm text-[#8A8A8A]">Created: {batchResult.created}</p>
                    <p className="text-sm text-[#8A8A8A]">Skipped: {batchResult.skipped}</p>
                    {batchResult.errors > 0 && (
                      <p className="text-sm text-[#C44536]">Errors: {batchResult.errors}</p>
                    )}
                  </div>
                )}

                {submitting && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 size={16} className="animate-spin text-[#4A5548]" />
                    <span className="text-sm text-[#8A8A8A]">Processing invitations...</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pending Invitations */}
          <div className="mt-8">
            <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
              <Users size={16} />
              Pending Invitations
            </h4>
            {invitesLoading ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 size={14} className="animate-spin text-[#8A8A8A]" />
                <span className="text-xs text-[#8A8A8A]">Loading...</span>
              </div>
            ) : invitations.length === 0 ? (
              <p className="text-xs text-[#8A8A8A]">No pending invitations</p>
            ) : (
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between bg-[#F7F6F2] rounded-[10px] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{inv.email}</p>
                      <p className="text-xs text-[#8A8A8A]">
                        {inv.teamName || 'No team'} • {t(`roles.${inv.orgRole}`, { defaultValue: inv.orgRole })} • Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleResend(inv.id)}
                        className="p-1.5 text-[#8A8A8A] hover:text-[#4A5548] transition-colors"
                        title="Resend"
                      >
                        <Send size={14} />
                      </button>
                      <button
                        onClick={() => handleCancel(inv.id)}
                        className="p-1.5 text-[#8A8A8A] hover:text-[#C44536] transition-colors"
                        title="Cancel"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
