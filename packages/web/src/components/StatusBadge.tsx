import { ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import type { EmployeeStatus } from '@/types';

interface StatusBadgeProps {
  status: EmployeeStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = {
    safe: {
      text: 'Safe',
      textColor: 'text-[#4A7C59]',
      bgColor: 'bg-[#EDF5EF]',
      icon: ShieldCheck,
      iconColor: 'text-[#4A7C59]',
    },
    distress: {
      text: 'In Distress',
      textColor: 'text-[#C44536]',
      bgColor: 'bg-[#FDECEA]',
      icon: AlertTriangle,
      iconColor: 'text-[#C44536]',
    },
    unknown: {
      text: 'Not Updated',
      textColor: 'text-[#9A9A9A]',
      bgColor: 'bg-[#F0F0F0]',
      icon: HelpCircle,
      iconColor: 'text-[#9A9A9A]',
    },
  };

  const c = config[status];
  const Icon = c.icon;

  const sizeClasses = {
    sm: 'text-xs px-3 py-1 gap-1.5',
    md: 'text-sm px-4 py-1.5 gap-2',
    lg: 'text-base px-5 py-2 gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${c.textColor} ${c.bgColor} ${sizeClasses[size]}`}
      aria-label={`Status: ${c.text}`}
    >
      <Icon size={iconSizes[size]} className={c.iconColor} />
      {c.text}
    </span>
  );
}
