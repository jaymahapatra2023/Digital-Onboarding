import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  ClientListResponse, ClientListParams, Client, ClientAccess, ClientAccessCreate,
  CaseReadiness, TimelineResponse,
} from '../../../core/models/client.model';
import { User } from '../../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class SoldCasesService {
  constructor(private api: ApiService) {}

  getClients(params: ClientListParams): Observable<ClientListResponse> {
    return this.api.get<ClientListResponse>('/clients', params as any);
  }

  getClient(clientId: string): Observable<Client> {
    return this.api.get<Client>(`/clients/${clientId}`);
  }

  getAccess(clientId: string): Observable<ClientAccess[]> {
    return this.api.get<ClientAccess[]>(`/clients/${clientId}/access`);
  }

  createAccess(clientId: string, data: ClientAccessCreate): Observable<ClientAccess> {
    return this.api.post<ClientAccess>(`/clients/${clientId}/access`, data);
  }

  updateAccess(clientId: string, accessId: string, data: ClientAccessCreate): Observable<ClientAccess> {
    return this.api.put<ClientAccess>(`/clients/${clientId}/access/${accessId}`, data);
  }

  deleteAccess(clientId: string, accessId: string): Observable<void> {
    return this.api.delete<void>(`/clients/${clientId}/access/${accessId}`);
  }

  resendInvitation(clientId: string, accessId: string): Observable<ClientAccess> {
    return this.api.post<ClientAccess>(`/clients/${clientId}/access/${accessId}/resend-invitation`);
  }

  unlockAccess(clientId: string, accessId: string): Observable<ClientAccess> {
    return this.api.post<ClientAccess>(`/clients/${clientId}/access/${accessId}/unlock`);
  }

  searchUsers(query: string): Observable<User[]> {
    return this.api.get<User[]>('/users/search', { q: query });
  }

  startOnlineSetup(clientId: string): Observable<any> {
    return this.api.post(`/clients/${clientId}/workflow/start`);
  }

  startOfflineSetup(clientId: string): Observable<any> {
    return this.api.post(`/clients/${clientId}/workflow/offline`);
  }

  checkReadiness(clientId: string): Observable<CaseReadiness> {
    return this.api.get<CaseReadiness>(`/clients/${clientId}/readiness`);
  }

  getTimeline(clientId: string, limit = 50, offset = 0, eventType?: string): Observable<TimelineResponse> {
    const params: any = { limit, offset };
    if (eventType) params.event_type = eventType;
    return this.api.get<TimelineResponse>(`/clients/${clientId}/timeline`, params);
  }

  assignToMe(clientId: string): Observable<Client> {
    return this.api.post<Client>(`/clients/${clientId}/assign-me`);
  }
}
