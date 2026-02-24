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

export interface AddProducerDialogData {
  existingEmails: string[];
}

export interface ProducerResult {
  id: string;
  role_type: string;
  first_name: string;
  last_name: string;
  email: string;
  has_ongoing_maintenance_access: boolean;
  licensing_status: 'pending';
  compensable_code: null;
  commission_split: null;
}

@Component({
  selector: 'app-add-producer-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatRadioModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-indigo-600" style="font-size:22px;width:22px;height:22px;">person_add</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900">Add New Writing Producer</h2>
          <p class="text-sm text-slate-400">Enter the producer's information</p>
        </div>
      </div>

      <mat-dialog-content class="py-5">
        <form [formGroup]="form" class="space-y-4">
          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Role Type</mat-label>
            <mat-select formControlName="role_type">
              <mat-option value="Broker">Broker</mat-option>
              <mat-option value="TPA">TPA</mat-option>
              <mat-option value="GA">General Agent (GA)</mat-option>
              <mat-option value="Account Executive">Account Executive</mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('role_type')?.hasError('required')">Role is required</mat-error>
          </mat-form-field>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="first_name">
              <mat-error *ngIf="form.get('first_name')?.hasError('required')">First name is required</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="last_name">
              <mat-error *ngIf="form.get('last_name')?.hasError('required')">Last name is required</mat-error>
            </mat-form-field>
          </div>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email">
            <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">Please enter a valid email</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('duplicateEmail')">
              This email is already assigned to a producer
            </mat-error>
          </mat-form-field>

          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <label class="text-sm font-medium text-slate-700 block mb-3">
              Does this producer need ongoing online maintenance access to this group?
            </label>
            <mat-radio-group formControlName="has_ongoing_maintenance_access" class="flex gap-6">
              <mat-radio-button [value]="true" color="primary">Yes</mat-radio-button>
              <mat-radio-button [value]="false" color="primary">No</mat-radio-button>
            </mat-radio-group>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-2">
        <button mat-button (click)="onCancel()" class="text-slate-500">Cancel</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="onAdd()"
                style="border-radius: 8px;">
          Add Producer
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class AddProducerDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddProducerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddProducerDialogData,
  ) {
    this.form = this.fb.group({
      role_type: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      has_ongoing_maintenance_access: [true],
    });

    this.form.get('email')!.addValidators((control) => {
      if (data.existingEmails?.includes(control.value)) {
        return { duplicateEmail: true };
      }
      return null;
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {
    if (this.form.valid) {
      const val = this.form.value;
      const result: ProducerResult = {
        id: crypto.randomUUID(),
        role_type: val.role_type,
        first_name: val.first_name,
        last_name: val.last_name,
        email: val.email,
        has_ongoing_maintenance_access: val.has_ongoing_maintenance_access,
        licensing_status: 'pending',
        compensable_code: null,
        commission_split: null,
      };
      this.dialogRef.close(result);
    }
  }
}
