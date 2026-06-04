import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, ArrowRightLeft, Building2, Loader2, ShieldAlert, Save, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Employee } from '@/types';

interface OrgSettingsPageProps {
  employees: Employee[];
  orgId: string | null;
  orgName: string | null;
  orgSlug: string | null;
  ownerId: string | null;
  isOwner: boolean;
  currentUserId: number;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onMutated?: () => void;
}

export function OrgSettingsPage({
  employees,
  orgId,
  orgName,
  orgSlug,
  ownerId,
  isOwner,
  currentUserId,
  addToast,
  onMutated,
}: OrgSettingsPageProps) {
  const { reloadUser } = useAuth();
  const [name, setName] = useState(orgName || '');
  const [saving, setSaving] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [transferring, setTransferring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasNameChanged = name.trim() !== (orgName || '');

  const handleSaveName = async () => {
    if (!orgId || !name.trim() || !hasNameChanged) return;
    setSaving(true);
    try {
      await api.patch(`/api/organizations/${orgId}`, { name: name.trim() });
      addToast('Organization name updated', 'success');
      await reloadUser();
      onMutated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update organization';
      addToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTransfer = async () => {
    if (!orgId || !transferTargetId) return;
    setTransferring(true);
    try {
      await api.post(`/api/organizations/${orgId}/transfer-ownership`, {
        newOwnerId: transferTargetId,
      });
      addToast('Ownership transferred successfully', 'success');
      setTransferTargetId('');
      await reloadUser();
      onMutated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to transfer ownership';
      addToast(message, 'error');
    } finally {
      setTransferring(false);
    }
  };

  const handleDelete = async () => {
    if (!orgId) return;
    const confirmed = window.confirm(
      'Are you sure you want to delete this organization? This action cannot be undone and all data will be permanently lost.'
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await api.delete(`/api/organizations/${orgId}`);
      addToast('Organization deleted', 'success');
      await reloadUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete organization';
      addToast(message, 'error');
      setDeleting(false);
    }
  };

  const transferCandidates = employees.filter((e) => e.id !== currentUserId);
  const ownerEmployee = employees.find((e) => e.userId === ownerId);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <Settings size={24} className="text-[#4A5548]" />
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Organization Settings</h2>
          <p className="text-sm text-[#8A8A8A]">Manage organization details and ownership</p>
        </div>
      </motion.div>

      {/* Organization Info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="bg-white border border-[#E5E4E0] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={18} className="text-[#5B7B8A]" />
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Organization Details</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1.5">
              Name
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isOwner}
                className="flex-1 h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150 disabled:bg-[#F7F6F2] disabled:text-[#8A8A8A]"
              />
              {isOwner && (
                <button
                  onClick={handleSaveName}
                  disabled={!hasNameChanged || saving || !name.trim()}
                  className="h-10 px-4 text-sm font-semibold text-white bg-[#4A5548] rounded-[10px] hover:bg-[#3D463B] transition-colors duration-150 disabled:opacity-60 flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      Save
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1">
              Slug
            </label>
            <p className="text-sm text-[#8A8A8A] font-mono">{orgSlug || '—'}</p>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider mb-1">
              Owner
            </label>
            <p className="text-sm text-[#1A1A1A]">
              {ownerEmployee?.name || 'Unknown'}
              {isOwner && ' (You)'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Transfer Ownership */}
      {isOwner && transferCandidates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white border border-[#E5E4E0] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-2 mb-4">
            <ArrowRightLeft size={18} className="text-[#5B7B8A]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Transfer Ownership</h3>
          </div>
          <p className="text-sm text-[#8A8A8A] mb-4">
            Transfer ownership of this organization to another member. You will remain an admin but will no longer be the owner.
          </p>
          <div className="flex items-center gap-3">
            <select
              value={transferTargetId}
              onChange={(e) => setTransferTargetId(e.target.value)}
              className="flex-1 h-10 border border-[#E5E4E0] rounded-[10px] px-3 text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
            >
              <option value="">Select a member...</option>
              {transferCandidates.map((e) => (
                <option key={e.id} value={e.memberId}>
                  {e.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleTransfer}
              disabled={!transferTargetId || transferring}
              className="h-10 px-4 text-sm font-semibold text-white bg-[#5B7B8A] rounded-[10px] hover:bg-[#4A6A79] transition-colors duration-150 disabled:opacity-60 flex items-center gap-2"
            >
              {transferring ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <ArrowRightLeft size={16} />
                  Transfer
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Danger Zone */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white border border-[#FECDCA] rounded-[14px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={18} className="text-[#C44536]" />
            <h3 className="text-sm font-semibold text-[#C44536]">Danger Zone</h3>
          </div>
          <p className="text-sm text-[#8A8A8A] mb-4">
            Ownership transfers and organization deletion are irreversible. The new owner will have full control, or all data will be permanently lost.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="h-10 px-4 text-sm font-semibold text-white bg-[#C44536] rounded-[10px] hover:bg-[#A33A2D] transition-colors duration-150 disabled:opacity-60 flex items-center gap-2"
          >
            {deleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Trash2 size={16} />
                Delete Organization
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
