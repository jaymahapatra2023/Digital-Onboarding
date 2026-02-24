import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FileUploaderComponent } from '../../../../shared/components/file-uploader/file-uploader.component';

@Component({
  selector: 'app-file-upload-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatSelectModule, MatInputModule, MatButtonModule, FileUploaderComponent,
  ],
  template: `
    <h2 mat-dialog-title>Upload Document</h2>
    <mat-dialog-content class="py-4">
      <form [formGroup]="form" class="space-y-4">
        <mat-form-field class="w-full" appearance="outline">
          <mat-label>Document Type</mat-label>
          <mat-select formControlName="file_type">
            <mat-option value="MASTER_APP">Master Application</mat-option>
            <mat-option value="DATA_GATHERING_TOOL">Data Gathering Tool</mat-option>
            <mat-option value="CENSUS_TEMPLATE">Census Template</mat-option>
            <mat-option value="COMMISSION_ACK">Commission Acknowledgement</mat-option>
            <mat-option value="SUPPLEMENTAL">Supplemental Document</mat-option>
            <mat-option value="ENROLLMENT_FORM">Enrollment Form</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="w-full" appearance="outline">
          <mat-label>Description (optional)</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <app-file-uploader
          acceptedTypes=".pdf,.doc,.docx,.xls,.xlsx,.csv"
          [maxSizeMB]="25"
          [uploading]="uploading"
          (filesSelected)="onFilesSelected($event)">
        </app-file-uploader>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary"
              [disabled]="form.invalid || !selectedFile || uploading"
              (click)="onUpload()">
        Upload
      </button>
    </mat-dialog-actions>
  `,
})
export class FileUploadModalComponent {
  form: FormGroup;
  selectedFile: File | null = null;
  uploading = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FileUploadModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { clientId: string; preselectedType?: string },
  ) {
    this.form = this.fb.group({
      file_type: [data.preselectedType || '', Validators.required],
      description: [''],
    });
  }

  onFilesSelected(files: File[]): void {
    this.selectedFile = files.length > 0 ? files[0] : null;
  }

  onUpload(): void {
    if (this.form.valid && this.selectedFile) {
      this.dialogRef.close({
        file: this.selectedFile,
        file_type: this.form.value.file_type,
        description: this.form.value.description,
      });
    }
  }
}
