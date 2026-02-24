import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

import { AdminService, DashboardMetrics } from '../../services/admin.service';

const STATUS_COLORS: Record<string, string> = {
  APPLICATION_NOT_STARTED: 'bg-slate-100 text-slate-700',
  APPLICATION_IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SUBMITTED: 'bg-green-100 text-green-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  template: `
    <div class="p-8 max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <button mat-stroked-button (click)="loadMetrics()" [disabled]="loading">
          <mat-icon class="mr-1">refresh</mat-icon> Refresh
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center py-16">
        <mat-spinner diameter="48"></mat-spinner>
      </div>

      <!-- Error -->
      <div *ngIf="error && !loading" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <mat-icon class="text-red-400 mb-2" style="font-size:40px;width:40px;height:40px;">error_outline</mat-icon>
        <p class="text-red-700 font-medium mb-3">Failed to load dashboard metrics</p>
        <button mat-flat-button color="primary" (click)="loadMetrics()" style="border-radius:10px;">
          <mat-icon class="mr-1">refresh</mat-icon> Retry
        </button>
      </div>

      <div *ngIf="metrics && !loading && !error">
        <!-- Stat cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <p class="text-sm text-slate-500">Total Cases</p>
            <p class="text-3xl font-bold text-slate-900 mt-1">{{ metrics.total_cases }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <p class="text-sm text-slate-500">Avg Cycle Time</p>
            <p class="text-3xl font-bold text-slate-900 mt-1">
              {{ metrics.avg_cycle_time_days !== null ? metrics.avg_cycle_time_days + 'd' : 'N/A' }}
            </p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <p class="text-sm text-slate-500">Submitted (7d)</p>
            <p class="text-3xl font-bold text-slate-900 mt-1">{{ metrics.submissions_last_7_days }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <p class="text-sm text-slate-500">Submitted (30d)</p>
            <p class="text-3xl font-bold text-slate-900 mt-1">{{ metrics.submissions_last_30_days }}</p>
          </div>
        </div>

        <!-- Status breakdown -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 mb-8">
          <h2 class="text-sm font-semibold text-slate-700 mb-3">Cases by Status</h2>
          <div class="flex flex-wrap gap-3">
            <div *ngFor="let entry of statusEntries" class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full text-xs font-medium" [ngClass]="getStatusColor(entry[0])">
                {{ formatStatus(entry[0]) }}
              </span>
              <span class="text-sm font-semibold text-slate-800">{{ entry[1] }}</span>
            </div>
          </div>
        </div>

        <!-- Stuck steps table -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 mb-8">
          <h2 class="text-sm font-semibold text-slate-700 mb-3">
            Stuck Steps
            <span *ngIf="metrics.stuck_steps.length" class="ml-2 text-xs text-red-500 font-normal">
              ({{ metrics.stuck_steps.length }})
            </span>
          </h2>
          <div *ngIf="metrics.stuck_steps.length === 0" class="text-sm text-slate-400 py-4 text-center">
            No stuck steps detected
          </div>
          <table *ngIf="metrics.stuck_steps.length > 0" class="w-full text-sm">
            <thead>
              <tr class="text-left text-slate-500 border-b">
                <th class="py-2 pr-4">Client</th>
                <th class="py-2 pr-4">Step</th>
                <th class="py-2">Days Stuck</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let step of metrics.stuck_steps" class="border-b border-gray-100">
                <td class="py-2 pr-4">
                  <a [routerLink]="['/workflow', step.client_id]" class="text-indigo-600 hover:underline">
                    {{ step.client_name }}
                  </a>
                </td>
                <td class="py-2 pr-4 text-slate-700">{{ step.step_id }}</td>
                <td class="py-2">
                  <span class="font-semibold"
                        [class.text-red-600]="step.days_stuck >= 14"
                        [class.text-amber-600]="step.days_stuck >= 7 && step.days_stuck < 14">
                    {{ step.days_stuck }}d
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- SLA Alerts table -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-slate-700 mb-3">
            SLA Alerts
            <span *ngIf="metrics.stale_cases.length" class="ml-2 text-xs text-amber-500 font-normal">
              ({{ metrics.stale_cases.length }})
            </span>
          </h2>
          <div *ngIf="metrics.stale_cases.length === 0" class="text-sm text-slate-400 py-4 text-center">
            All cases are within SLA
          </div>
          <table *ngIf="metrics.stale_cases.length > 0" class="w-full text-sm">
            <thead>
              <tr class="text-left text-slate-500 border-b">
                <th class="py-2 pr-4">Client</th>
                <th class="py-2 pr-4">Status</th>
                <th class="py-2 pr-4">Days Stale</th>
                <th class="py-2">Severity</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let alert of metrics.stale_cases" class="border-b border-gray-100">
                <td class="py-2 pr-4">
                  <a [routerLink]="['/clients']" class="text-indigo-600 hover:underline">
                    {{ alert.client_name }}
                  </a>
                </td>
                <td class="py-2 pr-4">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium" [ngClass]="getStatusColor(alert.status)">
                    {{ formatStatus(alert.status) }}
                  </span>
                </td>
                <td class="py-2 pr-4 text-slate-700">{{ alert.days_stale }}d</td>
                <td class="py-2">
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                        [class.bg-red-100]="alert.severity === 'critical'"
                        [class.text-red-700]="alert.severity === 'critical'"
                        [class.bg-amber-100]="alert.severity === 'warning'"
                        [class.text-amber-700]="alert.severity === 'warning'">
                    {{ alert.severity }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  metrics: DashboardMetrics | null = null;
  loading = false;
  error = false;
  statusEntries: [string, number][] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadMetrics();
  }

  loadMetrics(): void {
    this.loading = true;
    this.error = false;
    this.adminService.getDashboardMetrics().subscribe({
      next: (metrics) => {
        this.metrics = metrics;
        this.statusEntries = Object.entries(metrics.by_status);
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  getStatusColor(status: string): string {
    return STATUS_COLORS[status] || 'bg-slate-100 text-slate-600';
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
