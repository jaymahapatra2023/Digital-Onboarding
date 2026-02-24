export interface OnlineAccessData {
  broker_online_access: string;
  document_delivery: string;
}

export interface PrivacyNoticeData {
  privacy_notice_acknowledged: boolean;
}

export interface IntermediaryData {
  intermediary_notice_received: boolean;
  producer_compensation_acknowledged: boolean;
}

export interface ThirdPartyBillingData {
  agreement_reviewed: boolean;
}

export interface GrossUpData {
  company_name: string;
  group_number: string;
  gross_up_acknowledged: boolean;
}

export interface HipaaEmployeeTitle {
  title: string;
}

export interface HipaaData {
  phi_access: string;
  claims_access_option: string;
  employee_titles: HipaaEmployeeTitle[];
  privacy_officer: string;
  participants_rights: string;
  privacy_complaints: string;
  hipaa_file_uploaded: boolean;
  hipaa_terms_accepted: boolean;
  esign_declaration: boolean;
  esign_group_name: string;
  esign_group_number: string;
  esign_first_name: string;
  esign_last_name: string;
  esign_date: string;
}

export interface DisabilityTaxData {
  ltd_w2_issuer: string;
  ltd_payroll_vendor: string;
  ltd_terms_accepted: boolean;
  std_w2_issuer: string;
  std_payroll_vendor: string;
  std_terms_accepted: boolean;
}

export interface CertBeneficialData {
  portability_agreement_acknowledged: boolean;
}

export interface ClaimEntry {
  product: string;
  date: string;
  nature: string;
  additional_comments: string;
}

export interface NoClaimsData {
  claims_status: string;
  claims: ClaimEntry[];
  customer_esign: boolean;
}

export interface FinalSignatureData {
  final_declaration: boolean;
  accepted_by: string;
  signature_date: string;
}

export interface AuthorizationData {
  online_access: OnlineAccessData;
  privacy_notice: PrivacyNoticeData;
  intermediary: IntermediaryData;
  third_party_billing: ThirdPartyBillingData;
  gross_up: GrossUpData;
  hipaa: HipaaData;
  disability_tax: DisabilityTaxData;
  cert_beneficial: CertBeneficialData;
  no_claims: NoClaimsData;
  final_signature: FinalSignatureData;
}
