import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FileUploadService } from '../../../../core/services/file-upload.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Document } from '../../../../core/models/document.model';
import { FileUploadModalComponent } from '../file-upload-modal/file-upload-modal.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

export interface DocumentsDialogData {
  clientId: string;
  clientName: string;
}

@Component({
  selector: 'app-documents-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatTableModule, MatButtonModule,
    MatIconModule, MatTooltipModule, MatProgressSpinnerModule, DatePipe,
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon class="text-indigo-600">folder_open</mat-icon>
      Documents &mdash; {{ data.clientName }}
    </h2>

    <mat-dialog-content class="min-h-[200px]">
      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center items-center py-12">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && documents.length === 0" class="flex flex-col items-center gap-2 py-12">
        <mat-icon class="text-slate-300" style="font-size:48px;width:48px;height:48px;">description</mat-icon>
        <p class="text-slate-400 font-medium">No documents uploaded yet</p>
        <p class="text-slate-300 text-sm">Click "Upload Document" to get started</p>
      </div>

      <!-- Document table -->
      <table *ngIf="!loading && documents.length > 0" mat-table [dataSource]="documents" class="w-full">
        <ng-container matColumnDef="file_name">
          <th mat-header-cell *matHeaderCellDef>File Name</th>
          <td mat-cell *matCellDef="let doc" class="font-medium text-slate-800">{{ doc.file_name }}</td>
        </ng-container>

        <ng-container matColumnDef="file_type">
          <th mat-header-cell *matHeaderCellDef>Type</th>
          <td mat-cell *matCellDef="let doc" class="text-slate-600">{{ formatType(doc.file_type) }}</td>
        </ng-container>

        <ng-container matColumnDef="created_at">
          <th mat-header-cell *matHeaderCellDef>Uploaded</th>
          <td mat-cell *matCellDef="let doc" class="text-slate-500 text-sm">
            {{ doc.created_at | date:'MMM d, y' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef class="w-24"></th>
          <td mat-cell *matCellDef="let doc">
            <button mat-icon-button matTooltip="Download" (click)="downloadDocument(doc)">
              <mat-icon class="text-indigo-500">download</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Delete" (click)="confirmDelete(doc)">
              <mat-icon class="text-red-400">delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Close</button>
      <button mat-flat-button color="primary" (click)="openUpload()">
        <mat-icon>upload</mat-icon>
        Upload Document
      </button>
    </mat-dialog-actions>
  `,
})
export class DocumentsDialogComponent implements OnInit {
  documents: Document[] = [];
  loading = false;
  displayedColumns = ['file_name', 'file_type', 'created_at', 'actions'];

  constructor(
    public dialogRef: MatDialogRef<DocumentsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DocumentsDialogData,
    private fileUploadService: FileUploadService,
    private notification: NotificationService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;
    this.fileUploadService.listDocuments(this.data.clientId).subscribe({
      next: (docs) => {
        this.documents = docs;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notification.error('Failed to load documents');
      },
    });
  }

  formatType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  openUpload(): void {
    const uploadRef = this.dialog.open(FileUploadModalComponent, {
      width: '500px',
      data: { clientId: this.data.clientId },
    });

    uploadRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.fileUploadService.upload(
          this.data.clientId, result.file, result.file_type, result.description,
        ).subscribe({
          next: () => {
            this.notification.success('Document uploaded successfully');
            this.loadDocuments();
          },
          error: () => {
            this.loading = false;
            this.notification.error('Failed to upload document');
          },
        });
      }
    });
  }

  downloadDocument(doc: Document): void {
    this.fileUploadService.downloadDocument(this.data.clientId, doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notification.error('Failed to download document'),
    });
  }

  confirmDelete(doc: Document): void {
    const confirmRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Document',
        message: `Are you sure you want to delete "${doc.file_name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        isDestructive: true,
      },
    });

    confirmRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.fileUploadService.deleteDocument(this.data.clientId, doc.id).subscribe({
          next: () => {
            this.notification.success('Document deleted');
            this.loadDocuments();
          },
          error: () => this.notification.error('Failed to delete document'),
        });
      }
    });
  }
}
