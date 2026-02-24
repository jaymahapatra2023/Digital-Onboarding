import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MasterAppSignature } from './master-app.interfaces';

export interface MasterAppSignDialogData {
  name: string;
}

const US_STATES = [
  { value: 'AL', label: 'AL - Alabama' }, { value: 'AK', label: 'AK - Alaska' },
  { value: 'AZ', label: 'AZ - Arizona' }, { value: 'AR', label: 'AR - Arkansas' },
  { value: 'CA', label: 'CA - California' }, { value: 'CO', label: 'CO - Colorado' },
  { value: 'CT', label: 'CT - Connecticut' }, { value: 'DE', label: 'DE - Delaware' },
  { value: 'DC', label: 'DC - District of Columbia' }, { value: 'FL', label: 'FL - Florida' },
  { value: 'GA', label: 'GA - Georgia' }, { value: 'HI', label: 'HI - Hawaii' },
  { value: 'ID', label: 'ID - Idaho' }, { value: 'IL', label: 'IL - Illinois' },
  { value: 'IN', label: 'IN - Indiana' }, { value: 'IA', label: 'IA - Iowa' },
  { value: 'KS', label: 'KS - Kansas' }, { value: 'KY', label: 'KY - Kentucky' },
  { value: 'LA', label: 'LA - Louisiana' }, { value: 'ME', label: 'ME - Maine' },
  { value: 'MD', label: 'MD - Maryland' }, { value: 'MA', label: 'MA - Massachusetts' },
  { value: 'MI', label: 'MI - Michigan' }, { value: 'MN', label: 'MN - Minnesota' },
  { value: 'MS', label: 'MS - Mississippi' }, { value: 'MO', label: 'MO - Missouri' },
  { value: 'MT', label: 'MT - Montana' }, { value: 'NE', label: 'NE - Nebraska' },
  { value: 'NV', label: 'NV - Nevada' }, { value: 'NH', label: 'NH - New Hampshire' },
  { value: 'NJ', label: 'NJ - New Jersey' }, { value: 'NM', label: 'NM - New Mexico' },
  { value: 'NY', label: 'NY - New York' }, { value: 'NC', label: 'NC - North Carolina' },
  { value: 'ND', label: 'ND - North Dakota' }, { value: 'OH', label: 'OH - Ohio' },
  { value: 'OK', label: 'OK - Oklahoma' }, { value: 'OR', label: 'OR - Oregon' },
  { value: 'PA', label: 'PA - Pennsylvania' }, { value: 'RI', label: 'RI - Rhode Island' },
  { value: 'SC', label: 'SC - South Carolina' }, { value: 'SD', label: 'SD - South Dakota' },
  { value: 'TN', label: 'TN - Tennessee' }, { value: 'TX', label: 'TX - Texas' },
  { value: 'UT', label: 'UT - Utah' }, { value: 'VT', label: 'VT - Vermont' },
  { value: 'VA', label: 'VA - Virginia' }, { value: 'WA', label: 'WA - Washington' },
  { value: 'WV', label: 'WV - West Virginia' }, { value: 'WI', label: 'WI - Wisconsin' },
  { value: 'WY', label: 'WY - Wyoming' },
];

@Component({
  selector: 'app-master-app-sign-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-indigo-600" style="font-size:22px;width:22px;height:22px;">description</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900">Application for Group Insurance</h2>
          <p class="text-sm text-slate-400">Please review and sign</p>
        </div>
      </div>

      <mat-dialog-content class="py-5">
        <form [formGroup]="form" class="space-y-4">
          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput [value]="data.name" readonly>
          </mat-form-field>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Title of Authorized Signatory</mat-label>
            <input matInput formControlName="title">
            <mat-error>Required</mat-error>
          </mat-form-field>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>City</mat-label>
            <input matInput formControlName="city">
            <mat-error>Required</mat-error>
          </mat-form-field>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>State</mat-label>
            <mat-select formControlName="state">
              <mat-option *ngFor="let s of states" [value]="s.value">{{ s.label }}</mat-option>
            </mat-select>
            <mat-error>Required</mat-error>
          </mat-form-field>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Date</mat-label>
            <input matInput [value]="today" readonly>
          </mat-form-field>

          <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <mat-checkbox formControlName="terms_accepted" color="primary">
              <span class="text-sm text-slate-700">
                I have reviewed the above and declare that all information given is true and complete
                to the best of my knowledge and belief. I understand that this information will be used
                by MetLife to determine an individual's eligibility for benefits. I understand that by
                entering my name below and clicking the "Submit" button I am signing and submitting the
                Master Application to Metropolitan Life Insurance Company. This is a legally binding
                electronic signature.
              </span>
            </mat-checkbox>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-2">
        <button mat-button (click)="onCancel()" class="text-slate-500">Cancel</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="onSign()"
                style="border-radius: 8px;">
          Sign &amp; Submit
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class MasterAppSignDialogComponent {
  form: FormGroup;
  states = US_STATES;
  today = new Date().toLocaleDateString('en-US');

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MasterAppSignDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MasterAppSignDialogData,
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      terms_accepted: [false, Validators.requiredTrue],
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSign(): void {
    if (this.form.invalid) return;
    const val = this.form.value;
    const signature: MasterAppSignature = {
      title: val.title,
      city: val.city,
      state: val.state,
      date: this.today,
      terms_accepted: true,
    };
    this.dialogRef.close(signature);
  }
}
