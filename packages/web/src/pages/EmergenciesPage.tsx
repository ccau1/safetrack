import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Siren, CheckCircle, XCircle, Clock, Search, AlertTriangle, Flame, DoorOpen, Lock } from 'lucide-react';
import type { EmergencyEventApi, ToastItem } from '@/types';

interface EmergenciesPageProps {
  events: EmergencyEventApi[];
  activeEventCount: number;
  addToast: (message: string, type: ToastItem['type']) => void;
  onMutated: () => void;
}

export function EmergenciesPage({ events, activeEventCount, addToast: _addToast, onMutated: _onMutated }: EmergenciesPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'RESOLVED' | 'CANCELLED'>('all');

  const typeConfig: Record<EmergencyEventApi['type'], { label: string; icon: typeof Flame; color: string; bg: string }> = {
    FIRE_DRILL: { label: t('emergencies.types.FIRE_DRILL'), icon: Flame, color: 'text-[#C44536]', bg: 'bg-[#FDF2F0]' },
    EMERGENCY: { label: t('emergencies.types.EMERGENCY'), icon: AlertTriangle, color: 'text-[#C44536]', bg: 'bg-[#FDF2F0]' },
    EVACUATION: { label: t('emergencies.types.EVACUATION'), icon: DoorOpen, color: 'text-[#5B7B8A]', bg: 'bg-[#E8F0F2]' },
    LOCKDOWN: { label: t('emergencies.types.LOCKDOWN'), icon: Lock, color: 'text-[#8A6B3A]', bg: 'bg-[#F5F0E6]' },
  };

  const statusConfig: Record<EmergencyEventApi['status'], { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
    ACTIVE: { label: t('common.active'), color: 'text-[#C44536]', bg: 'bg-[#FDF2F0]', icon: Clock },
    RESOLVED: { label: t('common.resolved'), color: 'text-[#4A7C59]', bg: 'bg-[#E8EDE7]', icon: CheckCircle },
    CANCELLED: { label: t('common.cancelled'), color: 'text-[#8A8A8A]', bg: 'bg-[#F7F6F2]', icon: XCircle },
  };

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const filteredEvents = useMemo(() => {
    let result = [...events];
    if (statusFilter !== 'all') {
      result = result.filter((e) => e.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)) ||
          e.type.toLowerCase().includes(q)
      );
    }
    // Sort: active first, then by startedAt desc
    result.sort((a, b) => {
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });
    return result;
  }, [events, statusFilter, search]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">{t('emergencies.title')}</h2>
          <p className="text-sm text-[#8A8A8A] mt-1">
            {t('emergencies.totalActive', { total: events.length, active: activeEventCount })}
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
      >
        <div className="relative flex-1 w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('emergencies.searchPlaceholder')}
            className="w-full sm:w-[280px] h-10 pl-9 pr-3 bg-white border border-[#E5E4E0] rounded-[10px] text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'ACTIVE', 'RESOLVED', 'CANCELLED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`h-9 px-3 rounded-[10px] text-sm font-medium transition-colors duration-150 ${
                statusFilter === s
                  ? 'bg-[#4A5548] text-white'
                  : 'bg-white border border-[#E5E4E0] text-[#5C5C5C] hover:text-[#1A1A1A]'
              }`}
            >
              {s === 'all' ? t('emergencies.filters.all') : statusConfig[s].label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Events List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-3"
      >
        {filteredEvents.map((event, index) => {
          const typeInfo = typeConfig[event.type];
          const statusInfo = statusConfig[event.status];
          const TypeIcon = typeInfo.icon;
          const StatusIcon = statusInfo.icon;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index }}
              onClick={() => navigate(`/emergency-events/${event.id}`)}
              className="bg-white border border-[#E5E4E0] rounded-[14px] p-5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:border-[#D0E0D4] transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-[10px] ${typeInfo.bg} flex items-center justify-center shrink-0`}>
                    <TypeIcon size={20} className={typeInfo.color} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-[#1A1A1A]">{event.title}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon size={12} />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-[#5C5C5C] mt-0.5">
                      {event.description || t('emergencies.eventCard.noDescription')}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#8A8A8A]">
                      <span>{typeInfo.label}</span>
                      <span>·</span>
                      <span>{t('emergencies.eventCard.started', { date: formatDate(event.startedAt) })}</span>
                      {event.targetTeams.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{t('emergencies.eventCard.team_other', { count: event.targetTeams.length })}</span>
                        </>
                      )}
                      {event.targetGroups.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{t('emergencies.eventCard.group_other', { count: event.targetGroups.length })}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="text-center py-16 bg-white border border-[#E5E4E0] rounded-[14px]">
            <Siren size={32} className="text-[#D8E0D6] mx-auto mb-3" />
            <p className="text-sm text-[#8A8A8A]">
              {events.length === 0 ? t('emergencies.eventCard.noEmergenciesYet') : t('emergencies.eventCard.noMatchFilters')}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
