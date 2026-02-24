import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Client, ClientStatus } from '../../../../core/models/client.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-client-table',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule,
    MatDividerModule, StatusBadgeComponent,
  ],
  template: `
    <div class="overflow-x-auto">
      <table mat-table [dataSource]="clients" matSort (matSortChange)="onSort($event)" class="w-full">
        <!-- Client Name -->
        <ng-container matColumnDef="client_name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Client Name</th>
          <td mat-cell *matCellDef="let client" class="font-semibold text-slate-800">{{ client.client_name }}</td>
        </ng-container>

        <!-- Unique ID -->
        <ng-container matColumnDef="unique_id">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Unique ID</th>
          <td mat-cell *matCellDef="let client" style="font-family: 'SF Mono', ui-monospace, monospace; font-size: 0.8rem;"
              class="text-slate-500">{{ client.unique_id }}</td>
        </ng-container>

        <!-- Status -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
          <td mat-cell *matCellDef="let client">
            <app-status-badge [status]="client.status"></app-status-badge>
          </td>
        </ng-container>

        <!-- Eligible Employees -->
        <ng-container matColumnDef="eligible_employees">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Employees</th>
          <td mat-cell *matCellDef="let client">
            <span *ngIf="client.eligible_employees" class="inline-flex items-center gap-1 text-slate-600">
              <mat-icon class="text-slate-400" style="font-size:16px;width:16px;height:16px;">people</mat-icon>
              {{ client.eligible_employees }}
            </span>
            <span *ngIf="!client.eligible_employees" class="text-slate-300">&mdash;</span>
          </td>
        </ng-container>

        <!-- Location -->
        <ng-container matColumnDef="location">
          <th mat-header-cell *matHeaderCellDef>Location</th>
          <td mat-cell *matCellDef="let client" class="text-slate-600">
            {{ client.primary_address_city ? client.primary_address_city + ', ' + client.primary_address_state : '' }}
            <span *ngIf="!client.primary_address_city" class="text-slate-300">&mdash;</span>
          </td>
        </ng-container>

        <!-- Days in Queue -->
        <ng-container matColumnDef="days_in_queue">
          <th mat-header-cell *matHeaderCellDef mat-sort-header="updated_at">Days in Queue</th>
          <td mat-cell *matCellDef="let client">
            <span *ngIf="client.days_since_update != null"
                  class="inline-flex items-center gap-1 text-sm font-medium"
                  [ngClass]="getDaysClass(client.days_since_update)">
              <mat-icon *ngIf="client.is_stale" class="text-amber-500"
                        style="font-size:16px;width:16px;height:16px;"
                        matTooltip="This case is stale">warning</mat-icon>
              {{ client.days_since_update }}d
            </span>
            <span *ngIf="client.days_since_update == null" class="text-slate-300">&mdash;</span>
          </td>
        </ng-container>

        <!-- Actions -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef class="w-16"></th>
          <td mat-cell *matCellDef="let client">
            <button mat-icon-button [matMenuTriggerFor]="actionMenu" (click)="$event.stopPropagation()"
                    class="text-slate-400 hover:text-slate-600">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #actionMenu="matMenu">
              <button mat-menu-item (click)="manageAccess.emit(client)">
                <mat-icon>manage_accounts</mat-icon>
                <span>Manage Access</span>
              </button>
              <button mat-menu-item (click)="viewDocuments.emit(client)">
                <mat-icon>folder_open</mat-icon>
                <span>Documents</span>
              </button>
              <button *ngIf="client.status === ClientStatus.APPLICATION_IN_PROGRESS" mat-menu-item (click)="continueSetup.emit(client)">
                <mat-icon>arrow_forward</mat-icon>
                <span>Continue Group Setup</span>
              </button>
              <button *ngIf="client.status === ClientStatus.APPLICATION_NOT_STARTED" mat-menu-item (click)="startOnline.emit(client)">
                <mat-icon>play_arrow</mat-icon>
                <span>Begin Online Setup</span>
              </button>
              <button *ngIf="client.status === ClientStatus.APPLICATION_NOT_STARTED" mat-menu-item (click)="startOffline.emit(client)">
                <mat-icon>description</mat-icon>
                <span>Offline Setup</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="assignToMe.emit(client)">
                <mat-icon>assignment_ind</mat-icon>
                <span>Assign to Me</span>
              </button>
              <button mat-menu-item (click)="viewTimeline.emit(client)">
                <mat-icon>timeline</mat-icon>
                <span>View Timeline</span>
              </button>
            </mat-menu>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"
            class="cursor-pointer"
            (click)="clientClick.emit(row)"></tr>
        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell text-center py-12" [attr.colspan]="displayedColumns.length">
            <div class="flex flex-col items-center gap-2">
              <mat-icon class="text-slate-300" style="font-size:48px;width:48px;height:48px;">folder_open</mat-icon>
              <p class="text-slate-400 font-medium">No clients found</p>
              <p class="text-slate-300 text-sm">Try adjusting your search or filter criteria</p>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <mat-paginator
      [length]="totalItems"
      [pageSize]="pageSize"
      [pageIndex]="pageIndex"
      [pageSizeOptions]="[5, 10, 25, 50]"
      (page)="onPage($event)"
      showFirstLastButtons>
    </mat-paginator>
  `,
})
export class ClientTableComponent {
  @Input() clients: Client[] = [];
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Input() pageIndex: number = 0;

  @Output() sortChange = new EventEmitter<Sort>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() clientClick = new EventEmitter<Client>();
  @Output() assignAccess = new EventEmitter<Client>();
  @Output() continueSetup = new EventEmitter<Client>();
  @Output() startOnline = new EventEmitter<Client>();
  @Output() startOffline = new EventEmitter<Client>();
  @Output() viewDocuments = new EventEmitter<Client>();
  @Output() manageAccess = new EventEmitter<Client>();
  @Output() assignToMe = new EventEmitter<Client>();
  @Output() viewTimeline = new EventEmitter<Client>();

  ClientStatus = ClientStatus;
  displayedColumns = ['client_name', 'unique_id', 'status', 'eligible_employees', 'location', 'days_in_queue', 'actions'];

  getDaysClass(days: number): string {
    if (days >= 14) return 'text-red-600';
    if (days >= 7) return 'text-amber-600';
    return 'text-green-600';
  }

  onSort(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  onPage(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
