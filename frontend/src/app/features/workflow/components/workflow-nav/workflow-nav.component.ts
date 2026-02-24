import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WorkflowStepInstance } from '../../../../core/models/workflow.model';
import { STEP_NAMES } from '../../steps/step-registry';
import { getOwnershipLabel } from '../../../group-setup/store/group-setup.store';

@Component({
  selector: 'app-workflow-nav',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatTooltipModule],
  template: `
    <nav class="h-full bg-white border-r border-gray-200 w-64 overflow-y-auto">
      <div class="px-5 pt-5 pb-3 border-b border-gray-100">
        <h3 class="font-bold text-slate-900">Setup Steps</h3>
        <p class="text-xs text-slate-400 mt-0.5">{{ completedCount }} of {{ steps.length }} completed</p>
      </div>
      <div class="p-3">
        <button *ngFor="let step of steps; let i = index"
                (click)="stepSelect.emit(step.step_id)"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left transition-colors border-0 bg-transparent"
                [class]="getButtonClass(step)"
                [matTooltip]="isStepRestricted(step) ? 'This step requires ' + getRestrictedRoleText(step) + ' access' : ''"
                matTooltipPosition="right">
          <!-- Numbered pill -->
          <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                [class]="getPillClass(step)">
            <mat-icon *ngIf="step.status === 'COMPLETED'" style="font-size:16px;width:16px;height:16px;">check</mat-icon>
            <mat-icon *ngIf="isStepRestricted(step) && step.status !== 'COMPLETED'" style="font-size:14px;width:14px;height:14px;">lock</mat-icon>
            <span *ngIf="step.status !== 'COMPLETED' && !isStepRestricted(step)">{{ i + 1 }}</span>
          </span>
          <!-- Label + status + ownership badge -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <p class="text-sm font-medium truncate"
                 [class]="getLabelClass(step)">
                {{ getStepName(step.step_id) }}
              </p>
              <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                    [class]="getOwnership(step).color">
                {{ getOwnership(step).text }}
              </span>
            </div>
            <p class="text-xs" [class]="getStatusClass(step)">
              {{ isStepRestricted(step) ? getRestrictedRoleText(step) : (step.status === 'PENDING' ? 'Not started' : (step.status | titlecase)) }}
            </p>
          </div>
        </button>
      </div>
    </nav>
  `,
})
export class WorkflowNavComponent {
  @Input() steps: WorkflowStepInstance[] = [];
  @Input() currentStepId: string = '';
  @Input() userRole: string = '';
  @Output() stepSelect = new EventEmitter<string>();

  get completedCount(): number {
    return this.steps.filter(s => s.status === 'COMPLETED').length;
  }

  getStepName(stepId: string): string {
    return STEP_NAMES[stepId] || stepId;
  }

  getOwnership(step: WorkflowStepInstance): { text: string; icon: string; color: string } {
    return getOwnershipLabel(step.allowed_roles || []);
  }

  isStepRestricted(step: WorkflowStepInstance): boolean {
    const allowed = step.allowed_roles || [];
    return allowed.length > 0 && !!this.userRole && !allowed.includes(this.userRole);
  }

  getRestrictedRoleText(step: WorkflowStepInstance): string {
    const roles = step.allowed_roles || [];
    return roles.map(r => r.charAt(0) + r.slice(1).toLowerCase()).join(', ') || 'another role';
  }

  getButtonClass(step: WorkflowStepInstance): string {
    if (this.isStepRestricted(step)) return 'opacity-50 cursor-default';
    if (step.step_id === this.currentStepId) return 'bg-indigo-50 cursor-pointer';
    return 'hover:bg-slate-50 cursor-pointer';
  }

  getLabelClass(step: WorkflowStepInstance): string {
    if (this.isStepRestricted(step)) return 'text-slate-400';
    if (step.step_id === this.currentStepId) return 'text-indigo-700';
    return 'text-slate-700';
  }

  getPillClass(step: WorkflowStepInstance): string {
    if (step.status === 'COMPLETED') {
      return 'bg-green-100 text-green-600';
    }
    if (this.isStepRestricted(step)) {
      return 'bg-slate-100 text-slate-300';
    }
    if (step.step_id === this.currentStepId) {
      return 'bg-indigo-600 text-white';
    }
    if (step.status === 'IN_PROGRESS') {
      return 'bg-blue-100 text-blue-600';
    }
    if (step.status === 'SKIPPED') {
      return 'bg-purple-100 text-purple-600';
    }
    return 'bg-slate-100 text-slate-400';
  }

  getStatusClass(step: WorkflowStepInstance): string {
    if (this.isStepRestricted(step)) return 'text-slate-400';
    switch (step.status) {
      case 'COMPLETED': return 'text-green-600';
      case 'IN_PROGRESS': return 'text-blue-600';
      case 'SKIPPED': return 'text-purple-500';
      default: return 'text-slate-400';
    }
  }
}
