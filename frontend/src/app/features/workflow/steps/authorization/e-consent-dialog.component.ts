import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-e-consent-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-indigo-600" style="font-size:22px;width:22px;height:22px;">gavel</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900">Consumer Consent Statement</h2>
          <p class="text-sm text-slate-400">Electronic transaction consent information</p>
        </div>
      </div>

      <mat-dialog-content class="py-5">
        <div class="space-y-4 text-sm text-slate-600 max-h-96 overflow-y-auto">
          <p class="font-semibold text-slate-800">
            Consent to Conduct Transactions Electronically
          </p>

          <p>
            By consenting to this agreement, you agree to receive all documents, communications,
            notices, contracts, and agreements (collectively, "Documents") electronically in
            connection with your group benefits account.
          </p>

          <p class="font-semibold text-slate-800">Scope of Consent</p>
          <p>
            Your consent applies to all Documents related to any transaction between you and
            the insurance carrier, including but not limited to:
          </p>
          <ul class="list-disc list-inside ml-4 space-y-1">
            <li>Policy documents, applications, and amendments</li>
            <li>Billing statements and payment confirmations</li>
            <li>Claims-related correspondence</li>
            <li>Required regulatory notices and disclosures</li>
            <li>Any other documents we are required by law to provide in writing</li>
          </ul>

          <p class="font-semibold text-slate-800">Hardware and Software Requirements</p>
          <p>
            To access and retain the electronic Documents, you will need:
          </p>
          <ul class="list-disc list-inside ml-4 space-y-1">
            <li>A computer or mobile device with internet access</li>
            <li>A current web browser that supports 128-bit encryption</li>
            <li>A valid email address</li>
            <li>Sufficient storage space or a printer to retain copies</li>
          </ul>

          <p class="font-semibold text-slate-800">Right to Withdraw Consent</p>
          <p>
            You have the right to withdraw your consent at any time. To withdraw, contact
            your account representative or call customer service. Withdrawal of consent will
            not affect the legal validity of any electronic Documents previously provided.
            If you withdraw consent, future Documents will be delivered in paper form, and
            fees may apply for paper delivery.
          </p>

          <p class="font-semibold text-slate-800">Updating Contact Information</p>
          <p>
            You agree to keep your email address and other contact information current.
            You can update your information through the online portal or by contacting
            customer service.
          </p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-2">
        <button mat-button (click)="onClose()" class="text-slate-500">Close</button>
        <button mat-flat-button color="primary" (click)="onAccept()" style="border-radius: 8px;">
          I Understand
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class EConsentDialogComponent {
  constructor(public dialogRef: MatDialogRef<EConsentDialogComponent>) {}

  onClose(): void {
    this.dialogRef.close();
  }

  onAccept(): void {
    this.dialogRef.close('accepted');
  }
}
