import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-offline-setup',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-amber-600" style="font-size:22px;width:22px;height:22px;">description</mat-icon>
        </div>
        <h2 class="text-lg font-bold text-slate-900">Complete Group Setup Offline</h2>
      </div>

      <mat-dialog-content>
        <p class="text-slate-600 mb-4">
          You are choosing to complete the group setup process offline for
          <strong class="text-slate-800">{{ data.clientName }}</strong>.
        </p>

        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <div class="flex items-start gap-3">
            <mat-icon class="text-amber-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">warning</mat-icon>
            <div>
              <p class="font-semibold text-amber-800">Important</p>
              <p class="text-sm text-amber-700 mt-0.5">
                Choosing offline setup means you will need to download, complete, and submit
                the required forms manually. You will not be able to use the online workflow.
              </p>
            </div>
          </div>
        </div>

        <h3 class="font-semibold text-slate-800 mb-3">You will need to:</h3>
        <ul class="space-y-2">
          <li class="flex items-center gap-2 text-sm text-slate-600">
            <mat-icon class="text-slate-400" style="font-size:16px;width:16px;height:16px;">download</mat-icon>
            Download the Master Application form
          </li>
          <li class="flex items-center gap-2 text-sm text-slate-600">
            <mat-icon class="text-slate-400" style="font-size:16px;width:16px;height:16px;">download</mat-icon>
            Download the Data Gathering Tool
          </li>
          <li class="flex items-center gap-2 text-sm text-slate-600">
            <mat-icon class="text-slate-400" style="font-size:16px;width:16px;height:16px;">edit_note</mat-icon>
            Complete all forms offline
          </li>
          <li class="flex items-center gap-2 text-sm text-slate-600">
            <mat-icon class="text-slate-400" style="font-size:16px;width:16px;height:16px;">upload</mat-icon>
            Upload completed forms back to the portal
          </li>
        </ul>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-4">
        <button mat-button (click)="dialogRef.close(false)" class="text-slate-500">Cancel</button>
        <button mat-flat-button color="warn" (click)="dialogRef.close(true)" style="border-radius: 8px;">
          Confirm Offline Setup
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class OfflineSetupComponent {
  constructor(
    public dialogRef: MatDialogRef<OfflineSetupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { clientId: string; clientName: string },
  ) {}
}
