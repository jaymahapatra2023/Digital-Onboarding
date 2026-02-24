import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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

        <!-- Phase 3: Result -->
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

          <div *ngIf="verifiedStatus === 'active'" class="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p class="text-sm text-slate-700">
              <strong>Status:</strong> Active<br>
              <strong>State:</strong> {{ demoState }}<br>
              <strong>License Expiration:</strong> {{ demoExpiration }}
            </p>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-2">
        <button mat-button (click)="dialogRef.close()" class="text-slate-500">Cancel</button>
        <button *ngIf="phase === 'input'" mat-flat-button color="primary"
                [disabled]="ssnForm.invalid" (click)="verify()" style="border-radius: 8px;">
          Verify Status
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
  phase: 'input' | 'verifying' | 'result' = 'input';
  showSsn = false;
  verifiedStatus: 'active' | 'not_found' | 'not_active' | 'expired' = 'active';
  demoState = 'California';
  demoExpiration = '12/31/2027';

  constructor(
    private fb: FormBuilder,
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

    // Simulate API call with random result weighted toward 'active'
    setTimeout(() => {
      const rand = Math.random();
      if (rand < 0.6) this.verifiedStatus = 'active';
      else if (rand < 0.75) this.verifiedStatus = 'not_found';
      else if (rand < 0.9) this.verifiedStatus = 'not_active';
      else this.verifiedStatus = 'expired';

      this.phase = 'result';
    }, 1500);
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
