import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Contact } from './group-structure.interfaces';
import { PhoneMaskDirective } from '../../../../shared/directives/phone-mask.directive';

export interface AddContactDialogData {
  contact?: Contact;
}

const AVAILABLE_ROLES = ['Benefit Administrator', 'Billing Contact', 'Claims Contact'];

@Component({
  selector: 'app-add-contact-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatCheckboxModule, MatRadioModule, MatButtonModule, MatIconModule,
    PhoneMaskDirective,
  ],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-indigo-600" style="font-size:22px;width:22px;height:22px;">contact_mail</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900">{{ isEditing ? 'Edit' : 'Add' }} Contact</h2>
          <p class="text-sm text-slate-400">Enter the contact information and assign roles</p>
        </div>
      </div>

      <mat-dialog-content class="py-5">
        <form [formGroup]="form" class="space-y-4">
          <!-- Role Selection -->
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
            <label class="text-sm font-medium text-slate-700">Assign Roles</label>
            <div class="flex items-center gap-2 mb-2">
              <mat-checkbox [checked]="allRolesSelected" (change)="toggleAllRoles($event.checked)" color="primary">
                <span class="text-sm font-medium text-slate-700">Same contact for all roles</span>
              </mat-checkbox>
            </div>
            <div class="flex flex-col gap-2">
              <mat-checkbox *ngFor="let role of availableRoles; let i = index"
                            [checked]="selectedRoles[i]"
                            (change)="toggleRole(i, $event.checked)"
                            color="primary">
                <span class="text-sm text-slate-700">{{ role }}</span>
              </mat-checkbox>
            </div>
            <div *ngIf="!hasSelectedRole" class="text-xs text-red-500 mt-1">
              At least one role is required
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="first_name">
              <mat-error>Required</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="last_name">
              <mat-error>Required</mat-error>
            </mat-form-field>
          </div>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email">
            <mat-error>Valid email required</mat-error>
          </mat-form-field>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Work Phone</mat-label>
              <input matInput appPhoneMask formControlName="work_phone">
              <mat-hint>123-456-7890</mat-hint>
              <mat-error>Required</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Cell Phone (Optional)</mat-label>
              <input matInput appPhoneMask formControlName="cell_phone">
              <mat-hint>123-456-7890</mat-hint>
            </mat-form-field>
          </div>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Fax (Optional)</mat-label>
            <input matInput appPhoneMask formControlName="fax">
          </mat-form-field>

          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
            <label class="text-sm font-medium text-slate-700">
              Should this contact have online access?
            </label>
            <mat-radio-group formControlName="online_access" class="flex gap-6">
              <mat-radio-button [value]="true" color="primary">Yes</mat-radio-button>
              <mat-radio-button [value]="false" color="primary">No</mat-radio-button>
            </mat-radio-group>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-2">
        <button mat-button (click)="onCancel()" class="text-slate-500">Cancel</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid || !hasSelectedRole" (click)="onSave()"
                style="border-radius: 8px;">
          {{ isEditing ? 'Update' : 'Add' }} Contact
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class AddContactDialogComponent {
  form: FormGroup;
  availableRoles = AVAILABLE_ROLES;
  selectedRoles: boolean[];
  isEditing: boolean;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddContactDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddContactDialogData,
  ) {
    this.isEditing = !!data?.contact;

    // Initialize role selections
    if (data?.contact?.roles) {
      this.selectedRoles = AVAILABLE_ROLES.map(r => data.contact!.roles.includes(r));
    } else {
      this.selectedRoles = AVAILABLE_ROLES.map(() => false);
    }

    this.form = this.fb.group({
      first_name: [data?.contact?.first_name || '', Validators.required],
      last_name: [data?.contact?.last_name || '', Validators.required],
      email: [data?.contact?.email || '', [Validators.required, Validators.email]],
      work_phone: [data?.contact?.work_phone || '', Validators.required],
      cell_phone: [data?.contact?.cell_phone || ''],
      fax: [data?.contact?.fax || ''],
      online_access: [data?.contact?.online_access ?? true],
    });
  }

  get allRolesSelected(): boolean {
    return this.selectedRoles.every(r => r);
  }

  get hasSelectedRole(): boolean {
    return this.selectedRoles.some(r => r);
  }

  toggleAllRoles(checked: boolean): void {
    this.selectedRoles = this.selectedRoles.map(() => checked);
  }

  toggleRole(index: number, checked: boolean): void {
    this.selectedRoles = this.selectedRoles.map((r, i) => i === index ? checked : r);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid && this.hasSelectedRole) {
      const val = this.form.value;
      const roles = AVAILABLE_ROLES.filter((_, i) => this.selectedRoles[i]);
      this.dialogRef.close({
        id: this.data?.contact?.id || crypto.randomUUID(),
        roles,
        ...val,
      });
    }
  }
}
