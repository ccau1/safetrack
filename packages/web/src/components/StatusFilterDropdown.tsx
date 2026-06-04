import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertTriangle, HelpCircle, SlidersHorizontal, Check, Users } from 'lucide-react';
import type { EmployeeStatus } from '@/types';

interface StatusFilterDropdownProps {
  selected: EmployeeStatus[];
  onChange: (selected: EmployeeStatus[]) => void;
  counts: Record<EmployeeStatus, number>;
}

const STATUS_ORDER: EmployeeStatus[] = ['safe', 'distress', 'unknown'];

const STATUS_CONFIG: Record<EmployeeStatus, { labelKey: string; icon: typeof ShieldCheck; textColor: string; bgColor: string; borderColor: string }> = {
  safe: {
    labelKey: 'filters.status.safe',
    icon: ShieldCheck,
    textColor: 'text-[#4A7C59]',
    bgColor: 'bg-[#EDF5EF]',
    borderColor: 'border-[#4A7C59]/20',
  },
  distress: {
    labelKey: 'filters.status.distress',
    icon: AlertTriangle,
    textColor: 'text-[#C44536]',
    bgColor: 'bg-[#FDECEA]',
    borderColor: 'border-[#C44536]/20',
  },
  unknown: {
    labelKey: 'filters.status.notUpdated',
    icon: HelpCircle,
    textColor: 'text-[#9A9A9A]',
    bgColor: 'bg-[#F0F0F0]',
    borderColor: 'border-[#9A9A9A]/20',
  },
};

const ALL_STATUSES: EmployeeStatus[] = ['safe', 'distress', 'unknown'];

export function StatusFilterDropdown({ selected, onChange, counts }: StatusFilterDropdownProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allCount = counts.safe + counts.distress + counts.unknown;
  const isAllMode = selected.length === 0 || selected.length === ALL_STATUSES.length;

  const selectAll = () => {
    onChange([...ALL_STATUSES]);
  };

  const toggleStatus = (status: EmployeeStatus) => {
    if (isAllMode) {
      // Switch from "All" to specific selection with just this status
      onChange([status]);
    } else if (selected.includes(status)) {
      onChange(selected.filter((s) => s !== status));
    } else {
      onChange([...selected, status]);
    }
  };

  const getButtonLabel = () => {
    if (isAllMode) {
      return t('filters.status.allStatuses');
    }
    if (selected.length === 1) {
      return t(STATUS_CONFIG[selected[0]].labelKey);
    }
    const names = selected.map((s) => t(STATUS_CONFIG[s].labelKey));
    return names.join(', ');
  };

  const renderCheckbox = (checked: boolean) => (
    <span
      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors duration-150 ${
        checked ? 'bg-[#4A5548] border-[#4A5548]' : 'bg-white border-[#E5E4E0]'
      }`}
    >
      {checked && <Check size={12} className="text-white" />}
    </span>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-[#5C5C5C] border border-[#E5E4E0] rounded-[10px] px-3 py-1.5 bg-transparent hover:bg-[#FAFAF8] transition-all duration-150"
      >
        <SlidersHorizontal size={16} />
        <span className="max-w-[140px] truncate">{getButtonLabel()}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-[#E5E4E0] rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] min-w-[220px] py-1 z-50">
          {/* All option */}
          <button
            type="button"
            onClick={selectAll}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F7F6F2] transition-colors duration-100 flex items-center justify-between ${
              isAllMode ? 'text-[#1A1A1A] font-medium' : 'text-[#5C5C5C]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              {renderCheckbox(isAllMode)}
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#F7F6F2] border border-[#E5E4E0] flex items-center justify-center">
                  <Users size={12} className="text-[#5C5C5C]" />
                </span>
                <span>
                  {t('filters.status.allStatuses')} ({allCount})
                </span>
              </span>
            </span>
          </button>

          <div className="mx-3 my-1 h-px bg-[#E5E4E0]" />

          {/* Individual statuses */}
          {STATUS_ORDER.map((status) => {
            const isSelected = !isAllMode && selected.includes(status);
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F7F6F2] transition-colors duration-100 flex items-center justify-between ${
                  isSelected ? 'text-[#1A1A1A] font-medium' : 'text-[#5C5C5C]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {renderCheckbox(isSelected)}
                  <span className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full ${config.bgColor} ${config.borderColor} border flex items-center justify-center`}>
                      <Icon size={12} className={config.textColor} />
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${config.borderColor} border`}>
                      {t(config.labelKey)}
                      <span className="opacity-80">({counts[status]})</span>
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
