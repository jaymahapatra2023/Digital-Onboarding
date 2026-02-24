import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DeleteAccessData {
  accessName: string;
  accessEmail: string;
}

@Component({
  selector: 'app-delete-access-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-red-600" style="font-size:22px;width:22px;height:22px;">person_remove</mat-icon>
        </div>
        <h2 class="text-lg font-bold text-slate-900">Delete Administrator Access</h2>
      </div>
      <mat-dialog-content>
        <p class="text-slate-600">
          Are you sure you want to remove access for
          <strong class="text-slate-800">{{ data.accessName }}</strong> ({{ data.accessEmail }})?
        </p>
        <div class="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <mat-icon style="font-size:16px;width:16px;height:16px;">warning</mat-icon>
          This action cannot be undone.
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="mt-4">
        <button mat-button (click)="dialogRef.close(false)" class="text-slate-500">Cancel</button>
        <button mat-flat-button color="warn" (click)="dialogRef.close(true)" style="border-radius: 8px;">Delete</button>
      </mat-dialog-actions>
    </div>
  `,
})
export class DeleteAccessModalComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteAccessModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteAccessData,
  ) {}
}
