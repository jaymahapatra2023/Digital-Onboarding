import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { BillingAddress } from './group-structure.interfaces';

export interface AddBillingAddressDialogData {
  billingAddress?: BillingAddress;
  primaryAddress?: { address_line1: string; address_line2: string; city: string; state: string; zip: string };
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

@Component({
  selector: 'app-add-billing-address-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-indigo-600" style="font-size:22px;width:22px;height:22px;">receipt_long</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900">{{ isEditing ? 'Edit' : 'Add' }} Billing Address</h2>
          <p class="text-sm text-slate-400">Enter the billing address details</p>
        </div>
      </div>

      <mat-dialog-content class="py-5">
        <form [formGroup]="form" class="space-y-4">
          <div *ngIf="data.primaryAddress && !isEditing"
               class="flex items-center gap-2 mb-2">
            <mat-checkbox [checked]="prefillFromPrimary" (change)="onPrefillToggle($event.checked)"
                          color="primary">
              <span class="text-sm text-slate-700">Use primary location address</span>
            </mat-checkbox>
          </div>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Address Line 1</mat-label>
            <input matInput formControlName="address_line1">
            <mat-error>Required</mat-error>
          </mat-form-field>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Address Line 2 (Optional)</mat-label>
            <input matInput formControlName="address_line2">
          </mat-form-field>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>City</mat-label>
              <input matInput formControlName="city">
              <mat-error>Required</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>State</mat-label>
              <mat-select formControlName="state">
                <mat-option *ngFor="let s of states" [value]="s">{{ s }}</mat-option>
              </mat-select>
              <mat-error>Required</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Zip</mat-label>
              <input matInput formControlName="zip">
              <mat-error>Required</mat-error>
            </mat-form-field>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-2">
        <button mat-button (click)="onCancel()" class="text-slate-500">Cancel</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="onSave()"
                style="border-radius: 8px;">
          {{ isEditing ? 'Update' : 'Add' }} Billing Address
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class AddBillingAddressDialogComponent implements OnDestroy {
  form: FormGroup;
  states = US_STATES;
  isEditing: boolean;
  prefillFromPrimary = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddBillingAddressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddBillingAddressDialogData,
  ) {
    this.isEditing = !!data?.billingAddress;

    this.form = this.fb.group({
      address_line1: [data?.billingAddress?.address_line1 || '', Validators.required],
      address_line2: [data?.billingAddress?.address_line2 || ''],
      city: [data?.billingAddress?.city || '', Validators.required],
      state: [data?.billingAddress?.state || '', Validators.required],
      zip: [data?.billingAddress?.zip || '', Validators.required],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPrefillToggle(checked: boolean): void {
    this.prefillFromPrimary = checked;
    if (checked && this.data.primaryAddress) {
      this.form.patchValue({
        address_line1: this.data.primaryAddress.address_line1,
        address_line2: this.data.primaryAddress.address_line2,
        city: this.data.primaryAddress.city,
        state: this.data.primaryAddress.state,
        zip: this.data.primaryAddress.zip,
      });
    } else {
      this.form.reset();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      const val = this.form.value;
      this.dialogRef.close({
        id: this.data?.billingAddress?.id || crypto.randomUUID(),
        ...val,
      });
    }
  }
}
