import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorkflowService } from '../../services/workflow.service';

export interface VerifyStatusDialogData {
  producerName: string;
  producerId: string;
}

export interface VerifyStatusResult {
  status: 'active' | 'not_found' | 'not_active' | 'expired';
}

@Component({
  selector: 'app-verify-status-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-blue-600" style="font-size:22px;width:22px;height:22px;">verified_user</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900">Verify Licensing & Appointment Status</h2>
          <p class="text-sm text-slate-400">{{ data.producerName }}</p>
        </div>
      </div>

      <mat-dialog-content class="py-5">
        <!-- Phase 1: SSN Input -->
        <div *ngIf="phase === 'input'" class="space-y-4">
          <p class="text-sm text-slate-600">
            Enter the producer's Social Security Number to verify their licensing and appointment status.
          </p>
          <form [formGroup]="ssnForm">
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Social Security Number</mat-label>
              <input matInput formControlName="ssn" [type]="showSsn ? 'text' : 'password'"
                     maxlength="11" placeholder="XXX-XX-XXXX">
              <button mat-icon-button matSuffix type="button" (click)="showSsn = !showSsn">
                <mat-icon>{{ showSsn ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="ssnForm.get('ssn')?.hasError('required')">SSN is required</mat-error>
              <mat-error *ngIf="ssnForm.get('ssn')?.hasError('pattern')">Enter a valid SSN (XXX-XX-XXXX)</mat-error>
            </mat-form-field>
          </form>
        </div>

        <!-- Phase 2: Verifying -->
        <div *ngIf="phase === 'verifying'" class="flex flex-col items-center py-8 gap-4">
          <mat-spinner diameter="40"></mat-spinner>
          <p class="text-slate-600">Verifying licensing status...</p>
        </div>

        <!-- Phase 3: Error -->
        <div *ngIf="phase === 'error'" class="space-y-4">
          <div class="bg-red-50 rounded-xl p-4 border border-red-200">
            <div class="flex items-center gap-3">
              <mat-icon class="text-red-600">error</mat-icon>
              <div>
                <p class="font-semibold text-slate-900">Verification Failed</p>
                <p class="text-sm text-slate-600">{{ errorMessage }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Phase 4: Result -->
        <div *ngIf="phase === 'result'" class="space-y-4">
          <div class="rounded-xl p-4 border" [ngClass]="resultClasses">
            <div class="flex items-center gap-3">
              <mat-icon [ngClass]="resultIconClass">{{ resultIcon }}</mat-icon>
              <div>
                <p class="font-semibold text-slate-900">{{ resultTitle }}</p>
                <p class="text-sm text-slate-600">{{ resultMessage }}</p>
              </div>
            </div>
          </div>

          <!-- Active status details -->
          <div *ngIf="verifiedStatus === 'active' && statusDetails" class="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p class="text-sm text-slate-700">
              <strong>Status:</strong> Active<br>
              <strong>State:</strong> {{ statusDetails.state }}<br>
              <strong>License #:</strong> {{ statusDetails.license_number }}<br>
              <strong>License Expiration:</strong> {{ statusDetails.expiration }}
            </p>
          </div>

          <!-- Remediation guidance for non-active statuses (S6) -->
          <div *ngIf="verifiedStatus !== 'active' && remediation" class="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
            <h4 class="text-sm font-semibold text-slate-800">{{ remediation.title }}</h4>
            <ol class="list-decimal list-inside space-y-1.5">
              <li *ngFor="let step of remediation.steps" class="text-sm text-slate-600">{{ step }}</li>
            </ol>
            <div class="pt-2 border-t border-slate-100">
              <p class="text-xs text-slate-500">{{ remediation.contact }}</p>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-2">
        <button mat-button (click)="dialogRef.close()" class="text-slate-500">Cancel</button>
        <button *ngIf="phase === 'input'" mat-flat-button color="primary"
                [disabled]="ssnForm.invalid" (click)="verify()" style="border-radius: 8px;">
          Verify Status
        </button>
        <button *ngIf="phase === 'error'" mat-flat-button color="primary"
                (click)="phase = 'input'" style="border-radius: 8px;">
          Try Again
        </button>
        <button *ngIf="phase === 'result'" mat-flat-button color="primary"
                (click)="onConfirm()" style="border-radius: 8px;">
          Confirm
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class VerifyStatusDialogComponent {
  ssnForm: FormGroup;
  phase: 'input' | 'verifying' | 'result' | 'error' = 'input';
  showSsn = false;
  verifiedStatus: 'active' | 'not_found' | 'not_active' | 'expired' = 'active';
  statusDetails: { state: string; license_number: string; expiration: string } | null = null;
  remediation: { title: string; steps: string[]; contact: string } | null = null;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private workflowService: WorkflowService,
    public dialogRef: MatDialogRef<VerifyStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VerifyStatusDialogData,
  ) {
    this.ssnForm = this.fb.group({
      ssn: ['', [Validators.required, Validators.pattern(/^\d{3}-?\d{2}-?\d{4}$/)]],
    });
  }

  verify(): void {
    if (this.ssnForm.invalid) return;
    this.phase = 'verifying';

    const ssn = this.ssnForm.value.ssn;
    this.workflowService.verifyLicensingStatus(ssn, this.data.producerName, this.data.producerId)
      .subscribe({
        next: (response) => {
          this.verifiedStatus = response.status;
          this.statusDetails = response.details || null;
          this.remediation = response.remediation || null;
          this.phase = 'result';
        },
        error: () => {
          this.errorMessage = 'Unable to reach the licensing verification service. Please try again.';
          this.phase = 'error';
        },
      });
  }

  get resultClasses(): Record<string, boolean> {
    return {
      'bg-green-50 border-green-200': this.verifiedStatus === 'active',
      'bg-yellow-50 border-yellow-200': this.verifiedStatus === 'not_found',
      'bg-red-50 border-red-200': this.verifiedStatus === 'not_active' || this.verifiedStatus === 'expired',
    };
  }

  get resultIconClass(): string {
    if (this.verifiedStatus === 'active') return 'text-green-600';
    if (this.verifiedStatus === 'not_found') return 'text-yellow-600';
    return 'text-red-600';
  }

  get resultIcon(): string {
    if (this.verifiedStatus === 'active') return 'check_circle';
    if (this.verifiedStatus === 'not_found') return 'help';
    return 'cancel';
  }

  get resultTitle(): string {
    const titles: Record<string, string> = {
      active: 'Licensed & Appointed — Active',
      not_found: 'Producer Not Found',
      not_active: 'License Not Active',
      expired: 'License Expired',
    };
    return titles[this.verifiedStatus];
  }

  get resultMessage(): string {
    const messages: Record<string, string> = {
      active: 'This producer is currently licensed and appointed.',
      not_found: 'No matching producer was found. Please verify the SSN and try again.',
      not_active: 'This producer\'s license is not currently active. Contact your licensing department.',
      expired: 'This producer\'s license has expired. A renewal is required before proceeding.',
    };
    return messages[this.verifiedStatus];
  }

  onConfirm(): void {
    this.dialogRef.close({ status: this.verifiedStatus } as VerifyStatusResult);
  }
}
