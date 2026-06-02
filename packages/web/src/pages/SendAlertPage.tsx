import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Send } from 'lucide-react';
import { StatusTable } from '@/components/StatusTable';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import type { Employee } from '@/types';

interface SendAlertPageProps {
  employees: Employee[];
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type AlertTab = 'all' | 'team' | 'specific';

const PRESET_MESSAGES = [
  'Please check in now',
  'Are you safe?',
  'Update your status',
  'Need help? Reply here',
];

export function SendAlertPage({ employees, addToast }: SendAlertPageProps) {
  const [activeTab, setActiveTab] = useState<AlertTab>('all');
  const [message, setMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const unknownEmployees = employees.filter((e) => e.status === 'unknown');
  const teams = useMemo(() => {
    const teamMap = new Map<string, number>();
    unknownEmployees.forEach((e) => {
      teamMap.set(e.team, (teamMap.get(e.team) || 0) + 1);
    });
    return Array.from(teamMap.entries()).map(([name, count]) => ({ name, count }));
  }, [unknownEmployees]);

  const recipientCount = activeTab === 'all' ? unknownEmployees.length : selectedIds.length;
  const canSend = recipientCount > 0 && message.trim().length > 0;

  const toggleSelection = (id: number) => {
    if (id === -1) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllInTeam = (teamName: string) => {
    const teamIds = unknownEmployees
      .filter((e) => e.team === teamName)
      .map((e) => e.id);
    setSelectedIds((prev) => {
      const withoutTeam = prev.filter((id) => !teamIds.includes(id));
      const allSelected = teamIds.every((id) => prev.includes(id));
      return allSelected ? withoutTeam : [...withoutTeam, ...teamIds];
    });
  };

  const handleSend = () => {
    setConfirmOpen(true);
  };

  const handleConfirmSend = () => {
    addToast(`Alert sent to ${recipientCount} employees`, 'success');
    setMessage('');
    setSelectedIds([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Alert Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#C44536] rounded-[14px] px-6 py-6 text-white"
      >
        <div className="flex items-center gap-3 mb-2">
          <Megaphone size={24} />
          <h2 className="text-2xl font-bold">Send Alert</h2>
        </div>
        <p className="text-sm text-white/80">
          Send notifications to employees who haven&apos;t updated their status.
        </p>
      </motion.div>

      {/* Recipient Selection */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white border border-[#E5E4E0] rounded-[14px] p-5"
      >
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-5">
          {([
            { key: 'all' as AlertTab, label: 'All Not Updated' },
            { key: 'team' as AlertTab, label: 'By Team' },
            { key: 'specific' as AlertTab, label: 'Specific People' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSelectedIds([]);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                activeTab === tab.key
                  ? 'bg-[#4A5548] text-white'
                  : 'bg-[#F7F6F2] text-[#5C5C5C] border border-[#E5E4E0] hover:bg-[#FAFAF8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'all' && (
          <div>
            <p className="text-sm text-[#5C5C5C] mb-4">
              <span className="font-semibold text-[#C44536]">{unknownEmployees.length}</span> employees have not updated their status
            </p>
            <StatusTable
              employees={unknownEmployees}
              updatedRowId={null}
              onRowClick={() => {}}
              showCheckboxes
              selectedIds={activeTab === 'all' ? unknownEmployees.map((e) => e.id) : selectedIds}
              onToggleSelect={activeTab === 'all' ? () => {} : toggleSelection}
            />
          </div>
        )}

        {activeTab === 'team' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <div
                key={team.name}
                className="border border-[#E5E4E0] rounded-[14px] p-4 hover:bg-[#FAFAF8] transition-colors duration-150"
              >
                <h4 className="text-base font-semibold text-[#1A1A1A] mb-1">{team.name}</h4>
                <p className="text-sm text-[#C44536] mb-3">{team.count} not updated</p>
                <button
                  onClick={() => handleSelectAllInTeam(team.name)}
                  className="text-sm font-medium text-[#4A5548] bg-[#E8EDE7] rounded-[10px] px-4 py-2 hover:bg-[#D8E0D6] transition-colors duration-150"
                >
                  {selectedIds.some((id) =>
                    unknownEmployees.find((e) => e.id === id && e.team === team.name)
                  )
                    ? 'Deselect Team'
                    : 'Select All in Team'}
                </button>
              </div>
            ))}
            {teams.length === 0 && (
              <div className="col-span-2 text-center py-8 text-sm text-[#8A8A8A]">
                All employees have updated their status
              </div>
            )}
          </div>
        )}

        {activeTab === 'specific' && (
          <div>
            <p className="text-sm text-[#5C5C5C] mb-4">
              Select individual employees to notify
            </p>
            <StatusTable
              employees={unknownEmployees}
              updatedRowId={null}
              onRowClick={() => {}}
              showCheckboxes
              selectedIds={selectedIds}
              onToggleSelect={toggleSelection}
            />
          </div>
        )}
      </motion.div>

      {/* Message Composer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white border border-[#E5E4E0] rounded-[14px] p-5"
      >
        <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-2">
          Alert Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 500))}
          placeholder="Please update your status immediately. Let us know if you need help."
          rows={5}
          className="w-full border border-[#E5E4E0] rounded-[10px] px-3 py-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_MESSAGES.map((preset) => (
              <button
                key={preset}
                onClick={() => setMessage(preset)}
                className="text-xs text-[#4A5548] bg-[#E8EDE7] rounded-full px-3 py-1 hover:bg-[#D8E0D6] transition-colors duration-150"
              >
                {preset}
              </button>
            ))}
          </div>
          <span className="text-xs text-[#8A8A8A]">{message.length}/500</span>
        </div>
      </motion.div>

      {/* Send Button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white bg-[#C44536] rounded-[10px] hover:bg-[#A33A2E] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          Send Alert to {recipientCount} {recipientCount === 1 ? 'Employee' : 'Employees'}
        </button>
      </motion.div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSend}
        title="Confirm Alert"
        message={`You are about to send an alert to ${recipientCount} employees who have not updated their status. This action cannot be undone.`}
        confirmText="Send to {count} Employees"
        recipientCount={recipientCount}
      />
    </div>
  );
}
