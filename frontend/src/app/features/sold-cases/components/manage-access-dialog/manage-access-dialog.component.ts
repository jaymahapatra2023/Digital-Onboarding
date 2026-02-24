import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SoldCasesService } from '../../services/sold-cases.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ClientAccess } from '../../../../core/models/client.model';
import { AssignAccessModalComponent, AccessModalData } from '../assign-access-modal/assign-access-modal.component';
import { DeleteAccessModalComponent, DeleteAccessData } from '../delete-access-modal/delete-access-modal.component';

export interface ManageAccessDialogData {
  clientId: string;
  clientName: string;
}

@Component({
  selector: 'app-manage-access-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatTableModule, MatButtonModule,
    MatIconModule, MatTooltipModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon class="text-indigo-600">manage_accounts</mat-icon>
      Administrator Access &mdash; {{ data.clientName }}
    </h2>

    <mat-dialog-content class="min-h-[200px]">
      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center items-center py-12">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && accessList.length === 0" class="flex flex-col items-center gap-2 py-12">
        <mat-icon class="text-slate-300" style="font-size:48px;width:48px;height:48px;">people_outline</mat-icon>
        <p class="text-slate-400 font-medium">No administrator access assigned</p>
        <p class="text-slate-300 text-sm">Click "Assign Access" to add an administrator</p>
      </div>

      <!-- Info banner -->
      <div *ngIf="!loading && accessList.length > 0" class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
        <mat-icon class="text-blue-600 mt-0.5" style="font-size:18px;width:18px;height:18px;">info</mat-icon>
        <p class="text-sm text-blue-800">
          At least one employer must be assigned before the Group Setup process can begin.
        </p>
      </div>

      <!-- Access table -->
      <table *ngIf="!loading && accessList.length > 0" mat-table [dataSource]="accessList" class="w-full">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let access">
            <div class="font-medium text-slate-800">{{ access.first_name }} {{ access.last_name }}</div>
            <div class="text-xs text-slate-400">{{ access.email }}</div>
          </td>
        </ng-container>

        <ng-container matColumnDef="role_type">
          <th mat-header-cell *matHeaderCellDef>Role</th>
          <td mat-cell *matCellDef="let access" class="text-slate-600 text-sm">
            {{ formatRole(access.role_type) }}
          </td>
        </ng-container>

        <ng-container matColumnDef="maintenance">
          <th mat-header-cell *matHeaderCellDef>Ongoing Access</th>
          <td mat-cell *matCellDef="let access">
            <span *ngIf="access.has_ongoing_maintenance_access"
                  class="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5">
              <mat-icon style="font-size:14px;width:14px;height:14px;">check</mat-icon> Yes
            </span>
            <span *ngIf="!access.has_ongoing_maintenance_access"
                  class="text-xs text-slate-400">No</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef class="w-24"></th>
          <td mat-cell *matCellDef="let access">
            <button mat-icon-button matTooltip="Edit" (click)="editAccess(access)">
              <mat-icon class="text-indigo-500" style="font-size:20px;width:20px;height:20px;">edit</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Delete" (click)="confirmDelete(access)">
              <mat-icon class="text-red-400" style="font-size:20px;width:20px;height:20px;">delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Close</button>
      <button mat-flat-button color="primary" (click)="openAssign()">
        <mat-icon>person_add</mat-icon>
        Assign Access
      </button>
    </mat-dialog-actions>
  `,
})
export class ManageAccessDialogComponent implements OnInit {
  accessList: ClientAccess[] = [];
  loading = false;
  displayedColumns = ['name', 'role_type', 'maintenance', 'actions'];

  constructor(
    public dialogRef: MatDialogRef<ManageAccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ManageAccessDialogData,
    private service: SoldCasesService,
    private notification: NotificationService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadAccess();
  }

  loadAccess(): void {
    this.loading = true;
    this.service.getAccess(this.data.clientId).subscribe({
      next: (list) => {
        this.accessList = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notification.error('Failed to load access list');
      },
    });
  }

  formatRole(role: string): string {
    return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  openAssign(): void {
    const ref = this.dialog.open(AssignAccessModalComponent, {
      width: '500px',
      data: { clientId: this.data.clientId, clientName: this.data.clientName } as AccessModalData,
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.service.createAccess(this.data.clientId, result).subscribe({
          next: () => {
            this.notification.success('Access assigned successfully');
            this.loadAccess();
          },
          error: (err) => this.notification.error(err.error?.detail || 'Failed to assign access'),
        });
      }
    });
  }

  editAccess(access: ClientAccess): void {
    const ref = this.dialog.open(AssignAccessModalComponent, {
      width: '500px',
      data: {
        clientId: this.data.clientId,
        clientName: this.data.clientName,
        access,
      } as AccessModalData,
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.service.updateAccess(this.data.clientId, access.id, result).subscribe({
          next: () => {
            this.notification.success('Access updated successfully');
            this.loadAccess();
          },
          error: (err) => this.notification.error(err.error?.detail || 'Failed to update access'),
        });
      }
    });
  }

  confirmDelete(access: ClientAccess): void {
    const ref = this.dialog.open(DeleteAccessModalComponent, {
      data: {
        accessName: `${access.first_name} ${access.last_name}`,
        accessEmail: access.email,
      } as DeleteAccessData,
    });

    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.service.deleteAccess(this.data.clientId, access.id).subscribe({
          next: () => {
            this.notification.success('Access removed');
            this.loadAccess();
          },
          error: (err) => this.notification.error(err.error?.detail || 'Failed to remove access'),
        });
      }
    });
  }
}
