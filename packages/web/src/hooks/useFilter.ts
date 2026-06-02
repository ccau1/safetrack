import { useState, useCallback } from 'react';

export function useFilter() {
  const [activeTeam, setActiveTeam] = useState<string>(() => {
    return sessionStorage.getItem('safetrack_active_team') || 'all';
  });

  const setTeam = useCallback((team: string) => {
    setActiveTeam(team);
    sessionStorage.setItem('safetrack_active_team', team);
  }, []);

  return { activeTeam, setTeam };
}
