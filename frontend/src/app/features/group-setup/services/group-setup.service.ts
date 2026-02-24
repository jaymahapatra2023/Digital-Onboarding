import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { WorkflowInstance } from '../../../core/models/workflow.model';
import { Client } from '../../../core/models/client.model';

@Injectable({ providedIn: 'root' })
export class GroupSetupService {
  constructor(private api: ApiService) {}

  getWorkflow(clientId: string): Observable<WorkflowInstance> {
    return this.api.get<WorkflowInstance>(`/clients/${clientId}/workflow`);
  }

  getClient(clientId: string): Observable<Client> {
    return this.api.get<Client>(`/clients/${clientId}`);
  }

  startOnlineSetup(clientId: string): Observable<WorkflowInstance> {
    return this.api.post<WorkflowInstance>(`/clients/${clientId}/workflow/start`);
  }

  startOfflineSetup(clientId: string): Observable<WorkflowInstance> {
    return this.api.post<WorkflowInstance>(`/clients/${clientId}/workflow/offline`);
  }
}
