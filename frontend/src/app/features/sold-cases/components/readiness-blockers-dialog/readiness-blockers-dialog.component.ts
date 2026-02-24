import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ReadinessBlocker } from '../../../../core/models/client.model';

export interface ReadinessBlockersDialogData {
  blockers: ReadinessBlocker[];
}

@Component({
  selector: 'app-readiness-blockers-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100">
          <mat-icon class="text-amber-600" style="font-size:22px;width:22px;height:22px;">warning</mat-icon>
        </div>
        <h2 class="text-lg font-bold text-slate-900">Case Not Ready</h2>
      </div>

      <mat-dialog-content>
        <p class="text-slate-500 text-sm mt-3 mb-4">
          The following issues must be resolved before starting group setup:
        </p>
        <ul class="space-y-3">
          <li *ngFor="let blocker of data.blockers" class="flex items-start gap-3">
            <mat-icon class="text-red-500 mt-0.5" style="font-size:20px;width:20px;height:20px;">cancel</mat-icon>
            <span class="text-slate-700 text-sm">{{ blocker.message }}</span>
          </li>
        </ul>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-4">
        <button mat-flat-button color="primary" (click)="dialogRef.close()" style="border-radius: 8px;">
          Understood
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class ReadinessBlockersDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ReadinessBlockersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReadinessBlockersDialogData,
  ) {}
}
