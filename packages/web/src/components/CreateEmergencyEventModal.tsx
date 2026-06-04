import { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Flame, DoorOpen, ShieldAlert, Search, Users, Check } from 'lucide-react';
import type { EmergencyEventApi, TeamApi, MemberGroup } from '@/types';

const QUICK_PRESETS = [
  { label: 'Now', minutes: 0 },
  { label: '5 min ago', minutes: 5 },
  { label: '10 min ago', minutes: 10 },
  { label: '15 min ago', minutes: 15 },
  { label: '20 min ago', minutes: 20 },
  { label: '25 min ago', minutes: 25 },
  { label: '30 min ago', minutes: 30 },
  { label: '1 hr ago', minutes: 60 },
];

const EVENT_TYPES: { type: EmergencyEventApi['type']; label: string; icon: typeof Flame; color: string }[] = [
  { type: 'EMERGENCY', label: 'Emergency', icon: AlertTriangle, color: '#C44536' },
  { type: 'FIRE_DRILL', label: 'Fire Drill', icon: Flame, color: '#E07A5F' },
  { type: 'EVACUATION', label: 'Evacuation', icon: DoorOpen, color: '#4A7C59' },
  { type: 'LOCKDOWN', label: 'Lockdown', icon: ShieldAlert, color: '#5B7B8A' },
];

interface CreateEmergencyEventModalProps {
  open: boolean;
  onClose: () => void;
  teams: TeamApi[];
  groups: MemberGroup[];
  onCreate: (
    title: string,
    description: string,
    type: EmergencyEventApi['type'],
    startedAt: string,
    targetTeamIds?: string[],
    targetGroupIds?: string[]
  ) => Promise<void>;
}

function toLocalIsoString(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

export function CreateEmergencyEventModal({ open, onClose, teams, groups, onCreate }: CreateEmergencyEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EmergencyEventApi['type']>('EMERGENCY');
  const [startedAt, setStartedAt] = useState(() => toLocalIsoString(new Date()));
  const [activePreset, setActivePreset] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);

  // Scope state
  const [scopeMode, setScopeMode] = useState<'all' | 'selected'>('all');
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const applyPreset = useCallback((minutes: number, index: number) => {
    const now = new Date();
    const preset = new Date(now.getTime() - minutes * 60000);
    setStartedAt(toLocalIsoString(preset));
    setActivePreset(index);
  }, []);

  const handleDateChange = (value: string) => {
    setStartedAt(value);
    setActivePreset(null);
  };

  const toggleTeam = (id: string) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase();
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, searchQuery]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  const selectedCount = selectedTeamIds.size + selectedGroupIds.size;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const iso = new Date(startedAt).toISOString();
      const targetTeamIds = scopeMode === 'selected' && selectedTeamIds.size > 0
        ? Array.from(selectedTeamIds)
        : undefined;
      const targetGroupIds = scopeMode === 'selected' && selectedGroupIds.size > 0
        ? Array.from(selectedGroupIds)
        : undefined;
      await onCreate(title.trim(), description.trim(), type, iso, targetTeamIds, targetGroupIds);
      setTitle('');
      setDescription('');
      setType('EMERGENCY');
      setStartedAt(toLocalIsoString(new Date()));
      setActivePreset(0);
      setScopeMode('all');
      setSelectedTeamIds(new Set());
      setSelectedGroupIds(new Set());
      setSearchQuery('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/25" />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="relative bg-white rounded-[14px] shadow-[0_8px_40px_rgba(0,0,0,0.12)] w-[560px] max-w-[92vw] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E4E0]">
              <h3 className="text-lg font-semibold text-[#1A1A1A]">Create Emergency Event</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#8A8A8A] hover:text-[#1A1A1A] hover:bg-[#F7F6F2] transition-colors duration-150"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Event Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fire on Floor 3"
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E5E4E0] rounded-[10px] text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Event Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_TYPES.map(({ type: t, label, icon: Icon, color }) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-[10px] border text-sm font-medium transition-all duration-150 ${
                        type === t
                          ? 'border-[#4A5548] bg-[#E8EDE7] text-[#1A1A1A]'
                          : 'border-[#E5E4E0] bg-white text-[#5C5C5C] hover:bg-[#F7F6F2]'
                      }`}
                    >
                      <Icon size={16} style={{ color }} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Time Presets */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">When did it start?</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {QUICK_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.minutes}
                      type="button"
                      onClick={() => applyPreset(preset.minutes, idx)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                        activePreset === idx
                          ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                          : 'bg-white text-[#5C5C5C] border-[#E5E4E0] hover:border-[#1A1A1A]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="datetime-local"
                  value={startedAt}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E5E4E0] rounded-[10px] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                />
              </div>

              {/* Scope Section */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Scope</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setScopeMode('all')}
                    className={`flex-1 py-2 text-sm font-medium rounded-[10px] border transition-all duration-150 ${
                      scopeMode === 'all'
                        ? 'border-[#4A5548] bg-[#E8EDE7] text-[#1A1A1A]'
                        : 'border-[#E5E4E0] bg-white text-[#5C5C5C] hover:bg-[#F7F6F2]'
                    }`}
                  >
                    All Members
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeMode('selected')}
                    className={`flex-1 py-2 text-sm font-medium rounded-[10px] border transition-all duration-150 ${
                      scopeMode === 'selected'
                        ? 'border-[#4A5548] bg-[#E8EDE7] text-[#1A1A1A]'
                        : 'border-[#E5E4E0] bg-white text-[#5C5C5C] hover:bg-[#F7F6F2]'
                    }`}
                  >
                    Selected Teams & Groups
                    {selectedCount > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#4A5548] text-white text-[10px] font-bold">
                        {selectedCount}
                      </span>
                    )}
                  </button>
                </div>

                {scopeMode === 'selected' && (
                  <div className="border border-[#E5E4E0] rounded-[10px] p-3 space-y-3">
                    {/* Search */}
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search teams or groups..."
                        className="w-full h-9 pl-9 pr-3 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
                      />
                    </div>

                    {/* Selected chips */}
                    {(selectedTeamIds.size > 0 || selectedGroupIds.size > 0) && (
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(selectedTeamIds).map((id) => {
                          const team = teams.find((t) => t.id === id);
                          if (!team) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#E8F0F2] text-[#5B7B8A] border border-[#D0E0E4]"
                            >
                              {team.name}
                              <button
                                type="button"
                                onClick={() => toggleTeam(id)}
                                className="hover:text-[#C44536]"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          );
                        })}
                        {Array.from(selectedGroupIds).map((id) => {
                          const group = groups.find((g) => g.id === id);
                          if (!group) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#E8EDE7] text-[#4A5548] border border-[#D0E0D4]"
                            >
                              {group.name}
                              <button
                                type="button"
                                onClick={() => toggleGroup(id)}
                                className="hover:text-[#C44536]"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Teams list */}
                    {filteredTeams.length > 0 && (
                      <div>
                        <p className="text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">Teams</p>
                        <div className="space-y-1 max-h-[140px] overflow-y-auto">
                          {filteredTeams.map((team) => {
                            const isSelected = selectedTeamIds.has(team.id);
                            return (
                              <button
                                key={team.id}
                                type="button"
                                onClick={() => toggleTeam(team.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-sm transition-all duration-150 ${
                                  isSelected
                                    ? 'bg-[#E8F0F2] text-[#1A1A1A]'
                                    : 'hover:bg-[#F7F6F2] text-[#5C5C5C]'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? 'bg-[#4A5548] border-[#4A5548]'
                                        : 'border-[#E5E4E0] bg-white'
                                    }`}
                                  >
                                    {isSelected && <Check size={10} className="text-white" />}
                                  </div>
                                  <span className="font-medium">{team.name}</span>
                                </div>
                                <span className="text-xs text-[#8A8A8A] flex items-center gap-1">
                                  <Users size={12} />
                                  {team.name === 'Unassigned' ? 0 : (team as TeamApi & { memberCount?: number }).memberCount ?? '-'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Groups list */}
                    {filteredGroups.length > 0 && (
                      <div>
                        <p className="text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">Groups</p>
                        <div className="space-y-1 max-h-[140px] overflow-y-auto">
                          {filteredGroups.map((group) => {
                            const isSelected = selectedGroupIds.has(group.id);
                            return (
                              <button
                                key={group.id}
                                type="button"
                                onClick={() => toggleGroup(group.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-sm transition-all duration-150 ${
                                  isSelected
                                    ? 'bg-[#E8EDE7] text-[#1A1A1A]'
                                    : 'hover:bg-[#F7F6F2] text-[#5C5C5C]'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? 'bg-[#4A5548] border-[#4A5548]'
                                        : 'border-[#E5E4E0] bg-white'
                                    }`}
                                  >
                                    {isSelected && <Check size={10} className="text-white" />}
                                  </div>
                                  <span className="font-medium">{group.name}</span>
                                </div>
                                <span className="text-xs text-[#8A8A8A] flex items-center gap-1">
                                  <Users size={12} />
                                  {group.members?.length ?? 0}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {filteredTeams.length === 0 && filteredGroups.length === 0 && (
                      <p className="text-sm text-[#8A8A8A] text-center py-2">No teams or groups found</p>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any details about the emergency..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-[#E5E4E0] rounded-[10px] text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 text-sm font-medium text-[#5C5C5C] bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] hover:bg-[#EFEFEC] transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim() || (scopeMode === 'selected' && selectedCount === 0)}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-[#C44536] rounded-[10px] hover:bg-[#A33A2E] transition-colors duration-150 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Create Event'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
