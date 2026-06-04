import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Flame, Clock, Users, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { EmergencyEvent } from '@/types';

interface EventDetailModalProps {
  open: boolean;
  onClose: () => void;
  event: EmergencyEvent;
  stats: { total: number; safe: number; distress: number; unknown: number };
}

export function EmergencyEventDetailModal({ open, onClose, event, stats }: EventDetailModalProps) {
  const { t } = useTranslation();

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
                  <span className="text-xs text-[#8A8A8A]">{t(`emergencies.types.${event.type}`, event.type)}</span>
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
                  {event.status === 'ACTIVE' ? t('emergencyEventDetail.status.active') : event.status === 'RESOLVED' ? t('emergencyEventDetail.status.resolved') : t('emergencyEventDetail.status.cancelled')}
                </span>
                <span className="text-sm text-[#8A8A8A]">{t('emergencyEventDetailModal.started', { time: event.started })}</span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F7F6F2] rounded-[10px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-[#8A8A8A]" />
                    <span className="text-xs text-[#8A8A8A] uppercase tracking-wider font-medium">{t('emergencyEventDetailModal.totalAffected')}</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{stats.total}</p>
                </div>
                <div className="bg-[#F7F6F2] rounded-[10px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-[#8A8A8A]" />
                    <span className="text-xs text-[#8A8A8A] uppercase tracking-wider font-medium">{t('emergencyEventDetailModal.duration')}</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{event.started}</p>
                </div>
                <div className="bg-[#EDF5EF] rounded-[10px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-[#4A7C59]" />
                    <span className="text-xs text-[#4A7C59] uppercase tracking-wider font-medium">{t('emergencyEventDetailModal.accountedFor')}</span>
                  </div>
                  <p className="text-2xl font-bold text-[#4A7C59]">{stats.safe}</p>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">{t('emergencyEventDetailModal.percentOfOrg', { percent: ((stats.safe / stats.total) * 100).toFixed(1) })}</p>
                </div>
                <div className="bg-[#FDECEA] rounded-[10px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-[#C44536]" />
                    <span className="text-xs text-[#C44536] uppercase tracking-wider font-medium">{t('emergencyEventDetailModal.needHelp')}</span>
                  </div>
                  <p className="text-2xl font-bold text-[#C44536]">{stats.distress}</p>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">{t('emergencyEventDetailModal.awaitingResponse', { count: stats.unknown })}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-[#1A1A1A] mb-2">{t('emergencyEventDetailModal.eventDescription')}</h4>
                <p className="text-sm text-[#5C5C5C] leading-relaxed">
                  {t('emergencyEventDetailModal.defaultDescription', { type: t(`emergencies.types.${event.type}`, event.type).toLowerCase() })}
                </p>
              </div>

              {/* Response team */}
              <div className="bg-[#E8F0F2] border border-[#D0E0E4] rounded-[10px] p-4">
                <h4 className="text-sm font-semibold text-[#1A1A1A] mb-2">{t('emergencyEventDetailModal.responseTeam')}</h4>
                <div className="space-y-1.5 text-sm text-[#5C5C5C]">
                  <p>{t('emergencyEventDetailModal.emergencyHotline')}: <span className="font-medium text-[#1A1A1A]">{t('emergencyEventDetailModal.ext', { number: '911' })}</span></p>
                  <p>{t('emergencyEventDetailModal.floorWardens')}: <span className="font-medium text-[#1A1A1A]">{t('emergencyEventDetailModal.ext', { number: '2200' })}</span></p>
                  <p>{t('emergencyEventDetailModal.hrEmergency')}: <span className="font-medium text-[#1A1A1A]">{t('emergencyEventDetailModal.ext', { number: '3300' })}</span></p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E5E4E0]">
              <button
                onClick={onClose}
                className="w-full py-2.5 text-sm font-medium text-[#5C5C5C] bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] hover:bg-[#EFEFEC] transition-colors duration-150"
              >
                {t('emergencyEventDetailModal.close')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
