import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { WorkflowStepInstance } from '../../../../core/models/workflow.model';

@Component({
  selector: 'app-step-overview-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, StatusBadgeComponent],
  template: `
    <mat-card class="hover:shadow-md transition-all hover:-translate-y-0.5">
      <mat-card-content class="flex items-center gap-4 p-4">
        <div class="flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold"
             [class]="circleClass">
          <mat-icon *ngIf="step.status === 'COMPLETED'" style="font-size:18px;width:18px;height:18px;">check</mat-icon>
          <span *ngIf="step.status !== 'COMPLETED'">{{ step.step_order }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-800">{{ stepName }}</p>
          <p class="text-sm text-slate-400">{{ step.assigned_role || 'Not assigned' }}</p>
        </div>
        <app-status-badge [status]="step.status"></app-status-badge>
        <mat-icon class="text-slate-300" style="font-size:20px;width:20px;height:20px;">chevron_right</mat-icon>
      </mat-card-content>
    </mat-card>
  `,
})
export class StepOverviewCardComponent {
  @Input() step!: WorkflowStepInstance;
  @Input() stepName: string = '';

  get circleClass(): string {
    switch (this.step.status) {
      case 'COMPLETED': return 'bg-green-100 text-green-600';
      case 'IN_PROGRESS': return 'bg-indigo-600 text-white';
      case 'SKIPPED': return 'bg-purple-100 text-purple-600';
      default: return 'bg-slate-100 text-slate-400';
    }
  }
}
