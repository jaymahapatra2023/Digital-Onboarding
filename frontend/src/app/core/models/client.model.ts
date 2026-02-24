export enum ClientStatus {
  APPLICATION_NOT_STARTED = 'APPLICATION_NOT_STARTED',
  APPLICATION_IN_PROGRESS = 'APPLICATION_IN_PROGRESS',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Client {
  id: string;
  client_name: string;
  primary_address_street?: string;
  primary_address_city?: string;
  primary_address_state?: string;
  primary_address_zip?: string;
  primary_address_country?: string;
  unique_id: string;
  eligible_employees?: number;
  status: ClientStatus;
  group_id?: string;
  assigned_to_user_id?: string;
  assigned_user_name?: string;
  days_since_update?: number;
  is_stale?: boolean;
  is_offline?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface ClientListResponse {
  items: Client[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ClientListParams {
  search?: string;
  status?: string;
  assigned_to_user_id?: string;
  stale?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export enum AccessRoleType {
  EMPLOYER = 'EMPLOYER',
  BROKER = 'BROKER',
  GENERAL_AGENT = 'GENERAL_AGENT',
  THIRD_PARTY_ADMIN = 'THIRD_PARTY_ADMIN',
  BROKER_TPA_GA_ADMIN = 'BROKER_TPA_GA_ADMIN',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
}

export interface ClientAccess {
  id: string;
  client_id: string;
  user_id?: string;
  role_type: AccessRoleType;
  first_name: string;
  last_name: string;
  email: string;
  has_ongoing_maintenance_access: boolean;
  is_account_executive: boolean;
  invitation_status: InvitationStatus;
  invitation_sent_at?: string;
  accepted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientAccessCreate {
  first_name: string;
  last_name: string;
  email: string;
  role_type: AccessRoleType;
  has_ongoing_maintenance_access?: boolean;
  is_account_executive?: boolean;
  user_id?: string;
}

// --- Story 4: Case Readiness ---

export interface ReadinessBlocker {
  code: string;
  message: string;
}

export interface CaseReadiness {
  is_ready: boolean;
  blockers: ReadinessBlocker[];
}

// --- Story 5: Timeline ---

export interface TimelineEvent {
  id: string;
  event_type: string;
  description: string;
  icon: string;
  user_id?: string;
  user_name?: string;
  created_at: string;
}

export interface TimelineResponse {
  client_id: string;
  events: TimelineEvent[];
  total: number;
}
