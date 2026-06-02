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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { ViewName } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SidebarProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
}

const mainNavItems: { icon: typeof LayoutDashboard; label: string; view: ViewName }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
  { icon: Shield, label: 'Report Status', view: 'report' },
  { icon: Users, label: 'My Team', view: 'team' },
  { icon: Building, label: 'Organization', view: 'organization' },
  { icon: Phone, label: 'Contacts', view: 'contacts' },
];

const adminNavItems: { icon: typeof LayoutDashboard; label: string; view: ViewName }[] = [
  { icon: Megaphone, label: 'Send Alert', view: 'alert' },
  { icon: Settings, label: 'Team Management', view: 'team-management' },
  { icon: ShieldCheck, label: 'Permissions', view: 'permissions' },
];

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { user, logout, isAdmin, organizations, selectedOrganization, selectOrganization } = useAuth();

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?';

  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Guest';
  const orgName = selectedOrganization?.name || 'No Organization';

  const NavButton = ({
    item,
  }: {
    item: (typeof mainNavItems)[number];
  }) => {
    const isActive = currentView === item.view;
    const Icon = item.icon;
    return (
      <button
        key={item.label}
        onClick={() => onNavigate(item.view)}
        className={`w-full flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-[#E8EDE7] text-[#4A5548]'
            : 'text-[#5C5C5C] hover:bg-[#F7F6F2] hover:text-[#1A1A1A]'
        }`}
      >
        <Icon size={18} className={isActive ? 'text-[#4A5548]' : 'text-[#8A8A8A]'} />
        {item.label}
      </button>
    );
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-[260px] bg-white border-r border-[#E5E4E0] hidden lg:flex flex-col py-4 z-40">
      {/* Organization selector */}
      <div className="px-3 pb-3 border-b border-[#E5E4E0]">
        <label className="block px-3 pb-1.5 text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider">
          Organization
        </label>
        {organizations.length > 0 ? (
          <Select
            value={selectedOrganization?.id || ''}
            onValueChange={(id) => selectOrganization(id)}
          >
            <SelectTrigger className="w-full h-9 bg-[#F7F6F2] border-[#E5E4E0] text-sm text-[#1A1A1A] rounded-[10px] px-3 focus:ring-[#4A5548]/15 focus:border-[#4A5548]">
              <SelectValue placeholder="Select organization" />
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
          <div className="px-3 py-2 text-sm text-[#8A8A8A]">
            No organizations
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-1 pt-3">
        {mainNavItems.map((item) => (
          <NavButton key={item.label} item={item} />
        ))}

        {isAdmin && (
          <div className="pt-4">
            <div className="px-3 pb-2 pt-4 border-t border-[#E5E4E0]">
              <span className="text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wider">
                Administration
              </span>
            </div>
            {adminNavItems.map((item) => (
              <NavButton key={item.label} item={item} />
            ))}
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pt-4 border-t border-[#E5E4E0] mt-auto">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-[#E8EDE7] flex items-center justify-center text-xs font-semibold text-[#4A5548]">
            {initials}
          </div>
          <div>
            <div className="text-sm font-medium text-[#1A1A1A]">{fullName}</div>
            <div className="text-xs text-[#8A8A8A]">{orgName}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-xs text-[#8A8A8A] hover:text-[#C44536] transition-colors duration-150"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
