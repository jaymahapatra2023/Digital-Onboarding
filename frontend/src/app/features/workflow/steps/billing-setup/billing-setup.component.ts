import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { WorkflowStore } from '../../store/workflow.store';
import { PaymentMethod, PaymentConfirmation, BillingSetupData } from './billing-setup.interfaces';
import { AddPaymentMethodDialogComponent } from './add-payment-method-dialog.component';
import { OfflineInstructionsDialogComponent } from './offline-instructions-dialog.component';
import { PaymentConfirmationDialogComponent } from './payment-confirmation-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-billing-setup',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatCardModule, MatIconModule, MatRadioModule,
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

        <!-- SUB-STEP 1: Initial Premium Payment -->
        <mat-step [stepControl]="billingForm" label="Initial Premium Payment">
          <form [formGroup]="billingForm" class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">

                <!-- Bill Type (read-only) -->
                <mat-form-field class="w-full md:w-1/2" appearance="outline">
                  <mat-label>Bill Type</mat-label>
                  <input matInput formControlName="bill_type" readonly>
                </mat-form-field>

                <!-- Bill Delivery -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <label class="text-sm font-medium text-slate-700">
                    Would you like to receive billing by mail?
                  </label>
                  <mat-radio-group formControlName="receive_billing_by_mail" class="flex gap-6">
                    <mat-radio-button value="yes" color="primary">Yes</mat-radio-button>
                    <mat-radio-button value="no" color="primary">No</mat-radio-button>
                  </mat-radio-group>
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
                  </div>

                  <!-- Pay Online: Add Payment Method -->
                  <ng-container *ngIf="billingForm.get('payment_channel')?.value === 'online'">
                    <div *ngIf="!paymentMethod" class="flex justify-start">
                      <button mat-flat-button color="primary" type="button" (click)="openAddPaymentMethod()"
                              style="border-radius: 8px;">
                        <mat-icon>add</mat-icon> Add Payment Method
                      </button>
                    </div>

                    <div *ngIf="paymentMethod" class="bg-white border border-green-200 rounded-xl p-4 space-y-2">
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
              <button mat-flat-button color="primary" matStepperNext style="border-radius: 8px;">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- SUB-STEP 2: Review Payment & Submit -->
        <mat-step label="Review & Submit">
          <div class="space-y-5 mt-6">
            <mat-card>
              <mat-card-content class="p-6 space-y-5">
                <h3 class="text-base font-semibold text-slate-800">Review Payment Information</h3>
                <p class="text-sm text-slate-500">Please review the billing information before submitting.</p>

                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                  <h4 class="text-sm font-semibold text-slate-700">Billing Preferences</h4>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-slate-500">Bill Type</span>
                    <span class="text-slate-800">{{ billingForm.get('bill_type')?.value || '—' }}</span>
                    <span class="text-slate-500">Receive billing by mail?</span>
                    <span class="text-slate-800 capitalize">{{ billingForm.get('receive_billing_by_mail')?.value || '—' }}</span>
                    <span class="text-slate-500">Initial premium payment?</span>
                    <span class="text-slate-800 capitalize">{{ billingForm.get('wants_initial_premium')?.value || '—' }}</span>
                  </div>
                </div>

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
                    </ng-container>
                  </div>
                </div>

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
  billingForm!: FormGroup;
  paymentMethod: PaymentMethod | null = null;
  confirmation: PaymentConfirmation | null = null;

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
    this.billingForm = this.fb.group({
      bill_type: [{ value: 'List Bill', disabled: true }],
      receive_billing_by_mail: ['no', Validators.required],
      wants_initial_premium: ['no', Validators.required],
      initial_premium_amount: [''],
      payment_channel: [''],
    });
  }

  private setupConditionalValidators(): void {
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
        }
        amountCtrl.updateValueAndValidity();
        channelCtrl.updateValueAndValidity();
      });
  }

  private patchSavedData(data: Record<string, any>): void {
    if (data['billing']) {
      this.billingForm.patchValue(data['billing']);
      if (data['billing'].payment_method) {
        this.paymentMethod = data['billing'].payment_method;
      }
    }
    if (data['confirmation']) {
      this.confirmation = data['confirmation'];
    }
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
    return {
      billing: {
        ...this.billingForm.getRawValue(),
        payment_method: this.paymentMethod,
      },
      confirmation: this.confirmation,
    };
  }

  isValid(): boolean {
    return this.billingForm.valid;
  }
}
