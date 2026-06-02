import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ReportStatusPage } from '@/pages/ReportStatusPage';
import { MyTeamPage } from '@/pages/MyTeamPage';
import { OrganizationPage } from '@/pages/OrganizationPage';
import { SendAlertPage } from '@/pages/SendAlertPage';
import { ContactsPage } from '@/pages/ContactsPage';
import { TeamManagementPage } from '@/pages/TeamManagementPage';
import { PermissionsPage } from '@/pages/PermissionsPage';
import { LoginPage } from '@/pages/LoginPage';
import { useToast } from '@/hooks/useToast';
import { useFilter } from '@/hooks/useFilter';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { ViewName } from '@/types';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4A5548] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function MainApp() {
  const { isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<ViewName>('dashboard');
  const { toasts, addToast, removeToast } = useToast();
  const { activeTeam, setTeam } = useFilter();

  const {
    employees,
    teams,
    rawTeams,
    rawMembers,
    event,
    stats,
    currentUser,
    currentUserId,
    isLoading,
    myMembership,
    activeEvent,
    organization,
    refetch,
  } = useDashboardData();

  const teamNames = teams.map((t) => t.name);

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#4A5548] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardPage
            employees={employees}
            teams={teamNames}
            stats={stats}
            event={event}
            activeTeam={activeTeam}
            onTeamFilter={setTeam}
            isAdmin={isAdmin}
            addToast={addToast}
          />
        );
      case 'report':
        return (
          <ReportStatusPage
            currentUser={currentUser}
            eventId={activeEvent?.id || null}
            memberId={myMembership?.id || null}
            addToast={addToast}
            onReported={refetch}
          />
        );
      case 'team':
        return (
          <MyTeamPage
            employees={employees}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            addToast={addToast}
          />
        );
      case 'organization':
        return (
          <OrganizationPage
            employees={employees}
            teams={teamNames}
            activeTeam={activeTeam}
            onTeamFilter={setTeam}
            isAdmin={isAdmin}
            addToast={addToast}
          />
        );
      case 'alert':
        return isAdmin ? (
          <SendAlertPage employees={employees} addToast={addToast} />
        ) : (
          <Navigate to="/" replace />
        );
      case 'contacts':
        return <ContactsPage addToast={addToast} />;
      case 'team-management':
        return isAdmin ? (
          <TeamManagementPage
            teams={rawTeams}
            members={rawMembers}
            orgId={organization?.id || null}
            addToast={addToast}
            onMutated={refetch}
          />
        ) : (
          <Navigate to="/" replace />
        );
      case 'permissions':
        return isAdmin ? (
          <PermissionsPage orgId={organization?.id || null} addToast={addToast} />
        ) : (
          <Navigate to="/" replace />
        );
      default:
        return (
          <DashboardPage
            employees={employees}
            teams={teamNames}
            stats={stats}
            event={event}
            activeTeam={activeTeam}
            onTeamFilter={setTeam}
            isAdmin={isAdmin}
            addToast={addToast}
          />
        );
    }
  };

  return (
    <AppLayout
      currentView={currentView}
      onNavigate={setCurrentView}
      event={event}
      toasts={toasts}
      removeToast={removeToast}
    >
      {renderView()}
    </AppLayout>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
