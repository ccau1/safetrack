import { useState, useEffect } from 'react';
import { Search, Bell, CheckCheck, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import type { EmergencyEvent, Notification } from '@/types';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface HeaderProps {
  event: EmergencyEvent | null;
  onMenuToggle: () => void;
}

function timeAgo(dateStr: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return t('notifications.timeAgo.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('notifications.timeAgo.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('notifications.timeAgo.hours', { count: hours });
  const days = Math.floor(hours / 24);
  return t('notifications.timeAgo.days', { count: days });
}

function NotificationItem({
  notification,
  onClick,
  t,
}: {
  notification: Notification;
  onClick: (id: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <button
      onClick={() => onClick(notification.id)}
      className={`w-full text-left px-4 py-3 border-b border-[#E5E4E0] last:border-b-0 transition-colors hover:bg-[#F7F6F2] ${
        notification.read ? 'opacity-60' : 'bg-white'
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
            notification.read ? 'bg-[#D8E0D6]' : 'bg-[#C44536]'
          }`}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1A1A1A]">{notification.title}</p>
          {notification.message && (
            <p className="text-xs text-[#5C5C5C] mt-0.5 line-clamp-2">{notification.message}</p>
          )}
          <p className="text-[11px] text-[#8A8A8A] mt-1">{timeAgo(notification.createdAt, t)}</p>
        </div>
      </div>
    </button>
  );
}

export function Header({ event, onMenuToggle }: HeaderProps) {
  const { t } = useTranslation();
  const { user, selectedOrganization } = useAuth();
  const orgId = selectedOrganization?.id ?? null;
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(orgId);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?';

  const handleMarkAll = async () => {
    await markAllAsRead();
  };

  const handleItemClick = async (id: string) => {
    await markAsRead(id);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-16 bg-white z-50 flex items-center justify-between px-8 transition-shadow duration-150 ${
        scrolled ? 'shadow-[0_1px_3px_rgba(0,0,0,0.04)]' : 'border-b border-[#E5E4E0]'
      }`}
    >
      {/* Left cluster */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 text-[#5C5C5C] hover:text-[#1A1A1A] transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <Logo />
        {event && (
          <span className="text-[11px] font-medium text-[#4A5548] bg-[#E8EDE7] rounded-full px-3 py-1">
            {event.name} — {event.started}
          </span>
        )}
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder={t('common.search')}
            className="w-60 h-9 bg-[#F7F6F2] border border-[#E5E4E0] rounded-[10px] pl-9 pr-3 text-sm text-[#1A1A1A] placeholder:text-[#8A8A8A] focus:outline-none focus:border-[#4A5548] focus:ring-[0_0_0_3px_rgba(74,85,72,0.15)] transition-all duration-150"
          />
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="relative p-1.5 text-[#5C5C5C] hover:text-[#1A1A1A] hover:scale-105 transition-all duration-150">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#C44536] text-white text-[10px] font-bold px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-[360px] p-0 bg-white border border-[#E5E4E0] rounded-[14px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E4E0]">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">{t('notifications.title')}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-xs font-medium text-[#4A5548] hover:text-[#1A1A1A] transition-colors"
                >
                  <CheckCheck size={14} />
                  {t('notifications.markAllAsRead')}
                </button>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-[#8A8A8A]">{t('notifications.noNotifications')}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onClick={handleItemClick}
                    t={t}
                  />
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <LanguageSwitcher />
        <div className="w-9 h-9 rounded-full bg-[#E8EDE7] flex items-center justify-center text-sm font-semibold text-[#4A5548]">
          {initials}
        </div>
      </div>
    </header>
  );
}
