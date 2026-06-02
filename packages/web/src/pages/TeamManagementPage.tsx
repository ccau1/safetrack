import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, ChevronDown, Loader2, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { TeamApi, Member, ToastItem } from '@/types';

interface TeamManagementPageProps {
  teams: TeamApi[];
  members: Member[];
  orgId: string | null;
  addToast: (message: string, type: ToastItem['type']) => void;
  onMutated: () => void;
}

export function TeamManagementPage({
  teams,
  members,
  orgId,
  addToast,
  onMutated,
}: TeamManagementPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  const [assigningMemberId, setAssigningMemberId] = useState<string | null>(null);
  const [assignmentTeamId, setAssignmentTeamId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !newTeamName.trim()) return;
    setCreating(true);
    try {
      await api.post(`/api/organizations/${orgId}/teams`, { name: newTeamName.trim() });
      addToast(`Team "${newTeamName.trim()}" created`, 'success');
      setNewTeamName('');
      setCreateOpen(false);
      onMutated();
    } catch {
      addToast('Failed to create team', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async (memberId: string) => {
    if (!memberId) return;
    setAssigning(true);
    try {
      await api.patch(`/api/members/${memberId}/team`, {
        teamId: assignmentTeamId || null,
      });
      addToast('Team assignment updated', 'success');
      setAssigningMemberId(null);
      setAssignmentTeamId(null);
      onMutated();
    } catch {
      addToast('Failed to update team assignment', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const unassignedMembers = members.filter((m) => !m.teamId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Team Management</h2>
          <p className="text-sm text-[#8A8A8A] mt-1">
            Create teams and assign members
          </p>
        </div>
        <button
          onClick={() => setCreateOpen((v) => !v)}
          className="flex items-center gap-2 px-4 h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150"
        >
          <Plus size={16} />
          New Team
        </button>
      </motion.div>

      {/* Create Team Form */}
      {createOpen && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleCreateTeam}
          className="bg-white border border-[#E5E4E0] rounded-[14px] p-5"
        >
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name (e.g., Engineering)"
              required
              className="flex-1 h-10 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
            />
            <button
              type="submit"
              disabled={creating}
              className="h-10 px-4 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="h-10 px-3 text-sm text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.form>
      )}

      {/* Teams List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {teams.map((team) => {
          const teamMembers = members.filter((m) => m.teamId === team.id);
          return (
            <div
              key={team.id}
              className="bg-white border border-[#E5E4E0] rounded-[14px] p-5 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#E8EDE7] flex items-center justify-center">
                  <Users size={18} className="text-[#4A5548]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1A1A1A]">{team.name}</h3>
                  <p className="text-xs text-[#8A8A8A]">{teamMembers.length} members</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {teamMembers.length === 0 ? (
                  <span className="text-xs text-[#8A8A8A]">No members assigned</span>
                ) : (
                  teamMembers.slice(0, 6).map((m) => (
                    <span
                      key={m.id}
                      className="text-xs bg-[#F7F6F2] text-[#5C5C5C] rounded-full px-2.5 py-1"
                    >
                      {m.firstName} {m.lastName}
                    </span>
                  ))
                )}
                {teamMembers.length > 6 && (
                  <span className="text-xs text-[#8A8A8A] px-1">+{teamMembers.length - 6} more</span>
                )}
              </div>
            </div>
          );
        })}

        {teams.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-white border border-[#E5E4E0] rounded-[14px]">
            <Users size={32} className="text-[#D8E0D6] mx-auto mb-3" />
            <p className="text-sm text-[#8A8A8A]">No teams yet. Create your first team above.</p>
          </div>
        )}
      </motion.div>

      {/* Unassigned Members */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white border border-[#E5E4E0] rounded-[14px] overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[#E5E4E0]">
          <h3 className="text-base font-semibold text-[#1A1A1A]">Unassigned Members</h3>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            Assign members to teams to organize your organization
          </p>
        </div>

        <div className="divide-y divide-[#E5E4E0]">
          {unassignedMembers.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#8A8A8A]">
              All members are assigned to teams
            </div>
          ) : (
            unassignedMembers.map((member) => (
              <div
                key={member.id}
                className="px-5 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#E8EDE7] flex items-center justify-center text-xs font-semibold text-[#4A5548] shrink-0">
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-[#8A8A8A]">{member.email}</p>
                  </div>
                </div>

                {assigningMemberId === member.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={assignmentTeamId || ''}
                      onChange={(e) => setAssignmentTeamId(e.target.value || null)}
                      className="h-9 text-sm bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] px-3 focus:outline-none focus:border-[#4A5548]"
                    >
                      <option value="">Unassigned</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(member.id)}
                      disabled={assigning}
                      className="h-9 px-3 text-xs font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] disabled:opacity-60"
                    >
                      {assigning ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setAssigningMemberId(null);
                        setAssignmentTeamId(null);
                      }}
                      className="h-9 px-2 text-xs text-[#5C5C5C] hover:text-[#1A1A1A]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAssigningMemberId(member.id);
                      setAssignmentTeamId(member.teamId);
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-[#4A5548] bg-[#E8EDE7] rounded-[10px] px-3 py-2 hover:bg-[#D8E0D6] transition-colors shrink-0"
                  >
                    Assign to Team
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
