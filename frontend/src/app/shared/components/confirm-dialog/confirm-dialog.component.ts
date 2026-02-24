import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center"
             [class]="data.isDestructive ? 'bg-red-100' : 'bg-indigo-100'">
          <mat-icon [class]="data.isDestructive ? 'text-red-600' : 'text-indigo-600'"
                    style="font-size:22px;width:22px;height:22px;">
            {{ data.isDestructive ? 'warning' : 'help_outline' }}
          </mat-icon>
        </div>
        <h2 class="text-lg font-bold text-slate-900">{{ data.title }}</h2>
      </div>
      <mat-dialog-content>
        <p class="text-slate-600 mt-3">{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="mt-4">
        <button mat-button (click)="onCancel()" class="text-slate-500">{{ data.cancelText || 'Cancel' }}</button>
        <button mat-flat-button [color]="data.isDestructive ? 'warn' : 'primary'" (click)="onConfirm()"
                style="border-radius: 8px;">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
