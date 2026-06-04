import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { Employee } from '@/types';

interface EmployeeDetailModalProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onRemind?: (employee: Employee) => void;
}

export function EmployeeDetailModal({ employee, open, onClose, isAdmin, onRemind }: EmployeeDetailModalProps) {
  const { t } = useTranslation();
  if (!employee) return null;

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
            className="relative bg-white rounded-[14px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[420px] max-w-[90vw] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F7F6F2] transition-colors duration-150 z-10"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="pt-8 pb-6 px-6">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#E8EDE7] flex items-center justify-center text-2xl font-semibold text-[#4A5548] mb-3">
                  {employee.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A1A]">{employee.name}</h3>
                <p className="text-sm text-[#8A8A8A]">
                  {t(`roles.${employee.role}`, { defaultValue: employee.role })} · {employee.team}
                </p>
              </div>

              {/* Status */}
              <div className="flex justify-center mb-4">
                <StatusBadge status={employee.status} size="md" />
              </div>

              {/* Divider */}
              <div className="border-t border-[#E5E4E0] my-4" />

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1">Location</p>
                  <p className="text-sm text-[#1A1A1A]">{employee.location || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1">Last Updated</p>
                  <p className="text-sm text-[#1A1A1A]">{employee.lastUpdated || '-'}</p>
                </div>
                {employee.severity && (
                  <div>
                    <p className="text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1">Severity</p>
                    <p className="text-sm text-[#1A1A1A] capitalize">{employee.severity}</p>
                  </div>
                )}
                {employee.details && (
                  <div className="col-span-2">
                    <p className="text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1">Details</p>
                    <p className="text-sm text-[#1A1A1A]">{employee.details}</p>
                  </div>
                )}
              </div>

              {/* Admin action */}
              {isAdmin && employee.status === 'unknown' && onRemind && (
                <div className="mt-5">
                  <button
                    onClick={() => onRemind(employee)}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-[#C44536] rounded-[10px] hover:bg-[#A33A2E] transition-colors duration-150"
                  >
                    <Bell size={16} />
                    Send Reminder
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
