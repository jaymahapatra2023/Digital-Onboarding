import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WorkflowStore } from '../../store/workflow.store';
import { MasterAppSignDialogComponent } from './master-app-sign-dialog.component';
import { MasterAppSignature, MasterAppConfirmation, MasterAppData } from './master-app.interfaces';

@Component({
  selector: 'app-master-app',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatCardModule, MatIconModule,
    MatProgressBarModule, MatDialogModule,
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
      <ng-container *ngIf="!submitted">
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
                  <span class="text-green-600 text-xs">Title</span>
                  <span class="text-green-800 block">{{ signature.title }}</span>
                </div>
                <div>
                  <span class="text-green-600 text-xs">City</span>
                  <span class="text-green-800 block">{{ signature.city }}</span>
                </div>
                <div>
                  <span class="text-green-600 text-xs">State</span>
                  <span class="text-green-800 block">{{ signature.state }}</span>
                </div>
                <div>
                  <span class="text-green-600 text-xs">Date</span>
                  <span class="text-green-800 block">{{ signature.date }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <div *ngIf="signature" class="flex justify-end">
          <button mat-flat-button color="primary" (click)="submitApplication()" style="border-radius: 10px; padding: 0 24px;">
            Final Submit
          </button>
        </div>
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
  countdownSeconds = 0;
  countdownProgress = 0;

  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private readonly COUNTDOWN_TOTAL = 90;

  constructor(
    private dialog: MatDialog,
    private store: WorkflowStore,
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
      // If already submitted, countdown is done
      this.countdownSeconds = 0;
      this.countdownProgress = 100;
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

    this.submitted = true;
    this.confirmation = this.buildConfirmation();
    this.startCountdown();
  }

  private buildConfirmation(): MasterAppConfirmation {
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
      group_number: 'GRP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      effective_date: effectiveDate,
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
    // In production, this would navigate to the enrollment module
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
