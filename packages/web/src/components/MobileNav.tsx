import {
  LayoutDashboard,
  Shield,
  Users,
  Building,
  Megaphone,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { ViewName } from '@/types';

interface MobileNavProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
}

const navItems: { icon: typeof LayoutDashboard; label: string; view: ViewName; adminOnly?: boolean }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
  { icon: Shield, label: 'Report', view: 'report' },
  { icon: Users, label: 'Team', view: 'team' },
  { icon: Building, label: 'Org', view: 'organization' },
  { icon: Phone, label: 'Contacts', view: 'contacts' },
  { icon: Megaphone, label: 'Alert', view: 'alert', adminOnly: true },
  { icon: ShieldCheck, label: 'Perms', view: 'permissions', adminOnly: true },
];

export function MobileNav({ currentView, onNavigate }: MobileNavProps) {
  const { isAdmin } = useAuth();
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E4E0] z-50 flex items-center justify-around lg:hidden">
      {visibleItems.map((item) => {
        const isActive = currentView === item.view;
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => onNavigate(item.view)}
            className={`flex flex-col items-center gap-1 py-2 px-3 ${
              isActive ? 'text-[#4A5548]' : 'text-[#8A8A8A]'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
