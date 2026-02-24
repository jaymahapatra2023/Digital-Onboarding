export enum UserRole {
  EMPLOYER = 'EMPLOYER',
  BROKER = 'BROKER',
  GA = 'GA',
  TPA = 'TPA',
  BROKER_TPA_GA_ADMIN = 'BROKER_TPA_GA_ADMIN',
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
