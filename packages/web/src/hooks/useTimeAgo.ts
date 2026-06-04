import { formatRelativeTime } from '@/lib/time';

export function useTimeAgo() {
  return (iso: string | null | undefined): string => {
    if (!iso || iso === '-') return '-';
    return formatRelativeTime(iso);
  };
}
