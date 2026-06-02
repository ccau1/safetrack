import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  recipientCount: number;
}

export function ConfirmationModal({ open, onClose, onConfirm, title, message, confirmText, recipientCount }: ConfirmationModalProps) {
  return (
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-[14px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[400px] max-w-[90vw] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4E0]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-[#C44536]" />
                <h3 className="text-lg font-semibold text-[#1A1A1A]">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F7F6F2] transition-colors duration-150"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p className="text-sm text-[#5C5C5C] leading-relaxed">{message}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#E5E4E0]">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-[#5C5C5C] bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] hover:bg-[#EFEFEC] transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#C44536] rounded-[10px] hover:bg-[#A33A2E] transition-colors duration-150"
              >
                {confirmText.replace('{count}', recipientCount.toString())}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
