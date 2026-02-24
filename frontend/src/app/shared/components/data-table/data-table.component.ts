import { Component, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'status' | 'date' | 'actions';
  width?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatInputModule, MatFormFieldModule, MatIconModule, MatButtonModule, FormsModule,
  ],
  template: `
    <div class="w-full">
      <!-- Search bar -->
      <div *ngIf="searchable" class="mb-4">
        <mat-form-field class="w-full sm:w-80" appearance="outline">
          <mat-label>Search</mat-label>
          <input matInput [ngModel]="searchValue" (ngModelChange)="onSearchChange($event)" placeholder="Search...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSortChange($event)" class="w-full">
          <ng-container *ngFor="let col of columns" [matColumnDef]="col.key">
            <th mat-header-cell *matHeaderCellDef [mat-sort-header]="col.sortable !== false ? col.key : ''" [disabled]="col.sortable === false">
              {{ col.label }}
            </th>
            <td mat-cell *matCellDef="let row">
              <ng-container [ngSwitch]="col.type">
                <ng-container *ngSwitchCase="'actions'">
                  <ng-content select="[actions]"></ng-content>
                </ng-container>
                <ng-container *ngSwitchDefault>
                  {{ row[col.key] }}
                </ng-container>
              </ng-container>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              class="hover:bg-gray-50 cursor-pointer"
              (click)="rowClick.emit(row)"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell text-center py-8 text-gray-500" [attr.colspan]="columns.length">
              {{ emptyMessage }}
            </td>
          </tr>
        </table>
      </div>

      <!-- Paginator -->
      <mat-paginator *ngIf="paginated"
        [length]="totalItems"
        [pageSize]="pageSize"
        [pageSizeOptions]="pageSizeOptions"
        [pageIndex]="pageIndex"
        (page)="onPageChange($event)"
        showFirstLastButtons>
      </mat-paginator>
    </div>
  `,
})
export class DataTableComponent implements OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() searchable: boolean = true;
  @Input() paginated: boolean = true;
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Input() pageIndex: number = 0;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() emptyMessage: string = 'No data found';

  @Output() searchChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<Sort>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() rowClick = new EventEmitter<any>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>();
  searchValue: string = '';

  get displayedColumns(): string[] {
    return this.columns.map(c => c.key);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSource.data = this.data;
    }
  }

  onSearchChange(value: string): void {
    this.searchValue = value;
    this.searchChange.emit(value);
  }

  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
