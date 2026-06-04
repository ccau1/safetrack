import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Clock, Users, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { EmergencyEvent } from '@/types';

interface EventDetailModalProps {
  open: boolean;
  onClose: () => void;
  event: EmergencyEvent;
  stats: { total: number; safe: number; distress: number; unknown: number };
}

export function EmergencyEventDetailModal({ open, onClose, event, stats }: EventDetailModalProps) {
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
            className="relative bg-white rounded-[14px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[520px] max-w-[90vw] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E4E0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FDECEA] flex items-center justify-center">
                  <Flame size={20} className="text-[#C44536]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A]">{event.name}</h3>
                  <span className="text-xs text-[#8A8A8A]">{event.type}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F7F6F2] transition-colors duration-150"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C44536] bg-[#FDECEA] rounded-full px-3 py-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C44536] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C44536]" />
                  </span>
                  {event.status}
                </span>
                <span className="text-sm text-[#8A8A8A]">Started {event.started}</span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F7F6F2] rounded-[10px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-[#8A8A8A]" />
                    <span className="text-xs text-[#8A8A8A] uppercase tracking-wider font-medium">Total Affected</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{stats.total}</p>
                </div>
                <div className="bg-[#F7F6F2] rounded-[10px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-[#8A8A8A]" />
                    <span className="text-xs text-[#8A8A8A] uppercase tracking-wider font-medium">Duration</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{event.started}</p>
                </div>
                <div className="bg-[#EDF5EF] rounded-[10px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-[#4A7C59]" />
                    <span className="text-xs text-[#4A7C59] uppercase tracking-wider font-medium">Accounted For</span>
                  </div>
                  <p className="text-2xl font-bold text-[#4A7C59]">{stats.safe}</p>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">{((stats.safe / stats.total) * 100).toFixed(1)}% of organization</p>
                </div>
                <div className="bg-[#FDECEA] rounded-[10px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-[#C44536]" />
                    <span className="text-xs text-[#C44536] uppercase tracking-wider font-medium">Need Help</span>
                  </div>
                  <p className="text-2xl font-bold text-[#C44536]">{stats.distress}</p>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">{stats.unknown} awaiting response</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A1A1A] mb-2">Event Description</h4>
                <p className="text-sm text-[#5C5C5C] leading-relaxed">
                  A {event.type.toLowerCase()} is currently in progress. All employees are requested to check in with their status immediately. If you are safe, please report your location. If you need assistance, report your distress with location details so response teams can reach you.
                </p>
              </div>

              {/* Response team */}
              <div className="bg-[#E8F0F2] border border-[#D0E0E4] rounded-[10px] p-4">
                <h4 className="text-sm font-semibold text-[#1A1A1A] mb-2">Response Team Contact</h4>
                <div className="space-y-1.5 text-sm text-[#5C5C5C]">
                  <p>Emergency Hotline: <span className="font-medium text-[#1A1A1A]">ext. 911</span></p>
                  <p>Floor Wardens: <span className="font-medium text-[#1A1A1A]"> ext. 2200</span></p>
                  <p>HR Emergency: <span className="font-medium text-[#1A1A1A]">ext. 3300</span></p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E5E4E0]">
              <button
                onClick={onClose}
                className="w-full py-2.5 text-sm font-medium text-[#5C5C5C] bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] hover:bg-[#EFEFEC] transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
