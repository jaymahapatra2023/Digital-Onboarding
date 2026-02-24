import { Component, OnInit, ViewContainerRef, ViewChild, ComponentRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { WorkflowNavComponent } from '../workflow-nav/workflow-nav.component';
import { WorkflowProgressComponent } from '../workflow-progress/workflow-progress.component';
import { WorkflowStore } from '../../store/workflow.store';
import { WorkflowService } from '../../services/workflow.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { STEP_REGISTRY, STEP_NAMES } from '../../steps/step-registry';
import { StepStatus } from '../../../../core/models/workflow.model';

@Component({
  selector: 'app-workflow-container',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    WorkflowNavComponent, WorkflowProgressComponent,
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
            (stepSelect)="navigateToStep($event)">
          </app-workflow-nav>
        </aside>

        <!-- Step content -->
        <main class="flex-1 overflow-y-auto">
          <div *ngIf="store.loading()" class="flex justify-center py-12">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <div *ngIf="!store.loading()" class="p-8 max-w-4xl">
            <!-- Step header -->
            <div class="flex items-center justify-between mb-8">
              <h1 class="text-xl font-bold text-slate-900">
                {{ currentStepName }}
              </h1>
              <button mat-stroked-button (click)="onSave()" [disabled]="store.saving()"
                      class="text-slate-600">
                <mat-icon class="mr-1">save</mat-icon> Save Draft
              </button>
            </div>

            <!-- Dynamic step component container -->
            <ng-container #stepContainer></ng-container>

            <!-- Navigation bar -->
            <div class="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
              <button mat-button (click)="onPrevious()" [disabled]="isFirstStep"
                      class="text-slate-600">
                <mat-icon>arrow_back</mat-icon> Previous
              </button>
              <div class="flex gap-3">
                <button mat-button (click)="onSkip()" class="text-slate-400">Skip</button>
                <button mat-flat-button color="primary" (click)="onNext()"
                        style="border-radius: 10px; padding: 0 24px;">
                  {{ isLastStep ? 'Complete' : 'Save & Continue' }}
                  <mat-icon>{{ isLastStep ? 'check' : 'arrow_forward' }}</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
})
export class WorkflowContainerComponent implements OnInit {
  @ViewChild('stepContainer', { read: ViewContainerRef, static: false })
  stepContainer!: ViewContainerRef;

  private currentComponentRef: ComponentRef<any> | null = null;
  clientId: string = '';

  constructor(
    private route: ActivatedRoute,
    public store: WorkflowStore,
    private workflowService: WorkflowService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('clientId') || '';
    this.loadWorkflow();
  }

  loadWorkflow(): void {
    this.store.setLoading(true);
    this.workflowService.getWorkflow(this.clientId).subscribe({
      next: (workflow) => {
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
      error: () => {
        this.store.setLoading(false);
        this.notification.error('Failed to load workflow');
      },
    });
  }

  get currentStepName(): string {
    return STEP_NAMES[this.store.currentStepId()] || this.store.currentStepId();
  }

  get isFirstStep(): boolean {
    const steps = this.store.sortedSteps();
    return steps.length > 0 && steps[0].step_id === this.store.currentStepId();
  }

  get isLastStep(): boolean {
    const steps = this.store.sortedSteps();
    return steps.length > 0 && steps[steps.length - 1].step_id === this.store.currentStepId();
  }

  async navigateToStep(stepId: string): Promise<void> {
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
    if (!this.currentComponentRef?.instance?.getData) return;
    const data = this.currentComponentRef.instance.getData();
    const stepId = this.store.currentStepId();

    this.store.setSaving(true);
    try {
      await this.workflowService.saveStepData(this.clientId, stepId, data).toPromise();
    } catch {
      // Silently fail for auto-save
    }
    this.store.setSaving(false);
  }

  async onSave(): Promise<void> {
    if (!this.currentComponentRef?.instance?.getData) return;
    const data = this.currentComponentRef.instance.getData();
    const stepId = this.store.currentStepId();

    this.store.setSaving(true);
    this.workflowService.saveStepData(this.clientId, stepId, data).subscribe({
      next: () => {
        this.notification.success('Progress saved');
        this.store.setSaving(false);
      },
      error: () => {
        this.notification.error('Failed to save');
        this.store.setSaving(false);
      },
    });
  }

  async onNext(): Promise<void> {
    const stepId = this.store.currentStepId();

    // Save first
    if (this.currentComponentRef?.instance?.getData) {
      const data = this.currentComponentRef.instance.getData();
      await this.workflowService.saveStepData(this.clientId, stepId, data).toPromise();
    }

    // Complete step
    this.workflowService.completeStep(this.clientId, stepId).subscribe({
      next: (result) => {
        this.store.updateStepStatus(stepId, StepStatus.COMPLETED);
        if (result.next_step_id) {
          this.navigateToStep(result.next_step_id);
        } else {
          this.notification.success('All steps completed!');
        }
      },
      error: () => this.notification.error('Failed to complete step'),
    });
  }

  onPrevious(): void {
    const steps = this.store.sortedSteps();
    const currentIdx = steps.findIndex(s => s.step_id === this.store.currentStepId());
    if (currentIdx > 0) {
      this.navigateToStep(steps[currentIdx - 1].step_id);
    }
  }

  onSkip(): void {
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
      error: () => this.notification.error('Failed to skip step'),
    });
  }
}
