import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { Severity } from '@/types';

interface DistressFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (location: string, severity: Severity, details: string) => void;
}

export function DistressFormModal({ open, onClose, onSubmit }: DistressFormModalProps) {
  const { t } = useTranslation();
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    if (!location.trim()) return;
    onSubmit(location, severity, details);
    setLocation('');
    setSeverity('medium');
    setDetails('');
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/25" />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="relative bg-white rounded-[14px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[480px] max-w-[90vw] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4E0]">
              <h3 className="text-xl font-semibold text-[#C44536]">{t('distressFormModal.title')}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F7F6F2] transition-colors duration-150"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Location */}
              <div>
                <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                  {t('distressFormModal.location')}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('distressFormModal.locationPlaceholder')}
                  className="w-full h-11 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-2">
                  {t('distressFormModal.severity')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as Severity[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeverity(s)}
                      className={`flex flex-col items-center gap-2 py-3 rounded-[10px] border-2 transition-all duration-150 ${
                        severity === s
                          ? s === 'low'
                            ? 'border-[#4A7C59] bg-[#EDF5EF]'
                            : s === 'medium'
                            ? 'border-[#D4A017] bg-[#FFF8E7]'
                            : 'border-[#C44536] bg-[#FDECEA]'
                          : 'border-[#E5E4E0] bg-white hover:bg-[#FAFAF8]'
                      }`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${
                          severity === s
                            ? s === 'low'
                              ? 'bg-[#4A7C59]'
                              : s === 'medium'
                              ? 'bg-[#D4A017]'
                              : 'bg-[#C44536]'
                            : 'bg-[#E5E4E0]'
                        }`}
                      />
                      <span className="text-sm font-medium capitalize text-[#1A1A1A]">{t(`distressFormModal.${s}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                  {t('distressFormModal.details')}
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t('distressFormModal.detailsPlaceholder')}
                  rows={3}
                  className="w-full border border-[#E5E4E0] rounded-[10px] px-3 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#E5E4E0]">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-[#5C5C5C] bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] hover:bg-[#EFEFEC] transition-colors duration-150"
              >
                {t('distressFormModal.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!location.trim()}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#C44536] rounded-[10px] hover:bg-[#A33A2E] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('distressFormModal.submit')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
