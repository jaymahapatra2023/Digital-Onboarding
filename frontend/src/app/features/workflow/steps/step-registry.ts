import { Type } from '@angular/core';

export const STEP_NAMES: Record<string, string> = {
  licensing: 'Licensing/Appointment',
  company_info: 'Company Information',
  risk_assessment: 'Risk Assessment',
  commission_ack: 'Commission Agreement',
  renewal_period: 'Renewal Period',
  group_structure: 'Group Structure',
  billing_setup: 'Billing Setup',
  authorization: 'Authorization',
  finalize: 'Finalize',
  master_app: 'Master Application',
};

export const STEP_REGISTRY: Record<string, () => Promise<Type<any>>> = {
  licensing: () => import('./licensing/licensing.component').then(m => m.LicensingComponent),
  company_info: () => import('./company-info/company-info.component').then(m => m.CompanyInfoComponent),
  risk_assessment: () => import('./risk-assessment/risk-assessment.component').then(m => m.RiskAssessmentComponent),
  commission_ack: () => import('./commission-ack/commission-ack.component').then(m => m.CommissionAckComponent),
  renewal_period: () => import('./renewal-period/renewal-period.component').then(m => m.RenewalPeriodComponent),
  group_structure: () => import('./group-structure/group-structure.component').then(m => m.GroupStructureComponent),
  billing_setup: () => import('./billing-setup/billing-setup.component').then(m => m.BillingSetupComponent),
  authorization: () => import('./authorization/authorization.component').then(m => m.AuthorizationComponent),
  finalize: () => import('./finalize/finalize.component').then(m => m.FinalizeComponent),
  master_app: () => import('./master-app/master-app.component').then(m => m.MasterAppComponent),
};
