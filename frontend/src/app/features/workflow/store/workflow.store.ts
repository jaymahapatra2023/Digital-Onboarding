import { Injectable, signal, computed } from '@angular/core';
import { WorkflowInstance, WorkflowStepInstance, WorkflowStatus, StepStatus } from '../../../core/models/workflow.model';
import { Client } from '../../../core/models/client.model';

@Injectable({ providedIn: 'root' })
export class WorkflowStore {
  private _workflow = signal<WorkflowInstance | null>(null);
  private _client = signal<Client | null>(null);
  private _currentStepId = signal<string>('');
  private _loading = signal<boolean>(false);
  private _saving = signal<boolean>(false);
  private _userRole = signal<string | null>(null);
  private _submissionPayload = signal<Record<string, any> | null>(null);

  workflow = this._workflow.asReadonly();
  client = this._client.asReadonly();
  currentStepId = this._currentStepId.asReadonly();
  loading = this._loading.asReadonly();
  saving = this._saving.asReadonly();
  submissionPayload = this._submissionPayload.asReadonly();

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

  isCurrentStepRoleRestricted = computed(() => {
    const step = this.currentStep();
    const role = this._userRole();
    if (!step || !role) return false;
    const allowed = step.allowed_roles || [];
    return allowed.length > 0 && !allowed.includes(role);
  });

  isWorkflowSubmitted = computed(() => {
    const wf = this._workflow();
    return wf?.status === WorkflowStatus.COMPLETED;
  });

  setWorkflow(workflow: WorkflowInstance | null): void {
    this._workflow.set(workflow);
    if (workflow?.current_step_id) {
      this._currentStepId.set(workflow.current_step_id);
    }
  }

  setClient(client: Client | null): void {
    this._client.set(client);
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

  setUserRole(role: string | null): void {
    this._userRole.set(role);
  }

  getStepData(stepId: string): Record<string, any> | null {
    const step = this.sortedSteps().find(s => s.step_id === stepId);
    return step?.data ? (step.data as Record<string, any>) : null;
  }

  updateStepData(stepId: string, data: Record<string, any>): void {
    const wf = this._workflow();
    if (!wf) return;
    const updated = {
      ...wf,
      step_instances: wf.step_instances.map(s =>
        s.step_id === stepId ? { ...s, data } : s
      ),
    };
    this._workflow.set(updated);
  }

  updateWorkflowStatus(status: WorkflowStatus): void {
    const wf = this._workflow();
    if (!wf) return;
    this._workflow.set({ ...wf, status });
  }

  setSubmissionPayload(payload: Record<string, any> | null): void {
    this._submissionPayload.set(payload);
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

  // --- sessionStorage draft persistence ---

  persistDraft(clientId: string, stepId: string, data: Record<string, any>): void {
    try {
      sessionStorage.setItem(`draft_${clientId}_${stepId}`, JSON.stringify(data));
    } catch { /* quota exceeded — silently ignore */ }
  }

  restoreDraft(clientId: string, stepId: string): Record<string, any> | null {
    try {
      const raw = sessionStorage.getItem(`draft_${clientId}_${stepId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  clearDraft(clientId: string, stepId: string): void {
    sessionStorage.removeItem(`draft_${clientId}_${stepId}`);
  }

  clearAllDrafts(clientId: string): void {
    const prefix = `draft_${clientId}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
  }
}
