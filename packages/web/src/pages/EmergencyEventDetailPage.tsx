import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Flame,
  AlertTriangle,
  DoorOpen,
  ShieldAlert,
  Clock,
  Users,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
  Send,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  StickyNote,
  Search,
  Share,
  Bell,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
  Pencil,
  Loader2,
} from 'lucide-react';
import { useEmergencyEvent } from '@/hooks/useEmergencyEvent';
import { useEmergencyEventUpdates } from '@/hooks/useEmergencyEventUpdates';
import { useEmergencyEventMembers } from '@/hooks/useEmergencyEventMembers';
import { useMemberEmergencyStatusReports } from '@/hooks/useMemberEmergencyStatusReports';
import { ResolveEmergencyEventModal } from '@/components/ResolveEmergencyEventModal';
import { DistressFormModal } from '@/components/DistressFormModal';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useTimeAgo } from '@/hooks/useTimeAgo';
import { useMyMembership } from '@/hooks/useMyMembership';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ToastContainer } from '@/components/ToastContainer';
import { useToast } from '@/hooks/useToast';
import type { EmergencyEventUpdateApi, ScopedMember, MemberEmergencyStatusReportApi, Severity } from '@/types';

const TYPE_ICONS: Record<string, typeof Flame> = {
  EMERGENCY: AlertTriangle,
  FIRE_DRILL: Flame,
  EVACUATION: DoorOpen,
  LOCKDOWN: ShieldAlert,
};

const TYPE_COLORS: Record<string, string> = {
  EMERGENCY: '#C44536',
  FIRE_DRILL: '#E07A5F',
  EVACUATION: '#4A7C59',
  LOCKDOWN: '#5B7B8A',
};

const STATUS_CONFIG: Record<NonNullable<ScopedMember['latestStatus']>, { label: string; color: string; bg: string }> = {
  SAFE: { label: 'status.SAFE', color: '#4A7C59', bg: '#EDF5EF' },
  NEEDS_HELP: { label: 'status.NEEDS_HELP', color: '#C44536', bg: '#FDECEA' },
  MISSING: { label: 'status.MISSING', color: '#8A8A8A', bg: '#F7F6F2' },
  EN_ROUTE: { label: 'status.EN_ROUTE', color: '#5B7B8A', bg: '#E8F0F2' },
};

const REPORT_STATUS_CONFIG: Record<MemberEmergencyStatusReportApi['status'], { label: string; color: string; bg: string }> = {
  SAFE: { label: 'status.SAFE', color: '#4A7C59', bg: '#EDF5EF' },
  NEEDS_HELP: { label: 'status.NEEDS_HELP', color: '#C44536', bg: '#FDECEA' },
  MISSING: { label: 'status.MISSING', color: '#8A8A8A', bg: '#F7F6F2' },
  EN_ROUTE: { label: 'status.EN_ROUTE', color: '#5B7B8A', bg: '#E8F0F2' },
};

const UPDATE_TYPE_CONFIG: Record<EmergencyEventUpdateApi['type'], { label: string; color: string; icon: typeof TrendingUp }> = {
  PROGRESSING: { label: 'emergencyEventDetail.updateTypes.PROGRESSING', color: '#5B7B8A', icon: TrendingUp },
  ESCALATED: { label: 'emergencyEventDetail.updateTypes.ESCALATED', color: '#C44536', icon: AlertOctagon },
  DEESCALATED: { label: 'emergencyEventDetail.updateTypes.DEESCALATED', color: '#4A7C59', icon: TrendingDown },
  NOTE: { label: 'emergencyEventDetail.updateTypes.NOTE', color: '#8A8A8A', icon: StickyNote },
  RESOLVED: { label: 'emergencyEventDetail.updateTypes.RESOLVED', color: '#4A7C59', icon: CheckCircle2 },
};

export function EmergencyEventDetailPage() {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  const { toasts, addToast, removeToast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasAction } = useAuth();
  const canManageEvent = hasAction('safetrack:event:manage');

  const { event, isLoading: eventLoading, refetch: refetchEvent } = useEmergencyEvent(id || null);
  const { updates, isLoading: updatesLoading, createUpdate, refetch: refetchUpdates } = useEmergencyEventUpdates(id || null);
  const { members: scopedMembers, isLoading: membersLoading, refetch: refetchMembers } = useEmergencyEventMembers(id || null);
  const { member: myMembership } = useMyMembership(event?.organizationId || null);
  const { reports: allReports, isLoading: reportsLoading, createReport } = useMemberEmergencyStatusReports(id || null, myMembership?.id || null);

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [distressModalOpen, setDistressModalOpen] = useState(false);
  const [safeLoading, setSafeLoading] = useState(false);
  const [remindingMemberId, setRemindingMemberId] = useState<string | null>(null);
  const [remindedMemberIds, setRemindedMemberIds] = useState<Set<string>>(new Set());
  const [updateText, setUpdateText] = useState('');
  const [updateType, setUpdateType] = useState<EmergencyEventUpdateApi['type']>('PROGRESSING');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  type FilterKey = 'all' | 'safe' | 'distress' | 'unknown';
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(
    new Set(['all', 'safe', 'distress', 'unknown'])
  );

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((prev) => {
      if (prev.size === 4) {
        return new Set([key]);
      }
      if (prev.size === 1 && prev.has(key)) {
        return new Set(['all', 'safe', 'distress', 'unknown']);
      }
      if (prev.has(key)) {
        const next = new Set(prev);
        next.delete(key);
        return next;
      }
      return new Set([...prev, key]);
    });
  };

  const matchesFilter = (member: ScopedMember): boolean => {
    for (const key of activeFilters) {
      if (key === 'all') return true;
      if (key === 'safe' && member.latestStatus === 'SAFE') return true;
      if (key === 'distress' && member.latestStatus === 'NEEDS_HELP') return true;
      if (key === 'unknown' && (!member.latestStatus || member.latestStatus === 'MISSING' || member.latestStatus === 'EN_ROUTE')) return true;
    }
    return false;
  };

  const handleResolve = async (comment: string) => {
    if (!id) return;
    await api.patch(`/api/emergency-events/${id}/resolve`, { comment: comment || '' });
    refetchEvent();
    refetchUpdates();
    setResolveModalOpen(false);
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateText.trim()) return;
    setUpdateLoading(true);
    try {
      await createUpdate(updateText.trim(), updateType);
      setUpdateText('');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!id || !editTitle.trim()) return;
    setEditLoading(true);
    try {
      await api.patch(`/api/emergency-events/${id}`, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });
      refetchEvent();
      setIsEditing(false);
    } catch {
      // Error handled silently; could add toast here
    } finally {
      setEditLoading(false);
    }
  };

  const startEdit = () => {
    setEditTitle(event?.title || '');
    setEditDescription(event?.description || '');
    setIsEditing(true);
  };

  const handleReportSafe = async () => {
    if (!id || !myMembership) return;
    setSafeLoading(true);
    try {
      await createReport('SAFE');
      refetchMembers();
      addToast(t('reportStatus.toast.statusUpdatedSafe'), 'success');
    } catch {
      addToast(t('reportStatus.toast.failedUpdateStatus'), 'error');
    } finally {
      setSafeLoading(false);
    }
  };

  const handleDistressSubmit = async (location: string, _severity: Severity, details: string) => {
    if (!id || !myMembership) return;
    try {
      await createReport('NEEDS_HELP', location, details);
      refetchMembers();
      addToast(t('reportStatus.toast.distressSubmitted'), 'success');
      setDistressModalOpen(false);
    } catch {
      addToast(t('reportStatus.toast.failedDistressReport'), 'error');
    }
  };

  const handleRemind = async (member: ScopedMember) => {
    if (member.latestStatus === 'SAFE') return;
    setRemindingMemberId(member.memberId);
    try {
      await api.post(`/api/members/${member.memberId}/remind`);
      setRemindedMemberIds((prev) => new Set(prev).add(member.memberId));
      addToast(t('emergencyEventDetail.members.reminderSent', { name: member.name }), 'success');
    } catch {
      addToast(t('emergencyEventDetail.members.reminderFailed', { name: member.name }), 'error');
    } finally {
      setRemindingMemberId(null);
    }
  };

  const myLatestReport = myMembership
    ? allReports
        .filter((r) => r.memberId === myMembership.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : undefined;

  const totalScoped = scopedMembers.length;
  const safe = scopedMembers.filter((m) => m.latestStatus === 'SAFE').length;
  const distress = scopedMembers.filter((m) => m.latestStatus === 'NEEDS_HELP').length;
  const unknown = scopedMembers.filter((m) => !m.latestStatus || m.latestStatus === 'MISSING' || m.latestStatus === 'EN_ROUTE').length;

  const filteredMembers = scopedMembers.filter((m) => {
    const matchesSearch = !memberSearch.trim() || m.name.toLowerCase().includes(memberSearch.toLowerCase());
    return matchesSearch && matchesFilter(m);
  });

  const eventReports = allReports.filter((r) => {
    if (!event) return false;
    const reportTime = new Date(r.createdAt).getTime();
    const startTime = new Date(event.startedAt).getTime();
    if (reportTime < startTime) return false;
    if (event.resolvedAt) {
      const endTime = new Date(event.resolvedAt).getTime();
      if (reportTime > endTime) return false;
    }
    return true;
  });

  const getMemberReports = (memberId: string) =>
    eventReports
      .filter((r) => r.memberId === memberId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#4A5548] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-[#8A8A8A]">{t('emergencyEventDetail.notFound')}</p>
        <button
          onClick={() => navigate('/emergency-events')}
          className="mt-4 text-sm font-medium text-[#4A5548] hover:underline"
        >
          {t('emergencyEventDetail.backToEvents')}
        </button>
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[event.type] || AlertTriangle;
  const typeColor = TYPE_COLORS[event.type] || '#C44536';
  const isActive = event.status === 'ACTIVE';
  const showStatusCta = isActive && myMembership && myLatestReport?.status !== 'SAFE';

  return (
    <div
      className="min-h-screen bg-white"
      style={{ marginTop: '-env(safe-area-inset-top)', paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-4xl mx-auto space-y-8 pt-0 sm:pt-4 px-4 sm:px-6">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* Back + Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4 gap-3">
          <button
            onClick={() => navigate('/emergency-events')}
            className="flex items-center gap-1.5 text-sm text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors"
          >
            <ArrowLeft size={16} />
            {t('emergencyEventDetail.backToEvents')}
          </button>

          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <button
              onClick={async () => {
                const shareData = { title: event.title, url: window.location.href };
                const nav = navigator as Navigator & { share?: (data: { title?: string; url?: string }) => Promise<void> };
                if (nav.share) {
                  try {
                    await nav.share(shareData);
                  } catch (err) {
                    if ((err as Error).name !== 'AbortError') {
                      // ignore other share errors
                    }
                  }
                } else if (navigator.clipboard) {
                  await navigator.clipboard.writeText(window.location.href);
                  addToast(t('emergencyEventDetail.share.copied'), 'success');
                }
              }}
              className="flex items-center justify-center h-8 w-8 rounded-[10px] text-[#5C5C5C] hover:text-[#1A1A1A] hover:bg-[#F7F6F2] transition-colors"
              aria-label={t('emergencyEventDetail.share.button')}
              title={t('emergencyEventDetail.share.button')}
            >
              <Share size={18} />
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#E5E4E0] rounded-[14px] p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{t('emergencyEventDetail.edit.eventTitle')}</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-10 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{t('emergencyEventDetail.edit.description')}</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading || !editTitle.trim()}
                  className="h-10 px-4 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {editLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {t('emergencyEventDetail.edit.save')}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={editLoading}
                  className="h-10 px-4 text-sm font-medium text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors"
                >
                  {t('emergencyEventDetail.edit.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${typeColor}15` }}
                  >
                    <TypeIcon size={24} style={{ color: typeColor }} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#1A1A1A]">{event.title}</h1>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-0.5"
                        style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
                      >
                        {t(`emergencies.types.${event.type}`, event.type.replace('_', ' '))}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-0.5 ${
                          isActive
                            ? 'bg-[#FDECEA] text-[#C44536]'
                            : event.status === 'RESOLVED'
                            ? 'bg-[#EDF5EF] text-[#4A7C59]'
                            : 'bg-[#F7F6F2] text-[#8A8A8A]'
                        }`}
                      >
                        {isActive && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C44536] opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C44536]" />
                          </span>
                        )}
                        {event.status === 'ACTIVE' ? t('emergencyEventDetail.status.active') : event.status === 'RESOLVED' ? t('emergencyEventDetail.status.resolved') : t('emergencyEventDetail.status.cancelled')}
                      </span>
                      <span className="text-xs text-[#8A8A8A] flex items-center gap-1">
                        <Clock size={12} />
                        {t('common.started')} {timeAgo(event.startedAt)}
                      </span>
                      {event.resolvedAt && (
                        <span className="text-xs text-[#8A8A8A] flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          {t('common.resolved')} {timeAgo(event.resolvedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:shrink-0">
                  {canManageEvent && (
                    <button
                      onClick={startEdit}
                      className="flex items-center gap-2 text-sm font-semibold text-[#5B7B8A] bg-[#E8F0F2] border border-[#D0E0E4] rounded-[10px] px-4 py-2 hover:bg-[#D8E8EC] transition-colors"
                    >
                      <Pencil size={16} />
                      {t('common.edit')}
                    </button>
                  )}
                  {isActive && canManageEvent && (
                    <button
                      onClick={() => setResolveModalOpen(true)}
                      className="flex items-center gap-2 text-sm font-semibold text-white bg-[#4A7C59] rounded-[10px] px-4 py-2 hover:bg-[#3D6B4A] transition-colors"
                    >
                      <CheckCircle2 size={16} />
                      {t('emergencyEventDetail.resolve.button')}
                    </button>
                  )}
                </div>
              </div>

              {event.description && (
                <p className="mt-4 text-sm text-[#5C5C5C] leading-relaxed">{event.description}</p>
              )}

              {/* Scope tags */}
              {(event.targetTeams?.length || event.targetGroups?.length) ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {event.targetTeams?.map((t) => (
                    <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E8F0F2] text-[#5B7B8A] border border-[#D0E0E4]">
                      {t.name}
                    </span>
                  ))}
                  {event.targetGroups?.map((g) => (
                    <span key={g.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E8EDE7] text-[#4A5548] border border-[#D0E0D4]">
                      {g.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F7F6F2] text-[#8A8A8A] border border-[#E5E4E0]">
                  <Users size={10} />
                  {t('emergencyEventDetail.scope.allOrganizationMembers')}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Status CTA */}
      {showStatusCta && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white border border-[#E5E4E0] rounded-[14px] p-5"
        >
          <h3 className="text-sm font-medium text-[#5C5C5C] mb-3">
            {t('reportStatus.title')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleReportSafe}
              disabled={safeLoading}
              className="flex flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-[#4A7C59] bg-[#EDF5EF] p-4 text-[#4A7C59] hover:bg-[#D8E8DC] transition-colors disabled:opacity-70"
            >
              <ShieldCheck size={28} />
              <span className="text-sm font-semibold">{t('reportStatus.cards.imSafe.title')}</span>
            </button>
            <button
              onClick={() => setDistressModalOpen(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-[#C44536] bg-[#FDECEA] p-4 text-[#C44536] hover:bg-[#FCD5D0] transition-colors"
            >
              <AlertTriangle size={28} />
              <span className="text-sm font-semibold">{t('reportStatus.cards.iNeedHelp.title')}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <StatCard
          icon={Users}
          label={t('emergencyEventDetail.stats.totalTracked')}
          value={totalScoped}
          color="#8A8A8A"
          bg="#F7F6F2"
          active={activeFilters.has('all')}
          onClick={() => toggleFilter('all')}
        />
        <StatCard
          icon={ShieldCheck}
          label={t('emergencyEventDetail.stats.safe')}
          value={safe}
          color="#4A7C59"
          bg="#EDF5EF"
          active={activeFilters.has('safe')}
          onClick={() => toggleFilter('safe')}
        />
        <StatCard
          icon={AlertTriangle}
          label={t('emergencyEventDetail.stats.needHelp')}
          value={distress}
          color="#C44536"
          bg="#FDECEA"
          active={activeFilters.has('distress')}
          onClick={() => toggleFilter('distress')}
        />
        <StatCard
          icon={HelpCircle}
          label={t('emergencyEventDetail.stats.notUpdated')}
          value={unknown}
          color="#8A8A8A"
          bg="#F7F6F2"
          active={activeFilters.has('unknown')}
          onClick={() => toggleFilter('unknown')}
        />
      </motion.div>

      {/* Members List */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-white border border-[#E5E4E0] rounded-[14px] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#E5E4E0] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A]">{t('emergencyEventDetail.members.title')}</h2>
            <p className="text-sm text-[#8A8A8A]">
              {t('emergencyEventDetail.members.subtitle', { reported: safe + distress, total: totalScoped })}
            </p>
          </div>
          <div className="relative w-56">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder={t('emergencyEventDetail.members.searchPlaceholder')}
              className="w-full h-9 pl-9 pr-3 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
            />
          </div>
        </div>

        <div className="divide-y divide-[#E5E4E0]">
          {membersLoading || reportsLoading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-[#4A5548] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#8A8A8A]">
              {memberSearch.trim() ? t('emergencyEventDetail.members.noMatchSearch') : t('emergencyEventDetail.members.noMembersInScope')}
            </div>
          ) : (
            filteredMembers.map((member) => {
              const status = member.latestStatus;
              const config = status ? STATUS_CONFIG[status] : null;
              const isExpanded = expandedMemberId === member.memberId;
              const memberReports = getMemberReports(member.memberId);
              const hasReminded = remindedMemberIds.has(member.memberId);

              return (
                <div key={member.memberId} className="transition-colors">
                  <div
                    className="group flex items-stretch hover:bg-[#FAFAF8] transition-colors cursor-pointer"
                    onClick={() => setExpandedMemberId(isExpanded ? null : member.memberId)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex-1 px-6 py-3 flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E8EDE7] flex items-center justify-center text-xs font-semibold text-[#4A5548]">
                          {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">{member.name}</p>
                          <p className="text-xs text-[#8A8A8A]">{member.teamName || t('emergencyEventDetail.members.unassigned')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3">
                      {canManageEvent && member.latestStatus !== 'SAFE' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemind(member);
                          }}
                          disabled={remindingMemberId === member.memberId || hasReminded}
                          className={`flex items-center gap-1.5 text-sm border rounded-[10px] px-2.5 py-1 transition-all duration-150 disabled:opacity-40 ${
                            hasReminded
                              ? 'text-[#4A7C59] border-[#4A7C59] bg-[#EDF5EF]'
                              : 'text-[#C44536] border-[#C44536] opacity-70 hover:opacity-100 hover:bg-[#FDECEA]'
                          }`}
                        >
                          {remindingMemberId === member.memberId ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : hasReminded ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                              className="flex items-center"
                            >
                              <CheckCircle2 size={14} />
                            </motion.div>
                          ) : (
                            <Bell size={14} />
                          )}
                          {t('emergencyEventDetail.members.remind')}
                        </button>
                      )}
                      {member.latestLocation && (
                        <span className="text-xs text-[#8A8A8A] hidden sm:inline">{member.latestLocation}</span>
                      )}
                      {config ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5"
                          style={{ backgroundColor: config.bg, color: config.color }}
                        >
                          {t(config.label)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-[#F7F6F2] text-[#8A8A8A]">
                          {t('emergencyEventDetail.members.awaiting')}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-[#8A8A8A]" />
                      ) : (
                        <ChevronDown size={16} className="text-[#8A8A8A]" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 bg-[#FAFAF8]">
                          {memberReports.length === 0 ? (
                            <p className="text-sm text-[#8A8A8A] py-2">{t('emergencyEventDetail.reports.noStatusReports')}</p>
                          ) : (
                            <div className="space-y-2 pt-1">
                              {memberReports.map((report) => {
                                const rConfig = REPORT_STATUS_CONFIG[report.status];
                                return (
                                  <div
                                    key={report.id}
                                    className="bg-white border border-[#E5E4E0] rounded-[10px] p-3"
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span
                                        className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5"
                                        style={{ backgroundColor: rConfig.bg, color: rConfig.color }}
                                      >
                                        {t(rConfig.label)}
                                      </span>
                                      <span className="text-[11px] text-[#8A8A8A]">
                                        {timeAgo(report.createdAt)}
                                      </span>
                                    </div>
                                    <div className="space-y-1">
                                      {report.location && (
                                        <div className="flex items-center gap-1.5 text-xs text-[#5C5C5C]">
                                          <MapPin size={12} className="text-[#8A8A8A] shrink-0" />
                                          {report.location}
                                        </div>
                                      )}
                                      {report.note && (
                                        <div className="flex items-start gap-1.5 text-xs text-[#5C5C5C]">
                                          <FileText size={12} className="text-[#8A8A8A] shrink-0 mt-0.5" />
                                          {report.note}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Updates Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white border border-[#E5E4E0] rounded-[14px] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#E5E4E0]">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">{t('emergencyEventDetail.updates.title')}</h2>
          <p className="text-sm text-[#8A8A8A]">{t('emergencyEventDetail.updates.subtitle')}</p>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Add Update Form */}
          {isActive && canManageEvent && (
            <form onSubmit={handleAddUpdate} className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {(['PROGRESSING', 'ESCALATED', 'DEESCALATED', 'NOTE'] as const).map((updateTypeKey) => {
                  const config = UPDATE_TYPE_CONFIG[updateTypeKey];
                  return (
                    <button
                      key={updateTypeKey}
                      type="button"
                      onClick={() => setUpdateType(updateTypeKey)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        updateType === updateTypeKey
                          ? 'border-[#4A5548] bg-[#E8EDE7] text-[#1A1A1A]'
                          : 'border-[#E5E4E0] text-[#5C5C5C] hover:border-[#1A1A1A]'
                      }`}
                    >
                      {t(config.label)}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                  placeholder={t('emergencyEventDetail.updates.addUpdatePlaceholder')}
                  className="flex-1 h-10 px-3 bg-white border border-[#E5E4E0] rounded-[10px] text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all"
                />
                <button
                  type="submit"
                  disabled={updateLoading || !updateText.trim()}
                  className="h-10 px-4 text-sm font-medium text-white bg-[#1A1A1A] rounded-[10px] hover:bg-[#333] transition-colors disabled:opacity-60 flex items-center gap-1.5"
                >
                  <Send size={14} />
                  {t('emergencyEventDetail.updates.post')}
                </button>
              </div>
            </form>
          )}

          {/* Updates Timeline */}
          {updatesLoading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-[#4A5548] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : updates.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare size={32} className="text-[#D8D8D8] mx-auto mb-2" />
              <p className="text-sm text-[#8A8A8A]">{t('emergencyEventDetail.updates.noUpdates')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update, index) => {
                const config = UPDATE_TYPE_CONFIG[update.type];
                const UpdateIcon = config.icon;
                const isLast = index === updates.length - 1;

                return (
                  <div key={update.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${config.color}15` }}
                      >
                        <UpdateIcon size={14} style={{ color: config.color }} />
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-[#E5E4E0] min-h-[24px]" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#1A1A1A]">{update.createdByName}</span>
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${config.color}15`, color: config.color }}
                        >
                          {t(config.label)}
                        </span>
                      </div>
                      <p className="text-sm text-[#5C5C5C] mt-1 leading-relaxed">{update.text}</p>
                      <p className="text-xs text-[#8A8A8A] mt-1">{timeAgo(update.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Resolve Modal */}
      <ResolveEmergencyEventModal
        open={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        eventName={event.title}
        onResolve={handleResolve}
      />

      {/* Distress Modal */}
      <DistressFormModal
        open={distressModalOpen}
        onClose={() => setDistressModalOpen(false)}
        onSubmit={handleDistressSubmit}
      />


    </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  active,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  color: string;
  bg: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[10px] p-4 text-left w-full transition-all ${
        active ? 'opacity-100 hover:shadow-md' : 'opacity-40 hover:opacity-60'
      }`}
      style={{ backgroundColor: bg }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color }} />
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
    </button>
  );
}




