import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Search, X, Trash2, Loader2, Check, Pencil, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { MemberGroup, Member, TeamApi, ToastItem } from '@/types';

interface GroupManagementPageProps {
  groups: MemberGroup[];
  members: Member[];
  teams: TeamApi[];
  orgId: string | null;
  addToast: (message: string, type: ToastItem['type']) => void;
  onMutated: () => void;
}

export function GroupManagementPage({
  groups,
  members,
  teams,
  orgId,
  addToast,
  onMutated,
}: GroupManagementPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingGroup, setEditingGroup] = useState<MemberGroup | null>(null);
  const [editName, setEditName] = useState('');
  const [editMemberIds, setEditMemberIds] = useState<Set<string>>(new Set());
  const [editTeamIds, setEditTeamIds] = useState<Set<string>>(new Set());
  const [editSearch, setEditSearch] = useState('');
  const [editTeamSearch, setEditTeamSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());

  const [confirmDelete, setConfirmDelete] = useState<MemberGroup | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const q = memberSearch.toLowerCase();
    return members.filter(
      (m) =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  const filteredTeams = useMemo(() => {
    if (!teamSearch.trim()) return teams;
    const q = teamSearch.toLowerCase();
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, teamSearch]);

  const filteredEditMembers = useMemo(() => {
    if (!editSearch.trim()) return members;
    const q = editSearch.toLowerCase();
    return members.filter(
      (m) =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, editSearch]);

  const filteredEditTeams = useMemo(() => {
    if (!editTeamSearch.trim()) return teams;
    const q = editTeamSearch.toLowerCase();
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, editTeamSearch]);

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTeam = (id: string) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEditMember = (id: string) => {
    setEditMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEditTeam = (id: string) => {
    setEditTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !newGroupName.trim()) return;
    setCreating(true);
    try {
      await api.post(`/api/organizations/${orgId}/member-groups`, {
        name: newGroupName.trim(),
        memberIds: Array.from(selectedMemberIds),
        teamIds: Array.from(selectedTeamIds),
      });
      addToast(`Group "${newGroupName.trim()}" created`, 'success');
      setNewGroupName('');
      setSelectedMemberIds(new Set());
      setSelectedTeamIds(new Set());
      setMemberSearch('');
      setTeamSearch('');
      setCreateOpen(false);
      onMutated();
    } catch {
      addToast('Failed to create group', 'error');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (group: MemberGroup) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditMemberIds(new Set(group.members.map((m) => m.id)));
    setEditTeamIds(new Set(group.teams.map((t) => t.id)));
    setEditSearch('');
    setEditTeamSearch('');
  };

  const handleSaveEdit = async () => {
    if (!editingGroup || !editName.trim()) return;
    setSaving(true);
    try {
      await api.put(`/api/member-groups/${editingGroup.id}`, {
        name: editName.trim(),
        memberIds: Array.from(editMemberIds),
        teamIds: Array.from(editTeamIds),
      });
      addToast('Group updated', 'success');
      setEditingGroup(null);
      onMutated();
    } catch {
      addToast('Failed to update group', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/api/member-groups/${confirmDelete.id}`);
      addToast(`Group "${confirmDelete.name}" deleted`, 'success');
      setConfirmDelete(null);
      onMutated();
    } catch {
      addToast('Failed to delete group', 'error');
    } finally {
      setDeleting(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Group Management</h2>
          <p className="text-sm text-[#8A8A8A] mt-1">
            Create groups and assign members or teams for scoped emergency events
          </p>
        </div>
        <button
          onClick={() => setCreateOpen((v) => !v)}
          className="flex items-center gap-2 px-4 h-10 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150"
        >
          <Plus size={16} />
          New Group
        </button>
      </motion.div>

      {/* Create Group Form */}
      {createOpen && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleCreate}
          className="bg-white border border-[#E5E4E0] rounded-[14px] p-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Group Name</label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Building A, Floor 3"
              required
              className="w-full h-10 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Members selector */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Members ({selectedMemberIds.size} selected)
              </label>
              <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search members..."
                  className="w-full h-9 pl-9 pr-3 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                />
              </div>
              <div className="border border-[#E5E4E0] rounded-[10px] max-h-[200px] overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <p className="text-sm text-[#8A8A8A] text-center py-4">No members found</p>
                ) : (
                  filteredMembers.map((member) => {
                    const isSelected = selectedMemberIds.has(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleMember(member.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                          isSelected ? 'bg-[#E8EDE7]' : 'hover:bg-[#F7F6F2]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#4A5548] border-[#4A5548]' : 'border-[#E5E4E0] bg-white'
                          }`}
                        >
                          {isSelected && <Check size={10} className="text-white" />}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#E8EDE7] flex items-center justify-center text-xs font-semibold text-[#4A5548] shrink-0">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#1A1A1A] truncate">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs text-[#8A8A8A]">{member.email}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Teams selector */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Teams ({selectedTeamIds.size} selected)
              </label>
              <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                <input
                  type="text"
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  placeholder="Search teams..."
                  className="w-full h-9 pl-9 pr-3 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                />
              </div>
              <div className="border border-[#E5E4E0] rounded-[10px] max-h-[200px] overflow-y-auto">
                {filteredTeams.length === 0 ? (
                  <p className="text-sm text-[#8A8A8A] text-center py-4">No teams found</p>
                ) : (
                  filteredTeams.map((team) => {
                    const isSelected = selectedTeamIds.has(team.id);
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => toggleTeam(team.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                          isSelected ? 'bg-[#E8EDE7]' : 'hover:bg-[#F7F6F2]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#4A5548] border-[#4A5548]' : 'border-[#E5E4E0] bg-white'
                          }`}
                        >
                          {isSelected && <Check size={10} className="text-white" />}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#E8F0F2] flex items-center justify-center text-xs font-semibold text-[#5B7B8A] shrink-0">
                          <Building2 size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#1A1A1A] truncate">{team.name}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={creating}
              className="h-10 px-4 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateOpen(false);
                setNewGroupName('');
                setSelectedMemberIds(new Set());
                setSelectedTeamIds(new Set());
                setMemberSearch('');
                setTeamSearch('');
              }}
              className="h-10 px-3 text-sm text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.form>
      )}

      {/* Groups List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white border border-[#E5E4E0] rounded-[14px] p-5 hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#E8F0F2] flex items-center justify-center">
                  <Users size={18} className="text-[#5B7B8A]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1A1A1A]">{group.name}</h3>
                  <p className="text-xs text-[#8A8A8A]">
                    {group.members.length} members · {group.teams.length} teams
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(group)}
                  className="p-2 text-[#8A8A8A] hover:text-[#4A5548] transition-colors"
                  title="Edit group"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setConfirmDelete(group)}
                  className="p-2 text-[#8A8A8A] hover:text-[#C44536] transition-colors"
                  title="Delete group"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Member chips */}
            {group.members.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {group.members.slice(0, 6).map((m) => (
                  <span
                    key={m.id}
                    className="text-xs bg-[#F7F6F2] text-[#5C5C5C] rounded-full px-2.5 py-1"
                  >
                    {m.firstName} {m.lastName}
                  </span>
                ))}
                {group.members.length > 6 && (
                  <span className="text-xs text-[#8A8A8A] px-1">+{group.members.length - 6} more</span>
                )}
              </div>
            )}

            {/* Team chips */}
            {group.teams.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {group.teams.slice(0, 6).map((t) => (
                  <span
                    key={t.id}
                    className="text-xs bg-[#E8F0F2] text-[#5B7B8A] rounded-full px-2.5 py-1 flex items-center gap-1"
                  >
                    <Building2 size={10} />
                    {t.name}
                  </span>
                ))}
                {group.teams.length > 6 && (
                  <span className="text-xs text-[#8A8A8A] px-1">+{group.teams.length - 6} more</span>
                )}
              </div>
            )}

            {group.members.length === 0 && group.teams.length === 0 && (
              <span className="text-xs text-[#8A8A8A]">No members or teams in this group</span>
            )}
          </div>
        ))}

        {groups.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-white border border-[#E5E4E0] rounded-[14px]">
            <Users size={32} className="text-[#D8E0D6] mx-auto mb-3" />
            <p className="text-sm text-[#8A8A8A]">No groups yet. Create your first group above.</p>
          </div>
        )}
      </motion.div>

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-[14px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[560px] max-w-[92vw] max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E4E0]">
              <h3 className="text-lg font-semibold text-[#1A1A1A]">Edit Group</h3>
              <button
                onClick={() => setEditingGroup(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F7F6F2] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Group Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full h-10 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Edit Members */}
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    Members ({editMemberIds.size} selected)
                  </label>
                  <div className="relative mb-2">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                    <input
                      type="text"
                      value={editSearch}
                      onChange={(e) => setEditSearch(e.target.value)}
                      placeholder="Search members..."
                      className="w-full h-9 pl-9 pr-3 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                    />
                  </div>
                  <div className="border border-[#E5E4E0] rounded-[10px] max-h-[240px] overflow-y-auto">
                    {filteredEditMembers.length === 0 ? (
                      <p className="text-sm text-[#8A8A8A] text-center py-4">No members found</p>
                    ) : (
                      filteredEditMembers.map((member) => {
                        const isSelected = editMemberIds.has(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleEditMember(member.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                              isSelected ? 'bg-[#E8EDE7]' : 'hover:bg-[#F7F6F2]'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-[#4A5548] border-[#4A5548]' : 'border-[#E5E4E0] bg-white'
                              }`}
                            >
                              {isSelected && <Check size={10} className="text-white" />}
                            </div>
                            <div className="w-7 h-7 rounded-full bg-[#E8EDE7] flex items-center justify-center text-xs font-semibold text-[#4A5548] shrink-0">
                              {member.firstName[0]}{member.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-[#1A1A1A] truncate">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-xs text-[#8A8A8A]">{member.email}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Edit Teams */}
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    Teams ({editTeamIds.size} selected)
                  </label>
                  <div className="relative mb-2">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                    <input
                      type="text"
                      value={editTeamSearch}
                      onChange={(e) => setEditTeamSearch(e.target.value)}
                      placeholder="Search teams..."
                      className="w-full h-9 pl-9 pr-3 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                    />
                  </div>
                  <div className="border border-[#E5E4E0] rounded-[10px] max-h-[240px] overflow-y-auto">
                    {filteredEditTeams.length === 0 ? (
                      <p className="text-sm text-[#8A8A8A] text-center py-4">No teams found</p>
                    ) : (
                      filteredEditTeams.map((team) => {
                        const isSelected = editTeamIds.has(team.id);
                        return (
                          <button
                            key={team.id}
                            type="button"
                            onClick={() => toggleEditTeam(team.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                              isSelected ? 'bg-[#E8EDE7]' : 'hover:bg-[#F7F6F2]'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-[#4A5548] border-[#4A5548]' : 'border-[#E5E4E0] bg-white'
                              }`}
                            >
                              {isSelected && <Check size={10} className="text-white" />}
                            </div>
                            <div className="w-7 h-7 rounded-full bg-[#E8F0F2] flex items-center justify-center text-xs font-semibold text-[#5B7B8A] shrink-0">
                              <Building2 size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-[#1A1A1A] truncate">{team.name}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E4E0]">
              <button
                onClick={() => setEditingGroup(null)}
                className="h-10 px-4 text-sm font-medium text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editName.trim()}
                className="h-10 px-4 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-[14px] p-6 w-full max-w-sm mx-4 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-[#1A1A1A]">Delete Group</h3>
            <p className="text-sm text-[#5C5C5C] mt-2">
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="h-10 px-4 text-sm font-medium text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-10 px-4 text-sm font-semibold text-white bg-[#C44536] rounded-[10px] hover:bg-[#A63A2E] transition-colors disabled:opacity-60"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
