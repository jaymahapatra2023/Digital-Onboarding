export type BillingModel = 'list_bill' | 'self_administered';

export type BillingFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

export interface BillingResponsibleEntity {
  administrator_name: string;
  email: string;
  phone: string;
}

export interface SelfAdminConfig {
  remittance_address_line1: string;
  remittance_city: string;
  remittance_state: string;
  remittance_zip: string;
  admin_contact_name: string;
  admin_contact_email: string;
  admin_contact_phone: string;
}

export interface PaymentMethod {
  id: string;
  type: 'banking_account' | 'credit_debit_card';
  // Banking account fields
  routing_number?: string;
  account_number_last_four?: string;
  account_type?: 'checking' | 'savings';
  bank_name?: string;
  // Card fields
  cardholder_name?: string;
  card_last_four?: string;
  card_brand?: string;
  expiration?: string;
}

export interface PaymentConfirmation {
  confirmation_number: string;
  group_id: string;
  amount: number;
  payment_method_summary: string;
}

export interface BillingSetupData {
  billing_model: BillingModel;
  billing_frequency: BillingFrequency;
  responsible_entity: BillingResponsibleEntity;
  self_admin_config: SelfAdminConfig | null;
  billing: {
    receive_billing_by_mail: string;
    wants_initial_premium: string;
    initial_premium_amount: number | null;
    payment_channel: string;
    payment_method: PaymentMethod | null;
  };
  payment_confirmed: boolean;
  confirmation: PaymentConfirmation | null;
}
