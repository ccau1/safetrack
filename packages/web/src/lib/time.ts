import i18n from '@/i18n';

export function formatRelativeTime(iso: string): string {
  const t = i18n.t.bind(i18n);
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return t('common.justNow');
  if (diffMins < 60) {
    return diffMins === 1
      ? t('common.minuteAgo', { count: diffMins })
      : t('common.minutesAgo', { count: diffMins });
  }

  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) {
    return diffHours === 1
      ? t('common.hourAgo', { count: diffHours })
      : t('common.hoursAgo', { count: diffHours });
  }

  const diffDays = Math.floor(diffMs / 86400000);
  return diffDays === 1
    ? t('common.dayAgo', { count: diffDays })
    : t('common.daysAgo', { count: diffDays });
}
