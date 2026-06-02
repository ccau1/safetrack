import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: number;
  trend: string;
  trendColor?: string;
  delay?: number;
}

export function StatsCard({
  icon: Icon,
  iconColor,
  label,
  value,
  trend,
  trendColor = 'text-[#8A8A8A]',
  delay = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="bg-white border border-[#E5E4E0] rounded-[14px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-250 cursor-default"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={24} style={{ color: iconColor }} />
        <span className="text-xs text-[#8A8A8A] tracking-wide">{label}</span>
      </div>
      <div className="text-[32px] font-bold text-[#1A1A1A] leading-tight tracking-tight">
        {value}
      </div>
      <div className={`text-xs mt-1 ${trendColor}`}>{trend}</div>
    </motion.div>
  );
}
