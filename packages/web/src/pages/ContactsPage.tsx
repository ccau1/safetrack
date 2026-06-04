import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, User, Heart, Save, Loader2 } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import type { ToastItem } from '@/types';

interface ContactsPageProps {
  addToast: (message: string, type: ToastItem['type']) => void;
}

export function ContactsPage({ addToast }: ContactsPageProps) {
  const { t } = useTranslation();
  const { contact, isLoading, updateContact } = useContacts();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    email: contact?.email || '',
    phoneNumber: contact?.phoneNumber || '',
    alternatePhoneNumber: contact?.alternatePhoneNumber || '',
    nextOfKinName: contact?.nextOfKinName || '',
    nextOfKinRelationship: contact?.nextOfKinRelationship || '',
    nextOfKinPhone: contact?.nextOfKinPhone || '',
    nextOfKinEmail: contact?.nextOfKinEmail || '',
  });

  // Sync form when contact loads
  useState(() => {
    if (contact) {
      setForm({
        email: contact.email || '',
        phoneNumber: contact.phoneNumber || '',
        alternatePhoneNumber: contact.alternatePhoneNumber || '',
        nextOfKinName: contact.nextOfKinName || '',
        nextOfKinRelationship: contact.nextOfKinRelationship || '',
        nextOfKinPhone: contact.nextOfKinPhone || '',
        nextOfKinEmail: contact.nextOfKinEmail || '',
      });
    }
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateContact({
        email: form.email || null,
        phoneNumber: form.phoneNumber || null,
        alternatePhoneNumber: form.alternatePhoneNumber || null,
        nextOfKinName: form.nextOfKinName || null,
        nextOfKinRelationship: form.nextOfKinRelationship || null,
        nextOfKinPhone: form.nextOfKinPhone || null,
        nextOfKinEmail: form.nextOfKinEmail || null,
      });
      addToast(t('contacts.toast.updated'), 'success');
    } catch {
      addToast(t('contacts.toast.failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#4A5548] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const Field = ({
    icon: Icon,
    label,
    field,
    type = 'text',
    placeholder,
  }: {
    icon: typeof Phone;
    label: string;
    field: string;
    type?: string;
    placeholder: string;
  }) => (
    <div>
      <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
        <input
          type={type}
          value={form[field as keyof typeof form]}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] pl-9 pr-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold text-[#1A1A1A]">{t('contacts.title')}</h2>
        <p className="text-sm text-[#8A8A8A] mt-1">
          {t('contacts.subtitle')}
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onSubmit={handleSubmit}
        className="bg-white border border-[#E5E4E0] rounded-[14px] p-6 space-y-6"
      >
        {/* Personal Contact */}
        <div>
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <Phone size={16} className="text-[#4A5548]" />
            {t('contacts.sections.personalContact')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field icon={Mail} label={t('contacts.fields.email')} field="email" type="email" placeholder={t('contacts.placeholders.email')} />
            <Field icon={Phone} label={t('contacts.fields.phoneNumber')} field="phoneNumber" placeholder={t('contacts.placeholders.phoneNumber')} />
            <Field
              icon={Phone}
              label={t('contacts.fields.alternatePhone')}
              field="alternatePhoneNumber"
              placeholder={t('contacts.placeholders.alternatePhone')}
            />
          </div>
        </div>

        <div className="border-t border-[#E5E4E0]" />

        {/* Next of Kin */}
        <div>
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
            <Heart size={16} className="text-[#C44536]" />
            {t('contacts.sections.nextOfKin')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field icon={User} label={t('contacts.fields.fullName')} field="nextOfKinName" placeholder={t('contacts.placeholders.fullName')} />
            <Field icon={User} label={t('contacts.fields.relationship')} field="nextOfKinRelationship" placeholder={t('contacts.placeholders.relationship')} />
            <Field icon={Phone} label={t('contacts.fields.nextOfKinPhone')} field="nextOfKinPhone" placeholder={t('contacts.placeholders.nextOfKinPhone')} />
            <Field icon={Mail} label={t('contacts.fields.nextOfKinEmail')} field="nextOfKinEmail" type="email" placeholder={t('contacts.placeholders.nextOfKinEmail')} />
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
    </div>
  );
}
