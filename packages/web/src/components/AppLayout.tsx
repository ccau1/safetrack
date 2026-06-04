import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from './ToastContainer';
import type { ReactNode } from 'react';
import type { ViewName, EmergencyEvent, ToastItem } from '@/types';

interface AppLayoutProps {
  children: ReactNode;
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  event: EmergencyEvent | null;
  activeEventCount: number;
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

export function AppLayout({
  children,
  currentView,
  onNavigate,
  event,
  activeEventCount,
  toasts,
  removeToast,
}: AppLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleNavigate = (view: ViewName) => {
    onNavigate(view);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <Header event={event} onMenuToggle={() => setMobileSidebarOpen(true)} />
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        activeEventCount={activeEventCount}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <MobileNav currentView={currentView} onNavigate={onNavigate} />

      <main className="lg:ml-[260px] pt-16 min-h-screen">
        <div className="p-8 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-8">{children}</div>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
