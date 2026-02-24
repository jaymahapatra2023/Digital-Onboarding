import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { WorkflowStore } from '../../store/workflow.store';

interface CommissionRate {
  product_name: string;
  commission_type: string;
  commission_rate: number;
  commission_split_pct: number;
}

@Component({
  selector: 'app-commission-ack',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatCheckboxModule, MatButtonModule, MatCardModule, MatIconModule,
    MatTableModule, MatChipsModule,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
            <mat-icon class="text-green-600" style="font-size:20px;width:20px;height:20px;">handshake</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-900">Commission Agreement Acknowledgement</h2>

          <!-- S4: Acknowledgement status chip -->
          <span *ngIf="acknowledgementStatus === 'pending'"
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <mat-icon style="font-size:14px;width:14px;height:14px;">pending</mat-icon>
            Pending Acknowledgement
          </span>
          <span *ngIf="acknowledgementStatus === 'acknowledged'"
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <mat-icon style="font-size:14px;width:14px;height:14px;">check_circle</mat-icon>
            Acknowledged{{ acknowledgedAt ? ' ' + acknowledgedAt : '' }}
          </span>
        </div>
        <p class="text-slate-500 ml-12">Review and e-sign the commission agreement</p>
      </div>

      <!-- S5: Licensing prerequisite blocking banner -->
      <div *ngIf="!licensingValid" class="bg-red-50 border border-red-300 rounded-xl p-4 space-y-2">
        <div class="flex items-center gap-2">
          <mat-icon class="text-red-600" style="font-size:20px;width:20px;height:20px;">block</mat-icon>
          <h3 class="text-sm font-semibold text-red-800">
            Licensing step must be completed before proceeding
          </h3>
        </div>
        <ul class="list-disc list-inside space-y-1 ml-7">
          <li *ngFor="let reason of licensingBlockReasons" class="text-sm text-red-700">{{ reason }}</li>
        </ul>
      </div>

      <!-- S2: Agreement completeness warnings -->
      <div *ngIf="licensingValid && agreementBlockReasons.length > 0"
           class="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
        <div class="flex items-center gap-2">
          <mat-icon class="text-amber-600" style="font-size:20px;width:20px;height:20px;">warning</mat-icon>
          <h3 class="text-sm font-semibold text-amber-800">
            Agreement data is incomplete
          </h3>
        </div>
        <ul class="list-disc list-inside space-y-1 ml-7">
          <li *ngFor="let reason of agreementBlockReasons" class="text-sm text-amber-700">{{ reason }}</li>
        </ul>
      </div>

      <!-- Notice Banner -->
      <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
        <p class="text-sm text-blue-800">
          If you have any questions about your commissions, before clicking Submit, please contact your
          third party administrator or your sales representative.
        </p>
      </div>

      <!-- S5: Wrapper with disabled styling when licensing is invalid -->
      <div [ngClass]="{'opacity-60 pointer-events-none': !licensingValid}">
        <!-- Customer and Commission Information -->
        <mat-card class="mb-6">
          <mat-card-content class="p-6 space-y-5">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-slate-800">Customer and Commission Information</h3>
              <!-- S1: Prefilled indicator -->
              <span *ngIf="prefilledFields.size > 0"
                    class="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
                <mat-icon style="font-size:12px;width:12px;height:12px;">auto_fix_high</mat-icon>
                Prefilled from prior steps
              </span>
            </div>
            <p class="text-xs text-slate-500">All fields are required unless noted.</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div class="flex flex-col py-2">
                <span class="text-xs text-slate-400 uppercase tracking-wide">Company Name</span>
                <span class="text-sm font-medium text-slate-800">{{ infoForm.get('company_name')?.value || '—' }}</span>
              </div>
              <div class="flex flex-col py-2">
                <span class="text-xs text-slate-400 uppercase tracking-wide">Group Number</span>
                <span class="text-sm font-medium text-slate-800">{{ infoForm.get('group_number')?.value || '—' }}</span>
              </div>
              <div class="flex flex-col py-2">
                <span class="text-xs text-slate-400 uppercase tracking-wide">Experience Number</span>
                <span class="text-sm font-medium text-slate-800">{{ infoForm.get('experience_number')?.value || '—' }}</span>
              </div>
              <div class="flex flex-col py-2">
                <span class="text-xs text-slate-400 uppercase tracking-wide">Situs State</span>
                <span class="text-sm font-medium text-slate-800">{{ infoForm.get('situs_state')?.value || '—' }}</span>
              </div>
              <div class="flex flex-col py-2">
                <span class="text-xs text-slate-400 uppercase tracking-wide">Effective Date</span>
                <span class="text-sm font-medium text-slate-800">{{ infoForm.get('effective_date')?.value || '—' }}</span>
                <!-- S2: Amber warning if effective date missing -->
                <span *ngIf="!infoForm.get('effective_date')?.value"
                      class="text-xs text-amber-600 mt-1">
                  Must be set in Company Information step
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Commission Rate/Split Table -->
        <mat-card class="mb-6">
          <mat-card-content class="p-6 space-y-4">
            <h3 class="text-base font-semibold text-slate-800">Commission Rate / Split</h3>

            <div *ngIf="commissionRates.length === 0"
                 class="flex flex-col items-center gap-2 py-8 bg-slate-50 rounded-xl border border-slate-100">
              <mat-icon class="text-slate-300" style="font-size:40px;width:40px;height:40px;">table_chart</mat-icon>
              <p class="text-slate-400 text-sm">Commission rates will be populated from prior steps</p>
            </div>

            <table *ngIf="commissionRates.length > 0" mat-table [dataSource]="commissionRates" class="w-full">
              <ng-container matColumnDef="product_name">
                <th mat-header-cell *matHeaderCellDef>Product Name</th>
                <td mat-cell *matCellDef="let rate">{{ rate.product_name }}</td>
                <td mat-footer-cell *matFooterCellDef class="font-semibold">Total</td>
              </ng-container>
              <ng-container matColumnDef="commission_type">
                <th mat-header-cell *matHeaderCellDef>Commission Type</th>
                <td mat-cell *matCellDef="let rate">{{ rate.commission_type }}</td>
                <td mat-footer-cell *matFooterCellDef></td>
              </ng-container>
              <ng-container matColumnDef="commission_rate">
                <th mat-header-cell *matHeaderCellDef>Commission Rate</th>
                <td mat-cell *matCellDef="let rate">{{ rate.commission_rate }}%</td>
                <td mat-footer-cell *matFooterCellDef></td>
              </ng-container>
              <ng-container matColumnDef="commission_split_pct">
                <th mat-header-cell *matHeaderCellDef>Commission Split Percentage</th>
                <td mat-cell *matCellDef="let rate">{{ rate.commission_split_pct }}%</td>
                <td mat-footer-cell *matFooterCellDef
                    [ngClass]="{'text-green-700': splitTotal === 100, 'text-amber-700': splitTotal !== 100}"
                    class="font-semibold">
                  {{ splitTotal }}%
                  <span *ngIf="splitTotal !== 100" class="text-xs font-normal ml-1">(must equal 100%)</span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="rateColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: rateColumns;"></tr>
              <!-- S2: Footer row showing split total -->
              <tr mat-footer-row *matFooterRowDef="rateColumns"
                  [ngClass]="{'bg-green-50': splitTotal === 100, 'bg-amber-50': splitTotal !== 100}"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Broker Details -->
        <mat-card class="mb-6">
          <mat-card-content class="p-6 space-y-4">
            <h3 class="text-base font-semibold text-slate-800">Broker Details</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div class="flex flex-col py-2">
                <span class="text-xs text-slate-400 uppercase tracking-wide">Broker Code</span>
                <span class="text-sm font-medium text-slate-800">{{ brokerForm.get('broker_code')?.value || '—' }}</span>
              </div>
              <div class="flex flex-col py-2">
                <span class="text-xs text-slate-400 uppercase tracking-wide">Broker Email Address</span>
                <span class="text-sm font-medium text-slate-800">{{ brokerForm.get('broker_email')?.value || '—' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Payee Details -->
        <mat-card class="mb-6">
          <mat-card-content class="p-6 space-y-4">
            <h3 class="text-base font-semibold text-slate-800">Payee Details</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div class="flex flex-col py-2">
                <span class="text-xs text-slate-400 uppercase tracking-wide">Payee Name</span>
                <span class="text-sm font-medium text-slate-800">{{ payeeForm.get('payee_name')?.value || '—' }}</span>
              </div>
              <div class="flex flex-col py-2">
                <span class="text-xs text-slate-400 uppercase tracking-wide">Payee Broker Code</span>
                <span class="text-sm font-medium text-slate-800">{{ payeeForm.get('payee_broker_code')?.value || '—' }}</span>
              </div>
              <div class="flex flex-col py-2">
                <span class="text-xs text-slate-400 uppercase tracking-wide">Payee Address</span>
                <span class="text-sm font-medium text-slate-800">{{ payeeForm.get('payee_address')?.value || '—' }}</span>
              </div>
              <div class="flex flex-col py-2">
                <span class="text-xs text-slate-400 uppercase tracking-wide">Vice President Signature</span>
                <span class="text-sm font-medium text-slate-800">{{ payeeForm.get('vp_signature')?.value || '—' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Terms and Conditions + Electronic Signature -->
        <form [formGroup]="termsForm">
          <mat-card class="mb-6">
            <mat-card-content class="p-6 space-y-4">
              <h3 class="text-base font-semibold text-slate-800">Terms and Conditions</h3>

              <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <p class="text-sm text-slate-700">
                  You must first click the link, read the information, and then check the box before submitting your
                  commission acknowledgment form. If you have any questions or need clarification regarding your
                  commissions before submitting, please contact your administrator.
                </p>
                <p class="text-sm font-medium text-slate-800">I have read and consent to the following:</p>

                <div class="flex items-center gap-2">
                  <mat-checkbox formControlName="disclosure_agreement" color="primary">
                    <a href="javascript:void(0)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline"
                       (click)="$event.preventDefault()">
                      Disclosure Agreement
                    </a>
                  </mat-checkbox>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-content class="p-6 space-y-4">
              <h3 class="text-base font-semibold text-slate-800">Electronic Signature</h3>

              <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <mat-checkbox formControlName="e_signature" color="primary">
                  <span class="text-sm text-slate-700">
                    I have reviewed the above and declare that all information given is true and complete to the best of
                    my knowledge and belief. I understand that by entering my name below and clicking the "Submit"
                    button I am signing and submitting to Metropolitan Life Insurance Company. By electronically
                    signing this document, I am also indicating I have read and agree to Metropolitan Life Insurance
                    Company's agreements. This is a legally binding electronic signature.
                  </span>
                </mat-checkbox>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Accepted by</mat-label>
                  <input matInput formControlName="accepted_by">
                  <mat-error>Required</mat-error>
                </mat-form-field>
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Date</mat-label>
                  <input matInput formControlName="signature_date" readonly>
                </mat-form-field>
              </div>

              <p class="text-xs text-slate-400">
                Note: You cannot make changes after you've clicked "Submit &amp; Next". A copy of this document will be
                available for printing and downloading once enrollment begins.
              </p>
            </mat-card-content>
          </mat-card>
        </form>
      </div>
    </div>
  `,
})
export class CommissionAckComponent implements OnInit, OnDestroy {
  infoForm!: FormGroup;
  brokerForm!: FormGroup;
  payeeForm!: FormGroup;
  termsForm!: FormGroup;

  commissionRates: CommissionRate[] = [];
  rateColumns = ['product_name', 'commission_type', 'commission_rate', 'commission_split_pct'];

  // S5: Licensing prerequisite state
  licensingValid = true;
  licensingBlockReasons: string[] = [];

  // S1: Prefill tracking
  prefilledFields = new Set<string>();

  // S2: Agreement completeness validation
  agreementComplete = true;
  agreementBlockReasons: string[] = [];
  splitTotal = 0;

  // S4: Acknowledgement status
  acknowledgementStatus: 'pending' | 'acknowledged' = 'pending';
  acknowledgedAt: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private store: WorkflowStore,
  ) {
    this.buildForms();
  }

  ngOnInit(): void {
    const step = this.store.currentStep();
    const hasSavedData = step?.data && Object.keys(step.data).length > 0;

    if (hasSavedData) {
      this.patchSavedData(step!.data as Record<string, any>);
    }

    // S1: Prefill from client store and prior step data on first visit
    if (!hasSavedData) {
      this.prefillFromPriorSteps();
    }

    // S5: Check licensing step prerequisites
    this.checkLicensingPrerequisites();

    // S2: Check agreement completeness
    this.checkAgreementCompleteness();

    // S4: Determine acknowledgement status
    this.updateAcknowledgementStatus();

    // S2: Recalculate split total
    this.calculateSplitTotal();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // S1: Prefill all display fields from client store, company-info, and licensing data
  private prefillFromPriorSteps(): void {
    const client = this.store.client();
    const companyInfoData = this.store.getStepData('company_info');
    const licensingData = this.store.getStepData('licensing');

    // Client store → infoForm
    if (client) {
      if (client.client_name) {
        this.infoForm.patchValue({ company_name: client.client_name });
        this.prefilledFields.add('company_name');
      }
      const groupNumber = client.group_id || client.unique_id;
      if (groupNumber) {
        this.infoForm.patchValue({ group_number: groupNumber });
        this.prefilledFields.add('group_number');
      }
      if (client.primary_address_state) {
        this.infoForm.patchValue({ situs_state: client.primary_address_state });
        this.prefilledFields.add('situs_state');
      }
    }

    // Company-info step data → infoForm
    if (companyInfoData?.['basic']) {
      const basic = companyInfoData['basic'];
      if (basic['effective_date']) {
        this.infoForm.patchValue({ effective_date: basic['effective_date'] });
        this.prefilledFields.add('effective_date');
      }
      if (basic['group_number']) {
        this.infoForm.patchValue({ experience_number: basic['group_number'] });
        this.prefilledFields.add('experience_number');
      }
    }

    // Licensing step data → brokerForm, payeeForm, commissionRates
    if (licensingData?.['writing_producers']) {
      const producers = licensingData['writing_producers'] as any[];

      // First producer with role_type containing "BROKER" → broker details
      const brokerProducer = producers.find((p: any) =>
        p.role_type?.toUpperCase().includes('BROKER')
      ) || producers[0];

      if (brokerProducer) {
        this.brokerForm.patchValue({
          broker_code: brokerProducer.compensable_code || '',
          broker_email: brokerProducer.email || '',
        });
        this.prefilledFields.add('broker_code');
        this.prefilledFields.add('broker_email');
      }

      // First producer → payee details
      const firstProducer = producers[0];
      if (firstProducer) {
        const payeeName = [firstProducer.first_name, firstProducer.last_name]
          .filter(Boolean).join(' ');
        this.payeeForm.patchValue({
          payee_name: payeeName,
          payee_broker_code: firstProducer.compensable_code || '',
        });
        this.prefilledFields.add('payee_name');
        this.prefilledFields.add('payee_broker_code');
      }

      // Build commission rates from producers
      this.commissionRates = producers.map((p: any) => ({
        product_name: p.role_type || 'Producer',
        commission_type: 'Standard',
        commission_rate: p.commission_split || 0,
        commission_split_pct: p.commission_split || 0,
      }));
    }
  }

  private checkLicensingPrerequisites(): void {
    const licensingData = this.store.getStepData('licensing');
    const reasons: string[] = [];

    if (!licensingData || !licensingData['writing_producers']) {
      reasons.push('No writing producers have been added in the Licensing step.');
      this.licensingBlockReasons = reasons;
      this.licensingValid = false;
      return;
    }

    const producers = licensingData['writing_producers'] as any[];

    if (producers.length === 0) {
      reasons.push('At least one writing producer is required.');
    }

    const nonActiveProducers = producers.filter(p => p.licensing_status !== 'active');
    if (nonActiveProducers.length > 0) {
      reasons.push(
        `${nonActiveProducers.length} producer(s) do not have active licensing status.`
      );
    }

    const noCodeProducers = producers.filter(p => !p.compensable_code);
    if (noCodeProducers.length > 0) {
      reasons.push(
        `${noCodeProducers.length} producer(s) have not been verified for a compensable code.`
      );
    }

    const totalSplit = producers.reduce((sum: number, p: any) => sum + (p.commission_split || 0), 0);
    if (totalSplit !== 100) {
      reasons.push(`Commission splits total ${totalSplit}% (must equal 100%).`);
    }

    this.licensingBlockReasons = reasons;
    this.licensingValid = reasons.length === 0;
  }

  // S2: Validate agreement data completeness
  private checkAgreementCompleteness(): void {
    const reasons: string[] = [];

    if (!this.infoForm.get('effective_date')?.value) {
      reasons.push('Effective date must be set in Company Information step.');
    }

    if (this.commissionRates.length === 0) {
      reasons.push('At least one commission rate row is required.');
    }

    if (this.commissionRates.length > 0) {
      const total = this.commissionRates.reduce((sum, r) => sum + (r.commission_split_pct || 0), 0);
      if (total !== 100) {
        reasons.push(`Commission split percentages total ${total}% (must equal 100%).`);
      }
    }

    if (!this.payeeForm.get('payee_name')?.value) {
      reasons.push('Payee name is required.');
    }

    this.agreementBlockReasons = reasons;
    this.agreementComplete = reasons.length === 0;
  }

  // S2: Calculate split total for footer display
  private calculateSplitTotal(): void {
    this.splitTotal = this.commissionRates.reduce(
      (sum, r) => sum + (r.commission_split_pct || 0), 0
    );
  }

  // S4: Determine acknowledgement status from saved data
  private updateAcknowledgementStatus(): void {
    const step = this.store.currentStep();
    const data = step?.data as Record<string, any> | undefined;

    if (data?.['terms']?.['e_signature'] === true && data?.['terms']?.['accepted_by']) {
      this.acknowledgementStatus = 'acknowledged';
      this.acknowledgedAt = data?.['terms']?.['acknowledged_at']
        ? new Date(data['terms']['acknowledged_at']).toLocaleDateString('en-US')
        : null;
    } else {
      this.acknowledgementStatus = 'pending';
      this.acknowledgedAt = null;
    }
  }

  private buildForms(): void {
    // Read-only customer info (pre-populated from prior steps / backend)
    this.infoForm = this.fb.group({
      company_name: [{ value: '', disabled: true }],
      group_number: [{ value: '', disabled: true }],
      experience_number: [{ value: '', disabled: true }],
      situs_state: [{ value: '', disabled: true }],
      effective_date: [{ value: '', disabled: true }],
    });

    this.brokerForm = this.fb.group({
      broker_code: [{ value: '', disabled: true }],
      broker_email: [{ value: '', disabled: true }],
    });

    this.payeeForm = this.fb.group({
      payee_name: [{ value: '', disabled: true }],
      payee_broker_code: [{ value: '', disabled: true }],
      payee_address: [{ value: '', disabled: true }],
      vp_signature: [{ value: '', disabled: true }],
    });

    this.termsForm = this.fb.group({
      disclosure_agreement: [false, Validators.requiredTrue],
      e_signature: [false, Validators.requiredTrue],
      accepted_by: ['', Validators.required],
      signature_date: [{ value: new Date().toLocaleDateString('en-US'), disabled: true }],
    });
  }

  private patchSavedData(data: Record<string, any>): void {
    if (data['info']) {
      this.infoForm.patchValue(data['info']);
    }
    if (data['broker']) {
      this.brokerForm.patchValue(data['broker']);
    }
    if (data['payee']) {
      this.payeeForm.patchValue(data['payee']);
    }
    if (data['commission_rates']) {
      this.commissionRates = data['commission_rates'];
    }
    if (data['terms']) {
      this.termsForm.patchValue(data['terms']);
    }
  }

  getData(): Record<string, any> {
    const termsData = this.termsForm.getRawValue();

    // S4: Add acknowledged_at timestamp when terms are complete
    if (termsData.e_signature && termsData.accepted_by) {
      termsData.acknowledged_at = new Date().toISOString();
    }

    return {
      info: this.infoForm.getRawValue(),
      broker: this.brokerForm.getRawValue(),
      payee: this.payeeForm.getRawValue(),
      commission_rates: this.commissionRates,
      terms: termsData,
    };
  }

  isValid(): boolean {
    // S2: Agreement must be complete in addition to licensing and terms
    return this.licensingValid && this.agreementComplete && this.termsForm.valid;
  }
}
