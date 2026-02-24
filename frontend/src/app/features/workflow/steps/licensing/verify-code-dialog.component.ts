import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorkflowService } from '../../services/workflow.service';

export interface VerifyCodeDialogData {
  producerName: string;
  producerId: string;
}

export interface VerifyCodeResult {
  compensable_code: string;
  details: {
    name: string;
    broker_code: string;
    company: string;
    address: string;
  };
  information_incorrect: boolean;
}

@Component({
  selector: 'app-verify-code-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatCheckboxModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="p-2">
      <div class="flex items-center gap-3 mb-1">
        <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <mat-icon class="text-purple-600" style="font-size:22px;width:22px;height:22px;">qr_code</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900">Verify Compensable Code</h2>
          <p class="text-sm text-slate-400">{{ data.producerName }}</p>
        </div>
      </div>

      <mat-dialog-content class="py-5">
        <!-- Phase 1: SSN Input -->
        <div *ngIf="phase === 'input'" class="space-y-4">
          <p class="text-sm text-slate-600">
            Enter the producer's Social Security Number to look up their compensable code and broker information.
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
          <p class="text-slate-600">Looking up compensable code...</p>
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

        <!-- Phase 4: Not Found -->
        <div *ngIf="phase === 'not_found'" class="space-y-4">
          <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div class="flex items-center gap-3 mb-2">
              <mat-icon class="text-yellow-600">warning</mat-icon>
              <p class="font-semibold text-slate-900">No Compensable Code Found</p>
            </div>
            <p class="text-sm text-slate-600">
              No compensable code was found for this SSN. Please verify the Social Security Number
              is correct and try again, or contact your administrator for assistance.
            </p>
          </div>
        </div>

        <!-- Phase 5: Result (found) -->
        <div *ngIf="phase === 'result'" class="space-y-4">
          <div class="bg-green-50 rounded-xl p-4 border border-green-200">
            <div class="flex items-center gap-3 mb-3">
              <mat-icon class="text-green-600">check_circle</mat-icon>
              <p class="font-semibold text-slate-900">Compensable Code Found</p>
            </div>
            <div class="bg-white rounded-lg p-4 space-y-2 text-sm">
              <div class="grid grid-cols-[140px_1fr] gap-1">
                <span class="text-slate-500 font-medium">Name:</span>
                <span class="text-slate-900">{{ codeDetails.name }}</span>
              </div>
              <div class="grid grid-cols-[140px_1fr] gap-1">
                <span class="text-slate-500 font-medium">Broker Code:</span>
                <span class="text-slate-900 font-mono">{{ codeDetails.broker_code }}</span>
              </div>
              <div class="grid grid-cols-[140px_1fr] gap-1">
                <span class="text-slate-500 font-medium">Company:</span>
                <span class="text-slate-900">{{ codeDetails.company }}</span>
              </div>
              <div class="grid grid-cols-[140px_1fr] gap-1">
                <span class="text-slate-500 font-medium">Address:</span>
                <span class="text-slate-900">{{ codeDetails.address }}</span>
              </div>
            </div>
          </div>

          <mat-checkbox [(ngModel)]="informationIncorrect" color="warn">
            <span class="text-sm text-slate-700">This information is incorrect</span>
          </mat-checkbox>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-2">
        <button mat-button (click)="dialogRef.close()" class="text-slate-500">Cancel</button>
        <button *ngIf="phase === 'input'" mat-flat-button color="primary"
                [disabled]="ssnForm.invalid" (click)="verify()" style="border-radius: 8px;">
          Verify Code
        </button>
        <button *ngIf="phase === 'error' || phase === 'not_found'" mat-flat-button color="primary"
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
export class VerifyCodeDialogComponent {
  ssnForm: FormGroup;
  phase: 'input' | 'verifying' | 'result' | 'not_found' | 'error' = 'input';
  showSsn = false;
  informationIncorrect = false;
  errorMessage = '';

  codeDetails = {
    name: '',
    broker_code: '',
    company: '',
    address: '',
  };

  private compensableCode = '';

  constructor(
    private fb: FormBuilder,
    private workflowService: WorkflowService,
    public dialogRef: MatDialogRef<VerifyCodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VerifyCodeDialogData,
  ) {
    this.ssnForm = this.fb.group({
      ssn: ['', [Validators.required, Validators.pattern(/^\d{3}-?\d{2}-?\d{4}$/)]],
    });
  }

  verify(): void {
    if (this.ssnForm.invalid) return;
    this.phase = 'verifying';

    const ssn = this.ssnForm.value.ssn;
    this.workflowService.verifyCompensableCode(ssn, this.data.producerName, this.data.producerId)
      .subscribe({
        next: (response) => {
          if (response.found) {
            this.compensableCode = response.compensable_code;
            this.codeDetails = response.details;
            this.phase = 'result';
          } else {
            this.phase = 'not_found';
          }
        },
        error: () => {
          this.errorMessage = 'Unable to reach the compensable code service. Please try again.';
          this.phase = 'error';
        },
      });
  }

  onConfirm(): void {
    const result: VerifyCodeResult = {
      compensable_code: this.compensableCode,
      details: { ...this.codeDetails },
      information_incorrect: this.informationIncorrect,
    };
    this.dialogRef.close(result);
  }
}
