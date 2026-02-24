import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { Client } from '../../../../core/models/client.model';
import { Document } from '../../../../core/models/document.model';
import { FileUploadService } from '../../../../core/services/file-upload.service';

@Component({
  selector: 'app-context-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, StatusBadgeComponent],
  template: `
    <div class="p-5 space-y-6">
      <!-- Client context -->
      <div *ngIf="client">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Client</h3>
        <div class="space-y-3">
          <div>
            <p class="font-semibold text-slate-900">{{ client.client_name }}</p>
            <p class="text-xs text-slate-400">ID: {{ client.unique_id }}</p>
          </div>
          <app-status-badge [status]="client.status"></app-status-badge>
          <div *ngIf="client.primary_address_street" class="text-sm text-slate-600">
            <div class="flex items-start gap-2">
              <mat-icon class="text-slate-400 flex-shrink-0" style="font-size:16px;width:16px;height:16px;margin-top:2px;">location_on</mat-icon>
              <div>
                <p>{{ client.primary_address_street }}</p>
                <p *ngIf="client.primary_address_city">
                  {{ client.primary_address_city }}<span *ngIf="client.primary_address_state">, {{ client.primary_address_state }}</span>
                  {{ client.primary_address_zip }}
                </p>
              </div>
            </div>
          </div>
          <div *ngIf="client.eligible_employees" class="flex items-center gap-2 text-sm text-slate-600">
            <mat-icon class="text-slate-400" style="font-size:16px;width:16px;height:16px;">people</mat-icon>
            {{ client.eligible_employees }} eligible employees
          </div>
        </div>
      </div>

      <!-- Reference documents -->
      <div>
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Documents</h3>
        <div *ngIf="documents.length === 0" class="text-sm text-slate-400 py-4 text-center">
          <mat-icon class="block mx-auto mb-1 text-slate-300" style="font-size:24px;width:24px;height:24px;">folder_open</mat-icon>
          No documents uploaded yet
        </div>
        <div *ngFor="let doc of documents" class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
          <mat-icon class="text-slate-400 flex-shrink-0" style="font-size:18px;width:18px;height:18px;">description</mat-icon>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-700 truncate">{{ doc.file_name }}</p>
            <div class="flex items-center gap-2">
              <span class="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                {{ formatDocType(doc.file_type) }}
              </span>
              <span *ngIf="doc.uploaded_at" class="text-xs text-slate-400">
                {{ doc.uploaded_at | date:'MMM d' }}
              </span>
            </div>
          </div>
          <button mat-icon-button (click)="onDownload(doc)" class="flex-shrink-0"
                  style="width:28px;height:28px;">
            <mat-icon style="font-size:16px;width:16px;height:16px;" class="text-slate-400">download</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ContextPanelComponent implements OnInit {
  @Input() client: Client | null = null;
  @Input() clientId: string = '';

  documents: Document[] = [];

  constructor(private fileUploadService: FileUploadService) {}

  ngOnInit(): void {
    if (this.clientId) {
      this.fileUploadService.listDocuments(this.clientId).subscribe({
        next: (docs) => this.documents = docs,
        error: () => {},
      });
    }
  }

  formatDocType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  onDownload(doc: Document): void {
    this.fileUploadService.downloadDocument(this.clientId, doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }
}
