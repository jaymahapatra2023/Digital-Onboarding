export enum WorkflowStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OFFLINE = 'OFFLINE',
  OFFLINE_SUBMITTED = 'OFFLINE_SUBMITTED',
  OFFLINE_IN_REVIEW = 'OFFLINE_IN_REVIEW',
}

export enum StepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export interface WorkflowStepDefinition {
  step_id: string;
  order: number;
  name: string;
  allowed_roles: string[];
  required: boolean;
}

export interface WorkflowStepInstance {
  id: string;
  workflow_instance_id: string;
  step_id: string;
  step_order: number;
  status: StepStatus;
  assigned_to_user_id?: string;
  assigned_role?: string;
  allowed_roles?: string[];
  data: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  last_saved_at?: string;
}

export interface WorkflowInstance {
  id: string;
  client_id: string;
  workflow_definition_id: string;
  status: WorkflowStatus;
  current_step_id?: string;
  is_offline: boolean;
  started_at?: string;
  completed_at?: string;
  step_instances: WorkflowStepInstance[];
}
