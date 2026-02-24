import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SoldCasesService } from '../../services/sold-cases.service';
import { TimelineEvent } from '../../../../core/models/client.model';

export interface TimelineDialogData {
  clientId: string;
  clientName: string;
}

interface TimelineFilter {
  label: string;
  value: string | undefined;
}

@Component({
  selector: 'app-timeline-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, KeyValuePipe,
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon class="text-indigo-600">timeline</mat-icon>
      Case Timeline &mdash; {{ data.clientName }}
    </h2>

    <mat-dialog-content class="min-h-[200px]">
      <!-- Filter chips -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button *ngFor="let f of filters" mat-stroked-button
                [class.!bg-indigo-100]="selectedFilter === f.value"
                (click)="onFilterChange(f.value)">
          {{ f.label }}
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center items-center py-12">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && events.length === 0" class="flex flex-col items-center gap-2 py-12">
        <mat-icon class="text-slate-300" style="font-size:48px;width:48px;height:48px;">history</mat-icon>
        <p class="text-slate-400 font-medium">No events recorded yet</p>
        <p class="text-slate-300 text-sm">Events will appear here as actions are taken on this case</p>
      </div>

      <!-- Timeline -->
      <div *ngIf="!loading && events.length > 0" class="relative ml-4">
        <!-- Vertical line -->
        <div class="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200"></div>

        <div *ngFor="let event of events; let i = index; let last = last"
             class="relative flex items-start gap-4 pb-6"
             [class.pb-0]="last">
          <!-- Dot node -->
          <div class="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-indigo-400 shrink-0">
            <mat-icon class="text-indigo-500" style="font-size:14px;width:14px;height:14px;">{{ event.icon }}</mat-icon>
          </div>

          <!-- Content -->
          <div class="flex-1 -mt-0.5">
            <p class="text-sm text-slate-800 font-medium">{{ event.description }}</p>
            <div class="flex items-center gap-3 mt-1">
              <span class="text-xs text-slate-400">{{ event.created_at | date:'MMM d, y h:mm a' }}</span>
              <span *ngIf="event.user_name" class="text-xs text-slate-500">
                by {{ event.user_name }}
              </span>
              <button *ngIf="event.payload && hasPayloadKeys(event.payload)"
                      mat-button class="!text-xs !min-w-0 !px-2 !py-0 text-indigo-500"
                      (click)="toggleDetails(i)">
                {{ expandedIndex === i ? 'Hide Details' : 'Details' }}
              </button>
            </div>
            <!-- Expandable payload details -->
            <div *ngIf="expandedIndex === i && event.payload" class="mt-2 bg-slate-50 rounded-lg p-3 text-xs space-y-1">
              <div *ngFor="let item of event.payload | keyvalue" class="flex gap-2">
                <span class="font-medium text-slate-500 min-w-[100px]">{{ item.key }}:</span>
                <span class="text-slate-700">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Close</button>
    </mat-dialog-actions>
  `,
})
export class TimelineDialogComponent implements OnInit {
  events: (TimelineEvent & { payload?: Record<string, any> })[] = [];
  loading = false;
  expandedIndex: number | null = null;
  selectedFilter: string | undefined = undefined;

  filters: TimelineFilter[] = [
    { label: 'All Events', value: undefined },
    { label: 'Step Completions', value: 'WorkflowStepCompleted' },
    { label: 'Documents', value: 'DocumentUploaded' },
    { label: 'Access Changes', value: 'AccessAssigned' },
    { label: 'Submissions', value: 'WorkflowSubmitted' },
  ];

  constructor(
    public dialogRef: MatDialogRef<TimelineDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TimelineDialogData,
    private service: SoldCasesService,
  ) {}

  ngOnInit(): void {
    this.loadTimeline();
  }

  onFilterChange(eventType: string | undefined): void {
    this.selectedFilter = eventType;
    this.expandedIndex = null;
    this.loadTimeline(eventType);
  }

  toggleDetails(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  hasPayloadKeys(payload: Record<string, any>): boolean {
    return Object.keys(payload).length > 0;
  }

  loadTimeline(eventType?: string): void {
    this.loading = true;
    this.service.getTimeline(this.data.clientId, 50, 0, eventType).subscribe({
      next: (response) => {
        this.events = response.events;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
