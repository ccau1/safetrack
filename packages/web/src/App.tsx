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
import { GroupManagementPage } from '@/pages/GroupManagementPage';
import { PermissionsPage } from '@/pages/PermissionsPage';
import { EmergencyEventDetailPage } from '@/pages/EmergencyEventDetailPage';
import { LoginPage } from '@/pages/LoginPage';
import { AcceptInvitePage } from '@/pages/AcceptInvitePage';
import { NoOrganizationPage } from '@/pages/NoOrganizationPage';
import { OrgSettingsPage } from '@/pages/OrgSettingsPage';
import { useToast } from '@/hooks/useToast';
import { useFilter } from '@/hooks/useFilter';
import { EmergenciesPage } from '@/pages/EmergenciesPage';
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
  const { isAdmin, isOwner, organizations } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const { activeTeam, setTeam } = useFilter();

  const getViewFromPath = useCallback((path: string): ViewName => {
    const segment = path.split('/').filter(Boolean)[0];
    const validViews: ViewName[] = [
      'dashboard', 'report', 'team', 'organization',
      'alert', 'contacts', 'team-management', 'group-management', 'permissions', 'org-settings', 'emergency-events',
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
    groups,
    rawMembers,
    event,
    events,
    stats,
    currentUser,
    currentUserId,
    isLoading,
    myMembership,
    activeEvent,
    activeEventCount,
    organization,
    refetch,
    createEvent,
  } = useDashboardData();

  const teamNames = teams.map((t) => t.name);

  if (organizations.length === 0) {
    return (
      <AppLayout
        currentView={currentView}
        onNavigate={handleNavigate}
        event={null}
        activeEventCount={0}
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
            availableTeams={rawTeams}
            availableGroups={groups}
            stats={stats}
            event={event}
            activeTeam={activeTeam}
            onTeamFilter={setTeam}
            isAdmin={isAdmin}
            addToast={addToast}
            createEvent={createEvent}
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
      case 'group-management':
        return isAdmin ? (
          <GroupManagementPage
            groups={groups}
            members={rawMembers}
            teams={rawTeams}
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
      case 'emergency-events':
        return (
          <EmergenciesPage
            events={events}
            activeEventCount={activeEventCount}
            addToast={addToast}
            onMutated={refetch}
          />
        );
      case 'org-settings':
        return (
          <OrgSettingsPage
            employees={employees}
            orgId={organization?.id || null}
            orgName={organization?.name || null}
            orgSlug={organization?.slug || null}
            ownerId={organization?.ownerId || null}
            isOwner={isOwner}
            currentUserId={currentUserId}
            addToast={addToast}
            onMutated={refetch}
          />
        );
      default:
        return (
          <DashboardPage
            employees={employees}
            teams={teamNames}
            availableTeams={rawTeams}
            availableGroups={groups}
            stats={stats}
            event={event}
            activeTeam={activeTeam}
            onTeamFilter={setTeam}
            isAdmin={isAdmin}
            addToast={addToast}
            createEvent={createEvent}
          />
        );
    }
  };

  return (
    <AppLayout
      currentView={currentView}
      onNavigate={handleNavigate}
      event={event}
      activeEventCount={activeEventCount}
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
        path="/emergency-events/:id"
        element={
          <ProtectedRoute>
            <EmergencyEventDetailPage />
          </ProtectedRoute>
        }
      />
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
