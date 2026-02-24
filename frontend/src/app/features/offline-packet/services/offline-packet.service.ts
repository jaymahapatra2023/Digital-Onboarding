import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { OfflinePacketStatusResponse } from '../../../core/models/offline-packet.model';

@Injectable({ providedIn: 'root' })
export class OfflinePacketService {
  constructor(private api: ApiService) {}

  getPacketStatus(clientId: string): Observable<OfflinePacketStatusResponse> {
    return this.api.get<OfflinePacketStatusResponse>(`/clients/${clientId}/offline-packet/status`);
  }

  submitPacket(clientId: string): Observable<OfflinePacketStatusResponse> {
    return this.api.post<OfflinePacketStatusResponse>(`/clients/${clientId}/offline-packet/submit`);
  }

  getTemplateDownloadUrl(clientId: string, documentType: string): string {
    return `/clients/${clientId}/offline-packet/templates/${documentType}`;
  }
}
