import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

interface TeamFilterListProps {
  teams: string[];
  activeTeam: string;
  onSelect: (team: string) => void;
}

export function TeamFilterList({ teams, activeTeam, onSelect }: TeamFilterListProps) {
  const { t } = useTranslation();
  const allTeams = ['all', ...teams];

  return (
    <div className="space-y-1">
      {allTeams.map((team) => (
        <button
          key={team}
          type="button"
          onClick={() => onSelect(team)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-left text-sm transition-colors duration-100 ${
            activeTeam === team
              ? 'bg-[#EDF5EF] text-[#4A5548] font-medium'
              : 'text-[#5C5C5C] hover:bg-[#F7F6F2]'
          }`}
        >
          <span>{team === 'all' ? t('table.allTeams') : team}</span>
          {activeTeam === team && <Check size={16} className="text-[#4A5548]" />}
        </button>
      ))}
    </div>
  );
}
