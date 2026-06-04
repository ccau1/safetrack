import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Building, Mail } from 'lucide-react';
import { EmployeeTableHeader } from '@/components/EmployeeTableHeader';
import { StatusTable } from '@/components/StatusTable';
import { EmployeeDetailModal } from '@/components/EmployeeDetailModal';
import { InviteMembersModal } from '@/components/InviteMembersModal';
import type { Employee, EmployeeStatus } from '@/types';

interface OrganizationPageProps {
  employees: Employee[];
  teams: string[];
  activeTeam: string;
  onTeamFilter: (team: string) => void;
  isAdmin: boolean;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  orgId: string | null;
}

export function OrganizationPage({
  employees,
  teams,
  activeTeam,
  onTeamFilter,
  isAdmin,
  addToast,
  orgId,
}: OrganizationPageProps) {
  const { t } = useTranslation();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus[]>(['safe', 'distress', 'unknown']);

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

  const handleRemind = (employee: Employee) => {
    addToast(t('organization.toast.reminderSent', { name: employee.name }), 'success');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Building size={24} className="text-[#4A5548]" />
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">{t('organization.title')}</h2>
            <p className="text-sm text-[#8A8A8A]">
              {t('organization.employeeCount', { count: employees.length, teams: teams.length })}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150"
          >
            <Mail size={16} />
            {t('common.inviteMembers')}
          </button>
        )}
      </motion.div>

      {/* Status Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white border border-[#E5E4E0] rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden"
      >
        <EmployeeTableHeader
          title={t('organization.allEmployees.title')}
          subtitle={t('organization.allEmployees.subtitle')}
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
        <StatusTable
          employees={filteredEmployees}
          onRowClick={handleRowClick}
          onRemind={isAdmin ? handleRemind : undefined}
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
      />

      {/* Invite Members Modal */}
      <InviteMembersModal
        orgId={orgId}
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        addToast={addToast}
      />
    </div>
  );
}
