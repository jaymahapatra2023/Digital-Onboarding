import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaymentMethod } from './billing-setup.interfaces';

export interface AddPaymentMethodDialogData {
  existing?: PaymentMethod | null;
}

@Component({
  selector: 'app-add-payment-method-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatRadioModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-green-600" style="font-size:22px;width:22px;height:22px;">payment</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900">{{ data.existing ? 'Modify' : 'Add' }} Payment Method</h2>
          <p class="text-sm text-slate-400">Enter your payment information</p>
        </div>
      </div>

      <mat-dialog-content class="py-5">
        <form [formGroup]="form" class="space-y-4">
          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Payment Method</mat-label>
            <mat-select formControlName="type">
              <mat-option value="banking_account">Banking Account</mat-option>
              <mat-option value="credit_debit_card">Credit/Debit Card</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Banking Account Fields -->
          <ng-container *ngIf="form.get('type')?.value === 'banking_account'">
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Bank Name</mat-label>
              <input matInput formControlName="bank_name">
              <mat-error>Required</mat-error>
            </mat-form-field>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Routing Number</mat-label>
                <input matInput formControlName="routing_number" maxlength="9">
                <mat-error *ngIf="form.get('routing_number')?.hasError('required')">Required</mat-error>
                <mat-error *ngIf="form.get('routing_number')?.hasError('pattern')">Must be 9 digits</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Account Number</mat-label>
                <input matInput formControlName="account_number" type="password">
                <mat-error>Required</mat-error>
              </mat-form-field>
            </div>

            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Account Type</mat-label>
              <mat-select formControlName="account_type">
                <mat-option value="checking">Checking</mat-option>
                <mat-option value="savings">Savings</mat-option>
              </mat-select>
              <mat-error>Required</mat-error>
            </mat-form-field>
          </ng-container>

          <!-- Credit/Debit Card Fields -->
          <ng-container *ngIf="form.get('type')?.value === 'credit_debit_card'">
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Cardholder Name</mat-label>
              <input matInput formControlName="cardholder_name">
              <mat-error>Required</mat-error>
            </mat-form-field>

            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Card Number</mat-label>
              <input matInput formControlName="card_number" maxlength="19">
              <mat-error *ngIf="form.get('card_number')?.hasError('required')">Required</mat-error>
              <mat-error *ngIf="form.get('card_number')?.hasError('minlength')">Invalid card number</mat-error>
            </mat-form-field>

            <mat-form-field class="w-full md:w-1/2" appearance="outline">
              <mat-label>Expiration (MM/YY)</mat-label>
              <input matInput formControlName="expiration" placeholder="MM/YY" maxlength="5">
              <mat-error *ngIf="form.get('expiration')?.hasError('required')">Required</mat-error>
              <mat-error *ngIf="form.get('expiration')?.hasError('pattern')">Use MM/YY format</mat-error>
            </mat-form-field>
          </ng-container>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-2">
        <button mat-button (click)="onCancel()" class="text-slate-500">Cancel</button>
        <button mat-flat-button color="primary" [disabled]="!isFormValid()" (click)="onSave()"
                style="border-radius: 8px;">
          {{ data.existing ? 'Update' : 'Add' }} Payment Method
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class AddPaymentMethodDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddPaymentMethodDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddPaymentMethodDialogData,
  ) {
    this.form = this.fb.group({
      type: [data.existing?.type || '', Validators.required],
      // Banking fields
      bank_name: [data.existing?.bank_name || ''],
      routing_number: [data.existing?.routing_number || ''],
      account_number: [''],
      account_type: [data.existing?.account_type || ''],
      // Card fields
      cardholder_name: [data.existing?.cardholder_name || ''],
      card_number: [''],
      expiration: [data.existing?.expiration || ''],
    });

    this.form.get('type')!.valueChanges.subscribe(type => {
      this.updateValidators(type);
    });

    if (data.existing?.type) {
      this.updateValidators(data.existing.type);
    }
  }

  private updateValidators(type: string): void {
    const bankFields = ['bank_name', 'routing_number', 'account_number', 'account_type'];
    const cardFields = ['cardholder_name', 'card_number', 'expiration'];

    if (type === 'banking_account') {
      this.form.get('bank_name')!.setValidators(Validators.required);
      this.form.get('routing_number')!.setValidators([Validators.required, Validators.pattern(/^\d{9}$/)]);
      this.form.get('account_number')!.setValidators(Validators.required);
      this.form.get('account_type')!.setValidators(Validators.required);
      cardFields.forEach(f => {
        this.form.get(f)!.clearValidators();
        this.form.get(f)!.setValue('');
      });
    } else if (type === 'credit_debit_card') {
      this.form.get('cardholder_name')!.setValidators(Validators.required);
      this.form.get('card_number')!.setValidators([Validators.required, Validators.minLength(13)]);
      this.form.get('expiration')!.setValidators([Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]);
      bankFields.forEach(f => {
        this.form.get(f)!.clearValidators();
        this.form.get(f)!.setValue('');
      });
    }

    [...bankFields, ...cardFields].forEach(f => this.form.get(f)!.updateValueAndValidity());
  }

  isFormValid(): boolean {
    return this.form.valid;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.form.valid) return;
    const val = this.form.value;
    const method: PaymentMethod = {
      id: this.data.existing?.id || crypto.randomUUID(),
      type: val.type,
    };

    if (val.type === 'banking_account') {
      method.bank_name = val.bank_name;
      method.routing_number = val.routing_number;
      method.account_number_last_four = val.account_number.slice(-4);
      method.account_type = val.account_type;
    } else {
      method.cardholder_name = val.cardholder_name;
      method.card_last_four = val.card_number.replace(/\D/g, '').slice(-4);
      method.card_brand = this.detectCardBrand(val.card_number);
      method.expiration = val.expiration;
    }

    this.dialogRef.close(method);
  }

  private detectCardBrand(number: string): string {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'Amex';
    if (/^6011|^65/.test(cleaned)) return 'Discover';
    return 'Card';
  }
}
