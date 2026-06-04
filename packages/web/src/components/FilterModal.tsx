import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, X } from 'lucide-react';

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function FilterModal({ open, onClose, children, title }: FilterModalProps) {
  const { t } = useTranslation();
  const modalTitle = title || t('table.filters');

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/25" />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative bg-white rounded-t-[14px] md:rounded-[14px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-full md:w-[400px] md:max-w-[90vw] max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4E0] flex-shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[#4A5548]" />
                <h3 className="text-lg font-semibold text-[#1A1A1A]">{modalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F7F6F2] transition-colors duration-150"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-5 overflow-y-auto">
              {children}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#E5E4E0] flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150"
              >
                {t('table.showResults')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
