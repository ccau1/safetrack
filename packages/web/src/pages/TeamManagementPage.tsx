import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, Users, ChevronDown, Loader2, X, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { TeamApi, Member, ToastItem } from '@/types';

interface TeamManagementPageProps {
  teams: TeamApi[];
  members: Member[];
  orgId: string | null;
  addToast: (message: string, type: ToastItem['type'], action?: { label: string; onClick: () => void }, duration?: number) => string;
  removeToast: (id: string) => void;
  onMutated: () => void;
}

export function TeamManagementPage({
  teams,
  members,
  orgId,
  addToast,
  removeToast,
  onMutated,
}: TeamManagementPageProps) {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);

  const [assigningMemberId, setAssigningMemberId] = useState<string | null>(null);
  const [assignmentTeamId, setAssignmentTeamId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<Map<string, { name: string; toastId: string; timer: number }>>(new Map());

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !newTeamName.trim()) return;
    setCreating(true);
    try {
      await api.post(`/api/organizations/${orgId}/teams`, { name: newTeamName.trim() });
      addToast(t('teamManagement.toast.created', { name: newTeamName.trim() }), 'success');
      setNewTeamName('');
      setCreateOpen(false);
      onMutated();
    } catch {
      addToast(t('teamManagement.toast.failedCreate'), 'error');
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
      addToast(t('teamManagement.toast.assignmentUpdated'), 'success');
      setAssigningMemberId(null);
      setAssignmentTeamId(null);
      onMutated();
    } catch {
      addToast(t('teamManagement.toast.failedAssignment'), 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteTeam = () => {
    if (!confirmDelete) return;
    const { id, name } = confirmDelete;
    setConfirmDelete(null);

    // Optimistically hide the team and schedule the actual delete
    const timer = window.setTimeout(async () => {
      try {
        await api.delete(`/api/teams/${id}`);
        addToast(t('teamManagement.toast.deleted', { name }), 'success');
        onMutated();
      } catch {
        addToast(t('teamManagement.toast.failedDelete'), 'error');
      } finally {
        setPendingDeletes((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      }
    }, 4000);

    const toastId = addToast(
      t('teamManagement.toast.deleted', { name }),
      'info',
      {
        label: t('teamManagement.toast.undo'),
        onClick: () => {
          window.clearTimeout(timer);
          removeToast(toastId);
          setPendingDeletes((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
        },
      },
      4000
    );

    setPendingDeletes((prev) => new Map(prev).set(id, { name, toastId, timer }));
  };

  const visibleTeams = teams.filter((team) => !pendingDeletes.has(team.id));
  const visibleTeamIds = new Set(visibleTeams.map((t) => t.id));
  const unassignedMembers = members.filter((m) => !m.teamId || !visibleTeamIds.has(m.teamId));

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
          <h2 className="text-2xl font-bold text-[#1A1A1A]">{t('teamManagement.title')}</h2>
          <p className="text-sm text-[#8A8A8A] mt-1">
            {t('teamManagement.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen((v) => !v)}
          className="flex items-center gap-2 px-4 h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150"
        >
          <Plus size={16} />
          {t('teamManagement.newTeam')}
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
              placeholder={t('teamManagement.createForm.placeholder')}
              required
              className="flex-1 h-10 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
            />
            <button
              type="submit"
              disabled={creating}
              className="h-10 px-4 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : t('teamManagement.createForm.create')}
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
        {teams
          .filter((team) => !pendingDeletes.has(team.id))
          .map((team) => {
          const teamMembers = members.filter((m) => m.teamId === team.id);
          return (
            <div
              key={team.id}
              className="bg-white border border-[#E5E4E0] rounded-[14px] p-5 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#E8EDE7] flex items-center justify-center">
                    <Users size={18} className="text-[#4A5548]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#1A1A1A]">{team.name}</h3>
                    <p className="text-xs text-[#8A8A8A]">{t('teamManagement.teamCard.members', { count: teamMembers.length })}</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmDelete({ id: team.id, name: team.name })}
                  className="p-2 text-[#8A8A8A] hover:text-[#C44536] transition-colors"
                  title={t('common.delete')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {teamMembers.length === 0 ? (
                  <span className="text-xs text-[#8A8A8A]">{t('teamManagement.teamCard.noMembers')}</span>
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
                  <span className="text-xs text-[#8A8A8A] px-1">{t('teamManagement.teamCard.more', { count: teamMembers.length - 6 })}</span>
                )}
              </div>
            </div>
          );
        })}

        {teams.filter((team) => !pendingDeletes.has(team.id)).length === 0 && (
          <div className="col-span-2 text-center py-12 bg-white border border-[#E5E4E0] rounded-[14px]">
            <Users size={32} className="text-[#D8E0D6] mx-auto mb-3" />
            <p className="text-sm text-[#8A8A8A]">{t('teamManagement.noTeams')}</p>
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
          <h3 className="text-base font-semibold text-[#1A1A1A]">{t('teamManagement.unassignedMembers.title')}</h3>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            {t('teamManagement.unassignedMembers.subtitle')}
          </p>
        </div>

        <div className="divide-y divide-[#E5E4E0]">
          {unassignedMembers.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#8A8A8A]">
              {t('teamManagement.unassignedMembers.allAssigned')}
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
                      <option value="">{t('teamManagement.unassignedMembers.unassigned')}</option>
                      {visibleTeams.map((t) => (
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
                      {assigning ? <Loader2 size={14} className="animate-spin" /> : t('teamManagement.unassignedMembers.save')}
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
                    {t('teamManagement.unassignedMembers.assignToTeam')}
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-[14px] p-6 w-full max-w-sm mx-4 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-[#1A1A1A]">{t('teamManagement.deleteModal.title')}</h3>
            <p className="text-sm text-[#5C5C5C] mt-2"
              dangerouslySetInnerHTML={{ __html: t('teamManagement.deleteModal.message', { name: confirmDelete.name }) }}
            />
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="h-10 px-4 text-sm font-medium text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors"
              >
                {t('teamManagement.deleteModal.cancel')}
              </button>
              <button
                onClick={handleDeleteTeam}
                className="h-10 px-4 text-sm font-semibold text-white bg-[#C44536] rounded-[10px] hover:bg-[#A63A2E] transition-colors"
              >
                {t('teamManagement.deleteModal.delete')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
