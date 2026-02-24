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
