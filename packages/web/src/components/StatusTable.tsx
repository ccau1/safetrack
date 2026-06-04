import { useTranslation } from 'react-i18next';
import { Bell, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatusBadge } from './StatusBadge';
import { useTimeAgo } from '@/hooks/useTimeAgo';
import type { Employee } from '@/types';

interface StatusTableProps {
  employees: Employee[];
  updatedRowId?: number | null;
  onRowClick: (employee: Employee) => void;
  onRemind?: (employee: Employee) => void;
  remindedMemberIds?: Set<string>;
  remindingMemberId?: string | null;
  isAdmin?: boolean;
  showCheckboxes?: boolean;
  selectedIds?: number[];
  onToggleSelect?: (id: number) => void;
}

export function StatusTable({
  employees,
  updatedRowId = null,
  onRowClick,
  onRemind,
  remindedMemberIds = new Set(),
  remindingMemberId = null,
  isAdmin = false,
  showCheckboxes = false,
  selectedIds = [],
  onToggleSelect,
}: StatusTableProps) {
  const { t } = useTranslation();
  const timeAgo = useTimeAgo();
  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E5E4E0" strokeWidth="1.5" className="mb-3">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <p className="text-sm text-[#8A8A8A]">{t('table.noEmployees')}</p>
      </div>
    );
  }

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'safe': return '#4A7C59';
      case 'distress': return '#C44536';
      default: return '#D0D0D0';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="h-11 bg-[#FAFAF8] text-left">
            {/* Frozen status indicator header */}
            <th className="w-1 p-0 bg-[#FAFAF8] sticky left-0 z-10" />
            {showCheckboxes && (
              <th className="px-4 w-10">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[#E5E4E0] text-[#4A5548] focus:ring-[#4A5548]"
                  checked={selectedIds.length === employees.length && employees.length > 0}
                  onChange={() => {
                    if (selectedIds.length === employees.length) {
                      onToggleSelect?.(-1);
                    } else {
                      employees.forEach((e) => {
                        if (!selectedIds.includes(e.id)) onToggleSelect?.(e.id);
                      });
                    }
                  }}
                />
              </th>
            )}
            <th className="px-5 text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider">{t('table.columns.employee')}</th>
            <th className="px-5 text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider">{t('table.columns.team')}</th>
            <th className="px-5 text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider">{t('table.columns.lastLocation')}</th>
            <th className="px-5 text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider">{t('table.columns.status')}</th>
            <th className="px-5 text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider">{t('table.columns.lastUpdated')}</th>
            {(isAdmin || onRemind) && <th className="px-5 text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider">{t('table.columns.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr
              key={emp.id}
              onClick={() => onRowClick(emp)}
              className={`h-14 border-b border-[#E5E4E0] hover:bg-[#F7F6F2] transition-colors duration-150 cursor-pointer ${
                updatedRowId === emp.id ? 'bg-[#FFF8E7]' : ''
              }`}
            >
              {/* Frozen status indicator bar */}
              <td className="p-0 sticky left-0 z-10">
                <div
                  className="w-1 h-14 self-stretch"
                  style={{ backgroundColor: getStatusColor(emp.status) }}
                  aria-hidden="true"
                />
              </td>
              {showCheckboxes && (
                <td className="px-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[#E5E4E0] text-[#4A5548] focus:ring-[#4A5548]"
                    checked={selectedIds.includes(emp.id)}
                    onChange={() => onToggleSelect?.(emp.id)}
                  />
                </td>
              )}
              <td className="px-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E8EDE7] flex items-center justify-center text-sm font-semibold text-[#4A5548]">
                    {emp.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#1A1A1A]">{emp.name}</div>
                    <div className="text-xs text-[#8A8A8A]">{t(`roles.${emp.role}`, { defaultValue: emp.role })}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 text-sm text-[#5C5C5C]">{emp.team}</td>
              <td className="px-5 text-sm text-[#5C5C5C]">{emp.location || '-'}</td>
              <td className="px-5">
                <StatusBadge status={emp.status} />
              </td>
              <td className="px-5 text-sm text-[#8A8A8A]">{emp.lastUpdated !== '-' ? timeAgo(emp.lastUpdated) : '-'}</td>
              {(isAdmin || onRemind) && (
                <td className="px-5" onClick={(e) => e.stopPropagation()}>
                  {emp.status === 'unknown' && onRemind && (
                    (() => {
                      const isReminding = remindingMemberId === emp.memberId;
                      const hasReminded = remindedMemberIds.has(emp.memberId);
                      return (
                        <button
                          onClick={() => onRemind(emp)}
                          disabled={isReminding || hasReminded}
                          className={`flex items-center gap-1.5 text-sm border rounded-[10px] px-2.5 py-1 transition-all duration-150 disabled:opacity-40 ${
                            hasReminded
                              ? 'text-[#4A7C59] border-[#4A7C59] bg-[#EDF5EF]'
                              : 'text-[#C44536] border-[#C44536] opacity-70 hover:opacity-100 hover:bg-[#FDECEA]'
                          }`}
                        >
                          {isReminding ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : hasReminded ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                              className="flex items-center"
                            >
                              <CheckCircle2 size={14} />
                            </motion.div>
                          ) : (
                            <Bell size={14} />
                          )}
                          {t('table.remind')}
                        </button>
                      );
                    })()
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
