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
    MatTableModule,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
            <mat-icon class="text-green-600" style="font-size:20px;width:20px;height:20px;">handshake</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-900">Commission Agreement Acknowledgement</h2>
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
            <h3 class="text-base font-semibold text-slate-800">Customer and Commission Information</h3>
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
              </ng-container>
              <ng-container matColumnDef="commission_type">
                <th mat-header-cell *matHeaderCellDef>Commission Type</th>
                <td mat-cell *matCellDef="let rate">{{ rate.commission_type }}</td>
              </ng-container>
              <ng-container matColumnDef="commission_rate">
                <th mat-header-cell *matHeaderCellDef>Commission Rate</th>
                <td mat-cell *matCellDef="let rate">{{ rate.commission_rate }}%</td>
              </ng-container>
              <ng-container matColumnDef="commission_split_pct">
                <th mat-header-cell *matHeaderCellDef>Commission Split Percentage</th>
                <td mat-cell *matCellDef="let rate">{{ rate.commission_split_pct }}%</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="rateColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: rateColumns;"></tr>
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

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private store: WorkflowStore,
  ) {
    this.buildForms();
  }

  ngOnInit(): void {
    const step = this.store.currentStep();
    if (step?.data && Object.keys(step.data).length > 0) {
      this.patchSavedData(step.data as Record<string, any>);
    }

    // S5: Check licensing step prerequisites
    this.checkLicensingPrerequisites();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    return {
      info: this.infoForm.getRawValue(),
      broker: this.brokerForm.getRawValue(),
      payee: this.payeeForm.getRawValue(),
      commission_rates: this.commissionRates,
      terms: this.termsForm.getRawValue(),
    };
  }

  isValid(): boolean {
    return this.licensingValid && this.termsForm.valid;
  }
}
