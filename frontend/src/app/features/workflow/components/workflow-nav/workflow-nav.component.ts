import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { WorkflowStepInstance } from '../../../../core/models/workflow.model';
import { STEP_NAMES } from '../../steps/step-registry';

@Component({
  selector: 'app-workflow-nav',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule],
  template: `
    <nav class="h-full bg-white border-r border-gray-200 w-64 overflow-y-auto">
      <div class="px-5 pt-5 pb-3 border-b border-gray-100">
        <h3 class="font-bold text-slate-900">Setup Steps</h3>
        <p class="text-xs text-slate-400 mt-0.5">{{ completedCount }} of {{ steps.length }} completed</p>
      </div>
      <div class="p-3">
        <button *ngFor="let step of steps; let i = index"
                (click)="stepSelect.emit(step.step_id)"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left transition-colors cursor-pointer border-0 bg-transparent"
                [class]="step.step_id === currentStepId ? 'bg-indigo-50' : 'hover:bg-slate-50'">
          <!-- Numbered pill -->
          <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                [class]="getPillClass(step)">
            <mat-icon *ngIf="step.status === 'COMPLETED'" style="font-size:16px;width:16px;height:16px;">check</mat-icon>
            <span *ngIf="step.status !== 'COMPLETED'">{{ i + 1 }}</span>
          </span>
          <!-- Label + status -->
          <div class="min-w-0">
            <p class="text-sm font-medium truncate"
               [class]="step.step_id === currentStepId ? 'text-indigo-700' : 'text-slate-700'">
              {{ getStepName(step.step_id) }}
            </p>
            <p class="text-xs" [class]="getStatusClass(step)">
              {{ step.status === 'PENDING' ? 'Not started' : (step.status | titlecase) }}
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
  @Output() stepSelect = new EventEmitter<string>();

  get completedCount(): number {
    return this.steps.filter(s => s.status === 'COMPLETED').length;
  }

  getStepName(stepId: string): string {
    return STEP_NAMES[stepId] || stepId;
  }

  getPillClass(step: WorkflowStepInstance): string {
    if (step.status === 'COMPLETED') {
      return 'bg-green-100 text-green-600';
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
    switch (step.status) {
      case 'COMPLETED': return 'text-green-600';
      case 'IN_PROGRESS': return 'text-blue-600';
      case 'SKIPPED': return 'text-purple-500';
      default: return 'text-slate-400';
    }
  }
}
