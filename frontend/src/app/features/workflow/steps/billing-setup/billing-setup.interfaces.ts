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
  billing: {
    bill_type: string;
    receive_billing_by_mail: string;
    wants_initial_premium: string;
    initial_premium_amount: number | null;
    payment_channel: string;
    payment_method: PaymentMethod | null;
  };
  confirmation: PaymentConfirmation | null;
}
