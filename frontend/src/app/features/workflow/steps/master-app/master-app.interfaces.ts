export interface MasterAppSignature {
  title: string;
  city: string;
  state: string;
  date: string;
  terms_accepted: boolean;
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
