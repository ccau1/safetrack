import { useMemo } from 'react';
import {
  LayoutDashboard,
  Shield,
  Users,
  Building,
  Megaphone,
  Phone,
  Settings,
  LogOut,
  ShieldCheck,
  Cog,
  Siren,
  BarChart3,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { ViewName } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';


interface SidebarProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  activeEventCount?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  view: ViewName;
}

function NavButton({ item, isActive, onClick, badge }: { item: NavItem; isActive: boolean; onClick: () => void; badge?: number }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-[#E8EDE7] text-[#4A5548]'
          : 'text-[#5C5C5C] hover:bg-[#F7F6F2] hover:text-[#1A1A1A]'
      }`}
    >
      <Icon size={18} className={isActive ? 'text-[#4A5548]' : 'text-[#8A8A8A]'} />
      <span className="flex-1 text-left">{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[11px] font-bold ${
          isActive ? 'bg-[#4A5548] text-white' : 'bg-[#C44536] text-white'
        }`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

function SidebarNavItems({
  mainNavItems,
  adminNavItems,
  currentView,
  onNavigate,
  isAdmin,
  activeEventCount,
  t,
}: {
  mainNavItems: NavItem[];
  adminNavItems: NavItem[];
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  isAdmin: boolean;
  activeEventCount: number;
  t: (key: string) => string;
}) {
  return (
    <nav className="flex-1 px-3 space-y-1 pt-3">
      {mainNavItems.map((item) => (
        <NavButton
          key={item.label}
          item={item}
          isActive={currentView === item.view}
          onClick={() => onNavigate(item.view)}
          badge={item.view === 'emergency-events' ? activeEventCount : undefined}
        />
      ))}

      {isAdmin && (
        <div className="pt-4">
          <div className="px-3 pb-2 pt-4 border-t border-[#E5E4E0]">
            <span className="text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider">
              {t('navigation.administration')}
            </span>
          </div>
          {adminNavItems.map((item) => (
            <NavButton
              key={item.label}
              item={item}
              isActive={currentView === item.view}
              onClick={() => onNavigate(item.view)}
            />
          ))}
        </div>
      )}
    </nav>
  );
}

function OrganizationSelector({
  organizations,
  selectedOrganization,
  selectOrganization,
  t,
}: {
  organizations: { id: string; name: string }[];
  selectedOrganization: { id: string; name: string } | null;
  selectOrganization: (id: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="px-3 pb-3 border-b border-[#E5E4E0]">
      <label className="block px-3 pb-1.5 text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider">
        {t('common.organization')}
      </label>
      {organizations.length > 0 ? (
        <Select
          value={selectedOrganization?.id || ''}
          onValueChange={(id) => selectOrganization(id)}
        >
          <SelectTrigger className="w-full h-9 bg-[#F7F6F2] border-[#E5E4E0] text-sm text-[#1A1A1A] rounded-[10px] px-3 focus:ring-[#4A5548]/15 focus:border-[#4A5548]">
            <SelectValue placeholder={t('common.organization')} />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#E5E4E0] rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            {organizations.map((org) => (
              <SelectItem
                key={org.id}
                value={org.id}
                className="text-sm text-[#1A1A1A] focus:bg-[#F7F6F2] cursor-pointer"
              >
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="px-3 py-2 text-sm text-[#8A8A8A]">{t('common.noOrganizations')}</div>
      )}
    </div>
  );
}

function UserSection({
  initials,
  fullName,
  orgName,
  onLogout,
  t,
}: {
  initials: string;
  fullName: string;
  orgName: string;
  onLogout: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="px-3 pt-4 border-t border-[#E5E4E0] mt-auto">
      <div className="flex items-center justify-between px-3 py-2 mb-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E8EDE7] flex items-center justify-center text-xs font-semibold text-[#4A5548]">
            {initials}
          </div>
          <div>
            <div className="text-sm font-medium text-[#1A1A1A]">{fullName}</div>
            <div className="text-xs text-[#8A8A8A]">{orgName}</div>
          </div>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-3 py-2 text-xs text-[#8A8A8A] hover:text-[#C44536] transition-colors duration-150"
      >
        <LogOut size={14} />
        {t('common.signOut')}
      </button>
    </div>
  );
}

export function Sidebar({ currentView, onNavigate, activeEventCount = 0, mobileOpen, onMobileClose }: SidebarProps) {
  const { t } = useTranslation();
  const { user, logout, isAdmin, organizations, selectedOrganization, selectOrganization } = useAuth();

  const mainNavItems = useMemo(
    () => [
      { icon: LayoutDashboard, label: t('navigation.dashboard'), view: 'dashboard' as ViewName },
      { icon: Siren, label: t('navigation.emergencyEvents'), view: 'emergency-events' as ViewName },
      { icon: BarChart3, label: t('navigation.analytics'), view: 'analytics' as ViewName },
      { icon: Shield, label: t('navigation.report'), view: 'report' as ViewName },
      { icon: Users, label: t('navigation.team'), view: 'team' as ViewName },
      { icon: Building, label: t('navigation.organization'), view: 'organization' as ViewName },
      { icon: Phone, label: t('navigation.contacts'), view: 'contacts' as ViewName },
      { icon: Settings, label: t('navigation.settings'), view: 'settings' as ViewName },
    ],
    [t]
  );

  const adminNavItems = useMemo(
    () => [
      { icon: Megaphone, label: t('navigation.sendAlert'), view: 'alert' as ViewName },
      { icon: Settings, label: t('navigation.teamManagement'), view: 'team-management' as ViewName },
      { icon: Users, label: t('navigation.groupManagement'), view: 'group-management' as ViewName },
      { icon: ShieldCheck, label: t('navigation.permissions'), view: 'permissions' as ViewName },
      { icon: Cog, label: t('navigation.orgSettings'), view: 'org-settings' as ViewName },
    ],
    [t]
  );

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?';

  const fullName = user ? `${user.firstName} ${user.lastName}` : t('common.guest');
  const orgName = selectedOrganization?.name || t('common.noOrganization');

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-[260px] bg-white border-r border-[#E5E4E0] hidden lg:flex flex-col py-4 z-40">
        <OrganizationSelector
          organizations={organizations}
          selectedOrganization={selectedOrganization}
          selectOrganization={selectOrganization}
          t={t}
        />
        <SidebarNavItems
          mainNavItems={mainNavItems}
          adminNavItems={adminNavItems}
          currentView={currentView}
          onNavigate={onNavigate}
          isAdmin={isAdmin}
          activeEventCount={activeEventCount}
          t={t}
        />
        <div className="px-3 pt-2">
          <LanguageSwitcher />
        </div>
        <UserSection
          initials={initials}
          fullName={fullName}
          orgName={orgName}
          onLogout={logout}
          t={t}
        />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={onMobileClose}>
        <SheetContent side="left" className="bg-white p-0 w-[280px] sm:max-w-[280px] flex flex-col py-4">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Navigation menu</SheetDescription>
          </SheetHeader>
          <OrganizationSelector
            organizations={organizations}
            selectedOrganization={selectedOrganization}
            selectOrganization={selectOrganization}
            t={t}
          />
          <SidebarNavItems
            mainNavItems={mainNavItems}
            adminNavItems={adminNavItems}
            currentView={currentView}
            onNavigate={onNavigate}
            isAdmin={isAdmin}
            activeEventCount={activeEventCount}
            t={t}
          />
          <div className="px-3 pt-2">
            <LanguageSwitcher />
          </div>
          <UserSection
            initials={initials}
            fullName={fullName}
            orgName={orgName}
            onLogout={logout}
            t={t}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
