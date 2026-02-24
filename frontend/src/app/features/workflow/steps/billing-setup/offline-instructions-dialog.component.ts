import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-offline-instructions-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-blue-600" style="font-size:22px;width:22px;height:22px;">local_post_office</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900">Pay Bill Offline</h2>
          <p class="text-sm text-slate-400">Mailing instructions for offline payment</p>
        </div>
      </div>

      <mat-dialog-content class="py-5">
        <div class="space-y-5">
          <p class="text-sm text-slate-600">
            To pay your bill offline, please mail your payment to one of the following addresses.
            Include a cover sheet with your Group ID and payment amount.
          </p>

          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
            <h4 class="text-sm font-semibold text-slate-700">Mailing Address 1</h4>
            <p class="text-sm text-slate-600">
              Group Benefits<br>
              P.O. Box 804466<br>
              Kansas City, MO 64180-4466
            </p>
          </div>

          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
            <h4 class="text-sm font-semibold text-slate-700">Mailing Address 2</h4>
            <p class="text-sm text-slate-600">
              JPMC MetLife<br>
              PO Box 71112<br>
              Charlotte, NC 28272-1112
            </p>
          </div>

          <div class="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <mat-icon class="text-amber-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
            <p class="text-sm text-amber-800">
              Please include your Group ID and the exact payment amount on the check or money order.
              Allow 7-10 business days for processing.
            </p>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-2">
        <button mat-button (click)="onCancel()" class="text-slate-500">Cancel</button>
        <button mat-flat-button color="primary" (click)="onDownload()" style="border-radius: 8px;">
          <mat-icon>download</mat-icon> Download Cover Sheet
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class OfflineInstructionsDialogComponent {
  constructor(public dialogRef: MatDialogRef<OfflineInstructionsDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onDownload(): void {
    // In production, this would generate/download a PDF cover sheet
    this.dialogRef.close('downloaded');
  }
}
