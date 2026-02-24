import { Injectable, signal } from '@angular/core';
import { WorkflowInstance } from '../../../core/models/workflow.model';

@Injectable({ providedIn: 'root' })
export class GroupSetupStore {
  private _workflow = signal<WorkflowInstance | null>(null);
  private _loading = signal<boolean>(false);

  workflow = this._workflow.asReadonly();
  loading = this._loading.asReadonly();

  setWorkflow(workflow: WorkflowInstance | null): void {
    this._workflow.set(workflow);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }
}
