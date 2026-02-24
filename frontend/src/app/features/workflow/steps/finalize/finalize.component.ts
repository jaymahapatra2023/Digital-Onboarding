import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { WorkflowStore } from '../../store/workflow.store';
import { STEP_NAMES } from '../step-registry';

@Component({
  selector: 'app-finalize',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatCardModule, MatIconModule,
    MatTooltipModule, MatDividerModule,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
            <mat-icon class="text-teal-600" style="font-size:20px;width:20px;height:20px;">fact_check</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-900">Finalize Group Setup</h2>
        </div>
        <p class="text-slate-500 ml-12">Review all group setup data elements before final submission</p>
      </div>

      <!-- S3: Prerequisite blocking banner -->
      <div *ngIf="incompleteSteps.length > 0" class="bg-red-50 border border-red-300 rounded-xl p-4 space-y-2">
        <div class="flex items-center gap-2">
          <mat-icon class="text-red-600" style="font-size:20px;width:20px;height:20px;">block</mat-icon>
          <h3 class="text-sm font-semibold text-red-800">
            The following steps must be completed before finalizing
          </h3>
        </div>
        <ul class="list-disc list-inside space-y-1 ml-7">
          <li *ngFor="let step of incompleteSteps" class="text-sm text-red-700">{{ step }}</li>
        </ul>
      </div>

      <!-- Print Button -->
      <div class="flex justify-end">
        <button mat-stroked-button (click)="printScreen()" class="text-slate-600">
          <mat-icon>print</mat-icon> Print this Screen
        </button>
      </div>

      <!-- S3: Disabled wrapper when prerequisites not met -->
      <div [ngClass]="{'opacity-60 pointer-events-none': !commissionAckComplete}">

      <!-- Note about editing -->
      <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
        <div class="text-sm text-blue-800">
          <p class="font-medium">Review your group setup details below.</p>
          <p class="mt-1">Click the edit icon next to any section to make changes. Authorization forms
            are not editable but are displayed for record that they were e-signed.</p>
        </div>
      </div>

      <!-- Step 1: Licensing / Appointment -->
      <mat-card *ngIf="stepData['licensing'] as data">
        <mat-card-content class="p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-800">Licensing / Appointment</h3>
            <button mat-icon-button matTooltip="Edit" (click)="editStep('licensing')">
              <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
            </button>
          </div>
          <div *ngIf="data['writing_producers']?.length > 0" class="space-y-2">
            <div *ngFor="let p of data['writing_producers']" class="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span class="text-slate-500 block text-xs">Name</span>
                  <span class="text-slate-800">{{ p.first_name }} {{ p.last_name }}</span>
                </div>
                <div>
                  <span class="text-slate-500 block text-xs">Role</span>
                  <span class="text-slate-800">{{ p.role_type }}</span>
                </div>
                <div>
                  <span class="text-slate-500 block text-xs">Email</span>
                  <span class="text-slate-800">{{ p.email }}</span>
                </div>
                <div>
                  <span class="text-slate-500 block text-xs">Status</span>
                  <span class="text-slate-800 capitalize">{{ p.licensing_status }}</span>
                </div>
              </div>
            </div>
          </div>
          <p *ngIf="!data['writing_producers']?.length" class="text-sm text-slate-400">No producers added</p>
        </mat-card-content>
      </mat-card>

      <!-- Step 2: Company Information -->
      <mat-card *ngIf="stepData['company_info'] as data">
        <mat-card-content class="p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-800">Company Information</h3>
            <button mat-icon-button matTooltip="Edit" (click)="editStep('company_info')">
              <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
            </button>
          </div>
          <div *ngIf="data['basic']" class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div *ngFor="let field of companyInfoFields">
              <span class="text-slate-500">{{ field.label }}</span>
              <span class="text-slate-800 block">{{ data['basic'][field.key] || '—' }}</span>
            </div>
          </div>
          <div *ngIf="data['erisa']" class="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span class="text-xs font-medium text-slate-500">ERISA Status</span>
            <span class="text-sm text-slate-800 block capitalize">{{ data['erisa']['erisa_status'] || '—' }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Step 3: Risk Assessment -->
      <mat-card *ngIf="stepData['risk_assessment'] as data">
        <mat-card-content class="p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-800">Risk Assessment</h3>
            <button mat-icon-button matTooltip="Edit" (click)="editStep('risk_assessment')">
              <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span class="text-slate-500">Any pregnant employees?</span>
              <span class="text-slate-800 block capitalize">{{ data['pregnant']?.any_pregnant || '—' }}</span>
            </div>
            <div *ngIf="data['pregnant']?.any_pregnant === 'yes'">
              <span class="text-slate-500">Pregnant count</span>
              <span class="text-slate-800 block">{{ data['pregnant']?.pregnant_count || '—' }}</span>
            </div>
            <div>
              <span class="text-slate-500">Any health risks?</span>
              <span class="text-slate-800 block capitalize">{{ data['health']?.has_health_risks || '—' }}</span>
            </div>
            <div>
              <span class="text-slate-500">Any disabled employees?</span>
              <span class="text-slate-800 block capitalize">{{ data['disabled']?.has_disabled || '—' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Step 4: Commission Acknowledgement -->
      <mat-card *ngIf="stepData['commission_ack'] as data">
        <mat-card-content class="p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-800">Commission Acknowledgement</h3>
            <button mat-icon-button matTooltip="Edit" (click)="editStep('commission_ack')">
              <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span class="text-slate-500">Broker Name</span>
              <span class="text-slate-800 block">{{ data['broker']?.broker_name || '—' }}</span>
            </div>
            <div>
              <span class="text-slate-500">Payee</span>
              <span class="text-slate-800 block">{{ data['payee']?.payee_name || data['payee']?.payee_type || '—' }}</span>
            </div>
            <div>
              <span class="text-slate-500">Terms Accepted</span>
              <span class="text-slate-800 block">{{ data['terms']?.terms_accepted ? 'Yes' : 'No' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Step 5: Renewal Period -->
      <mat-card *ngIf="stepData['renewal_period'] as data">
        <mat-card-content class="p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-800">Renewal Notification Period</h3>
            <button mat-icon-button matTooltip="Edit" (click)="editStep('renewal_period')">
              <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span class="text-slate-500">Notification Period</span>
              <span class="text-slate-800 block">{{ data['renewal_notification_period'] || '—' }} days</span>
            </div>
            <div>
              <span class="text-slate-500">Downstream Status</span>
              <span class="text-slate-800 block">
                <span *ngIf="data['renewal_notification_period']"
                      class="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  <mat-icon style="font-size:14px;width:14px;height:14px;">check_circle</mat-icon>
                  Ready for servicing
                </span>
                <span *ngIf="!data['renewal_notification_period']"
                      class="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  <mat-icon style="font-size:14px;width:14px;height:14px;">warning</mat-icon>
                  Not configured
                </span>
              </span>
            </div>
          </div>
          <div class="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs text-slate-500">
            This setting will be included in the downstream servicing payload for renewal notification scheduling.
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Step 6: Group Structure -->
      <mat-card *ngIf="stepData['group_structure'] as data">
        <mat-card-content class="p-5 space-y-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-800">Group Structure</h3>
            <button mat-icon-button matTooltip="Edit" (click)="editStep('group_structure')">
              <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
            </button>
          </div>

          <!-- 4-column summary grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span class="text-slate-500 block text-xs">Classes</span>
              <span class="text-slate-800 font-semibold">{{ data['classes']?.length || 0 }}</span>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span class="text-slate-500 block text-xs">Locations</span>
              <span class="text-slate-800 font-semibold">{{ data['locations']?.length || 0 }}</span>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span class="text-slate-500 block text-xs">Contacts</span>
              <span class="text-slate-800 font-semibold">{{ data['contacts']?.length || 0 }}</span>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span class="text-slate-500 block text-xs">Case Structures</span>
              <span class="text-slate-800 font-semibold">{{ data['case_structures']?.length || 0 }}</span>
            </div>
          </div>

          <!-- Class pills -->
          <div *ngIf="data['classes']?.length > 0">
            <span class="text-xs font-medium text-slate-500 block mb-2">Classes</span>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let c of data['classes']"
                    class="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                {{ c.class_id }} &mdash; {{ c.description }}
              </span>
            </div>
          </div>

          <!-- Location list with city/state -->
          <div *ngIf="data['locations']?.length > 0">
            <span class="text-xs font-medium text-slate-500 block mb-2">Locations</span>
            <div class="space-y-1">
              <div *ngFor="let loc of data['locations']"
                   class="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                <mat-icon class="text-slate-400" style="font-size:16px;width:16px;height:16px;">location_on</mat-icon>
                <span class="font-medium">{{ loc.name }}</span>
                <span *ngIf="loc.city || loc.state" class="text-slate-400">&mdash; {{ loc.city }}<span *ngIf="loc.city && loc.state">, </span>{{ loc.state }}</span>
              </div>
            </div>
          </div>

          <!-- Third-party billing addresses -->
          <div *ngIf="data['billing']?.has_third_party_billing === 'yes' && data['billing_addresses']?.length > 0">
            <span class="text-xs font-medium text-slate-500 block mb-2">Third-Party Billing Addresses</span>
            <div class="space-y-1">
              <div *ngFor="let ba of data['billing_addresses']"
                   class="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                {{ ba.address_line1 }}, {{ ba.city }}, {{ ba.state }} {{ ba.zip }}
              </div>
            </div>
          </div>

          <!-- Contacts with roles -->
          <div *ngIf="data['contacts']?.length > 0">
            <span class="text-xs font-medium text-slate-500 block mb-2">Contacts</span>
            <div class="space-y-1">
              <div *ngFor="let c of data['contacts']"
                   class="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                <mat-icon class="text-slate-400" style="font-size:16px;width:16px;height:16px;">person</mat-icon>
                <span class="font-medium">{{ c.first_name }} {{ c.last_name }}</span>
                <span class="text-slate-400">&mdash; {{ c.roles?.join(', ') || c.role || c.contact_type || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Case structure mappings table -->
          <div *ngIf="data['case_structures']?.length > 0">
            <span class="text-xs font-medium text-slate-500 block mb-2">Case Structure Mappings</span>
            <div class="overflow-x-auto">
              <table class="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="text-left px-3 py-2 text-xs font-medium text-slate-500">Location</th>
                    <th class="text-left px-3 py-2 text-xs font-medium text-slate-500">Billing</th>
                    <th class="text-left px-3 py-2 text-xs font-medium text-slate-500">Department</th>
                    <th class="text-left px-3 py-2 text-xs font-medium text-slate-500">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let cs of data['case_structures']" class="border-t border-slate-100">
                    <td class="px-3 py-2 text-slate-700">{{ getGSLocationName(cs.location_id, data) }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ getGSBillingLabel(cs.billing_address_id, data) }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ getGSDepartmentName(cs.department_id, data) }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ getGSContactName(cs.contact_id, data) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Step 7: Billing Setup -->
      <mat-card *ngIf="stepData['billing_setup'] as data">
        <mat-card-content class="p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-800">Billing Setup</h3>
            <button mat-icon-button matTooltip="Edit" (click)="editStep('billing_setup')">
              <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span class="text-slate-500">Bill Type</span>
              <span class="text-slate-800 block">{{ data['billing']?.bill_type || '—' }}</span>
            </div>
            <div>
              <span class="text-slate-500">Receive billing by mail?</span>
              <span class="text-slate-800 block capitalize">{{ data['billing']?.receive_billing_by_mail || '—' }}</span>
            </div>
            <div>
              <span class="text-slate-500">Initial premium payment?</span>
              <span class="text-slate-800 block capitalize">{{ data['billing']?.wants_initial_premium || '—' }}</span>
            </div>
            <div *ngIf="data['billing']?.wants_initial_premium === 'yes'">
              <span class="text-slate-500">Amount</span>
              <span class="text-slate-800 block">{{ data['billing']?.initial_premium_amount | currency }}</span>
            </div>
          </div>
          <div *ngIf="data['confirmation']" class="mt-3 bg-green-50 rounded-lg p-3 border border-green-200 text-sm text-green-800">
            Payment confirmed — Confirmation #{{ data['confirmation']?.confirmation_number }}
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Step 8: Authorization (read-only, not editable) -->
      <mat-card *ngIf="stepData['authorization'] as data">
        <mat-card-content class="p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-semibold text-slate-800">Authorization</h3>
            <span class="text-xs text-slate-400 italic">E-signed — not editable</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-1">
              <span class="text-xs font-medium text-slate-500">Online Access</span>
              <span class="text-slate-700 block capitalize">Broker access: {{ data['online_access']?.broker_online_access || '—' }}</span>
              <span class="text-slate-700 block capitalize">Delivery: {{ data['online_access']?.document_delivery || '—' }}</span>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-1">
              <span class="text-xs font-medium text-slate-500">Privacy &amp; Intermediary</span>
              <span class="text-slate-700 block">Privacy acknowledged: {{ data['privacy_notice']?.privacy_notice_acknowledged ? 'Yes' : 'No' }}</span>
              <span class="text-slate-700 block">Intermediary received: {{ data['intermediary']?.intermediary_notice_received ? 'Yes' : 'No' }}</span>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-1">
              <span class="text-xs font-medium text-slate-500">HIPAA</span>
              <span class="text-slate-700 block capitalize">PHI access: {{ data['hipaa']?.phi_access || '—' }}</span>
              <span class="text-slate-700 block">Terms accepted: {{ data['hipaa']?.hipaa_terms_accepted ? 'Yes' : 'No' }}</span>
            </div>
            <div class="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-1">
              <span class="text-xs font-medium text-slate-500">Claims</span>
              <span class="text-slate-700 block capitalize">Status: {{ data['no_claims']?.claims_status === 'no_claims' ? 'No claims incurred' : 'Claims incurred' }}</span>
              <span *ngIf="data['no_claims']?.claims?.length" class="text-slate-700 block">
                {{ data['no_claims']?.claims?.length }} claim(s) reported
              </span>
            </div>
          </div>
          <div *ngIf="data['final_signature']" class="mt-3 bg-green-50 rounded-lg p-3 border border-green-200 text-sm">
            <div class="flex items-center gap-2 text-green-800">
              <mat-icon style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
              <span class="font-medium">E-signed by {{ data['final_signature']?.accepted_by || 'Authorized Signatory' }}</span>
              <span class="text-green-600 ml-2">{{ data['final_signature']?.signature_date }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Confirmation note -->
      <div class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <mat-icon class="text-amber-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">warning</mat-icon>
        <p class="text-sm text-amber-800">
          Once Group Setup has been submitted on this page, you will lose the ability to go back
          and change any information captured prior to this step.
        </p>
      </div>

      </div><!-- /S3 disabled wrapper -->
    </div>
  `,
  styles: [`
    @media print {
      :host { display: block; }
      button { display: none !important; }
    }
  `],
})
export class FinalizeComponent implements OnInit {
  @Output() editStepRequest = new EventEmitter<string>();

  stepData: Record<string, Record<string, any>> = {};

  // S3: Prerequisite enforcement
  commissionAckComplete = true;
  incompleteSteps: string[] = [];

  companyInfoFields = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'tax_id', label: 'Tax ID' },
    { key: 'sic_code', label: 'SIC Code' },
    { key: 'address_line_1', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zip_code', label: 'Zip Code' },
    { key: 'effective_date', label: 'Effective Date' },
    { key: 'total_eligible_employees', label: 'Total Eligible Employees' },
  ];

  constructor(private store: WorkflowStore) {}

  ngOnInit(): void {
    this.loadAllStepData();
    this.checkPrerequisites();
  }

  private loadAllStepData(): void {
    const steps = this.store.sortedSteps();
    for (const step of steps) {
      if (step.data && Object.keys(step.data).length > 0) {
        this.stepData[step.step_id] = step.data;
      }
    }
  }

  // S3: Check that commission_ack is complete before allowing finalize
  private checkPrerequisites(): void {
    const incomplete: string[] = [];

    // Check commission_ack step data for e-signature
    const commAckData = this.store.getStepData('commission_ack');
    const hasSignature = commAckData?.['terms']?.['e_signature'] === true
      && !!commAckData?.['terms']?.['accepted_by'];

    // Also verify the step status is COMPLETED
    const commAckStep = this.store.sortedSteps().find(s => s.step_id === 'commission_ack');
    const stepCompleted = commAckStep?.status === 'COMPLETED';

    if (!hasSignature || !stepCompleted) {
      incomplete.push(STEP_NAMES['commission_ack'] || 'Commission Agreement Acknowledgement');
    }

    this.incompleteSteps = incomplete;
    this.commissionAckComplete = incomplete.length === 0;
  }

  editStep(stepId: string): void {
    this.editStepRequest.emit(stepId);
  }

  printScreen(): void {
    window.print();
  }

  // --- Group Structure lookup helpers for finalize review ---
  getGSLocationName(id: string, data: Record<string, any>): string {
    const loc = data['locations']?.find((l: any) => l.id === id);
    return loc?.name || '—';
  }

  getGSBillingLabel(id: string, data: Record<string, any>): string {
    if (!id) return 'Primary';
    const ba = data['billing_addresses']?.find((b: any) => b.id === id);
    return ba ? `${ba.address_line1}, ${ba.city}` : '—';
  }

  getGSDepartmentName(id: string, data: Record<string, any>): string {
    if (!id) return '—';
    return data['departments']?.find((d: any) => d.id === id)?.description || '—';
  }

  getGSContactName(id: string, data: Record<string, any>): string {
    const c = data['contacts']?.find((ct: any) => ct.id === id);
    return c ? `${c.first_name} ${c.last_name}` : '—';
  }

  getData(): Record<string, any> {
    return { reviewed: true };
  }

  isValid(): boolean {
    return this.commissionAckComplete;
  }
}
