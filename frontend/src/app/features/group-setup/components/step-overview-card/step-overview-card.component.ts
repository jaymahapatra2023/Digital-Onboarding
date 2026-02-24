import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { WorkflowStepInstance } from '../../../../core/models/workflow.model';

@Component({
  selector: 'app-step-overview-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTooltipModule, StatusBadgeComponent],
  template: `
    <mat-card [class]="cardClasses"
              [matTooltip]="isRoleRestricted ? 'This step requires ' + restrictedRoleText + ' access' : ''"
              matTooltipPosition="above">
      <mat-card-content class="flex items-center gap-4 p-4">
        <!-- Step number / icon -->
        <div class="flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold flex-shrink-0"
             [class]="circleClass">
          <mat-icon *ngIf="step.status === 'COMPLETED'" style="font-size:18px;width:18px;height:18px;">check</mat-icon>
          <mat-icon *ngIf="isLocked && step.status !== 'COMPLETED'" style="font-size:18px;width:18px;height:18px;">lock</mat-icon>
          <span *ngIf="!isLocked && step.status !== 'COMPLETED'">{{ step.step_order }}</span>
        </div>

        <!-- Label + subtitle -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-semibold" [class]="isLocked || isRoleRestricted ? 'text-slate-400' : 'text-slate-800'">
              {{ stepName }}
            </p>
            <!-- Ownership badge -->
            <span *ngIf="ownershipLabel"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  [class]="ownershipLabel.color">
              <mat-icon style="font-size:12px;width:12px;height:12px;">{{ ownershipLabel.icon }}</mat-icon>
              {{ ownershipLabel.text }}
            </span>
          </div>
          <!-- Blocker text or role restriction text -->
          <p *ngIf="isLocked && blockerText" class="text-xs text-orange-500 mt-0.5">
            <mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle;" class="mr-0.5">warning</mat-icon>
            {{ blockerText }}
          </p>
          <p *ngIf="isRoleRestricted && !isLocked" class="text-xs text-slate-400 mt-0.5">
            <mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle;" class="mr-0.5">person_off</mat-icon>
            Assigned to {{ restrictedRoleText }}
          </p>
        </div>

        <app-status-badge [status]="step.status"></app-status-badge>

        <!-- Next step indicator or chevron -->
        <mat-icon *ngIf="isNextStep && !isRoleRestricted" class="text-indigo-500 animate-pulse" style="font-size:20px;width:20px;height:20px;">arrow_forward</mat-icon>
        <mat-icon *ngIf="!isNextStep" class="text-slate-300" style="font-size:20px;width:20px;height:20px;">chevron_right</mat-icon>
      </mat-card-content>
    </mat-card>
  `,
})
export class StepOverviewCardComponent {
  @Input() step!: WorkflowStepInstance;
  @Input() stepName: string = '';
  @Input() isLocked: boolean = false;
  @Input() isRoleRestricted: boolean = false;
  @Input() isNextStep: boolean = false;
  @Input() blockerText: string = '';
  @Input() ownershipLabel: { text: string; icon: string; color: string } | null = null;

  get restrictedRoleText(): string {
    const roles = this.step.allowed_roles || [];
    return roles.map(r => r.charAt(0) + r.slice(1).toLowerCase()).join(', ') || 'another role';
  }

  get cardClasses(): string {
    const base = 'transition-all';
    if (this.isLocked) return `${base} opacity-60`;
    if (this.isRoleRestricted) return `${base} opacity-50`;
    if (this.isNextStep) return `${base} ring-2 ring-indigo-200 hover:shadow-md hover:-translate-y-0.5`;
    return `${base} hover:shadow-md hover:-translate-y-0.5`;
  }

  get circleClass(): string {
    if (this.isLocked) return 'bg-slate-100 text-slate-300';
    if (this.isRoleRestricted) return 'bg-slate-100 text-slate-300';
    switch (this.step.status) {
      case 'COMPLETED': return 'bg-green-100 text-green-600';
      case 'IN_PROGRESS': return 'bg-indigo-600 text-white';
      case 'SKIPPED': return 'bg-purple-100 text-purple-600';
      default: return 'bg-slate-100 text-slate-400';
    }
  }
}
