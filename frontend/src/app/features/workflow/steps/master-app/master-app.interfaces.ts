export interface MasterAppSignature {
  accepted_by: string;
  title: string;
  city: string;
  state: string;
  date: string;
  terms_accepted: boolean;
  client_timestamp: string;
  signer_user_agent: string;
}

export interface MasterAppConfirmation {
  group_number: string;
  effective_date: string;
  classes: string[];
  departments: string[];
}

export interface MasterAppData {
  signature: MasterAppSignature | null;
  confirmation: MasterAppConfirmation | null;
  submitted: boolean;
}
