import { Component, OnInit, ViewContainerRef, ViewChild, ComponentRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { WorkflowNavComponent } from '../workflow-nav/workflow-nav.component';
import { WorkflowProgressComponent } from '../workflow-progress/workflow-progress.component';
import { ContextPanelComponent } from '../context-panel/context-panel.component';
import { WorkflowStore } from '../../store/workflow.store';
import { WorkflowService } from '../../services/workflow.service';
import { SoldCasesService } from '../../../sold-cases/services/sold-cases.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { STEP_REGISTRY, STEP_NAMES } from '../../steps/step-registry';
import { StepStatus, WorkflowStatus } from '../../../../core/models/workflow.model';
import { getOwnershipLabel } from '../../../group-setup/store/group-setup.store';

@Component({
  selector: 'app-workflow-container',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    WorkflowNavComponent, WorkflowProgressComponent, ContextPanelComponent,
  ],
  template: `
    <div class="h-full flex flex-col bg-slate-50">
      <!-- Progress bar -->
      <app-workflow-progress
        [completed]="store.completedCount()"
        [total]="store.sortedSteps().length">
      </app-workflow-progress>

      <div class="flex flex-1 overflow-hidden">
        <!-- Side nav (hidden on mobile) -->
        <aside class="hidden md:block">
          <app-workflow-nav
            [steps]="store.sortedSteps()"
            [currentStepId]="store.currentStepId()"
            [userRole]="userRole"
            (stepSelect)="navigateToStep($event)">
          </app-workflow-nav>
        </aside>

        <!-- Step content -->
        <main class="flex-1 overflow-y-auto">
          <div *ngIf="store.loading()" class="flex justify-center py-12">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <div *ngIf="!store.loading()" class="p-8 max-w-4xl">
            <!-- Post-submit banner -->
            <div *ngIf="store.isWorkflowSubmitted()" class="mb-6 px-5 py-4 bg-green-50 border border-green-200 rounded-xl">
              <div class="flex items-center gap-3">
                <mat-icon class="text-green-600" style="font-size:20px;width:20px;height:20px;">check_circle</mat-icon>
                <div>
                  <p class="text-sm font-semibold text-green-800">Group Setup Submitted</p>
                  <p class="text-xs text-green-600 mt-0.5">This workflow has been submitted. All steps are locked and read-only.</p>
                </div>
              </div>
            </div>

            <!-- Role-restricted step: handoff banner -->
            <div *ngIf="store.isCurrentStepRoleRestricted() && !handoffSent"
                 class="mb-6 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div class="flex items-center gap-3">
                <mat-icon class="text-amber-600" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
                <p class="text-sm text-amber-800">
                  This step is assigned to <strong>{{ currentStepAssignedRole }}</strong>. You can view but not edit.
                </p>
              </div>
              <div class="flex items-center gap-3">
                <button mat-flat-button color="primary" (click)="onRequestHandoff()"
                        [disabled]="handoffLoading" style="border-radius: 10px;">
                  <mat-icon>send</mat-icon>
                  {{ handoffLoading ? 'Sending...' : 'Send to Employer' }}
                </button>
                <span class="text-xs text-amber-600">
                  This will notify the employer via email that their steps are ready.
                </span>
              </div>
            </div>

            <!-- Handoff success banner -->
            <div *ngIf="store.isCurrentStepRoleRestricted() && handoffSent"
                 class="mb-6 px-5 py-4 bg-green-50 border border-green-200 rounded-xl">
              <div class="flex items-center gap-3">
                <mat-icon class="text-green-600" style="font-size:20px;width:20px;height:20px;">check_circle</mat-icon>
                <div>
                  <p class="text-sm font-semibold text-green-800">Sent to {{ handoffEmployerName }}</p>
                  <p class="text-xs text-green-600 mt-0.5">
                    A notification was sent to {{ handoffEmployerEmail }}. They can now log in to complete their steps.
                  </p>
                </div>
              </div>
            </div>

            <!-- Step header -->
            <div class="flex items-center justify-between mb-8">
              <h1 class="text-xl font-bold text-slate-900">
                {{ currentStepName }}
              </h1>
              <button *ngIf="!store.isWorkflowSubmitted()" mat-stroked-button (click)="onSave()"
                      [disabled]="store.saving() || store.isCurrentStepRoleRestricted()"
                      class="text-slate-600">
                <mat-icon class="mr-1">save</mat-icon> Save Draft
              </button>
            </div>

            <!-- Validation error banner (above step content so it's always visible) -->
            <div #errorBanner *ngIf="validationErrors.length > 0" class="mb-6 bg-red-50 border border-red-300 rounded-xl p-4 space-y-2">
              <div class="flex items-center gap-2">
                <mat-icon class="text-red-600" style="font-size:20px;width:20px;height:20px;">error</mat-icon>
                <h3 class="text-sm font-semibold text-red-800">Please fix the following before continuing:</h3>
              </div>
              <ul class="list-disc list-inside space-y-1 ml-7">
                <li *ngFor="let err of validationErrors" class="text-sm text-red-700">{{ err }}</li>
              </ul>
            </div>

            <!-- Dynamic step component container -->
            <ng-container #stepContainer></ng-container>

            <!-- Navigation bar (hidden on master_app — it owns its own submit flow) -->
            <div class="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
              <button mat-button (click)="onPrevious()" [disabled]="isFirstStep"
                      class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Previous
              </button>
              <div *ngIf="!store.isWorkflowSubmitted() && !isOnMasterApp" class="flex gap-3">
                <button mat-button (click)="onSkip()" class="text-slate-400"
                        [disabled]="store.isCurrentStepRoleRestricted()">Skip</button>
                <button mat-flat-button color="primary" (click)="onNext()"
                        [disabled]="store.isCurrentStepRoleRestricted()"
                        style="border-radius: 10px; padding: 0 24px;">
                  {{ isLastStep ? 'Complete' : 'Save & Continue' }}
                  <mat-icon>{{ isLastStep ? 'check' : 'arrow_forward' }}</mat-icon>
                </button>
              </div>
              <div *ngIf="store.isWorkflowSubmitted()">
                <button mat-flat-button color="primary" (click)="returnToCases()"
                        style="border-radius: 10px; padding: 0 24px;">
                  Return to Cases <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </main>

        <!-- Right-rail context panel (hidden on smaller screens) -->
        <aside class="hidden lg:block w-80 border-l border-gray-200 overflow-y-auto bg-white">
          <app-context-panel
            [client]="store.client()"
            [clientId]="clientId">
          </app-context-panel>
        </aside>
      </div>
    </div>
  `,
})
export class WorkflowContainerComponent implements OnInit {
  @ViewChild('stepContainer', { read: ViewContainerRef, static: false })
  stepContainer!: ViewContainerRef;
  @ViewChild('errorBanner', { read: ElementRef, static: false })
  errorBanner?: ElementRef;

  private currentComponentRef: ComponentRef<any> | null = null;
  clientId: string = '';
  userRole: string = '';
  validationErrors: string[] = [];
  handoffSent = false;
  handoffLoading = false;
  handoffEmployerEmail = '';
  handoffEmployerName = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public store: WorkflowStore,
    private workflowService: WorkflowService,
    private soldCasesService: SoldCasesService,
    private notification: NotificationService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('clientId') || '';
    this.userRole = this.auth.userRole() || '';
    this.store.setUserRole(this.userRole);
    this.loadWorkflow();
    this.loadClient();
  }

  loadWorkflow(): void {
    this.store.setLoading(true);
    this.workflowService.getWorkflow(this.clientId).subscribe({
      next: (workflow) => {
        // Redirect offline workflows to the offline packet hub
        if (workflow.is_offline) {
          this.router.navigate(['/offline-packet', this.clientId]);
          return;
        }

        this.store.setWorkflow(workflow);
        this.store.setLoading(false);
        // Allow one change-detection tick so the *ngIf renders the stepContainer
        setTimeout(() => {
          const stepId = this.route.snapshot.queryParamMap.get('step') || workflow.current_step_id;
          if (stepId) {
            this.navigateToStep(stepId);
          }
        });
      },
      error: (err: any) => {
        this.store.setLoading(false);
        const hint = err?.error?.recovery_hint || err?.error?.message;
        this.notification.error(hint || 'Failed to load workflow');
      },
    });
  }

  loadClient(): void {
    this.soldCasesService.getClient(this.clientId).subscribe({
      next: (client) => this.store.setClient(client),
      error: () => {},
    });
  }

  get currentStepName(): string {
    return STEP_NAMES[this.store.currentStepId()] || this.store.currentStepId();
  }

  get currentStepAssignedRole(): string {
    const step = this.store.currentStep();
    const roles = step?.allowed_roles || [];
    return roles.map(r => r.charAt(0) + r.slice(1).toLowerCase()).join(', ') || 'another role';
  }

  get isFirstStep(): boolean {
    const steps = this.store.sortedSteps();
    return steps.length > 0 && steps[0].step_id === this.store.currentStepId();
  }

  get isOnMasterApp(): boolean {
    return this.store.currentStepId() === 'master_app';
  }

  get isLastStep(): boolean {
    const steps = this.store.sortedSteps();
    return steps.length > 0 && steps[steps.length - 1].step_id === this.store.currentStepId();
  }

  onRequestHandoff(): void {
    this.handoffLoading = true;
    this.workflowService.requestHandoff(this.clientId).subscribe({
      next: (result) => {
        this.handoffSent = true;
        this.handoffLoading = false;
        this.handoffEmployerName = result.employer_name;
        this.handoffEmployerEmail = result.employer_email;
        this.notification.success('Handoff notification sent to employer');
      },
      error: (err: any) => {
        this.handoffLoading = false;
        const hint = err?.error?.recovery_hint || err?.error?.message;
        this.notification.error(hint || 'Failed to send handoff notification');
      },
    });
  }

  async navigateToStep(stepId: string): Promise<void> {
    this.validationErrors = [];
    this.handoffSent = false;
    this.handoffLoading = false;

    // Save current step data first
    if (this.currentComponentRef?.instance?.getData) {
      await this.saveCurrentStepData();
    }

    this.store.setCurrentStepId(stepId);

    // Load step component dynamically
    const loader = STEP_REGISTRY[stepId];
    if (loader) {
      try {
        const componentType = await loader();
        this.stepContainer.clear();
        this.currentComponentRef = this.stepContainer.createComponent(componentType);
        // Listen for edit navigation requests (e.g. from Finalize review step)
        if (this.currentComponentRef.instance.editStepRequest) {
          this.currentComponentRef.instance.editStepRequest.subscribe((targetStepId: string) => {
            this.navigateToStep(targetStepId);
          });
        }
      } catch {
        this.notification.error(`Step "${stepId}" is not yet implemented`);
      }
    } else {
      // Show placeholder for unregistered steps
      this.stepContainer.clear();
      this.currentComponentRef = null;
    }
  }

  async saveCurrentStepData(): Promise<void> {
    if (this.store.isWorkflowSubmitted()) return;
    if (!this.currentComponentRef?.instance?.getData) return;
    const data = this.currentComponentRef.instance.getData();
    const stepId = this.store.currentStepId();

    // Update the in-memory store so other steps see the latest data
    this.store.updateStepData(stepId, data);

    this.store.setSaving(true);
    try {
      await this.workflowService.saveStepData(this.clientId, stepId, data).toPromise();
    } catch (err: any) {
      const hint = err?.error?.recovery_hint;
      this.notification.error(hint || 'Auto-save failed. Your latest changes may not be saved.');
    }
    this.store.setSaving(false);
  }

  async onSave(): Promise<void> {
    if (this.store.isWorkflowSubmitted()) return;
    if (this.store.isCurrentStepRoleRestricted()) return;
    if (!this.currentComponentRef?.instance?.getData) return;
    const data = this.currentComponentRef.instance.getData();
    const stepId = this.store.currentStepId();

    // Update the in-memory store so other steps see the latest data
    this.store.updateStepData(stepId, data);

    this.store.setSaving(true);
    this.workflowService.saveStepData(this.clientId, stepId, data).subscribe({
      next: () => {
        this.notification.success('Progress saved');
        this.store.setSaving(false);
      },
      error: (err: any) => {
        const hint = err?.error?.recovery_hint || err?.error?.message;
        this.notification.error(hint || 'Failed to save');
        this.store.setSaving(false);
      },
    });
  }

  async onNext(): Promise<void> {
    if (this.store.isWorkflowSubmitted()) return;
    if (this.store.isCurrentStepRoleRestricted()) return;

    // Clear previous validation errors
    this.validationErrors = [];

    // Mark all forms as touched to trigger inline error display
    if (this.currentComponentRef?.instance?.markFormsAsTouched) {
      this.currentComponentRef.instance.markFormsAsTouched();
    }

    // Validation gate: check isValid() before allowing step completion
    if (this.currentComponentRef?.instance?.isValid &&
        !this.currentComponentRef.instance.isValid()) {
      // Get specific validation errors if the step supports it
      if (this.currentComponentRef.instance.getValidationErrors) {
        this.validationErrors = this.currentComponentRef.instance.getValidationErrors();
      }
      // Fallback: ensure at least one error message is shown inline
      if (this.validationErrors.length === 0) {
        this.validationErrors = ['Please complete all required fields before continuing.'];
      }
      // Scroll to the error banner after it renders
      setTimeout(() => {
        this.errorBanner?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }

    const stepId = this.store.currentStepId();

    // Save first
    if (this.currentComponentRef?.instance?.getData) {
      const data = this.currentComponentRef.instance.getData();
      this.store.updateStepData(stepId, data);
      await this.workflowService.saveStepData(this.clientId, stepId, data).toPromise();
    }

    // Complete step
    this.workflowService.completeStep(this.clientId, stepId).subscribe({
      next: (result) => {
        this.store.updateStepStatus(stepId, StepStatus.COMPLETED);
        if (result.next_step_id) {
          this.navigateToStep(result.next_step_id);
        } else {
          // All steps completed — submit the workflow downstream
          this.submitWorkflow();
        }
      },
      error: (err: any) => {
        const hint = err?.error?.recovery_hint || err?.error?.message;
        this.notification.error(hint || 'Failed to complete step');
      },
    });
  }

  onPrevious(): void {
    const steps = this.store.sortedSteps();
    const currentIdx = steps.findIndex(s => s.step_id === this.store.currentStepId());
    if (currentIdx > 0) {
      this.navigateToStep(steps[currentIdx - 1].step_id);
    }
  }

  private submitWorkflow(): void {
    this.workflowService.submitWorkflow(this.clientId).subscribe({
      next: () => {
        this.store.updateWorkflowStatus(WorkflowStatus.COMPLETED);
        this.notification.success('Group setup submitted successfully!');
      },
      error: (err: any) => {
        const hint = err?.error?.recovery_hint || err?.error?.message;
        this.notification.error(hint || 'Steps completed, but downstream submission failed. Please try again.');
      },
    });
  }

  returnToCases(): void {
    this.router.navigate(['/sold-cases']);
  }

  onSkip(): void {
    if (this.store.isWorkflowSubmitted()) return;
    if (this.store.isCurrentStepRoleRestricted()) return;
    const stepId = this.store.currentStepId();
    this.workflowService.skipStep(this.clientId, stepId).subscribe({
      next: () => {
        this.store.updateStepStatus(stepId, StepStatus.SKIPPED);
        // Move to next
        const steps = this.store.sortedSteps();
        const currentIdx = steps.findIndex(s => s.step_id === stepId);
        if (currentIdx < steps.length - 1) {
          this.navigateToStep(steps[currentIdx + 1].step_id);
        }
      },
      error: (err: any) => {
        const hint = err?.error?.recovery_hint || err?.error?.message;
        this.notification.error(hint || 'Failed to skip step');
      },
    });
  }
}
