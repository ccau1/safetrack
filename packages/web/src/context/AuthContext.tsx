import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import type { AuthUser, AuthResponse, LoginRequest, RegisterRequest, OrganizationMembership } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
  hasAction: (action: string) => boolean;
  hasAnyAction: (actions: string[]) => boolean;
  isAdmin: boolean;
  organizations: OrganizationMembership[];
  selectedOrganization: OrganizationMembership | null;
  selectOrganization: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'safetrack_user';
const SELECTED_ORG_KEY = 'safetrack_selected_org';

function parseStoredUser(): AuthUser | null {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as AuthUser & { organization?: OrganizationMembership | null };
    // Backward compatibility: migrate old single-organization field
    if (!parsed.organizations && parsed.organization) {
      parsed.organizations = [parsed.organization];
    }
    if (!parsed.organizations) {
      parsed.organizations = [];
    }
    return parsed;
  } catch {
    return null;
  }
}

function authResponseToUser(res: AuthResponse): AuthUser {
  return {
    userId: res.userId,
    email: res.email,
    firstName: res.firstName,
    lastName: res.lastName,
    roles: res.roles || [],
    actions: res.actions || [],
    organizations: res.organizations || (res.organization ? [res.organization] : []),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => parseStoredUser());
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(() => localStorage.getItem(SELECTED_ORG_KEY));
  const [isLoading, setIsLoading] = useState(false);

  const organizations = useMemo(() => user?.organizations ?? [], [user]);

  const selectedOrganization = useMemo(() => {
    if (!organizations.length) return null;
    if (selectedOrgId) {
      return organizations.find((o) => o.id === selectedOrgId) || organizations[0];
    }
    return organizations[0];
  }, [organizations, selectedOrgId]);

  const selectOrganization = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem(SELECTED_ORG_KEY, id);
    } else {
      localStorage.removeItem(SELECTED_ORG_KEY);
    }
    setSelectedOrgId(id);
  }, []);

  // Ensure a valid org is selected whenever organizations change
  useEffect(() => {
    if (organizations.length === 0) {
      if (selectedOrgId !== null) selectOrganization(null);
      return;
    }
    const valid = organizations.find((o) => o.id === selectedOrgId);
    if (!valid) {
      selectOrganization(organizations[0].id);
    }
  }, [organizations, selectedOrgId, selectOrganization]);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await api.post<AuthResponse>('/api/auth/login', credentials);
      const authUser = authResponseToUser(res.data);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const res = await api.post<AuthResponse>('/api/auth/register', data);
      const authUser = authResponseToUser(res.data);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore errors — always clear local state
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(SELECTED_ORG_KEY);
      setUser(null);
      setSelectedOrgId(null);
    }
  }, []);

  const reloadUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<AuthResponse>('/api/auth/me/full');
      const authUser = authResponseToUser(res.data);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasAction = useCallback(
    (action: string) => {
      if (!user) return false;
      return user.actions.includes('*') || user.actions.includes(action);
    },
    [user]
  );

  const hasAnyAction = useCallback(
    (actions: string[]) => {
      if (!user) return false;
      if (user.actions.includes('*')) return true;
      return actions.some((a) => user.actions.includes(a));
    },
    [user]
  );

  const isAdmin = selectedOrganization?.orgRole === 'ORG_ADMIN';

  // Listen for logout events from API client (401 handler)
  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(SELECTED_ORG_KEY);
      setUser(null);
      setSelectedOrgId(null);
    };
    window.addEventListener('safetrack:auth:logout', handleLogout);
    return () => window.removeEventListener('safetrack:auth:logout', handleLogout);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        reloadUser,
        hasAction,
        hasAnyAction,
        isAdmin,
        organizations,
        selectedOrganization,
        selectOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
