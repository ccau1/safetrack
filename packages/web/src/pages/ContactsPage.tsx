import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  Mail,
  User,
  Heart,
  Save,
  Loader2,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { useContactPoints } from '@/hooks/useContactPoints';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import type { ToastItem, ContactPointType } from '@/types';

interface ContactsPageProps {
  addToast: (message: string, type: ToastItem['type']) => void;
}

const typeColors: Record<ContactPointType, string> = {
  EMAIL: 'bg-blue-50 text-blue-700 border-blue-200',
  PHONE: 'bg-green-50 text-green-700 border-green-200',
  SMS: 'bg-purple-50 text-purple-700 border-purple-200',
  WHATSAPP: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function ContactsPage({ addToast }: ContactsPageProps) {
  const { t } = useTranslation();
  const { contact, isLoading: contactLoading, updateContact } = useContacts();
  const {
    contactPoints,
    isLoading: cpLoading,
    addContactPoint,
    deleteContactPoint,
    verifyContactPoint,
    resendVerification,
    confirmVerification,
  } = useContactPoints();

  const [saving, setSaving] = useState(false);
  const [nextOfKinForm, setNextOfKinForm] = useState({
    nextOfKinName: '',
    nextOfKinRelationship: '',
    nextOfKinPhone: '',
    nextOfKinEmail: '',
  });

  // Sync next of kin form when contact loads
  useEffect(() => {
    if (contact) {
      setNextOfKinForm({
        nextOfKinName: contact.nextOfKinName || '',
        nextOfKinRelationship: contact.nextOfKinRelationship || '',
        nextOfKinPhone: contact.nextOfKinPhone?.value || '',
        nextOfKinEmail: contact.nextOfKinEmail?.value || '',
      });
    }
  }, [contact]);

  // Add contact point form
  const [newCP, setNewCP] = useState<{
    type: ContactPointType;
    value: string;
    label: string;
  }>({
    type: 'EMAIL',
    value: '',
    label: '',
  });
  const [addingCP, setAddingCP] = useState(false);

  // Verification state
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAddCP = async () => {
    if (!newCP.value.trim()) return;
    setAddingCP(true);
    try {
      await addContactPoint({
        type: newCP.type,
        value: newCP.value.trim(),
        label: newCP.label.trim() || undefined,
      });
      addToast(t('contacts.toast.added'), 'success');
      setNewCP({ type: 'EMAIL', value: '', label: '' });
    } catch {
      addToast(t('contacts.toast.addFailed'), 'error');
    } finally {
      setAddingCP(false);
    }
  };

  const handleDeleteCP = async (id: string) => {
    try {
      await deleteContactPoint(id);
      addToast(t('contacts.toast.deleted'), 'success');
      setDeleteId(null);
    } catch {
      addToast(t('contacts.toast.deleteFailed'), 'error');
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await verifyContactPoint(id);
      setVerifyingId(id);
      setVerificationCode('');
      addToast(t('contacts.toast.verificationSent'), 'success');
    } catch {
      addToast(t('contacts.toast.verificationFailed'), 'error');
    }
  };

  const handleResend = async (id: string) => {
    try {
      await resendVerification(id);
      addToast(t('contacts.toast.verificationSent'), 'success');
    } catch {
      addToast(t('contacts.toast.verificationFailed'), 'error');
    }
  };

  const handleConfirmVerification = async (id: string) => {
    if (verificationCode.length !== 6) return;
    try {
      await confirmVerification(id, verificationCode);
      setVerifyingId(null);
      setVerificationCode('');
      addToast(t('contacts.toast.verified'), 'success');
    } catch {
      addToast(t('contacts.toast.verificationFailed'), 'error');
    }
  };

  const handleSubmitNextOfKin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateContact({
        nextOfKinName: nextOfKinForm.nextOfKinName || null,
        nextOfKinRelationship: nextOfKinForm.nextOfKinRelationship || null,
        nextOfKinPhone: nextOfKinForm.nextOfKinPhone || null,
        nextOfKinEmail: nextOfKinForm.nextOfKinEmail || null,
      });
      addToast(t('contacts.toast.updated'), 'success');
    } catch {
      addToast(t('contacts.toast.failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const isLoading = contactLoading || cpLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#4A5548] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selfContactPoints = contactPoints.filter(
    (cp) => cp.category === 'SELF'
  );

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold text-[#1A1A1A]">
          {t('contacts.title')}
        </h2>
        <p className="text-sm text-[#8A8A8A] mt-1">{t('contacts.subtitle')}</p>
      </motion.div>

      {/* My Contact Points */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white border border-[#E5E4E0] rounded-[14px] p-6 mb-6"
      >
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
          <Mail size={16} className="text-[#4A5548]" />
          {t('contacts.sections.myContactPoints')}
        </h3>

        {selfContactPoints.length === 0 ? (
          <p className="text-sm text-[#8A8A8A] mb-4">
            {t('contacts.noContactPoints')}
          </p>
        ) : (
          <div className="space-y-3 mb-4">
            {selfContactPoints.map((cp) => {
              const isVerifying = verifyingId === cp.id;
              return (
                <div
                  key={cp.id}
                  className="flex items-start justify-between p-3 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px]"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {cp.type === 'EMAIL' ? (
                        <Mail size={18} className="text-[#4A5548]" />
                      ) : (
                        <Phone size={18} className="text-[#4A5548]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[#1A1A1A] truncate">
                          {cp.value}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeColors[cp.type]}`}
                        >
                          {t(`contacts.types.${cp.type}`)}
                        </span>
                        {cp.isPrimary && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {t('contacts.primary')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {cp.label && (
                          <span className="text-xs text-[#8A8A8A]">
                            {cp.label}
                          </span>
                        )}
                        {cp.verifiedAt ? (
                          <span className="flex items-center gap-1 text-xs text-green-700">
                            <ShieldCheck size={12} />
                            {t('contacts.verified')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-[#C44536]">
                            <ShieldAlert size={12} />
                            {t('contacts.unverified')}
                          </span>
                        )}
                      </div>
                      {isVerifying && (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) =>
                              setVerificationCode(
                                e.target.value.replace(/\D/g, '')
                              )
                            }
                            placeholder="000000"
                            className="w-24 h-8 bg-white border border-[#E5E4E0] rounded-[8px] px-2 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_2px_rgba(74,85,72,0.15)] transition-all duration-150 text-center tracking-widest"
                          />
                          <button
                            type="button"
                            onClick={() => handleConfirmVerification(cp.id)}
                            disabled={verificationCode.length !== 6}
                            className="h-8 px-3 text-xs font-medium text-white bg-[#4A5548] rounded-[8px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-50"
                          >
                            {t('common.confirm')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResend(cp.id)}
                            className="h-8 px-3 text-xs font-medium text-[#5C5C5C] bg-white border border-[#E5E4E0] rounded-[8px] hover:bg-[#F7F6F2] transition-colors duration-150"
                          >
                            {t('contacts.resendVerification')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setVerifyingId(null);
                              setVerificationCode('');
                            }}
                            className="w-8 h-8 flex items-center justify-center text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    {!cp.verifiedAt && !isVerifying && (
                      <button
                        type="button"
                        onClick={() => handleVerify(cp.id)}
                        className="h-8 px-3 text-xs font-medium text-[#4A5548] bg-white border border-[#4A5548] rounded-[8px] hover:bg-[#4A5548] hover:text-white transition-colors duration-150"
                      >
                        {t('contacts.verify')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteId(cp.id)}
                      className="w-8 h-8 flex items-center justify-center text-[#8A8A8A] hover:text-[#C44536] transition-colors duration-150"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Contact Point Form */}
        <div className="pt-3 border-t border-[#E5E4E0]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-3">
              <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                {t('contacts.type')}
              </label>
              <select
                value={newCP.type}
                onChange={(e) =>
                  setNewCP((prev) => ({
                    ...prev,
                    type: e.target.value as ContactPointType,
                  }))
                }
                className="w-full h-10 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
              >
                <option value="EMAIL">
                  {t('contacts.types.EMAIL')}
                </option>
                <option value="PHONE">
                  {t('contacts.types.PHONE')}
                </option>
                <option value="SMS">{t('contacts.types.SMS')}</option>
                <option value="WHATSAPP">
                  {t('contacts.types.WHATSAPP')}
                </option>
              </select>
            </div>
            <div className="md:col-span-5">
              <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                {t('contacts.value')}
              </label>
              <input
                type={newCP.type === 'EMAIL' ? 'email' : 'text'}
                value={newCP.value}
                onChange={(e) =>
                  setNewCP((prev) => ({ ...prev, value: e.target.value }))
                }
                placeholder={
                  newCP.type === 'EMAIL'
                    ? 'you@company.com'
                    : '+1 555 123 4567'
                }
                className="w-full h-10 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                {t('contacts.label')}
              </label>
              <input
                type="text"
                value={newCP.label}
                onChange={(e) =>
                  setNewCP((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder={t('contacts.labelPlaceholder') || 'Primary'}
                className="w-full h-10 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <button
                type="button"
                onClick={handleAddCP}
                disabled={addingCP || !newCP.value.trim()}
                className="flex items-center justify-center gap-1.5 w-full h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60"
              >
                {addingCP ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Next of Kin */}
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        onSubmit={handleSubmitNextOfKin}
        className="bg-white border border-[#E5E4E0] rounded-[14px] p-6 space-y-6"
      >
        <div>
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <Heart size={16} className="text-[#C44536]" />
            {t('contacts.sections.nextOfKin')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              icon={User}
              label={t('contacts.fields.fullName')}
              value={nextOfKinForm.nextOfKinName}
              onChange={(v) =>
                setNextOfKinForm((p) => ({ ...p, nextOfKinName: v }))
              }
              placeholder={t('contacts.placeholders.fullName')}
            />
            <Field
              icon={User}
              label={t('contacts.fields.relationship')}
              value={nextOfKinForm.nextOfKinRelationship}
              onChange={(v) =>
                setNextOfKinForm((p) => ({ ...p, nextOfKinRelationship: v }))
              }
              placeholder={t('contacts.placeholders.relationship')}
            />
            <Field
              icon={Phone}
              label={t('contacts.fields.nextOfKinPhone')}
              value={nextOfKinForm.nextOfKinPhone}
              onChange={(v) =>
                setNextOfKinForm((p) => ({ ...p, nextOfKinPhone: v }))
              }
              placeholder={t('contacts.placeholders.nextOfKinPhone')}
            />
            <Field
              icon={Mail}
              label={t('contacts.fields.nextOfKinEmail')}
              type="email"
              value={nextOfKinForm.nextOfKinEmail}
              onChange={(v) =>
                setNextOfKinForm((p) => ({ ...p, nextOfKinEmail: v }))
              }
              placeholder={t('contacts.placeholders.nextOfKinEmail')}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-6 h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {t('contacts.button')}
          </button>
        </div>
      </motion.form>

      <ConfirmationModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDeleteCP(deleteId)}
        title={t('common.delete')}
        message={t('contacts.deleteConfirm')}
        confirmText={t('common.delete')}
      />
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]"
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] pl-9 pr-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
        />
      </div>
    </div>
  );
}
