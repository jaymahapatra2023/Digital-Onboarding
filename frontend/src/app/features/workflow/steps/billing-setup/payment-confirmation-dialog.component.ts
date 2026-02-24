import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaymentConfirmation } from './billing-setup.interfaces';

@Component({
  selector: 'app-payment-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-2">
      <div class="flex flex-col items-center text-center py-4">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <mat-icon class="text-green-600" style="font-size:36px;width:36px;height:36px;">check_circle</mat-icon>
        </div>
        <h2 class="text-xl font-bold text-slate-900 mb-1">Thank You!</h2>
        <p class="text-sm text-slate-500">Your payment has been submitted successfully.</p>
      </div>

      <mat-dialog-content>
        <div class="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <span class="text-slate-500">Confirmation #</span>
            <span class="text-slate-800 font-semibold">{{ data.confirmation_number }}</span>

            <span class="text-slate-500">Group ID</span>
            <span class="text-slate-800 font-semibold">{{ data.group_id }}</span>

            <span class="text-slate-500">Amount</span>
            <span class="text-slate-800 font-semibold">{{ data.amount | currency }}</span>

            <span class="text-slate-500">Payment Method</span>
            <span class="text-slate-800 font-semibold">{{ data.payment_method_summary }}</span>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="mt-4 flex justify-center gap-3">
        <button mat-button (click)="onDownload()" class="text-indigo-600">
          <mat-icon>download</mat-icon> Download Receipt
        </button>
        <button mat-flat-button color="primary" (click)="onContinue()" style="border-radius: 8px;">
          Continue
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class PaymentConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PaymentConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentConfirmation,
  ) {}

  onDownload(): void {
    // In production, would generate a PDF receipt
  }

  onContinue(): void {
    this.dialogRef.close('continue');
  }
}
