import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building, Mail } from 'lucide-react';
import { FilterDropdown } from '@/components/FilterDropdown';
import { StatusTable } from '@/components/StatusTable';
import { EmployeeDetailModal } from '@/components/EmployeeDetailModal';
import { InviteMembersModal } from '@/components/InviteMembersModal';
import type { Employee } from '@/types';

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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const filteredEmployees = activeTeam === 'all'
    ? employees
    : employees.filter((e) => e.team === activeTeam);

  const handleRowClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalOpen(true);
  };

  const handleRemind = (employee: Employee) => {
    addToast(`Reminder sent to ${employee.name}`, 'success');
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
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Organization</h2>
            <p className="text-sm text-[#8A8A8A]">
              {employees.length} employees across {teams.length} teams
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150"
          >
            <Mail size={16} />
            Invite Members
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4E0]">
          <div>
            <h3 className="text-xl font-semibold text-[#1A1A1A]">All Employees</h3>
            <p className="text-sm text-[#8A8A8A]">Full organization status overview</p>
          </div>
          <FilterDropdown teams={teams} activeTeam={activeTeam} onSelect={onTeamFilter} />
        </div>
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
