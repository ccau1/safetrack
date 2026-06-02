export type EmployeeStatus = 'safe' | 'distress' | 'unknown';

export type Severity = 'low' | 'medium' | 'high';

export interface Employee {
  id: number;
  memberId: string;
  name: string;
  role: string;
  team: string;
  status: EmployeeStatus;
  location: string;
  lastUpdated: string;
  severity?: Severity;
  details?: string;
}

export interface Team {
  name: string;
  memberCount: number;
}

export interface EmergencyEvent {
  id: number;
  name: string;
  type: string;
  status: string;
  started: string;
}

export interface StatusHistoryEntry {
  status: EmployeeStatus;
  timestamp: string;
  note?: string;
}

export type ViewName = 'dashboard' | 'report' | 'team' | 'organization' | 'alert' | 'contacts' | 'team-management' | 'permissions';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Backend API types

export interface OrganizationMembership {
  id: string;
  name: string;
  slug: string;
  orgRole: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  actions: string[];
  organization: OrganizationMembership | null;
  organizations: OrganizationMembership[];
}

export interface AuthUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  actions: string[];
  organizations: OrganizationMembership[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface TeamApi {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
}

export interface Member {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  teamId: string | null;
  teamName: string | null;
  orgRole: string;
  createdAt: string;
}

export interface EventApi {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  type: 'FIRE_DRILL' | 'EMERGENCY' | 'EVACUATION' | 'LOCKDOWN';
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  startedAt: string;
  resolvedAt: string | null;
  createdAt: string;
}

export interface StatusReportApi {
  id: string;
  eventId: string;
  memberId: string;
  memberName: string;
  status: 'SAFE' | 'NEEDS_HELP' | 'MISSING' | 'EN_ROUTE';
  location: string | null;
  note: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  organizationId: string;
  teamId: string | null;
  eventId: string | null;
  statusReportId: string | null;
  actorMemberId: string | null;
  actorName: string | null;
  targetMemberId: string | null;
  targetName: string | null;
  createdAt: string;
  read: boolean;
}

export interface UserContact {
  id: string;
  userId: string;
  email: string | null;
  phoneNumber: string | null;
  alternatePhoneNumber: string | null;
  nextOfKinName: string | null;
  nextOfKinRelationship: string | null;
  nextOfKinPhone: string | null;
  nextOfKinEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type PermissionEffect = 'Allow' | 'Deny';

export interface PermissionEntry {
  action: string;
  effect: PermissionEffect;
}

export interface MemberPermission {
  memberId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  orgRole: string;
  permissions: PermissionEntry[];
}

export interface PermissionCatalogItem {
  action: string;
  description: string;
  category: string;
}
