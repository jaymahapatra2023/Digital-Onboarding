import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { FileUploadModalComponent } from '../../../sold-cases/components/file-upload-modal/file-upload-modal.component';
import { OfflinePacketService } from '../../services/offline-packet.service';
import { OfflinePacketStore } from '../../store/offline-packet.store';
import { WorkflowService } from '../../../workflow/services/workflow.service';
import { FileUploadService } from '../../../../core/services/file-upload.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-offline-packet-hub',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatTooltipModule, StatusBadgeComponent,
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <button mat-button (click)="goBack()" class="text-slate-500 -ml-2 mb-2">
            <mat-icon>arrow_back</mat-icon> Back to Clients
          </button>
          <h1 class="text-2xl font-bold text-slate-900">Offline Packet</h1>
          <p class="text-slate-500 mt-1">Upload required documents and submit for review</p>
        </div>
        <app-status-badge [status]="store.status()"></app-status-badge>
      </div>

      <!-- Loading -->
      <div *ngIf="store.loading()" class="flex justify-center py-12">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!store.loading()" class="space-y-6">
        <!-- Template Downloads -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">
            <mat-icon class="align-middle mr-2 text-slate-400">download</mat-icon>
            Download Blank Templates
          </h2>
          <p class="text-slate-500 text-sm mb-4">Download, fill out, and upload the completed forms below.</p>
          <div class="flex flex-wrap gap-3">
            <button *ngFor="let ft of templateTypes" mat-stroked-button
                    (click)="downloadTemplate(ft.type)"
                    class="text-slate-600">
              <mat-icon class="mr-1">download</mat-icon>
              {{ ft.label }}
            </button>
          </div>
        </div>

        <!-- File Matrix -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-slate-900 mb-4">
            <mat-icon class="align-middle mr-2 text-slate-400">checklist</mat-icon>
            Document Checklist
          </h2>

          <div class="divide-y divide-slate-100">
            <div *ngFor="let file of store.files()"
                 class="flex items-center justify-between py-4">
              <div class="flex items-center gap-3">
                <mat-icon [class]="file.uploaded ? 'text-green-500' : (file.required ? 'text-red-400' : 'text-slate-300')">
                  {{ file.uploaded ? 'check_circle' : (file.required ? 'error_outline' : 'radio_button_unchecked') }}
                </mat-icon>
                <div>
                  <span class="font-medium text-slate-800">{{ file.label }}</span>
                  <span *ngIf="file.required" class="ml-2 text-xs text-red-500 font-medium">Required</span>
                  <span *ngIf="!file.required" class="ml-2 text-xs text-slate-400 font-medium">Optional</span>
                  <p *ngIf="file.uploaded && file.file_name" class="text-sm text-slate-500 mt-0.5">
                    {{ file.file_name }}
                  </p>
                  <p *ngIf="!file.uploaded" class="text-sm text-slate-400 mt-0.5">Not uploaded</p>
                </div>
              </div>
              <button mat-stroked-button (click)="openUpload(file.file_type)"
                      [disabled]="store.isSubmitted()"
                      class="text-slate-600">
                <mat-icon class="mr-1">upload_file</mat-icon>
                {{ file.uploaded ? 'Re-upload' : 'Upload' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Submit Section -->
        <div class="card p-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Submit for Review</h2>
              <p *ngIf="!store.isComplete() && !store.isSubmitted()" class="text-sm text-amber-600 mt-1">
                <mat-icon class="align-middle text-amber-500" style="font-size:16px;width:16px;height:16px;">warning</mat-icon>
                Missing: {{ store.missingLabels().join(', ') }}
              </p>
              <p *ngIf="store.isComplete() && !store.isSubmitted()" class="text-sm text-green-600 mt-1">
                All required documents uploaded. Ready to submit.
              </p>
              <p *ngIf="store.isSubmitted()" class="text-sm text-indigo-600 mt-1">
                Packet has been submitted for review.
              </p>
            </div>
            <button mat-flat-button color="primary"
                    [disabled]="!store.isComplete() || store.isSubmitted() || store.submitting()"
                    [matTooltip]="!store.isComplete() ? 'Upload all required documents first' : ''"
                    (click)="onSubmit()"
                    style="border-radius: 10px; padding: 0 24px;">
              <mat-icon class="mr-1">send</mat-icon>
              {{ store.submitting() ? 'Submitting...' : 'Submit for Review' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OfflinePacketHubComponent implements OnInit {
  clientId = '';

  templateTypes = [
    { type: 'MASTER_APP', label: 'Master Application' },
    { type: 'DATA_GATHERING_TOOL', label: 'Data Gathering Tool' },
    { type: 'CENSUS_TEMPLATE', label: 'Census Template' },
    { type: 'COMMISSION_ACK', label: 'Commission Acknowledgement' },
    { type: 'ENROLLMENT_FORM', label: 'Enrollment Form' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    public store: OfflinePacketStore,
    private packetService: OfflinePacketService,
    private workflowService: WorkflowService,
    private fileUploadService: FileUploadService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('clientId') || '';
    this.loadWorkflowAndStatus();
  }

  loadWorkflowAndStatus(): void {
    this.store.setLoading(true);
    // First, load the workflow to get the instance ID
    this.workflowService.getWorkflow(this.clientId).subscribe({
      next: (workflow) => {
        this.store.setWorkflowInstanceId(workflow.id);
        this.loadStatus();
      },
      error: () => {
        this.store.setLoading(false);
        this.notification.error('Failed to load workflow');
      },
    });
  }

  loadStatus(): void {
    this.packetService.getPacketStatus(this.clientId).subscribe({
      next: (response) => {
        this.store.setPacketStatus(response);
        this.store.setLoading(false);
      },
      error: () => {
        this.store.setLoading(false);
        this.notification.error('Failed to load offline packet status');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/clients']);
  }

  downloadTemplate(documentType: string): void {
    const url = `${environment.apiUrl}/clients/${this.clientId}/offline-packet/templates/${documentType}`;
    window.open(url, '_blank');
  }

  openUpload(fileType: string): void {
    const dialogRef = this.dialog.open(FileUploadModalComponent, {
      width: '500px',
      data: { clientId: this.clientId, preselectedType: fileType },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fileUploadService.upload(
          this.clientId,
          result.file,
          result.file_type,
          result.description,
          this.getWorkflowInstanceId(),
        ).subscribe({
          next: () => {
            this.notification.success('Document uploaded');
            this.loadStatus();
          },
          error: () => this.notification.error('Failed to upload document'),
        });
      }
    });
  }

  onSubmit(): void {
    this.store.setSubmitting(true);
    this.packetService.submitPacket(this.clientId).subscribe({
      next: (response) => {
        this.store.setPacketStatus(response);
        this.store.setSubmitting(false);
        this.notification.success('Offline packet submitted for review');
      },
      error: (err) => {
        this.store.setSubmitting(false);
        this.notification.error(err.error?.detail || 'Failed to submit packet');
      },
    });
  }

  private getWorkflowInstanceId(): string | undefined {
    return this.store.workflowInstanceId() || undefined;
  }
}
