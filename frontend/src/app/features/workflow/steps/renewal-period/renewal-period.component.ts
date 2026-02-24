import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { Subject } from 'rxjs';
import { WorkflowStore } from '../../store/workflow.store';

@Component({
  selector: 'app-renewal-period',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatIconModule, MatRadioModule,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <div class="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
            <mat-icon class="text-purple-600" style="font-size:20px;width:20px;height:20px;">event</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-900">Renewal Notification Period</h2>
        </div>
        <p class="text-slate-500 ml-12">Select how far in advance renewal notifications should be sent</p>
      </div>

      <!-- Info Banner -->
      <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
        <p class="text-sm text-blue-800">
          The renewal notification period determines how many days before the policy renewal date
          the employer will be notified. The standard period is 60 days.
        </p>
      </div>

      <form [formGroup]="form">
        <mat-card>
          <mat-card-content class="p-6 space-y-5">
            <h3 class="text-base font-semibold text-slate-800">Select Notification Period</h3>
            <p class="text-xs text-slate-500">Choose the number of days prior to renewal for notification.</p>

            <mat-radio-group formControlName="renewal_notification_period" class="flex flex-col gap-4">
              <div class="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100 cursor-pointer"
                   [class.border-indigo-300]="form.get('renewal_notification_period')?.value === '60'"
                   [class.bg-indigo-50]="form.get('renewal_notification_period')?.value === '60'"
                   (click)="form.get('renewal_notification_period')?.setValue('60')">
                <mat-radio-button value="60" color="primary"></mat-radio-button>
                <div>
                  <span class="text-sm font-semibold text-slate-800">60 Days</span>
                  <span class="ml-2 text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Standard</span>
                  <p class="text-xs text-slate-500 mt-1">Recommended for most groups. Provides adequate time for renewal review and processing.</p>
                </div>
              </div>

              <div class="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100 cursor-pointer"
                   [class.border-indigo-300]="form.get('renewal_notification_period')?.value === '90'"
                   [class.bg-indigo-50]="form.get('renewal_notification_period')?.value === '90'"
                   (click)="form.get('renewal_notification_period')?.setValue('90')">
                <mat-radio-button value="90" color="primary"></mat-radio-button>
                <div>
                  <span class="text-sm font-semibold text-slate-800">90 Days</span>
                  <p class="text-xs text-slate-500 mt-1">Extended notification period for larger groups or those requiring additional review time.</p>
                </div>
              </div>
            </mat-radio-group>
          </mat-card-content>
        </mat-card>
      </form>
    </div>
  `,
})
export class RenewalPeriodComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private store: WorkflowStore,
  ) {
    this.form = this.fb.group({
      renewal_notification_period: ['60', Validators.required],
    });
  }

  ngOnInit(): void {
    const step = this.store.currentStep();
    if (step?.data && Object.keys(step.data).length > 0) {
      this.patchSavedData(step.data as Record<string, any>);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private patchSavedData(data: Record<string, any>): void {
    if (data['renewal_notification_period']) {
      this.form.patchValue({ renewal_notification_period: data['renewal_notification_period'] });
    }
  }

  getData(): Record<string, any> {
    return {
      renewal_notification_period: this.form.get('renewal_notification_period')!.value,
    };
  }

  isValid(): boolean {
    return this.form.valid;
  }
}
