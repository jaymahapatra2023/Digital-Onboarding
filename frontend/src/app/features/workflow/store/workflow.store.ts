import { Injectable, signal, computed } from '@angular/core';
import { WorkflowInstance, WorkflowStepInstance, StepStatus } from '../../../core/models/workflow.model';

@Injectable({ providedIn: 'root' })
export class WorkflowStore {
  private _workflow = signal<WorkflowInstance | null>(null);
  private _currentStepId = signal<string>('');
  private _loading = signal<boolean>(false);
  private _saving = signal<boolean>(false);

  workflow = this._workflow.asReadonly();
  currentStepId = this._currentStepId.asReadonly();
  loading = this._loading.asReadonly();
  saving = this._saving.asReadonly();

  sortedSteps = computed(() => {
    const wf = this._workflow();
    if (!wf) return [];
    return [...wf.step_instances].sort((a, b) => a.step_order - b.step_order);
  });

  currentStep = computed(() => {
    const stepId = this._currentStepId();
    return this.sortedSteps().find(s => s.step_id === stepId) || null;
  });

  completedCount = computed(() =>
    this.sortedSteps().filter(s => s.status === 'COMPLETED').length
  );

  progressPercent = computed(() => {
    const steps = this.sortedSteps();
    return steps.length > 0 ? (this.completedCount() / steps.length) * 100 : 0;
  });

  setWorkflow(workflow: WorkflowInstance | null): void {
    this._workflow.set(workflow);
    if (workflow?.current_step_id) {
      this._currentStepId.set(workflow.current_step_id);
    }
  }

  setCurrentStepId(stepId: string): void {
    this._currentStepId.set(stepId);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setSaving(saving: boolean): void {
    this._saving.set(saving);
  }

  updateStepStatus(stepId: string, status: StepStatus): void {
    const wf = this._workflow();
    if (!wf) return;
    const updated = {
      ...wf,
      step_instances: wf.step_instances.map(s =>
        s.step_id === stepId ? { ...s, status } : s
      ),
    };
    this._workflow.set(updated);
  }
}
