import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WorkflowStore } from '../../store/workflow.store';
import { WorkflowService } from '../../services/workflow.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MasterAppSignDialogComponent } from './master-app-sign-dialog.component';
import { MasterAppSignature, MasterAppConfirmation } from './master-app.interfaces';
import { StepStatus, WorkflowStatus } from '../../../../core/models/workflow.model';

@Component({
  selector: 'app-master-app',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatCardModule, MatIconModule,
    MatProgressBarModule, MatProgressSpinnerModule, MatDialogModule,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <mat-icon class="text-indigo-600" style="font-size:20px;width:20px;height:20px;">assignment</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-900">Master Application</h2>
        </div>
        <p class="text-slate-500 ml-12">Sign the Master Application and transition to enrollment</p>
      </div>

      <!-- Before submission -->
      <ng-container *ngIf="!submitted && !submitting">
        <mat-card>
          <mat-card-content class="p-6 space-y-5">
            <h3 class="text-base font-semibold text-slate-800">
              Sign the Master Application and Begin Enrollment
            </h3>
            <p class="text-sm text-slate-600">
              Sign and download, then you can proceed to enrollment.
            </p>

            <button mat-button class="text-indigo-600" (click)="openSignDialog()">
              <mat-icon>open_in_new</mat-icon> View &amp; Sign Master Application
            </button>

            <div *ngIf="signature" class="bg-green-50 rounded-xl p-4 border border-green-200">
              <div class="flex items-center gap-2 text-green-800">
                <mat-icon style="font-size:20px;width:20px;height:20px;">check_circle</mat-icon>
                <span class="text-sm font-semibold">Master Application signed</span>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-3">
                <div>
                  <span class="text-green-600 text-xs">Signed By</span>
                  <span class="text-green-800 block">{{ signature.accepted_by }}</span>
                </div>
                <div>
                  <span class="text-green-600 text-xs">Title</span>
                  <span class="text-green-800 block">{{ signature.title }}</span>
                </div>
                <div>
                  <span class="text-green-600 text-xs">City / State</span>
                  <span class="text-green-800 block">{{ signature.city }}, {{ signature.state }}</span>
                </div>
                <div>
                  <span class="text-green-600 text-xs">Date</span>
                  <span class="text-green-800 block">{{ signature.date }}</span>
                </div>
              </div>
            </div>

            <!-- Error message -->
            <div *ngIf="submitError" class="bg-red-50 rounded-xl p-4 border border-red-200">
              <div class="flex items-center gap-2 text-red-800">
                <mat-icon style="font-size:20px;width:20px;height:20px;">error</mat-icon>
                <span class="text-sm font-semibold">Submission failed</span>
              </div>
              <p class="text-sm text-red-700 mt-1">{{ submitError }}</p>
            </div>
          </mat-card-content>
        </mat-card>

        <div *ngIf="signature" class="flex justify-end gap-3">
          <button *ngIf="submitError" mat-stroked-button color="warn" (click)="submitApplication()" style="border-radius: 10px; padding: 0 24px;">
            Retry Submit
          </button>
          <button *ngIf="!submitError" mat-flat-button color="primary" (click)="submitApplication()" style="border-radius: 10px; padding: 0 24px;">
            Final Submit
          </button>
        </div>
      </ng-container>

      <!-- Submitting transition state -->
      <ng-container *ngIf="submitting">
        <mat-card>
          <mat-card-content class="p-6">
            <div class="flex flex-col items-center text-center py-8">
              <mat-spinner diameter="48" class="mb-6"></mat-spinner>
              <h3 class="text-lg font-bold text-slate-900 mb-2">Submitting your application...</h3>
              <p class="text-sm text-slate-500">{{ submittingStatus }}</p>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>

      <!-- After submission: Confirmation -->
      <ng-container *ngIf="submitted && confirmation">
        <mat-card>
          <mat-card-content class="p-6">
            <div class="flex flex-col items-center text-center py-4">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <mat-icon class="text-green-600" style="font-size:36px;width:36px;height:36px;">check_circle</mat-icon>
              </div>
              <h3 class="text-xl font-bold text-slate-900 mb-1">Group Setup Submitted Successfully!</h3>
              <p class="text-sm text-slate-500">
                Your Master Application has been signed and submitted.
              </p>
            </div>

            <div class="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3 mt-4">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-slate-500">Group Number</span>
                  <span class="text-slate-800 block font-semibold">{{ confirmation.group_number }}</span>
                </div>
                <div>
                  <span class="text-slate-500">Effective Date</span>
                  <span class="text-slate-800 block font-semibold">{{ confirmation.effective_date }}</span>
                </div>
              </div>

              <div *ngIf="confirmation.classes.length > 0">
                <span class="text-slate-500 text-sm">Classes</span>
                <div class="flex flex-wrap gap-2 mt-1">
                  <span *ngFor="let cls of confirmation.classes"
                        class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">
                    {{ cls }}
                  </span>
                </div>
              </div>

              <div *ngIf="confirmation.departments.length > 0">
                <span class="text-slate-500 text-sm">Departments</span>
                <div class="flex flex-wrap gap-2 mt-1">
                  <span *ngFor="let dept of confirmation.departments"
                        class="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-lg">
                    {{ dept }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Download + Timer -->
            <div class="mt-6 space-y-4">
              <div class="flex justify-center">
                <button mat-stroked-button (click)="downloadGroupStructure()" class="text-indigo-600">
                  <mat-icon>download</mat-icon> Download Group Structure
                </button>
              </div>

              <div *ngIf="countdownSeconds > 0" class="text-center space-y-2">
                <mat-progress-bar mode="determinate" [value]="countdownProgress" class="rounded-full"></mat-progress-bar>
                <p class="text-sm text-slate-500">
                  Loading Group Setup details... <span class="font-semibold">{{ countdownSeconds }}s</span> remaining
                </p>
              </div>

              <div class="flex justify-center">
                <button mat-flat-button color="primary" [disabled]="countdownSeconds > 0"
                        (click)="beginEnrollment()" style="border-radius: 10px; padding: 0 32px;">
                  Begin Enrollment
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>
    </div>
  `,
})
export class MasterAppComponent implements OnInit, OnDestroy {
  signature: MasterAppSignature | null = null;
  confirmation: MasterAppConfirmation | null = null;
  submitted = false;
  submitting = false;
  submitError: string | null = null;
  submittingStatus = 'Saving signature data...';
  countdownSeconds = 0;
  countdownProgress = 0;

  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private readonly COUNTDOWN_TOTAL = 90;

  constructor(
    private dialog: MatDialog,
    private store: WorkflowStore,
    private router: Router,
    private workflowService: WorkflowService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    const step = this.store.currentStep();
    if (step?.data && Object.keys(step.data).length > 0) {
      this.patchSavedData(step.data as Record<string, any>);
    }
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  private patchSavedData(data: Record<string, any>): void {
    if (data['signature']) {
      this.signature = data['signature'];
    }
    if (data['confirmation']) {
      this.confirmation = data['confirmation'];
    }
    if (data['submitted']) {
      this.submitted = true;
      this.countdownSeconds = 0;
      this.countdownProgress = 100;
      // Rebuild confirmation from store if missing
      if (!this.confirmation) {
        this.confirmation = this.buildConfirmationFromStore();
      }
    }
  }

  openSignDialog(): void {
    const ref = this.dialog.open(MasterAppSignDialogComponent, {
      width: '550px',
      data: { name: this.getSignatoryName() },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.signature = result;
      }
    });
  }

  submitApplication(): void {
    if (!this.signature) return;

    this.submitting = true;
    this.submitError = null;
    this.submittingStatus = 'Saving signature data...';

    const clientId = this.store.client()?.id;
    if (!clientId) {
      this.submitting = false;
      this.submitError = 'Client information not available. Please reload and try again.';
      return;
    }

    const stepData = this.getData();

    // Step 1: Save step data
    this.workflowService.saveStepData(clientId, 'master_app', stepData).subscribe({
      next: () => {
        this.submittingStatus = 'Completing master application step...';
        // Step 2: Complete step
        this.workflowService.completeStep(clientId, 'master_app').subscribe({
          next: () => {
            this.store.updateStepStatus('master_app', StepStatus.COMPLETED);
            this.submittingStatus = 'Submitting workflow for enrollment...';
            // Step 3: Submit workflow
            this.workflowService.submitWorkflow(clientId).subscribe({
              next: (payload) => {
                this.store.updateWorkflowStatus(WorkflowStatus.COMPLETED);
                this.store.setSubmissionPayload(payload);
                this.submitting = false;
                this.submitted = true;
                this.confirmation = this.buildConfirmationFromPayload(payload);
                this.startCountdown();
                this.notification.success('Group setup submitted successfully!');
              },
              error: (err) => {
                this.submitting = false;
                this.submitError = err?.error?.detail || 'Workflow submission failed. Please retry.';
              },
            });
          },
          error: (err) => {
            this.submitting = false;
            this.submitError = err?.error?.detail || 'Failed to complete master application step. Please retry.';
          },
        });
      },
      error: (err) => {
        this.submitting = false;
        this.submitError = err?.error?.detail || 'Failed to save signature data. Please retry.';
      },
    });
  }

  private buildConfirmationFromPayload(payload: Record<string, any>): MasterAppConfirmation {
    const groupNumber = payload['group_number'] || 'Pending';
    const { effectiveDate, classes, departments } = this.getLocalStoreData();
    return {
      group_number: groupNumber,
      effective_date: effectiveDate,
      classes,
      departments,
    };
  }

  private buildConfirmationFromStore(): MasterAppConfirmation {
    const client = this.store.client();
    const groupNumber = client?.group_id || 'Pending';
    const { effectiveDate, classes, departments } = this.getLocalStoreData();
    return {
      group_number: groupNumber,
      effective_date: effectiveDate,
      classes,
      departments,
    };
  }

  private getLocalStoreData(): { effectiveDate: string; classes: string[]; departments: string[] } {
    const steps = this.store.sortedSteps();
    const groupStructureData = steps.find(s => s.step_id === 'group_structure')?.data as Record<string, any> | undefined;

    const classes: string[] = [];
    if (groupStructureData?.['classes']) {
      for (const cls of groupStructureData['classes']) {
        classes.push(cls.class_name || cls.name || `Class ${cls.class_id || ''}`);
      }
    }

    const departments: string[] = [];
    if (groupStructureData?.['departments']) {
      for (const dept of groupStructureData['departments']) {
        departments.push(dept.department_name || dept.name || `Dept ${dept.department_id || ''}`);
      }
    }

    const companyData = steps.find(s => s.step_id === 'company_info')?.data as Record<string, any> | undefined;
    const effectiveDate = companyData?.['basic']?.effective_date || new Date().toLocaleDateString('en-US');

    return {
      effectiveDate,
      classes: classes.length > 0 ? classes : ['Default Class'],
      departments: departments.length > 0 ? departments : ['Default Department'],
    };
  }

  private startCountdown(): void {
    this.countdownSeconds = this.COUNTDOWN_TOTAL;
    this.countdownProgress = 0;

    this.countdownInterval = setInterval(() => {
      this.countdownSeconds--;
      this.countdownProgress = ((this.COUNTDOWN_TOTAL - this.countdownSeconds) / this.COUNTDOWN_TOTAL) * 100;

      if (this.countdownSeconds <= 0) {
        this.clearCountdown();
        this.countdownProgress = 100;
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private getSignatoryName(): string {
    const steps = this.store.sortedSteps();
    const authData = steps.find(s => s.step_id === 'authorization')?.data as Record<string, any> | undefined;
    return authData?.['final_signature']?.accepted_by || '';
  }

  downloadGroupStructure(): void {
    // In production, this would generate and download a PDF
  }

  beginEnrollment(): void {
    this.router.navigate(['/sold-cases']);
  }

  getData(): Record<string, any> {
    return {
      signature: this.signature,
      confirmation: this.confirmation,
      submitted: this.submitted,
    };
  }

  isValid(): boolean {
    return this.submitted;
  }
}
