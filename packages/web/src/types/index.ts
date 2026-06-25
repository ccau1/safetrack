export type EmployeeStatus = 'safe' | 'distress' | 'unknown';

export type Severity = 'low' | 'medium' | 'high';

export interface Employee {
  id: number;
  memberId: string;
  userId: string;
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
  uuid: string;
  name: string;
  type: string;
  status: string;
  started: string;
  description?: string;
  startedAt: string;
  resolvedAt: string | null;
}

export interface StatusHistoryEntry {
  status: EmployeeStatus;
  timestamp: string;
  note?: string;
}

export type ViewName = 'dashboard' | 'report' | 'team' | 'organization' | 'alert' | 'contacts' | 'team-management' | 'group-management' | 'permissions' | 'org-settings' | 'emergency-events' | 'analytics' | 'settings';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: ToastAction;
  duration?: number;
}

// Backend API types

export interface OrganizationMembership {
  id: string;
  name: string;
  slug: string;
  orgRole: string;
  isOwner?: boolean;
  ownerId?: string;
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
  ownerId?: string;
}

export type OrganizationResponse = Organization;

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

export interface MemberGroup {
  id: string;
  organizationId: string;
  name: string;
  members: Member[];
  teams: TeamApi[];
  createdAt: string;
}

export interface EmergencyEventApi {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  type: 'FIRE_DRILL' | 'EMERGENCY' | 'EVACUATION' | 'LOCKDOWN';
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  startedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  targetTeams: TeamApi[];
  targetGroups: MemberGroup[];
}

export interface ScopedMember {
  memberId: string;
  name: string;
  teamId: string | null;
  teamName: string | null;
  latestStatus: 'SAFE' | 'NEEDS_HELP' | 'MISSING' | 'EN_ROUTE' | null;
  latestLocation: string | null;
  latestReportAt: string | null;
}

export interface MemberEmergencyStatusReportApi {
  id: string;
  emergencyEventId: string;
  memberId: string;
  memberName: string;
  status: 'SAFE' | 'NEEDS_HELP' | 'MISSING' | 'EN_ROUTE';
  location: string | null;
  note: string | null;
  createdAt: string;
}

export interface EmergencyEventUpdateApi {
  id: string;
  emergencyEventId: string;
  createdById: string;
  createdByName: string;
  text: string;
  type: 'PROGRESSING' | 'ESCALATED' | 'DEESCALATED' | 'NOTE' | 'RESOLVED';
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  organizationId: string;
  teamId: string | null;
  emergencyEventId: string | null;
  memberEmergencyStatusReportId: string | null;
  actorMemberId: string | null;
  actorName: string | null;
  targetMemberId: string | null;
  targetName: string | null;
  createdAt: string;
  read: boolean;
}

export type ContactPointType = 'EMAIL' | 'PHONE' | 'SMS' | 'WHATSAPP';
export type ContactPointCategory = 'SELF' | 'EMERGENCY_CONTACT';

export interface ContactPoint {
  id: string;
  userId: string;
  type: ContactPointType;
  value: string;
  label: string | null;
  category: ContactPointCategory;
  verifiedAt: string | null;
  isPrimary: boolean;
  priority: number;
  createdAt: string;
}

export interface CreateContactPointRequest {
  type: ContactPointType;
  value: string;
  label?: string;
  category?: ContactPointCategory;
}

export interface ReorderContactPointsRequest {
  contactPointIds: string[];
}

export interface UserContact {
  id: string;
  userId: string;
  nextOfKinName: string | null;
  nextOfKinRelationship: string | null;
  nextOfKinPhone: ContactPoint | null;
  nextOfKinEmail: ContactPoint | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserContactRequest {
  nextOfKinName?: string | null;
  nextOfKinRelationship?: string | null;
  nextOfKinPhone?: string | null;
  nextOfKinEmail?: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  inviteToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
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

export interface Invitation {
  id: string;
  email: string;
  organizationName: string;
  teamName?: string;
  orgRole: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
}

export interface CreateInvitationRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  teamId?: string;
  orgRole?: string;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  nextOfKinEmail?: string;
}

export interface AcceptInvitationRequest {
  token: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export interface BatchInvitationResponse {
  createdCount: number;
  skippedCount: number;
  errors: { row: number; email: string; reason: string }[];
}

export interface InvitationValidationResponse {
  token: string;
  email: string;
  organizationName: string;
  teamName: string | null;
  orgRole: string;
  expiresAt: string;
  existingUser: boolean;
}
