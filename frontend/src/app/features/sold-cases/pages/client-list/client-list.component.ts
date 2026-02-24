import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';

import { ClientTableComponent } from '../../components/client-table/client-table.component';
import { AssignAccessModalComponent, AccessModalData } from '../../components/assign-access-modal/assign-access-modal.component';
import { DeleteAccessModalComponent } from '../../components/delete-access-modal/delete-access-modal.component';
import { OfflineSetupComponent } from '../../components/offline-setup/offline-setup.component';
import { DocumentsDialogComponent } from '../../components/documents-dialog/documents-dialog.component';
import { ManageAccessDialogComponent } from '../../components/manage-access-dialog/manage-access-dialog.component';
import { FileUploadModalComponent } from '../../components/file-upload-modal/file-upload-modal.component';
import { ReadinessBlockersDialogComponent } from '../../components/readiness-blockers-dialog/readiness-blockers-dialog.component';
import { TimelineDialogComponent } from '../../components/timeline-dialog/timeline-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SoldCasesService } from '../../services/sold-cases.service';
import { SoldCasesStore } from '../../store/sold-cases.store';
import { NotificationService } from '../../../../core/services/notification.service';
import { FileUploadService } from '../../../../core/services/file-upload.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Client, ClientStatus } from '../../../../core/models/client.model';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatSlideToggleModule,
    FormsModule, ClientTableComponent,
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">My Clients</h1>
          <p class="text-slate-500 mt-1">Manage your sold cases and group setup</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="card p-5 mb-6">
        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Search clients</mat-label>
            <input matInput [(ngModel)]="searchTerm" (ngModelChange)="onSearch($event)" placeholder="Search by name or ID...">
            <mat-icon matSuffix class="text-slate-400">search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="sm:w-60">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (ngModelChange)="onStatusFilter($event)">
              <mat-option value="">All Statuses</mat-option>
              <mat-option *ngFor="let status of statuses" [value]="status">
                {{ formatStatus(status) }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-slide-toggle
            [(ngModel)]="myCasesOnly"
            (ngModelChange)="onMyCasesToggle($event)"
            color="primary"
            class="mb-4 sm:mb-0">
            My Cases Only
          </mat-slide-toggle>
        </div>
      </div>

      <!-- Client Table -->
      <div class="card overflow-hidden">
        <app-client-table
          [clients]="store.clients()"
          [totalItems]="store.totalClients()"
          [pageSize]="store.params().per_page || 10"
          [pageIndex]="(store.params().page || 1) - 1"
          (sortChange)="onSort($event)"
          (pageChange)="onPage($event)"
          (clientClick)="onClientClick($event)"
          (manageAccess)="openManageAccess($event)"
          (continueSetup)="onContinueSetup($event)"
          (startOnline)="onStartOnline($event)"
          (startOffline)="openOfflineSetup($event)"
          (continueOffline)="onContinueOffline($event)"
          (viewDocuments)="openDocuments($event)"
          (assignToMe)="onAssignToMe($event)"
          (viewTimeline)="openTimeline($event)">
        </app-client-table>
      </div>
    </div>
  `,
})
export class ClientListComponent implements OnInit {
  searchTerm = '';
  statusFilter = '';
  myCasesOnly = false;
  statuses = Object.values(ClientStatus);

  constructor(
    private service: SoldCasesService,
    public store: SoldCasesStore,
    private dialog: MatDialog,
    private router: Router,
    private notification: NotificationService,
    private fileUploadService: FileUploadService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.store.setLoading(true);
    const params = this.store.params();
    this.service.getClients(params).subscribe({
      next: (response) => {
        this.store.setClients(response.items, response.total);
        this.store.setLoading(false);
      },
      error: () => {
        this.store.setLoading(false);
        this.notification.error('Failed to load clients');
      },
    });
  }

  onSearch(term: string): void {
    this.store.updateParams({ search: term || undefined, page: 1 });
    this.loadClients();
  }

  onStatusFilter(status: string): void {
    this.store.updateParams({ status: status || undefined, page: 1 });
    this.loadClients();
  }

  onMyCasesToggle(checked: boolean): void {
    const userId = checked ? this.auth.user()?.id : undefined;
    this.store.updateParams({ assigned_to_user_id: userId, page: 1 });
    this.loadClients();
  }

  onSort(sort: Sort): void {
    this.store.updateParams({
      sort_by: sort.active,
      sort_order: sort.direction as 'asc' | 'desc' || 'asc',
    });
    this.loadClients();
  }

  onPage(event: PageEvent): void {
    this.store.updateParams({
      page: event.pageIndex + 1,
      per_page: event.pageSize,
    });
    this.loadClients();
  }

  onClientClick(client: Client): void {
    this.store.setSelectedClient(client);
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  openAssignAccess(client: Client): void {
    const dialogRef = this.dialog.open(AssignAccessModalComponent, {
      width: '500px',
      data: { clientId: client.id, clientName: client.client_name } as AccessModalData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createAccess(client.id, result).subscribe({
          next: () => {
            this.notification.success('Access assigned successfully');
            this.loadClients();
          },
          error: (err) => this.notification.error(err.error?.detail || 'Failed to assign access'),
        });
      }
    });
  }

  onContinueSetup(client: Client): void {
    this.router.navigate(['/workflow', client.id]);
  }

  onStartOnline(client: Client): void {
    this.service.checkReadiness(client.id).subscribe({
      next: (readiness) => {
        if (!readiness.is_ready) {
          this.dialog.open(ReadinessBlockersDialogComponent, {
            width: '480px',
            data: { blockers: readiness.blockers },
          });
          return;
        }

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          data: {
            title: 'Begin Online Group Setup',
            message: `Start the online group setup process for ${client.client_name}?`,
            confirmText: 'Begin Setup',
          },
        });

        dialogRef.afterClosed().subscribe(confirmed => {
          if (confirmed) {
            this.service.startOnlineSetup(client.id).subscribe({
              next: () => {
                this.notification.success('Group setup started');
                this.router.navigate(['/workflow', client.id]);
              },
              error: (err) => this.notification.error(err.error?.detail || 'Failed to start setup'),
            });
          }
        });
      },
      error: (err) => this.notification.error(err.error?.detail || 'Failed to check readiness'),
    });
  }

  onContinueOffline(client: Client): void {
    this.router.navigate(['/offline-packet', client.id]);
  }

  openOfflineSetup(client: Client): void {
    const dialogRef = this.dialog.open(OfflineSetupComponent, {
      width: '500px',
      data: { clientId: client.id, clientName: client.client_name },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.service.startOfflineSetup(client.id).subscribe({
          next: () => {
            this.notification.success('Offline setup initiated');
            this.router.navigate(['/offline-packet', client.id]);
          },
          error: (err) => this.notification.error(err.error?.detail || 'Failed to start offline setup'),
        });
      }
    });
  }

  openDocuments(client: Client): void {
    this.dialog.open(DocumentsDialogComponent, {
      width: '700px',
      data: { clientId: client.id, clientName: client.client_name },
    });
  }

  openManageAccess(client: Client): void {
    this.dialog.open(ManageAccessDialogComponent, {
      width: '700px',
      data: { clientId: client.id, clientName: client.client_name },
    });
  }

  onAssignToMe(client: Client): void {
    this.service.assignToMe(client.id).subscribe({
      next: () => {
        this.notification.success('Case assigned to you');
        this.loadClients();
      },
      error: (err) => this.notification.error(err.error?.detail || 'Failed to assign case'),
    });
  }

  openTimeline(client: Client): void {
    this.dialog.open(TimelineDialogComponent, {
      width: '600px',
      data: { clientId: client.id, clientName: client.client_name },
    });
  }
}
