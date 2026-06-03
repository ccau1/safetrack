import { useMemo, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router';
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
import { AcceptInvitePage } from '@/pages/AcceptInvitePage';
import { NoOrganizationPage } from '@/pages/NoOrganizationPage';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, organizations } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const { activeTeam, setTeam } = useFilter();

  const getViewFromPath = useCallback((path: string): ViewName => {
    const segment = path.split('/').filter(Boolean)[0];
    const validViews: ViewName[] = [
      'dashboard', 'report', 'team', 'organization',
      'alert', 'contacts', 'team-management', 'permissions',
    ];
    return validViews.includes(segment as ViewName) ? (segment as ViewName) : 'dashboard';
  }, []);

  const currentView = useMemo(() => getViewFromPath(location.pathname), [location.pathname, getViewFromPath]);

  const handleNavigate = useCallback((view: ViewName) => {
    navigate(`/${view}`);
  }, [navigate]);

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

  if (organizations.length === 0) {
    return (
      <AppLayout
        currentView={currentView}
        onNavigate={handleNavigate}
        event={null}
        toasts={toasts}
        removeToast={removeToast}
      >
        <NoOrganizationPage />
      </AppLayout>
    );
  }

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
            orgId={organization?.id || null}
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
            removeToast={removeToast}
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
      onNavigate={handleNavigate}
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
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
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
