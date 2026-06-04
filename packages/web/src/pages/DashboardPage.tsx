import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Users, ShieldCheck, AlertTriangle, HelpCircle, Eye, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { StatsCard } from '@/components/StatsCard';
import { PulseDot } from '@/components/PulseDot';
import { EmployeeTableHeader } from '@/components/EmployeeTableHeader';
import { StatusTable } from '@/components/StatusTable';
import { EmployeeDetailModal } from '@/components/EmployeeDetailModal';
import { EmergencyEventDetailModal } from '@/components/EmergencyEventDetailModal';
import { CreateEmergencyEventModal } from '@/components/CreateEmergencyEventModal';
import type { Employee, EmergencyEvent, EmergencyEventApi, TeamApi, MemberGroup, EmployeeStatus } from '@/types';

interface DashboardPageProps {
  employees: Employee[];
  teams: string[];
  availableTeams: TeamApi[];
  availableGroups: MemberGroup[];
  stats: { total: number; safe: number; distress: number; unknown: number };
  event: EmergencyEvent | null;
  activeTeam: string;
  onTeamFilter: (team: string) => void;
  isAdmin: boolean;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  createEvent?: (title: string, description: string, type: EmergencyEventApi['type'], startedAt: string, targetTeamIds?: string[], targetGroupIds?: string[]) => Promise<void>;
}

export function DashboardPage({
  employees,
  teams,
  availableTeams,
  availableGroups,
  stats,
  event,
  activeTeam,
  onTeamFilter,
  isAdmin,
  addToast,
  createEvent,
}: DashboardPageProps) {
  const { t } = useTranslation();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus[]>(['safe', 'distress', 'unknown']);
  const [remindedMemberIds, setRemindedMemberIds] = useState<Set<string>>(new Set());
  const [remindingMemberId, setRemindingMemberId] = useState<string | null>(null);
  const navigate = useNavigate();

  const baseEmployees = useMemo(() => {
    return activeTeam === 'all' ? employees : employees.filter((e) => e.team === activeTeam);
  }, [employees, activeTeam]);

  const statusCounts = useMemo(() => {
    return {
      safe: baseEmployees.filter((e) => e.status === 'safe').length,
      distress: baseEmployees.filter((e) => e.status === 'distress').length,
      unknown: baseEmployees.filter((e) => e.status === 'unknown').length,
    };
  }, [baseEmployees]);

  const filteredEmployees = useMemo(() => {
    let result = [...baseEmployees];
    if (statusFilter.length > 0 && statusFilter.length < 3) {
      result = result.filter((e) => statusFilter.includes(e.status));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }
    return result;
  }, [baseEmployees, statusFilter, search]);

  const handleRowClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalOpen(true);
  };

  const handleRemind = async (employee: Employee) => {
    setRemindingMemberId(employee.memberId);
    try {
      await api.post(`/api/members/${employee.memberId}/remind`);
      setRemindedMemberIds((prev) => new Set(prev).add(employee.memberId));
      addToast(t('dashboard.toast.reminderSent', { name: employee.name }), 'success');
    } catch {
      addToast(t('dashboard.toast.reminderFailed', { name: employee.name }), 'error');
    } finally {
      setRemindingMemberId(null);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          iconColor="#8A8A8A"
          label={t('dashboard.stats.totalEmployees')}
          value={stats.total}
          trend={t('dashboard.stats.organizationWide')}
          delay={0}
        />
        <StatsCard
          icon={ShieldCheck}
          iconColor="#4A7C59"
          label={t('dashboard.stats.markedSafe')}
          value={stats.safe}
          trend={t('dashboard.stats.percentOfTotal', { percent: stats.total > 0 ? ((stats.safe / stats.total) * 100).toFixed(1) : 0 })}
          trendColor="text-[#4A7C59]"
          delay={0.08}
        />
        <StatsCard
          icon={AlertTriangle}
          iconColor="#C44536"
          label={t('dashboard.stats.inDistress')}
          value={stats.distress}
          trend={t('dashboard.stats.needsImmediateHelp')}
          trendColor="text-[#C44536]"
          delay={0.16}
        />
        <StatsCard
          icon={HelpCircle}
          iconColor="#9A9A9A"
          label={t('dashboard.stats.notUpdated')}
          value={stats.unknown}
          trend={t('dashboard.stats.percentOfTotal', { percent: ((stats.unknown / stats.total) * 100).toFixed(1) })}
          delay={0.24}
        />
      </div>

      {/* Event Banner */}
      {event && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-[#E8F0F2] border border-[#D0E0E4] rounded-[14px] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <PulseDot color="#C44536" size={10} />
            <div>
              <div className="text-base font-semibold text-[#1A1A1A]">
                {t('dashboard.eventBanner.activeEvent', { name: event.name })}
              </div>
              <div className="text-sm text-[#5C5C5C]">{t('dashboard.eventBanner.started', { date: event.started })}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => event.uuid && navigate(`/emergency-events/${event.uuid}`)}
              className="flex items-center gap-2 text-sm font-semibold text-[#5B7B8A] bg-white border border-[#D0E0E4] rounded-[10px] px-3.5 py-1.5 hover:bg-[#F7F6F2] transition-colors duration-150"
            >
              <Eye size={16} />
              {t('dashboard.eventBanner.fullDetails')}
            </button>
            <button
              onClick={() => setEventModalOpen(true)}
              className="flex items-center gap-2 text-sm font-semibold text-[#5B7B8A] bg-[#E8F0F2] border border-[#D0E0E4] rounded-[10px] px-3.5 py-1.5 hover:bg-[#D8E8EC] transition-colors duration-150"
            >
              {t('dashboard.eventBanner.quickView')}
            </button>
          </div>
        </motion.div>
      )}

      {!event && isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white border border-[#E5E4E0] rounded-[14px] px-5 py-4 flex items-center justify-between"
        >
          <div className="text-sm text-[#5C5C5C]">{t('dashboard.eventBanner.noActiveEvents')}</div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-[#C44536] rounded-[10px] px-4 py-2 hover:bg-[#A33A2E] transition-colors duration-150"
          >
            <Plus size={16} />
            {t('dashboard.eventBanner.createEvent')}
          </button>
        </motion.div>
      )}

      {/* Status Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white border border-[#E5E4E0] rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
      >
        {/* Table Header */}
        <EmployeeTableHeader
          title={t('dashboard.employeeStatus.title')}
          subtitle={t('dashboard.employeeStatus.subtitle')}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusCounts={statusCounts}
          teamFilter={activeTeam}
          onTeamFilterChange={onTeamFilter}
          teams={teams}
          showTeamFilter
        />

        {/* Table */}
        <StatusTable
          employees={filteredEmployees}
          onRowClick={handleRowClick}
          onRemind={isAdmin ? handleRemind : undefined}
          remindedMemberIds={remindedMemberIds}
          remindingMemberId={remindingMemberId}
          isAdmin={isAdmin}
        />
      </motion.div>

      {/* Employee Detail Modal */}
      <EmployeeDetailModal
        employee={selectedEmployee}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isAdmin={isAdmin}
        onRemind={handleRemind}
        remindedMemberIds={remindedMemberIds}
        remindingMemberId={remindingMemberId}
      />

      {/* Event Detail Modal */}
      {event && (
        <EmergencyEventDetailModal
          open={eventModalOpen}
          onClose={() => setEventModalOpen(false)}
          event={event}
          stats={stats}
        />
      )}

      {/* Create Event Modal */}
      <CreateEmergencyEventModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        teams={availableTeams}
        groups={availableGroups}
        onCreate={async (title, description, type, startedAt, targetTeamIds, targetGroupIds) => {
          if (createEvent) {
            await createEvent(title, description, type, startedAt, targetTeamIds, targetGroupIds);
            addToast(t('dashboard.toast.eventCreated'), 'success');
          }
        }}
      />
    </div>
  );
}
