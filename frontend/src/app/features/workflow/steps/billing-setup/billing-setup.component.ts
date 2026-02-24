import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { WorkflowStore } from '../../store/workflow.store';
import { PaymentMethod, PaymentConfirmation, BillingModel, BillingFrequency } from './billing-setup.interfaces';
import { AddPaymentMethodDialogComponent } from './add-payment-method-dialog.component';
import { OfflineInstructionsDialogComponent } from './offline-instructions-dialog.component';
import { PaymentConfirmationDialogComponent } from './payment-confirmation-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

const BILLING_MODEL_OPTIONS: { value: BillingModel; label: string }[] = [
  { value: 'list_bill', label: 'List Bill' },
  { value: 'self_administered', label: 'Self-Administered' },
];

const BILLING_FREQUENCY_OPTIONS: { value: BillingFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
];

@Component({
  selector: 'app-billing-setup',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatCardModule, MatIconModule, MatRadioModule,
    MatStepperModule, MatDialogModule,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
            <mat-icon class="text-green-600" style="font-size:20px;width:20px;height:20px;">receipt_long</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-900">Billing Setup</h2>
        </div>
        <p class="text-slate-500 ml-12">Configure billing preferences and initial premium payment</p>
      </div>

      <mat-stepper linear #stepper class="bg-transparent">

        <!-- SUB-STEP 1: Billing Model -->
        <mat-step [stepControl]="billingModelForm" label="Billing Model">
          <form [formGroup]="billingModelForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">

                <!-- Billing Model select -->
                <mat-form-field class="w-full md:w-1/2" appearance="outline">
                  <mat-label>Billing Model</mat-label>
                  <mat-select formControlName="billing_model">
                    <mat-option *ngFor="let opt of billingModelOptions" [value]="opt.value">
                      {{ opt.label }}
                    </mat-option>
                  </mat-select>
                  <mat-error>Required</mat-error>
                </mat-form-field>

                <!-- Billing Frequency select -->
                <mat-form-field class="w-full md:w-1/2" appearance="outline">
                  <mat-label>Billing Frequency</mat-label>
                  <mat-select formControlName="billing_frequency">
                    <mat-option *ngFor="let opt of billingFrequencyOptions" [value]="opt.value">
                      {{ opt.label }}
                    </mat-option>
                  </mat-select>
                  <mat-error>Required</mat-error>
                </mat-form-field>

                <!-- Billing Administrator -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                  <h4 class="text-sm font-semibold text-slate-700">Billing Administrator</h4>
                  <mat-form-field class="w-full" appearance="outline">
                    <mat-label>Administrator Name</mat-label>
                    <input matInput formControlName="administrator_name">
                    <mat-error>Required</mat-error>
                  </mat-form-field>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <mat-form-field appearance="outline">
                      <mat-label>Email</mat-label>
                      <input matInput type="email" formControlName="administrator_email">
                      <mat-error *ngIf="billingModelForm.get('administrator_email')?.hasError('required')">Required</mat-error>
                      <mat-error *ngIf="billingModelForm.get('administrator_email')?.hasError('email')">Invalid email</mat-error>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Phone</mat-label>
                      <input matInput formControlName="administrator_phone">
                      <mat-error>Required</mat-error>
                    </mat-form-field>
                  </div>
                </div>

                <!-- Self-Administered Config (conditional) -->
                <ng-container *ngIf="billingModelForm.get('billing_model')?.value === 'self_administered'">
                  <div [formGroup]="selfAdminForm" class="space-y-4">
                    <div class="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-4">
                      <h4 class="text-sm font-semibold text-amber-800">Self-Administered Configuration</h4>

                      <!-- Remittance Address -->
                      <div class="space-y-4">
                        <h5 class="text-xs font-medium text-slate-600">Remittance Address</h5>
                        <mat-form-field class="w-full" appearance="outline">
                          <mat-label>Address Line 1</mat-label>
                          <input matInput formControlName="remittance_address_line1">
                          <mat-error>Required</mat-error>
                        </mat-form-field>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <mat-form-field appearance="outline">
                            <mat-label>City</mat-label>
                            <input matInput formControlName="remittance_city">
                            <mat-error>Required</mat-error>
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>State</mat-label>
                            <input matInput formControlName="remittance_state">
                            <mat-error>Required</mat-error>
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Zip</mat-label>
                            <input matInput formControlName="remittance_zip">
                            <mat-error>Required</mat-error>
                          </mat-form-field>
                        </div>
                      </div>

                      <!-- Admin Contact -->
                      <div class="space-y-4">
                        <h5 class="text-xs font-medium text-slate-600">Admin Contact</h5>
                        <mat-form-field class="w-full" appearance="outline">
                          <mat-label>Contact Name</mat-label>
                          <input matInput formControlName="admin_contact_name">
                          <mat-error>Required</mat-error>
                        </mat-form-field>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <mat-form-field appearance="outline">
                            <mat-label>Contact Email</mat-label>
                            <input matInput type="email" formControlName="admin_contact_email">
                            <mat-error *ngIf="selfAdminForm.get('admin_contact_email')?.hasError('required')">Required</mat-error>
                            <mat-error *ngIf="selfAdminForm.get('admin_contact_email')?.hasError('email')">Invalid email</mat-error>
                          </mat-form-field>
                          <mat-form-field appearance="outline">
                            <mat-label>Contact Phone</mat-label>
                            <input matInput formControlName="admin_contact_phone">
                            <mat-error>Required</mat-error>
                          </mat-form-field>
                        </div>
                      </div>
                    </div>
                  </div>
                </ng-container>

              </mat-card-content>
            </mat-card>

            <div class="flex justify-end">
              <button mat-flat-button color="primary" matStepperNext
                      [disabled]="!isStep1Valid()" style="border-radius: 8px;">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- SUB-STEP 2: Initial Premium Payment -->
        <mat-step [stepControl]="billingForm" label="Initial Premium Payment">
          <form [formGroup]="billingForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">

                <!-- Bill Delivery -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Would you like to receive billing by mail?
                  </label>
                  <mat-radio-group formControlName="receive_billing_by_mail" class="flex gap-6">
                    <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                    <mat-radio-button value="no" color="primary">No</mat-radio-button>
                  </mat-radio-group>
                  <div *ngIf="billingForm.get('receive_billing_by_mail')?.touched && billingForm.get('receive_billing_by_mail')?.invalid"
                       class="text-xs text-red-600 mt-1">Billing delivery preference is required</div>
                </div>

                <!-- Initial Premium Payment toggle -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Would you like to make an initial premium payment?
                  </label>
                  <mat-radio-group formControlName="wants_initial_premium" class="flex gap-6">
                    <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                    <mat-radio-button value="no" color="primary">No</mat-radio-button>
                  </mat-radio-group>
                  <div *ngIf="billingForm.get('wants_initial_premium')?.touched && billingForm.get('wants_initial_premium')?.invalid"
                       class="text-xs text-red-600 mt-1">Initial premium payment preference is required</div>
                </div>

                <!-- Payment Details (shown when wants_initial_premium = yes) -->
                <ng-container *ngIf="billingForm.get('wants_initial_premium')?.value === 'yes'">
                  <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
                    <p class="text-sm text-blue-800">
                      If you prepay across Master Applications, you only need to enter the total payment once.
                      The payment will be applied across all applicable applications.
                    </p>
                  </div>

                  <mat-form-field class="w-full md:w-1/2" appearance="outline">
                    <mat-label>Initial Premium Amount</mat-label>
                    <span matPrefix class="text-slate-500 ml-2">$&nbsp;</span>
                    <input matInput type="number" formControlName="initial_premium_amount" min="0.01" step="0.01">
                    <mat-error *ngIf="billingForm.get('initial_premium_amount')?.hasError('required')">Required</mat-error>
                    <mat-error *ngIf="billingForm.get('initial_premium_amount')?.hasError('min')">Must be at least $0.01</mat-error>
                  </mat-form-field>

                  <!-- How to pay -->
                  <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <label class="text-sm font-medium text-slate-700">How would you like to pay?</label>
                    <mat-radio-group formControlName="payment_channel" class="flex gap-6">
                      <mat-radio-button value="online" color="primary">Pay Online</mat-radio-button>
                      <mat-radio-button value="offline" color="primary">Pay Offline</mat-radio-button>
                    </mat-radio-group>
                    <div *ngIf="billingForm.get('payment_channel')?.touched && billingForm.get('payment_channel')?.invalid"
                         class="text-xs text-red-600 mt-1">Payment channel selection is required</div>
                  </div>

                  <!-- Pay Online: Add Payment Method -->
                  <ng-container *ngIf="billingForm.get('payment_channel')?.value === 'online'">

                    <!-- Warning: online selected but no confirmed payment method -->
                    <div *ngIf="!paymentConfirmed"
                         class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <mat-icon class="text-amber-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">warning</mat-icon>
                      <p class="text-sm text-amber-800">
                        You must add and confirm a payment method before proceeding to the next step.
                      </p>
                    </div>

                    <div *ngIf="!paymentMethod" class="flex justify-start">
                      <button mat-flat-button color="primary" type="button" (click)="openAddPaymentMethod()"
                              style="border-radius: 8px;">
                        <mat-icon>add</mat-icon> Add Payment Method
                      </button>
                    </div>

                    <div *ngIf="paymentMethod" class="bg-white border border-green-200 rounded-xl p-4 space-y-3">
                      <div class="flex items-center justify-between">
                        <h4 class="text-sm font-semibold text-slate-800">Payment Details</h4>
                        <div class="flex gap-2">
                          <button mat-button class="text-indigo-600 text-sm" type="button" (click)="openAddPaymentMethod()">
                            Modify
                          </button>
                          <button mat-button class="text-red-500 text-sm" type="button" (click)="deletePaymentMethod()">
                            Delete
                          </button>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2 text-sm">
                        <span class="text-slate-500">Method</span>
                        <span class="text-slate-800">{{ paymentMethod.type === 'banking_account' ? 'Banking Account' : 'Credit/Debit Card' }}</span>
                        <span class="text-slate-500">Details</span>
                        <span class="text-slate-800">{{ getPaymentSummary() }}</span>
                      </div>

                      <!-- Confirm Payment Method button -->
                      <div *ngIf="!paymentConfirmed" class="flex justify-end pt-2">
                        <button mat-flat-button color="accent" type="button" (click)="confirmPaymentMethod()"
                                style="border-radius: 8px;">
                          <mat-icon>check_circle</mat-icon> Confirm Payment Method
                        </button>
                      </div>
                      <div *ngIf="paymentConfirmed"
                           class="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                        <mat-icon style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
                        Payment method confirmed
                      </div>
                    </div>
                  </ng-container>

                  <!-- Pay Offline: View Instructions -->
                  <div *ngIf="billingForm.get('payment_channel')?.value === 'offline'">
                    <button mat-button class="text-indigo-600" type="button" (click)="openOfflineInstructions()">
                      <mat-icon>open_in_new</mat-icon> View Offline Instructions
                    </button>
                  </div>
                </ng-container>
              </mat-card-content>
            </mat-card>

            <div class="flex justify-end">
              <button mat-flat-button color="primary" matStepperNext
                      [disabled]="!isStep2Valid()" style="border-radius: 8px;">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- SUB-STEP 3: Review & Submit -->
        <mat-step label="Review & Submit">
          <div class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Review Billing Information</h3>
                <p class="text-sm text-slate-500">Please review all billing information before submitting.</p>

                <!-- Billing Model & Frequency -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <h4 class="text-sm font-semibold text-slate-700">Billing Model</h4>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-slate-500">Model</span>
                    <span class="text-slate-800">{{ getBillingModelLabel() }}</span>
                    <span class="text-slate-500">Frequency</span>
                    <span class="text-slate-800">{{ getBillingFrequencyLabel() }}</span>
                  </div>
                </div>

                <!-- Billing Administrator -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <h4 class="text-sm font-semibold text-slate-700">Billing Administrator</h4>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-slate-500">Name</span>
                    <span class="text-slate-800">{{ billingModelForm.get('administrator_name')?.value || '—' }}</span>
                    <span class="text-slate-500">Email</span>
                    <span class="text-slate-800">{{ billingModelForm.get('administrator_email')?.value || '—' }}</span>
                    <span class="text-slate-500">Phone</span>
                    <span class="text-slate-800">{{ billingModelForm.get('administrator_phone')?.value || '—' }}</span>
                  </div>
                </div>

                <!-- Self-Admin Config (conditional) -->
                <div *ngIf="billingModelForm.get('billing_model')?.value === 'self_administered'"
                     class="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-3">
                  <h4 class="text-sm font-semibold text-amber-800">Self-Administered Configuration</h4>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-slate-500">Remittance Address</span>
                    <span class="text-slate-800">
                      {{ selfAdminForm.get('remittance_address_line1')?.value }},
                      {{ selfAdminForm.get('remittance_city')?.value }},
                      {{ selfAdminForm.get('remittance_state')?.value }}
                      {{ selfAdminForm.get('remittance_zip')?.value }}
                    </span>
                    <span class="text-slate-500">Admin Contact</span>
                    <span class="text-slate-800">
                      {{ selfAdminForm.get('admin_contact_name')?.value }}
                      ({{ selfAdminForm.get('admin_contact_email')?.value }})
                    </span>
                  </div>
                </div>

                <!-- Billing Preferences -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <h4 class="text-sm font-semibold text-slate-700">Billing Preferences</h4>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-slate-500">Receive billing by mail?</span>
                    <span class="text-slate-800 capitalize">{{ billingForm.get('receive_billing_by_mail')?.value || '—' }}</span>
                    <span class="text-slate-500">Initial premium payment?</span>
                    <span class="text-slate-800 capitalize">{{ billingForm.get('wants_initial_premium')?.value || '—' }}</span>
                  </div>
                </div>

                <!-- Payment Details -->
                <div *ngIf="billingForm.get('wants_initial_premium')?.value === 'yes'"
                     class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <h4 class="text-sm font-semibold text-slate-700">Payment Details</h4>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-slate-500">Amount</span>
                    <span class="text-slate-800 font-semibold">{{ billingForm.get('initial_premium_amount')?.value | currency }}</span>
                    <span class="text-slate-500">Payment Channel</span>
                    <span class="text-slate-800 capitalize">{{ billingForm.get('payment_channel')?.value || '—' }}</span>
                    <ng-container *ngIf="paymentMethod">
                      <span class="text-slate-500">Payment Method</span>
                      <span class="text-slate-800">{{ getPaymentSummary() }}</span>
                      <span class="text-slate-500">Confirmed</span>
                      <span class="text-slate-800">{{ paymentConfirmed ? 'Yes' : 'No' }}</span>
                    </ng-container>
                  </div>
                </div>

                <!-- Payment Confirmation -->
                <div *ngIf="confirmation" class="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                  <mat-icon class="text-green-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">check_circle</mat-icon>
                  <div class="text-sm text-green-800">
                    <p class="font-semibold">Payment submitted successfully!</p>
                    <p>Confirmation #: {{ confirmation.confirmation_number }}</p>
                  </div>
                </div>

                <div *ngIf="!confirmation && billingForm.get('wants_initial_premium')?.value === 'yes'"
                     class="flex justify-end">
                  <button mat-flat-button color="primary" (click)="submitPayment()" style="border-radius: 8px;">
                    Submit Payment
                  </button>
                </div>
              </mat-card-content>
            </mat-card>

            <div class="flex justify-between">
              <button mat-button matStepperPrevious class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
            </div>
          </div>
        </mat-step>

      </mat-stepper>
    </div>
  `,
  styles: [`
    :host ::ng-deep .mat-horizontal-stepper-header-container {
      margin-bottom: 0;
    }
    :host ::ng-deep .mat-step-header .mat-step-icon-selected {
      background-color: #4f46e5;
    }
  `],
})
export class BillingSetupComponent implements OnInit, OnDestroy {
  billingModelForm!: FormGroup;
  selfAdminForm!: FormGroup;
  billingForm!: FormGroup;
  paymentMethod: PaymentMethod | null = null;
  paymentConfirmed = false;
  confirmation: PaymentConfirmation | null = null;

  readonly billingModelOptions = BILLING_MODEL_OPTIONS;
  readonly billingFrequencyOptions = BILLING_FREQUENCY_OPTIONS;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private store: WorkflowStore,
  ) {
    this.buildForms();
  }

  ngOnInit(): void {
    this.setupConditionalValidators();

    const step = this.store.currentStep();
    if (step?.data && Object.keys(step.data).length > 0) {
      this.patchSavedData(step.data as Record<string, any>);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForms(): void {
    this.billingModelForm = this.fb.group({
      billing_model: ['list_bill', Validators.required],
      billing_frequency: ['monthly', Validators.required],
      administrator_name: ['', Validators.required],
      administrator_email: ['', [Validators.required, Validators.email]],
      administrator_phone: ['', Validators.required],
    });

    this.selfAdminForm = this.fb.group({
      remittance_address_line1: [''],
      remittance_city: [''],
      remittance_state: [''],
      remittance_zip: [''],
      admin_contact_name: [''],
      admin_contact_email: [''],
      admin_contact_phone: [''],
    });

    this.billingForm = this.fb.group({
      receive_billing_by_mail: ['no', Validators.required],
      wants_initial_premium: ['no', Validators.required],
      initial_premium_amount: [''],
      payment_channel: [''],
    });
  }

  private setupConditionalValidators(): void {
    // Toggle self-admin validators based on billing model
    this.billingModelForm.get('billing_model')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((model: BillingModel) => {
        const selfAdminFields = [
          'remittance_address_line1', 'remittance_city', 'remittance_state', 'remittance_zip',
          'admin_contact_name', 'admin_contact_phone',
        ];
        if (model === 'self_administered') {
          selfAdminFields.forEach(field => {
            this.selfAdminForm.get(field)!.setValidators(Validators.required);
            this.selfAdminForm.get(field)!.updateValueAndValidity();
          });
          this.selfAdminForm.get('admin_contact_email')!.setValidators([Validators.required, Validators.email]);
          this.selfAdminForm.get('admin_contact_email')!.updateValueAndValidity();
        } else {
          Object.keys(this.selfAdminForm.controls).forEach(field => {
            this.selfAdminForm.get(field)!.clearValidators();
            this.selfAdminForm.get(field)!.updateValueAndValidity();
          });
        }
      });

    // Toggle payment validators based on wants_initial_premium
    this.billingForm.get('wants_initial_premium')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const amountCtrl = this.billingForm.get('initial_premium_amount')!;
        const channelCtrl = this.billingForm.get('payment_channel')!;
        if (val === 'yes') {
          amountCtrl.setValidators([Validators.required, Validators.min(0.01)]);
          channelCtrl.setValidators(Validators.required);
        } else {
          amountCtrl.clearValidators();
          amountCtrl.setValue('');
          channelCtrl.clearValidators();
          channelCtrl.setValue('');
          this.paymentMethod = null;
          this.paymentConfirmed = false;
        }
        amountCtrl.updateValueAndValidity();
        channelCtrl.updateValueAndValidity();
      });

    // Reset paymentConfirmed when payment channel changes
    this.billingForm.get('payment_channel')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.paymentConfirmed = false;
      });
  }

  private patchSavedData(data: Record<string, any>): void {
    if (data['billing_model'] || data['billing_frequency'] || data['responsible_entity']) {
      this.billingModelForm.patchValue({
        billing_model: data['billing_model'] || 'list_bill',
        billing_frequency: data['billing_frequency'] || 'monthly',
        administrator_name: data['responsible_entity']?.administrator_name || '',
        administrator_email: data['responsible_entity']?.email || '',
        administrator_phone: data['responsible_entity']?.phone || '',
      });
    }
    if (data['self_admin_config']) {
      this.selfAdminForm.patchValue(data['self_admin_config']);
    }
    if (data['billing']) {
      this.billingForm.patchValue(data['billing']);
      if (data['billing'].payment_method) {
        this.paymentMethod = data['billing'].payment_method;
      }
    }
    if (data['payment_confirmed']) {
      this.paymentConfirmed = true;
    }
    if (data['confirmation']) {
      this.confirmation = data['confirmation'];
    }
  }

  isStep1Valid(): boolean {
    if (!this.billingModelForm.valid) return false;
    if (this.billingModelForm.get('billing_model')?.value === 'self_administered') {
      return this.selfAdminForm.valid;
    }
    return true;
  }

  isStep2Valid(): boolean {
    if (!this.billingForm.valid) return false;
    // Gate: online payment selected requires confirmed payment method
    if (
      this.billingForm.get('wants_initial_premium')?.value === 'yes' &&
      this.billingForm.get('payment_channel')?.value === 'online' &&
      !this.paymentConfirmed
    ) {
      return false;
    }
    return true;
  }

  confirmPaymentMethod(): void {
    this.paymentConfirmed = true;
  }

  getBillingModelLabel(): string {
    const val = this.billingModelForm.get('billing_model')?.value;
    return BILLING_MODEL_OPTIONS.find(o => o.value === val)?.label || '—';
  }

  getBillingFrequencyLabel(): string {
    const val = this.billingModelForm.get('billing_frequency')?.value;
    return BILLING_FREQUENCY_OPTIONS.find(o => o.value === val)?.label || '—';
  }

  getPaymentSummary(): string {
    if (!this.paymentMethod) return '—';
    if (this.paymentMethod.type === 'banking_account') {
      return `${this.paymentMethod.bank_name} - ****${this.paymentMethod.account_number_last_four}`;
    }
    return `${this.paymentMethod.card_brand} ending in ${this.paymentMethod.card_last_four}`;
  }

  openAddPaymentMethod(): void {
    const ref = this.dialog.open(AddPaymentMethodDialogComponent, {
      width: '500px',
      data: { existing: this.paymentMethod },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.paymentMethod = result;
        this.paymentConfirmed = false;
      }
    });
  }

  deletePaymentMethod(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Payment Method',
        message: 'Are you sure you want to remove this payment method?',
        confirmText: 'Delete',
        isDestructive: true,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.paymentMethod = null;
        this.paymentConfirmed = false;
      }
    });
  }

  openOfflineInstructions(): void {
    this.dialog.open(OfflineInstructionsDialogComponent, { width: '500px' });
  }

  submitPayment(): void {
    const groupId = 'GRP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const confirmation: PaymentConfirmation = {
      confirmation_number: 'CNF-' + Date.now().toString(36).toUpperCase(),
      group_id: groupId,
      amount: this.billingForm.get('initial_premium_amount')!.value,
      payment_method_summary: this.getPaymentSummary(),
    };

    const ref = this.dialog.open(PaymentConfirmationDialogComponent, {
      width: '450px',
      disableClose: true,
      data: confirmation,
    });
    ref.afterClosed().subscribe(() => {
      this.confirmation = confirmation;
    });
  }

  getData(): Record<string, any> {
    const modelFormVal = this.billingModelForm.getRawValue();
    const result: Record<string, any> = {
      billing_model: modelFormVal.billing_model,
      billing_frequency: modelFormVal.billing_frequency,
      responsible_entity: {
        administrator_name: modelFormVal.administrator_name,
        email: modelFormVal.administrator_email,
        phone: modelFormVal.administrator_phone,
      },
      self_admin_config: modelFormVal.billing_model === 'self_administered'
        ? this.selfAdminForm.getRawValue()
        : null,
      billing: {
        ...this.billingForm.getRawValue(),
        payment_method: this.paymentMethod,
      },
      payment_confirmed: this.paymentConfirmed,
      confirmation: this.confirmation,
    };
    return result;
  }

  isValid(): boolean {
    return this.isStep1Valid() && this.isStep2Valid();
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];

    // Billing Model form
    if (this.billingModelForm.get('billing_model')?.invalid) {
      errors.push('Billing model selection is required.');
    }
    if (this.billingModelForm.get('billing_frequency')?.invalid) {
      errors.push('Billing frequency selection is required.');
    }
    if (this.billingModelForm.get('administrator_name')?.invalid) {
      errors.push('Billing administrator name is required.');
    }
    if (this.billingModelForm.get('administrator_email')?.invalid) {
      errors.push('Billing administrator email is required.');
    }
    if (this.billingModelForm.get('administrator_phone')?.invalid) {
      errors.push('Billing administrator phone is required.');
    }

    // Self-admin form (conditional)
    if (this.billingModelForm.get('billing_model')?.value === 'self_administered' && this.selfAdminForm.invalid) {
      if (this.selfAdminForm.get('remittance_address_line1')?.invalid) errors.push('Self-Admin: remittance address is required.');
      if (this.selfAdminForm.get('remittance_city')?.invalid) errors.push('Self-Admin: remittance city is required.');
      if (this.selfAdminForm.get('remittance_state')?.invalid) errors.push('Self-Admin: remittance state is required.');
      if (this.selfAdminForm.get('remittance_zip')?.invalid) errors.push('Self-Admin: remittance zip is required.');
      if (this.selfAdminForm.get('admin_contact_name')?.invalid) errors.push('Self-Admin: contact name is required.');
      if (this.selfAdminForm.get('admin_contact_email')?.invalid) errors.push('Self-Admin: contact email is required.');
      if (this.selfAdminForm.get('admin_contact_phone')?.invalid) errors.push('Self-Admin: contact phone is required.');
    }

    // Billing preferences form
    if (this.billingForm.get('receive_billing_by_mail')?.invalid) {
      errors.push('Billing delivery preference is required.');
    }
    if (this.billingForm.get('wants_initial_premium')?.invalid) {
      errors.push('Initial premium payment preference is required.');
    }

    if (this.billingForm.get('wants_initial_premium')?.value === 'yes') {
      if (this.billingForm.get('initial_premium_amount')?.invalid) {
        errors.push('Initial premium amount is required.');
      }
      if (this.billingForm.get('payment_channel')?.invalid) {
        errors.push('Payment channel selection is required.');
      }
      if (this.billingForm.get('payment_channel')?.value === 'online' && !this.paymentConfirmed) {
        errors.push('Online payment method must be added and confirmed.');
      }
    }

    return errors;
  }

  markFormsAsTouched(): void {
    this.billingModelForm.markAllAsTouched();
    this.selfAdminForm.markAllAsTouched();
    this.billingForm.markAllAsTouched();
  }
}
