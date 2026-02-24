import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { WorkflowInstance } from '../../../core/models/workflow.model';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  constructor(private api: ApiService) {}

  getWorkflow(clientId: string): Observable<WorkflowInstance> {
    return this.api.get<WorkflowInstance>(`/clients/${clientId}/workflow`);
  }

  getStepData(clientId: string, stepId: string): Observable<any> {
    return this.api.get(`/clients/${clientId}/workflow/steps/${stepId}`);
  }

  saveStepData(clientId: string, stepId: string, data: Record<string, any>): Observable<any> {
    return this.api.put(`/clients/${clientId}/workflow/steps/${stepId}`, { data });
  }

  completeStep(clientId: string, stepId: string): Observable<any> {
    return this.api.post(`/clients/${clientId}/workflow/steps/${stepId}/complete`);
  }

  skipStep(clientId: string, stepId: string): Observable<any> {
    return this.api.post(`/clients/${clientId}/workflow/steps/${stepId}/skip`);
  }
}
