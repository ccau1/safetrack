import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Users, ShieldCheck, AlertTriangle, HelpCircle, Eye, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { StatsCard } from '@/components/StatsCard';
import { PulseDot } from '@/components/PulseDot';
import { FilterDropdown } from '@/components/FilterDropdown';
import { StatusTable } from '@/components/StatusTable';
import { EmployeeDetailModal } from '@/components/EmployeeDetailModal';
import { EmergencyEventDetailModal } from '@/components/EmergencyEventDetailModal';
import { CreateEmergencyEventModal } from '@/components/CreateEmergencyEventModal';
import type { Employee, EmergencyEvent, EmergencyEventApi, TeamApi, MemberGroup } from '@/types';

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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const filteredEmployees = activeTeam === 'all'
    ? employees
    : employees.filter((e) => e.team === activeTeam);

  const handleRowClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalOpen(true);
  };

  const handleRemind = async (employee: Employee) => {
    try {
      await api.post(`/api/members/${employee.memberId}/remind`);
      addToast(`Reminder sent to ${employee.name}`, 'success');
    } catch {
      addToast(`Failed to send reminder to ${employee.name}`, 'error');
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
          label="Total Employees"
          value={stats.total}
          trend="Organization-wide"
          delay={0}
        />
        <StatsCard
          icon={ShieldCheck}
          iconColor="#4A7C59"
          label="Marked Safe"
          value={stats.safe}
          trend={`${stats.total > 0 ? ((stats.safe / stats.total) * 100).toFixed(1) : 0}% of total`}
          trendColor="text-[#4A7C59]"
          delay={0.08}
        />
        <StatsCard
          icon={AlertTriangle}
          iconColor="#C44536"
          label="In Distress"
          value={stats.distress}
          trend="Needs immediate help"
          trendColor="text-[#C44536]"
          delay={0.16}
        />
        <StatsCard
          icon={HelpCircle}
          iconColor="#9A9A9A"
          label="Not Updated"
          value={stats.unknown}
          trend={`${((stats.unknown / stats.total) * 100).toFixed(1)}% of total`}
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
                Active Event: {event.name}
              </div>
              <div className="text-sm text-[#5C5C5C]">Started {event.started}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => event.uuid && navigate(`/emergency-events/${event.uuid}`)}
              className="flex items-center gap-2 text-sm font-semibold text-[#5B7B8A] bg-white border border-[#D0E0E4] rounded-[10px] px-3.5 py-1.5 hover:bg-[#F7F6F2] transition-colors duration-150"
            >
              <Eye size={16} />
              Full Details
            </button>
            <button
              onClick={() => setEventModalOpen(true)}
              className="flex items-center gap-2 text-sm font-semibold text-[#5B7B8A] bg-[#E8F0F2] border border-[#D0E0E4] rounded-[10px] px-3.5 py-1.5 hover:bg-[#D8E8EC] transition-colors duration-150"
            >
              Quick View
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
          <div className="text-sm text-[#5C5C5C]">No active emergency events</div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-[#C44536] rounded-[10px] px-4 py-2 hover:bg-[#A33A2E] transition-colors duration-150"
          >
            <Plus size={16} />
            Create Event
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4E0]">
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A1A]">Employee Status</h2>
            <p className="text-sm text-[#8A8A8A]">Real-time updates from your organization</p>
          </div>
          <FilterDropdown teams={teams} activeTeam={activeTeam} onSelect={onTeamFilter} />
        </div>

        {/* Table */}
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
            addToast('Emergency event created', 'success');
          }
        }}
      />
    </div>
  );
}
