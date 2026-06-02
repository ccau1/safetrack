import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import type { ToastItem } from '@/types';

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const icons = {
    success: { Icon: CheckCircle, color: 'text-[#4A7C59]' },
    error: { Icon: AlertCircle, color: 'text-[#C44536]' },
    info: { Icon: Info, color: 'text-[#5B7B8A]' },
  };

  const { Icon, color } = icons[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-white border border-[#E5E4E0] rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-4 py-3.5 flex items-center gap-3 w-[360px]"
    >
      <Icon size={18} className={color} />
      <span className="text-sm text-[#1A1A1A] flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors duration-150"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
