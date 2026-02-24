import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface AddClassDialogData {
  existingClassIds: string[];
}

@Component({
  selector: 'app-add-class-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-indigo-600" style="font-size:22px;width:22px;height:22px;">group_add</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900">Add Employee Class</h2>
          <p class="text-sm text-slate-400">Define a new employee class for this group</p>
        </div>
      </div>

      <mat-dialog-content class="py-5">
        <form [formGroup]="form" class="space-y-4">
          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Class ID</mat-label>
            <input matInput formControlName="class_id" placeholder="e.g. 001, A, EXEC">
            <mat-error *ngIf="form.get('class_id')?.hasError('required')">Required</mat-error>
            <mat-error *ngIf="form.get('class_id')?.hasError('duplicateClassId')">
              This Class ID already exists
            </mat-error>
          </mat-form-field>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Description</mat-label>
            <input matInput formControlName="description" placeholder="e.g. All Full-Time Employees">
            <mat-error>Required</mat-error>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-2">
        <button mat-button (click)="onCancel()" class="text-slate-500">Cancel</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="onAdd()"
                style="border-radius: 8px;">
          Add Class
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class AddClassDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddClassDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddClassDialogData,
  ) {
    this.form = this.fb.group({
      class_id: ['', [Validators.required, this.duplicateClassIdValidator.bind(this)]],
      description: ['', Validators.required],
    });
  }

  private duplicateClassIdValidator(control: AbstractControl) {
    if (this.data?.existingClassIds?.includes(control.value?.trim())) {
      return { duplicateClassId: true };
    }
    return null;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        class_id: this.form.value.class_id.trim(),
        description: this.form.value.description.trim(),
      });
    }
  }
}
