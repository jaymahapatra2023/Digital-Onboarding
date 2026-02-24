export interface EmployeeClass {
  class_id: string;
  description: string;
}

export interface ClassDescription {
  class_id: string;
  description_type: 'predefined' | 'custom';
  custom_description: string;
  full_time_hours: number;
  earnings_definition: string;
  waiting_period_type: 'first_of_month_following' | 'date_of_hire' | 'custom';
  waiting_period_days: number | null;
}

export interface Location {
  id: string;
  name: string;
  has_active_participants: boolean;
  same_federal_tax_id: boolean;
  federal_tax_id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
}

export interface BillingAddress {
  id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
}

export interface Department {
  id: string;
  description: string;
  code: string;
}

export interface Contact {
  id: string;
  roles: string[];
  first_name: string;
  last_name: string;
  email: string;
  work_phone: string;
  cell_phone: string;
  fax: string;
  online_access: boolean;
}

export interface CaseStructure {
  id: string;
  location_id: string;
  billing_address_id: string;
  department_id: string;
  contact_id: string;
}

export interface ClassLocationAssignment {
  location_id: string;
  class_ids: string[];
}
