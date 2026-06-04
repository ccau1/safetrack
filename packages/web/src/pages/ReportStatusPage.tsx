import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { DistressFormModal } from '@/components/DistressFormModal';
import { useMemberEmergencyStatusReports } from '@/hooks/useMemberEmergencyStatusReports';
import { useTimeAgo } from '@/hooks/useTimeAgo';
import type { Employee, EmployeeStatus, StatusHistoryEntry } from '@/types';

interface ReportStatusPageProps {
  currentUser: Employee | null;
  eventId: string | null;
  memberId: string | null;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onReported: () => void;
}

export function ReportStatusPage({
  currentUser,
  eventId,
  memberId,
  addToast,
  onReported,
}: ReportStatusPageProps) {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const [safeLoading, setSafeLoading] = useState(false);
  const [distressModalOpen, setDistressModalOpen] = useState(false);

  const { createReport, getMyHistory } = useMemberEmergencyStatusReports(eventId, memberId);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);

  useEffect(() => {
    if (memberId) {
      setStatusHistory(getMyHistory(memberId));
    }
  }, [memberId, getMyHistory]);

  const handleReportSafe = async () => {
    if (!eventId || !memberId) {
      addToast(t('reportStatus.toast.noActiveEvent'), 'error');
      return;
    }
    setSafeLoading(true);
    try {
      await createReport('SAFE');
      setStatusHistory(memberId ? getMyHistory(memberId) : []);
      addToast(t('reportStatus.toast.statusUpdatedSafe'), 'success');
      onReported();
    } catch {
      addToast(t('reportStatus.toast.failedUpdateStatus'), 'error');
    } finally {
      setSafeLoading(false);
    }
  };

  const handleDistressSubmit = async (location: string, _severity: string, details: string) => {
    if (!eventId || !memberId) {
      addToast(t('reportStatus.toast.noActiveEvent'), 'error');
      return;
    }
    try {
      await createReport('NEEDS_HELP', location, details);
      setStatusHistory(memberId ? getMyHistory(memberId) : []);
      addToast(t('reportStatus.toast.distressSubmitted'), 'error');
      onReported();
      setDistressModalOpen(false);
    } catch {
      addToast(t('reportStatus.toast.failedDistressReport'), 'error');
    }
  };

  const userStatus: EmployeeStatus = currentUser?.status || 'unknown';

  const statusConfig: Record<EmployeeStatus, { icon: typeof ShieldCheck; color: string; text: string }> = {
    safe: { icon: ShieldCheck, color: '#4A7C59', text: t('reportStatus.status.safe') },
    distress: { icon: AlertTriangle, color: '#C44536', text: t('reportStatus.status.distress') },
    unknown: { icon: HelpCircle, color: '#9A9A9A', text: t('reportStatus.status.unknown') },
  };

  const config = statusConfig[userStatus];
  const StatusIcon = config.icon;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Status Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center pt-8 pb-8"
      >
        <div
          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow"
          style={{ backgroundColor: config.color }}
        >
          <StatusIcon size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">{t('reportStatus.title')}</h2>
        <p className="text-xl font-semibold" style={{ color: config.color }}>
          {config.text}
        </p>
        <p className="text-sm text-[#8A8A8A] mt-1">
          {currentUser?.lastUpdated && currentUser.lastUpdated !== '-'
            ? t('reportStatus.lastUpdated', { time: timeAgo(currentUser.lastUpdated) })
            : t('reportStatus.noStatusReported')}
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
      >
        {/* I'm Safe Card */}
        <div className="bg-white border-2 border-[#4A7C59] rounded-[14px] p-8 text-center">
          <ShieldCheck size={48} className="text-[#4A7C59] mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-[#4A7C59] mb-2">{t('reportStatus.cards.imSafe.title')}</h3>
          <p className="text-sm text-[#5C5C5C] mb-5">
            {t('reportStatus.cards.imSafe.description')}
          </p>
          <button
            onClick={handleReportSafe}
            disabled={safeLoading || !eventId}
            className="w-full py-3 text-sm font-semibold text-white bg-[#4A7C59] rounded-[10px] hover:bg-[#3D6B4A] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-150 disabled:opacity-70"
          >
            {safeLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              t('reportStatus.cards.imSafe.button')
            )}
          </button>
        </div>

        {/* I Need Help Card */}
        <div className="bg-white border-2 border-[#C44536] rounded-[14px] p-8 text-center">
          <AlertTriangle size={48} className="text-[#C44536] mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-[#C44536] mb-2">{t('reportStatus.cards.iNeedHelp.title')}</h3>
          <p className="text-sm text-[#5C5C5C] mb-5">
            {t('reportStatus.cards.iNeedHelp.description')}
          </p>
          <button
            onClick={() => setDistressModalOpen(true)}
            disabled={!eventId}
            className="w-full py-3 text-sm font-semibold text-white bg-[#C44536] rounded-[10px] hover:bg-[#A33A2E] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-150 disabled:opacity-70"
          >
            {t('reportStatus.cards.iNeedHelp.button')}
          </button>
        </div>
      </motion.div>

      {/* Status History */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white border border-[#E5E4E0] rounded-[14px] p-5"
      >
        <div className="mb-4">
          <h3 className="text-base font-semibold text-[#1A1A1A]">{t('reportStatus.statusHistory.title')}</h3>
          <p className="text-sm text-[#8A8A8A]">{t('reportStatus.statusHistory.subtitle')}</p>
        </div>

        <div className="relative">
          {statusHistory.length === 0 && (
            <p className="text-sm text-[#8A8A8A] py-4">{t('reportStatus.statusHistory.noHistory')}</p>
          )}
          {statusHistory.map((entry, index) => {
            const entryConfig = statusConfig[entry.status];
            const isLast = index === statusHistory.length - 1;

            return (
              <div key={index} className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entryConfig.color }}
                  />
                  {!isLast && (
                    <div className="w-px flex-1 bg-[#E5E4E0] min-h-[40px]" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-5 -mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1A1A1A]">
                      {entry.status === 'safe' && t('reportStatus.statusHistory.markedSafe')}
                      {entry.status === 'distress' && t('reportStatus.statusHistory.reportedInDistress')}
                      {entry.status === 'unknown' && t('reportStatus.statusHistory.statusUnknown')}
                    </span>
                    <StatusIcon size={12} style={{ color: entryConfig.color }} />
                  </div>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">{timeAgo(entry.timestamp)}</p>
                  {entry.note && (
                    <p className="text-sm text-[#5C5C5C] mt-1">{entry.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Distress Form Modal */}
      <DistressFormModal
        open={distressModalOpen}
        onClose={() => setDistressModalOpen(false)}
        onSubmit={handleDistressSubmit}
      />
    </div>
  );
}
