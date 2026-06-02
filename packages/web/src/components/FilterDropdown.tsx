import { useState, useRef, useEffect } from 'react';
import { Filter, Check } from 'lucide-react';

interface FilterDropdownProps {
  teams: string[];
  activeTeam: string;
  onSelect: (team: string) => void;
}

export function FilterDropdown({ teams, activeTeam, onSelect }: FilterDropdownProps) {
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

  const allTeams = ['all', ...teams];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-[#5C5C5C] border border-[#E5E4E0] rounded-[10px] px-3 py-1.5 bg-transparent hover:bg-[#FAFAF8] transition-all duration-150"
      >
        <Filter size={16} />
        <span>Filter by Team</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-[#E5E4E0] rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] min-w-[180px] py-1 z-50 max-h-[280px] overflow-y-auto">
          {allTeams.map((team) => (
            <button
              key={team}
              onClick={() => {
                onSelect(team);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F7F6F2] transition-colors duration-100 flex items-center justify-between ${
                activeTeam === team ? 'text-[#4A5548] font-medium' : 'text-[#5C5C5C]'
              }`}
            >
              {team === 'all' ? 'All Teams' : team}
              {activeTeam === team && <Check size={14} className="text-[#4A5548]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
