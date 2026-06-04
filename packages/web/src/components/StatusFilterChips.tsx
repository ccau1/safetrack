import { useTranslation } from 'react-i18next';
import type { EmployeeStatus } from '@/types';

interface StatusFilterChipsProps {
  selected: EmployeeStatus[];
  onChange: (selected: EmployeeStatus[]) => void;
  counts: Record<EmployeeStatus, number>;
}

const STATUS_ORDER: EmployeeStatus[] = ['safe', 'distress', 'unknown'];

const STATUS_LABEL_KEYS: Record<EmployeeStatus, string> = {
  safe: 'filters.status.safe',
  distress: 'filters.status.distress',
  unknown: 'filters.status.notUpdated',
};

const STATUS_STYLES: Record<EmployeeStatus, { activeBg: string; activeText: string; activeBorder: string }> = {
  safe: {
    activeBg: 'bg-[#EDF5EF]',
    activeText: 'text-[#4A7C59]',
    activeBorder: 'border-[#4A7C59]/30',
  },
  distress: {
    activeBg: 'bg-[#FDECEA]',
    activeText: 'text-[#C44536]',
    activeBorder: 'border-[#C44536]/30',
  },
  unknown: {
    activeBg: 'bg-[#F0F0F0]',
    activeText: 'text-[#9A9A9A]',
    activeBorder: 'border-[#9A9A9A]/30',
  },
};

export function StatusFilterChips({ selected, onChange, counts }: StatusFilterChipsProps) {
  const { t } = useTranslation();

  const toggleStatus = (status: EmployeeStatus) => {
    if (selected.includes(status)) {
      onChange(selected.filter((s) => s !== status));
    } else {
      onChange([...selected, status]);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STATUS_ORDER.map((status) => {
        const isSelected = selected.includes(status);
        const styles = STATUS_STYLES[status];
        return (
          <button
            key={status}
            type="button"
            onClick={() => toggleStatus(status)}
            className={`h-9 px-3 rounded-[10px] text-sm font-medium border transition-all duration-150 ${
              isSelected
                ? `${styles.activeBg} ${styles.activeText} ${styles.activeBorder}`
                : 'bg-white text-[#5C5C5C] border-[#E5E4E0] hover:bg-[#F7F6F2]'
            }`}
          >
            {t(STATUS_LABEL_KEYS[status])} ({counts[status]})
          </button>
        );
      })}
    </div>
  );
}
