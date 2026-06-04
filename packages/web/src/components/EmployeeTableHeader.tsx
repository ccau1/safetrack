import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';
import { StatusFilterDropdown } from './StatusFilterDropdown';
import { StatusFilterChips } from './StatusFilterChips';
import { TeamFilterList } from './TeamFilterList';
import { FilterModal } from './FilterModal';
import type { EmployeeStatus } from '@/types';

interface EmployeeTableHeaderProps {
  title: string;
  subtitle: string;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: EmployeeStatus[];
  onStatusFilterChange: (selected: EmployeeStatus[]) => void;
  statusCounts: Record<EmployeeStatus, number>;
  teamFilter?: string;
  onTeamFilterChange?: (team: string) => void;
  teams?: string[];
  showTeamFilter?: boolean;
}

export function EmployeeTableHeader({
  title,
  subtitle,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  teamFilter = 'all',
  onTeamFilterChange,
  teams = [],
  showTeamFilter = true,
}: EmployeeTableHeaderProps) {
  const { t } = useTranslation();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className="px-5 py-4 border-b border-[#E5E4E0]">
      {/* Desktop layout */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">{title}</h2>
          <p className="text-sm text-[#8A8A8A]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {showTeamFilter && onTeamFilterChange && (
            <FilterDropdown
              teams={teams}
              activeTeam={teamFilter}
              onSelect={onTeamFilterChange}
            />
          )}
          <StatusFilterDropdown
            selected={statusFilter}
            onChange={onStatusFilterChange}
            counts={statusCounts}
          />
          <div className="relative w-52">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('table.searchByName')}
              className="w-full h-9 pl-9 pr-3 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-[#4A5548]/20 focus:border-[#4A5548] transition-all duration-150"
            />
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A1A]">{title}</h2>
            <p className="text-sm text-[#8A8A8A]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center justify-center w-10 h-10 text-[#5C5C5C] border border-[#E5E4E0] rounded-[10px] hover:bg-[#FAFAF8] transition-colors duration-150"
            aria-label={t('table.openFilters')}
          >
            <Filter size={18} />
          </button>
        </div>
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('table.searchByName')}
            className="w-full h-10 pl-9 pr-3 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:ring-2 focus:ring-[#4A5548]/20 focus:border-[#4A5548] transition-all duration-150"
          />
        </div>
      </div>

      {/* Mobile filter modal */}
      <FilterModal
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title={t('table.filters')}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1A1A1A]">{t('table.columns.status')}</label>
            <StatusFilterChips
              selected={statusFilter}
              onChange={onStatusFilterChange}
              counts={statusCounts}
            />
          </div>
          {showTeamFilter && onTeamFilterChange && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#1A1A1A]">{t('table.columns.team')}</label>
              <TeamFilterList
                teams={teams}
                activeTeam={teamFilter}
                onSelect={onTeamFilterChange}
              />
            </div>
          )}
        </div>
      </FilterModal>
    </div>
  );
}
