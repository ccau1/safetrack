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
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

export function AppLayout({
  children,
  currentView,
  onNavigate,
  event,
  toasts,
  removeToast,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <Header event={event} />
      <Sidebar currentView={currentView} onNavigate={onNavigate} />
      <MobileNav currentView={currentView} onNavigate={onNavigate} />

      <main className="lg:ml-[260px] pt-16 min-h-screen">
        <div className="p-8 pb-24 lg:pb-8">{children}</div>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
