import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StepOverviewCardComponent } from '../../components/step-overview-card/step-overview-card.component';
import { GroupSetupService } from '../../services/group-setup.service';
import { GroupSetupStore, StepStatusInfo } from '../../store/group-setup.store';
import { AuthService } from '../../../../core/auth/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, StepOverviewCardComponent,
  ],
  template: `
    <div class="page-container">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-10">
          <div class="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <mat-icon class="text-indigo-600" style="font-size:32px;width:32px;height:32px;">assignment</mat-icon>
          </div>
          <h1 class="text-3xl font-bold text-slate-900 mb-2">
            {{ store.client() ? 'Group Setup — ' + store.client()!.client_name : 'Welcome to Group Setup' }}
          </h1>
          <p class="text-slate-500 text-lg">Complete the following steps to set up your group benefits</p>
        </div>

        <!-- Loading -->
        <div *ngIf="store.loading()" class="flex justify-center py-12">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <!-- Workflow Overview -->
        <div *ngIf="store.workflow() as workflow" class="space-y-6">
          <!-- Ownership legend -->
          <div class="flex flex-wrap items-center justify-center gap-4 mb-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
              <mat-icon style="font-size:14px;width:14px;height:14px;">person</mat-icon>
              Broker tasks
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
              <mat-icon style="font-size:14px;width:14px;height:14px;">business</mat-icon>
              Employer tasks
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600">
              <mat-icon style="font-size:14px;width:14px;height:14px;">group</mat-icon>
              Shared tasks
            </span>
          </div>

          <!-- Progress summary -->
          <div class="card p-6 mb-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 class="text-lg font-bold text-slate-900">Setup Progress</h2>
                <p class="text-slate-500 mt-0.5">
                  <span class="font-bold text-indigo-600">{{ store.completedCount() }}</span> of {{ store.sortedSteps().length }} steps completed
                </p>
              </div>
              <div class="w-full sm:w-64">
                <div class="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500 ease-out"
                       style="background: linear-gradient(90deg, #4338ca, #4f46e5, #818cf8);"
                       [style.width.%]="store.progressPercent()"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step cards -->
          <div class="grid gap-3">
            <app-step-overview-card
              *ngFor="let info of store.stepStatuses()"
              [step]="info.step"
              [stepName]="store.getStepName(info.step.step_id)"
              [isLocked]="info.isLocked"
              [isRoleRestricted]="info.isRoleRestricted"
              [isNextStep]="info.isNextStep"
              [blockerText]="info.blockerText"
              [ownershipLabel]="info.ownershipLabel"
              [class]="(info.isLocked || info.isRoleRestricted) ? 'cursor-not-allowed' : 'cursor-pointer'"
              (click)="onStepClick(info)">
            </app-step-overview-card>
          </div>

          <!-- Action buttons -->
          <div class="flex justify-center gap-4 mt-10">
            <button mat-flat-button color="primary" (click)="continueSetup()"
                    style="border-radius: 10px; padding: 0 28px; height: 48px; font-size: 15px;">
              <mat-icon>play_arrow</mat-icon>
              Continue Setup
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
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    // Read clientId from path param (not query param)
    const clientId = this.route.parent?.snapshot.paramMap.get('clientId')
      || this.route.snapshot.paramMap.get('clientId');
    if (clientId) {
      this.store.setUserRole(this.auth.userRole());
      this.loadData(clientId);
    }
  }

  loadData(clientId: string): void {
    this.store.setLoading(true);
    forkJoin({
      workflow: this.service.getWorkflow(clientId),
      client: this.service.getClient(clientId),
    }).subscribe({
      next: ({ workflow, client }) => {
        this.store.setWorkflow(workflow);
        this.store.setClient(client);
        this.store.setLoading(false);
      },
      error: () => {
        this.store.setLoading(false);
      },
    });
  }

  onStepClick(info: StepStatusInfo): void {
    if (info.isLocked || info.isRoleRestricted) return;
    const workflow = this.store.workflow();
    if (workflow) {
      this.router.navigate(['/workflow', workflow.client_id], { queryParams: { step: info.step.step_id } });
    }
  }

  continueSetup(): void {
    const workflow = this.store.workflow();
    if (!workflow) return;
    const next = this.store.nextAvailableStep();
    const stepId = next ? next.step.step_id : workflow.current_step_id || this.store.sortedSteps()[0]?.step_id;
    if (stepId) {
      this.router.navigate(['/workflow', workflow.client_id], { queryParams: { step: stepId } });
    }
  }
}
