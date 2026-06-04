import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { EmployeeTableHeader } from '@/components/EmployeeTableHeader';
import { StatusTable } from '@/components/StatusTable';
import { EmployeeDetailModal } from '@/components/EmployeeDetailModal';
import type { Employee, EmployeeStatus } from '@/types';

interface MyTeamPageProps {
  employees: Employee[];
  currentUserId: number;
  isAdmin: boolean;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function MyTeamPage({ employees, currentUserId, isAdmin, addToast }: MyTeamPageProps) {
  const { t } = useTranslation();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus[]>(['safe', 'distress', 'unknown']);
  const [remindedMemberIds, setRemindedMemberIds] = useState<Set<string>>(new Set());
  const [remindingMemberId, setRemindingMemberId] = useState<string | null>(null);

  // Determine current user's team
  const currentUser = employees.find((e) => e.id === currentUserId);
  const teamName = currentUser?.team || 'Engineering';

  // Filter to team members
  const teamMembers = employees.filter((e) => e.team === teamName);

  const statusCounts = useMemo(() => {
    return {
      safe: teamMembers.filter((e) => e.status === 'safe').length,
      distress: teamMembers.filter((e) => e.status === 'distress').length,
      unknown: teamMembers.filter((e) => e.status === 'unknown').length,
    };
  }, [teamMembers]);

  const filteredTeamMembers = useMemo(() => {
    let result = [...teamMembers];
    if (statusFilter.length > 0 && statusFilter.length < 3) {
      result = result.filter((e) => statusFilter.includes(e.status));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }
    return result;
  }, [teamMembers, statusFilter, search]);

  const teamStats = {
    safe: teamMembers.filter((e) => e.status === 'safe').length,
    distress: teamMembers.filter((e) => e.status === 'distress').length,
    unknown: teamMembers.filter((e) => e.status === 'unknown').length,
  };

  const handleRowClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalOpen(true);
  };

  const handleRemind = async (employee: Employee) => {
    setRemindingMemberId(employee.memberId);
    try {
      await api.post(`/api/members/${employee.memberId}/remind`);
      setRemindedMemberIds((prev) => new Set(prev).add(employee.memberId));
      addToast(t('myTeam.toast.reminderSent', { name: employee.name }), 'success');
    } catch {
      addToast(t('myTeam.toast.reminderFailed', { name: employee.name }), 'error');
    } finally {
      setRemindingMemberId(null);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#E8EDE7] border border-[#D8E0D6] rounded-[14px] p-5"
      >
        <div className="flex items-center gap-3">
          <Users size={24} className="text-[#4A5548]" />
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A1A]">{t('myTeam.teamHeader', { team: teamName })}</h2>
            <p className="text-sm text-[#8A8A8A]">{t('myTeam.membersCount', { count: teamMembers.length })}</p>
          </div>
        </div>
      </motion.div>

      {/* Team Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="bg-white border border-[#E5E4E0] rounded-[14px] p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck size={18} className="text-[#4A7C59]" />
            <span className="text-sm font-medium text-[#5C5C5C]">{t('myTeam.stats.safe')}</span>
          </div>
          <span className="text-2xl font-bold text-[#4A7C59]">{teamStats.safe}</span>
        </div>
        <div className="bg-white border border-[#E5E4E0] rounded-[14px] p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-[#C44536]" />
            <span className="text-sm font-medium text-[#5C5C5C]">{t('myTeam.stats.distress')}</span>
          </div>
          <span className="text-2xl font-bold text-[#C44536]">{teamStats.distress}</span>
        </div>
        <div className="bg-white border border-[#E5E4E0] rounded-[14px] p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-center gap-2 mb-2">
            <HelpCircle size={18} className="text-[#9A9A9A]" />
            <span className="text-sm font-medium text-[#5C5C5C]">{t('myTeam.stats.notUpdated')}</span>
          </div>
          <span className="text-2xl font-bold text-[#9A9A9A]">{teamStats.unknown}</span>
        </div>
      </motion.div>

      {/* Team Members Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white border border-[#E5E4E0] rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
      >
        <EmployeeTableHeader
          title={t('myTeam.teamMembers.title')}
          subtitle={t('myTeam.teamMembers.subtitle', { team: teamName })}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusCounts={statusCounts}
          showTeamFilter={false}
        />
        <StatusTable
          employees={filteredTeamMembers}
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
    </div>
  );
}
