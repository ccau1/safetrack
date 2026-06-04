import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Loader2,
  Search,
  Lock,
  Unlock,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { MemberPermission, PermissionCatalogItem, PermissionEffect, ToastItem } from '@/types';

interface PermissionsPageProps {
  orgId: string | null;
  addToast: (message: string, type: ToastItem['type']) => void;
}

export function PermissionsPage({ orgId, addToast }: PermissionsPageProps) {
  const { t } = useTranslation();
  const [memberPermissions, setMemberPermissions] = useState<MemberPermission[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [grantingMemberId, setGrantingMemberId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEffect, setSelectedEffect] = useState<PermissionEffect>('Allow');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPermissions = async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const res = await api.get<MemberPermission[]>(`/api/organizations/${orgId}/admin/permissions/members`);
      setMemberPermissions(res.data);
    } catch {
      addToast('Failed to load member permissions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCatalog = async () => {
    if (!orgId) return;
    setIsCatalogLoading(true);
    try {
      const res = await api.get<PermissionCatalogItem[]>(`/api/organizations/${orgId}/admin/permissions/catalog`);
      setCatalog(res.data);
    } catch {
      addToast('Failed to load permission catalog', 'error');
    } finally {
      setIsCatalogLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
    fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return memberPermissions;
    const q = search.toLowerCase();
    return memberPermissions.filter(
      (m) =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.orgRole.toLowerCase().includes(q)
    );
  }, [memberPermissions, search]);

  const groupedCatalog = useMemo(() => {
    const groups: Record<string, PermissionCatalogItem[]> = {};
    for (const item of catalog) {
      const cat = item.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [catalog]);

  const handleGrant = async (memberId: string) => {
    if (!orgId || !selectedAction) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/organizations/${orgId}/admin/permissions/members/${memberId}`, {
        action: selectedAction,
        effect: selectedEffect,
      });
      addToast('Permission granted', 'success');
      setGrantingMemberId(null);
      setSelectedAction('');
      setSelectedEffect('Allow');
      await fetchPermissions();
    } catch {
      addToast('Failed to grant permission', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (memberId: string, action: string) => {
    if (!orgId) return;
    try {
      await api.delete(`/api/organizations/${orgId}/admin/permissions/members/${memberId}/${action}`);
      addToast('Permission revoked', 'success');
      await fetchPermissions();
    } catch {
      addToast('Failed to revoke permission', 'error');
    }
  };

  const getAvailableActions = (member: MemberPermission) => {
    const existing = new Set(member.permissions.map((p) => p.action));
    return catalog.filter((c) => !existing.has(c.action));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Permissions</h2>
          <p className="text-sm text-[#8A8A8A] mt-1">
            Manage organization-scoped permissions for members
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="relative"
      >
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members by name, email, or role..."
          className="w-full h-11 pl-10 pr-4 bg-white border border-[#E5E4E0] rounded-[14px] text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
        />
      </motion.div>

      {/* Members list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white border border-[#E5E4E0] rounded-[14px] overflow-hidden"
      >
        {isLoading || isCatalogLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#4A5548]" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Shield size={32} className="text-[#D8E0D6] mb-3" />
            <p className="text-sm text-[#8A8A8A]">
              {search.trim() ? 'No members match your search' : 'No members found in this organization'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E4E0]">
            {filteredMembers.map((member) => {
              const isExpanded = expandedMemberId === member.memberId;
              const isGranting = grantingMemberId === member.memberId;
              const availableActions = getAvailableActions(member);

              return (
                <div key={member.memberId}>
                  {/* Member row */}
                  <button
                    onClick={() => setExpandedMemberId(isExpanded ? null : member.memberId)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#F7F6F2] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#E8EDE7] flex items-center justify-center text-xs font-semibold text-[#4A5548] shrink-0">
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1A1A1A] truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-[#8A8A8A]">
                          {member.email} · {t(`roles.${member.orgRole}`, { defaultValue: member.orgRole })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        {member.permissions.length > 0 ? (
                          <>
                            <Lock size={14} className="text-[#4A5548]" />
                            <span className="text-xs font-medium text-[#4A5548]">
                              {member.permissions.length} override
                              {member.permissions.length !== 1 ? 's' : ''}
                            </span>
                          </>
                        ) : (
                          <>
                            <Unlock size={14} className="text-[#8A8A8A]" />
                            <span className="text-xs text-[#8A8A8A]">Role defaults</span>
                          </>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-[#8A8A8A]" />
                      ) : (
                        <ChevronDown size={16} className="text-[#8A8A8A]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded permissions panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 bg-[#FAFAF8]">
                          {/* Current permissions */}
                          {member.permissions.length > 0 ? (
                            <div className="mb-4">
                              <h4 className="text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider mb-2">
                                Assigned Overrides
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {member.permissions.map((perm) => (
                                  <span
                                    key={perm.action}
                                    className={`inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 ${
                                      perm.effect === 'Allow'
                                        ? 'bg-[#E8EDE7] text-[#4A5548]'
                                        : 'bg-[#FCE8E8] text-[#C44536]'
                                    }`}
                                  >
                                    {perm.effect === 'Allow' ? (
                                      <Unlock size={12} />
                                    ) : (
                                      <Lock size={12} />
                                    )}
                                    {perm.action}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRevoke(member.memberId, perm.action);
                                      }}
                                      className="ml-0.5 hover:opacity-70 transition-opacity"
                                      title="Revoke"
                                    >
                                      <X size={12} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="mb-4 text-xs text-[#8A8A8A]">
                              No permission overrides. Role-based defaults apply.
                            </div>
                          )}

                          {/* Grant form */}
                          {isGranting ? (
                            <div className="bg-white border border-[#E5E4E0] rounded-[10px] p-4">
                              <div className="flex items-center gap-3 flex-wrap">
                                <select
                                  value={selectedAction}
                                  onChange={(e) => setSelectedAction(e.target.value)}
                                  className="h-9 text-sm bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] px-3 focus:outline-none focus:border-[#4A5548] min-w-[200px]"
                                >
                                  <option value="">Select permission...</option>
                                  {Object.entries(groupedCatalog).map(([category, items]) => (
                                    <optgroup key={category} label={category}>
                                      {items
                                        .filter((i) => availableActions.some((a) => a.action === i.action))
                                        .map((item) => (
                                          <option key={item.action} value={item.action}>
                                            {item.action}
                                          </option>
                                        ))}
                                    </optgroup>
                                  ))}
                                </select>
                                <select
                                  value={selectedEffect}
                                  onChange={(e) => setSelectedEffect(e.target.value as PermissionEffect)}
                                  className="h-9 text-sm bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] px-3 focus:outline-none focus:border-[#4A5548]"
                                >
                                  <option value="Allow">Allow</option>
                                  <option value="Deny">Deny</option>
                                </select>
                                <button
                                  onClick={() => handleGrant(member.memberId)}
                                  disabled={!selectedAction || isSubmitting}
                                  className="h-9 px-4 text-xs font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] disabled:opacity-60 transition-colors"
                                >
                                  {isSubmitting ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    'Grant'
                                  )}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGrantingMemberId(null);
                                    setSelectedAction('');
                                    setSelectedEffect('Allow');
                                  }}
                                  className="h-9 px-3 text-xs text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                              {selectedAction && (
                                <p className="mt-2 text-xs text-[#8A8A8A]">
                                  {
                                    catalog.find((c) => c.action === selectedAction)
                                      ?.description
                                  }
                                </p>
                              )}
                            </div>
                          ) : (
                            availableActions.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGrantingMemberId(member.memberId);
                                  setSelectedAction('');
                                  setSelectedEffect('Allow');
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A5548] bg-[#E8EDE7] rounded-[10px] px-3 py-2 hover:bg-[#D8E0D6] transition-colors"
                              >
                                <Plus size={14} />
                                Add Permission
                              </button>
                            )
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Permission catalog reference */}
      {!isCatalogLoading && catalog.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white border border-[#E5E4E0] rounded-[14px] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[#E5E4E0]">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Permission Catalog</h3>
            <p className="text-xs text-[#8A8A8A] mt-0.5">
              Available permissions that can be granted or denied per member
            </p>
          </div>
          <div className="divide-y divide-[#E5E4E0]">
            {Object.entries(groupedCatalog).map(([category, items]) => (
              <div key={category} className="px-5 py-3">
                <h4 className="text-xs font-semibold text-[#5C5C5C] uppercase tracking-wider mb-2">
                  {category}
                </h4>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div
                      key={item.action}
                      className="flex items-start justify-between gap-4"
                    >
                      <code className="text-xs font-mono text-[#4A5548] bg-[#F7F6F2] rounded px-1.5 py-0.5 shrink-0">
                        {item.action}
                      </code>
                      <span className="text-xs text-[#8A8A8A] text-right">
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
