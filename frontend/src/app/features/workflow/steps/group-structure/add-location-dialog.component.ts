import { Component, Inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { Location } from './group-structure.interfaces';

export interface AddLocationDialogData {
  location?: Location;
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

@Component({
  selector: 'app-add-location-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatRadioModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-indigo-600" style="font-size:22px;width:22px;height:22px;">location_on</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900">{{ isEditing ? 'Edit' : 'Add' }} Location</h2>
          <p class="text-sm text-slate-400">Enter the location details</p>
        </div>
      </div>

      <mat-dialog-content class="py-5">
        <form [formGroup]="form" class="space-y-4">
          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Location Name</mat-label>
            <input matInput formControlName="name">
            <mat-error>Required</mat-error>
          </mat-form-field>

          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
            <label class="text-sm font-medium text-slate-700">
              Are there active participants at this location?
            </label>
            <mat-radio-group formControlName="has_active_participants" class="flex gap-6">
              <mat-radio-button [value]="true" color="primary">Yes</mat-radio-button>
              <mat-radio-button [value]="false" color="primary">No</mat-radio-button>
            </mat-radio-group>
          </div>

          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
            <label class="text-sm font-medium text-slate-700">
              Is the Federal Tax ID the same as the primary location?
            </label>
            <mat-radio-group formControlName="same_federal_tax_id" class="flex gap-6">
              <mat-radio-button [value]="true" color="primary">Yes</mat-radio-button>
              <mat-radio-button [value]="false" color="primary">No</mat-radio-button>
            </mat-radio-group>
          </div>

          <mat-form-field *ngIf="form.get('same_federal_tax_id')?.value === false"
                          class="w-full" appearance="outline">
            <mat-label>Federal Tax ID</mat-label>
            <input matInput formControlName="federal_tax_id" placeholder="XX-XXXXXXX">
            <mat-error>Required when Tax ID differs from primary</mat-error>
          </mat-form-field>

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
          {{ isEditing ? 'Update' : 'Add' }} Location
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class AddLocationDialogComponent implements OnDestroy {
  form: FormGroup;
  states = US_STATES;
  isEditing: boolean;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddLocationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddLocationDialogData,
  ) {
    this.isEditing = !!data?.location;

    this.form = this.fb.group({
      name: [data?.location?.name || '', Validators.required],
      has_active_participants: [data?.location?.has_active_participants ?? true],
      same_federal_tax_id: [data?.location?.same_federal_tax_id ?? true],
      federal_tax_id: [data?.location?.federal_tax_id || ''],
      address_line1: [data?.location?.address_line1 || '', Validators.required],
      address_line2: [data?.location?.address_line2 || ''],
      city: [data?.location?.city || '', Validators.required],
      state: [data?.location?.state || '', Validators.required],
      zip: [data?.location?.zip || '', Validators.required],
    });

    this.form.get('same_federal_tax_id')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const ctrl = this.form.get('federal_tax_id')!;
        if (val === false) {
          ctrl.setValidators(Validators.required);
        } else {
          ctrl.clearValidators();
          ctrl.setValue('');
        }
        ctrl.updateValueAndValidity();
      });

    // Trigger initial validation if editing with same_federal_tax_id = false
    if (data?.location && data.location.same_federal_tax_id === false) {
      this.form.get('federal_tax_id')!.setValidators(Validators.required);
      this.form.get('federal_tax_id')!.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      const val = this.form.value;
      this.dialogRef.close({
        id: this.data?.location?.id || crypto.randomUUID(),
        ...val,
      });
    }
  }
}
