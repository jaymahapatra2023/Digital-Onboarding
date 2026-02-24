import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StepOverviewCardComponent } from '../../components/step-overview-card/step-overview-card.component';
import { GroupSetupService } from '../../services/group-setup.service';
import { GroupSetupStore } from '../../store/group-setup.store';
import { WorkflowInstance } from '../../../../core/models/workflow.model';

const STEP_NAMES: Record<string, string> = {
  licensing: 'Licensing/Appointment',
  company_info: 'Company Information',
  risk_assessment: 'Risk Assessment',
  commission_ack: 'Commission Agreement',
  renewal_period: 'Renewal Period',
  group_structure: 'Group Structure',
  billing_setup: 'Billing Setup',
  authorization: 'Authorization',
  finalize: 'Finalize',
  master_app: 'Master Application',
};

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    StepOverviewCardComponent,
  ],
  template: `
    <div class="page-container">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-10">
          <div class="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <mat-icon class="text-indigo-600" style="font-size:32px;width:32px;height:32px;">assignment</mat-icon>
          </div>
          <h1 class="text-3xl font-bold text-slate-900 mb-2">Welcome to Group Setup</h1>
          <p class="text-slate-500 text-lg">Complete the following steps to set up your group benefits</p>
        </div>

        <!-- Loading -->
        <div *ngIf="store.loading()" class="flex justify-center py-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <!-- Workflow Overview -->
        <div *ngIf="store.workflow() as workflow" class="space-y-6">
          <!-- Progress summary -->
          <div class="card p-6 mb-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 class="text-lg font-bold text-slate-900">Setup Progress</h2>
                <p class="text-slate-500 mt-0.5">
                  <span class="font-bold text-indigo-600">{{ completedSteps }}</span> of {{ totalSteps }} steps completed
                </p>
              </div>
              <div class="w-full sm:w-64">
                <div class="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500 ease-out"
                       style="background: linear-gradient(90deg, #4338ca, #4f46e5, #818cf8);"
                       [style.width.%]="progressPercent"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step cards -->
          <div class="grid gap-3">
            <app-step-overview-card
              *ngFor="let step of sortedSteps"
              [step]="step"
              [stepName]="getStepName(step.step_id)"
              class="cursor-pointer"
              (click)="navigateToStep(step.step_id)">
            </app-step-overview-card>
          </div>

          <!-- Action buttons -->
          <div class="flex justify-center gap-4 mt-10">
            <button mat-flat-button color="primary" (click)="continueSetup()"
                    style="border-radius: 10px; padding: 0 28px; height: 48px; font-size: 15px;">
              <mat-icon>play_arrow</mat-icon>
              {{ workflow.current_step_id ? 'Continue Setup' : 'Begin Setup' }}
            </button>
          </div>
        </div>

        <!-- No workflow yet -->
        <div *ngIf="!store.loading() && !store.workflow()" class="text-center py-16">
          <div class="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <mat-icon class="text-slate-300" style="font-size:40px;width:40px;height:40px;">assignment</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-600 mb-2">No Active Workflow</h2>
          <p class="text-slate-400 mb-8">Start a group setup from the My Clients page</p>
          <button mat-flat-button color="primary" routerLink="/clients"
                  style="border-radius: 10px; padding: 0 24px;">
            Go to My Clients
          </button>
        </div>
      </div>
    </div>
  `,
})
export class WelcomeComponent implements OnInit {
  constructor(
    private service: GroupSetupService,
    public store: GroupSetupStore,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // If there's a clientId query param, load that workflow
    const clientId = this.route.snapshot.queryParamMap.get('clientId');
    if (clientId) {
      this.loadWorkflow(clientId);
    }
  }

  loadWorkflow(clientId: string): void {
    this.store.setLoading(true);
    this.service.getWorkflow(clientId).subscribe({
      next: (workflow) => {
        this.store.setWorkflow(workflow);
        this.store.setLoading(false);
      },
      error: () => {
        this.store.setLoading(false);
      },
    });
  }

  get sortedSteps() {
    const workflow = this.store.workflow();
    if (!workflow) return [];
    return [...workflow.step_instances].sort((a, b) => a.step_order - b.step_order);
  }

  get completedSteps(): number {
    return this.sortedSteps.filter(s => s.status === 'COMPLETED').length;
  }

  get totalSteps(): number {
    return this.sortedSteps.length;
  }

  get progressPercent(): number {
    return this.totalSteps > 0 ? (this.completedSteps / this.totalSteps) * 100 : 0;
  }

  getStepName(stepId: string): string {
    return STEP_NAMES[stepId] || stepId;
  }

  navigateToStep(stepId: string): void {
    const workflow = this.store.workflow();
    if (workflow) {
      this.router.navigate(['/workflow', workflow.client_id], { queryParams: { step: stepId } });
    }
  }

  continueSetup(): void {
    const workflow = this.store.workflow();
    if (workflow) {
      const stepId = workflow.current_step_id || this.sortedSteps[0]?.step_id;
      this.router.navigate(['/workflow', workflow.client_id], { queryParams: { step: stepId } });
    }
  }
}
