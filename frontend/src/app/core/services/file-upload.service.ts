import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { Document } from '../models/document.model';

export interface DocumentUploadResponse {
  id: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
}

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  constructor(private api: ApiService) {}

  upload(clientId: string, file: File, fileType: string, description?: string): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    if (description) {
      formData.append('file_description', description);
    }
    return this.api.upload<DocumentUploadResponse>(`/clients/${clientId}/documents`, formData);
  }

  listDocuments(clientId: string): Observable<Document[]> {
    return this.api.get<Document[]>(`/clients/${clientId}/documents`);
  }

  deleteDocument(clientId: string, documentId: string): Observable<void> {
    return this.api.delete<void>(`/clients/${clientId}/documents/${documentId}`);
  }

  downloadDocument(clientId: string, documentId: string): Observable<Blob> {
    return this.api.download(`/clients/${clientId}/documents/${documentId}/download`);
  }
}
