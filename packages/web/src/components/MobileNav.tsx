import { useMemo } from 'react';
import {
  LayoutDashboard,
  Shield,
  Users,
  Building,
  Megaphone,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import type { ViewName } from '@/types';

interface MobileNavProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
}

export function MobileNav({ currentView, onNavigate }: MobileNavProps) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const navItems = useMemo(
    () => [
      { icon: LayoutDashboard, label: t('mobileNav.dashboard'), view: 'dashboard' as ViewName },
      { icon: Shield, label: t('mobileNav.report'), view: 'report' as ViewName },
      { icon: Users, label: t('mobileNav.team'), view: 'team' as ViewName },
      { icon: Building, label: t('mobileNav.organization'), view: 'organization' as ViewName },
      { icon: Phone, label: t('mobileNav.contacts'), view: 'contacts' as ViewName },
      { icon: Megaphone, label: t('mobileNav.alert'), view: 'alert' as ViewName, adminOnly: true },
      { icon: ShieldCheck, label: t('mobileNav.permissions'), view: 'permissions' as ViewName, adminOnly: true },
    ],
    [t]
  );

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
