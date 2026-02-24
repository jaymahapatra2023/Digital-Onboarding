import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface StepperStep {
  stepId: string;
  name: string;
  order: number;
  status: string;
  isAccessible: boolean;
  isEnabled: boolean;
}

@Component({
  selector: 'app-workflow-stepper',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <nav class="workflow-stepper">
      <!-- Desktop: horizontal -->
      <ol class="hidden md:flex items-center w-full">
        <li *ngFor="let step of steps; let last = last"
            class="flex items-center" [class.flex-1]="!last">
          <button
            (click)="onStepClick(step)"
            [disabled]="!step.isEnabled"
            [matTooltip]="step.name"
            class="flex items-center gap-2 group border-0 bg-transparent"
            [class.opacity-50]="!step.isEnabled"
            [class.cursor-pointer]="step.isEnabled"
            [class.cursor-not-allowed]="!step.isEnabled">
            <span [class]="getStepCircleClass(step)" class="flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold shrink-0 transition-all">
              <mat-icon *ngIf="step.status === 'COMPLETED'" style="font-size:16px;width:16px;height:16px;">check</mat-icon>
              <mat-icon *ngIf="step.status === 'SKIPPED'" style="font-size:16px;width:16px;height:16px;">skip_next</mat-icon>
              <span *ngIf="step.status !== 'COMPLETED' && step.status !== 'SKIPPED'">{{ step.order }}</span>
            </span>
            <span class="text-sm font-medium hidden lg:inline" [class]="getStepTextClass(step)">{{ step.name }}</span>
          </button>
          <div *ngIf="!last" class="flex-1 h-0.5 mx-3 rounded-full transition-colors" [class]="getConnectorClass(step)"></div>
        </li>
      </ol>

      <!-- Mobile: vertical -->
      <ol class="md:hidden space-y-2 p-2">
        <li *ngFor="let step of steps">
          <button
            (click)="onStepClick(step)"
            [disabled]="!step.isEnabled"
            class="flex items-center gap-3 w-full p-2.5 rounded-lg transition-colors border-0 bg-transparent"
            [class.bg-indigo-50]="step.stepId === currentStepId"
            [class.hover:bg-slate-50]="step.stepId !== currentStepId"
            [class.opacity-50]="!step.isEnabled">
            <span [class]="getStepCircleClass(step)" class="flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold shrink-0">
              <mat-icon *ngIf="step.status === 'COMPLETED'" style="font-size:16px;width:16px;height:16px;">check</mat-icon>
              <mat-icon *ngIf="step.status === 'SKIPPED'" style="font-size:16px;width:16px;height:16px;">skip_next</mat-icon>
              <span *ngIf="step.status !== 'COMPLETED' && step.status !== 'SKIPPED'">{{ step.order }}</span>
            </span>
            <span class="text-sm font-medium" [class]="getStepTextClass(step)">{{ step.name }}</span>
          </button>
        </li>
      </ol>
    </nav>
  `,
})
export class WorkflowStepperComponent {
  @Input() steps: StepperStep[] = [];
  @Input() currentStepId: string = '';
  @Output() stepSelect = new EventEmitter<string>();

  onStepClick(step: StepperStep): void {
    if (step.isEnabled) {
      this.stepSelect.emit(step.stepId);
    }
  }

  getStepCircleClass(step: StepperStep): string {
    if (step.status === 'COMPLETED') return 'bg-green-100 text-green-600';
    if (step.status === 'IN_PROGRESS' || step.stepId === this.currentStepId) return 'bg-indigo-600 text-white';
    if (step.status === 'SKIPPED') return 'bg-purple-100 text-purple-600';
    return 'bg-slate-100 text-slate-400';
  }

  getStepTextClass(step: StepperStep): string {
    if (step.status === 'COMPLETED') return 'text-green-700';
    if (step.status === 'IN_PROGRESS' || step.stepId === this.currentStepId) return 'text-indigo-700';
    return 'text-slate-500';
  }

  getConnectorClass(step: StepperStep): string {
    if (step.status === 'COMPLETED') return 'bg-green-400';
    return 'bg-slate-200';
  }
}
