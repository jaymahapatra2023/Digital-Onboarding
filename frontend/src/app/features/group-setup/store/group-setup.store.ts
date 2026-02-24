import { Injectable, signal, computed } from '@angular/core';
import { WorkflowInstance, WorkflowStepInstance, StepStatus } from '../../../core/models/workflow.model';
import { Client } from '../../../core/models/client.model';

export interface StepStatusInfo {
  step: WorkflowStepInstance;
  isLocked: boolean;
  blockerText: string;
  isNextStep: boolean;
  isRoleRestricted: boolean;
  ownershipLabel: { text: string; icon: string; color: string };
}

export function getOwnershipLabel(allowedRoles: string[]): { text: string; icon: string; color: string } {
  if (allowedRoles.length === 1 && allowedRoles[0] === 'EMPLOYER') {
    return { text: 'Employer', icon: 'business', color: 'text-amber-600 bg-amber-50' };
  }
  if (allowedRoles.length === 1 && allowedRoles[0] === 'BROKER') {
    return { text: 'Broker', icon: 'person', color: 'text-indigo-600 bg-indigo-50' };
  }
  if (!allowedRoles.includes('EMPLOYER')) {
    return { text: 'Broker', icon: 'person', color: 'text-indigo-600 bg-indigo-50' };
  }
  return { text: 'Shared', icon: 'group', color: 'text-slate-600 bg-slate-50' };
}

@Injectable({ providedIn: 'root' })
export class GroupSetupStore {
  private _workflow = signal<WorkflowInstance | null>(null);
  private _client = signal<Client | null>(null);
  private _loading = signal<boolean>(false);
  private _userRole = signal<string | null>(null);

  workflow = this._workflow.asReadonly();
  client = this._client.asReadonly();
  loading = this._loading.asReadonly();

  sortedSteps = computed(() => {
    const wf = this._workflow();
    if (!wf) return [];
    return [...wf.step_instances].sort((a, b) => a.step_order - b.step_order);
  });

  stepStatuses = computed<StepStatusInfo[]>(() => {
    const steps = this.sortedSteps();
    const userRole = this._userRole();
    let foundNextStep = false;

    return steps.map((step, index) => {
      const isDone = step.status === StepStatus.COMPLETED || step.status === StepStatus.SKIPPED || step.status === StepStatus.NOT_APPLICABLE;

      // A step is locked if PENDING and a preceding required step is not yet done
      let isLocked = false;
      let blockerText = '';
      if (step.status === StepStatus.PENDING) {
        for (let i = 0; i < index; i++) {
          const prev = steps[i];
          const prevDone = prev.status === StepStatus.COMPLETED || prev.status === StepStatus.SKIPPED || prev.status === StepStatus.NOT_APPLICABLE;
          if (!prevDone) {
            isLocked = true;
            blockerText = `Complete ${this.getStepName(prev.step_id)} first`;
            break;
          }
        }
      }

      // First actionable (not done, not locked) step
      const isActionable = !isDone && !isLocked;
      let isNextStep = false;
      if (isActionable && !foundNextStep) {
        isNextStep = true;
        foundNextStep = true;
      }

      // Role restriction
      const allowedRoles = step.allowed_roles || [];
      const isRoleRestricted = allowedRoles.length > 0 && userRole != null && !allowedRoles.includes(userRole);

      const ownershipLabel = getOwnershipLabel(allowedRoles);

      return { step, isLocked, blockerText, isNextStep, isRoleRestricted, ownershipLabel };
    });
  });

  nextAvailableStep = computed(() => {
    return this.stepStatuses().find(s => s.isNextStep) || null;
  });

  completedCount = computed(() =>
    this.sortedSteps().filter(s => s.status === StepStatus.COMPLETED).length
  );

  progressPercent = computed(() => {
    const steps = this.sortedSteps();
    return steps.length > 0 ? (this.completedCount() / steps.length) * 100 : 0;
  });

  private stepNameMap: Record<string, string> = {
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

  getStepName(stepId: string): string {
    return this.stepNameMap[stepId] || stepId;
  }

  setWorkflow(workflow: WorkflowInstance | null): void {
    this._workflow.set(workflow);
  }

  setClient(client: Client | null): void {
    this._client.set(client);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setUserRole(role: string | null): void {
    this._userRole.set(role);
  }
}
