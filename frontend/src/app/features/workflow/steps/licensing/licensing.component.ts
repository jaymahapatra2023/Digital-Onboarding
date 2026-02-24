import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WorkflowStore } from '../../store/workflow.store';
import { AddProducerDialogComponent, ProducerResult } from './add-producer-dialog.component';
import { VerifyStatusDialogComponent, VerifyStatusResult } from './verify-status-dialog.component';
import { VerifyCodeDialogComponent, VerifyCodeResult } from './verify-code-dialog.component';

interface WritingProducer {
  id: string;
  role_type: string;
  first_name: string;
  last_name: string;
  email: string;
  has_ongoing_maintenance_access: boolean;
  licensing_status: 'pending' | 'active' | 'not_found' | 'not_active' | 'expired';
  compensable_code: string | null;
  commission_split: number | null;
}

@Component({
  selector: 'app-licensing',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatCardModule, MatIconModule, MatTableModule, MatDialogModule, MatTooltipModule,
  ],
  template: `
    <div class="flex gap-6">
      <!-- Left column: main content -->
      <div class="flex-1 space-y-6">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <div class="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
              <mat-icon class="text-indigo-600" style="font-size:20px;width:20px;height:20px;">badge</mat-icon>
            </div>
            <h2 class="text-xl font-bold text-slate-900">
              Licensing &amp; Appointment / Compensable Code / Commissions
            </h2>
          </div>
          <p class="text-slate-500 ml-12">
            Add writing producers to this group, verify their licensing status and compensable code,
            then assign commission splits.
          </p>
        </div>

        <!-- Info banner -->
        <div class="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <mat-icon class="text-blue-600 mt-0.5" style="font-size:20px;width:20px;height:20px;">info</mat-icon>
          <p class="text-sm text-blue-800">
            The employer will have to approve ongoing access to this group for each writing producer.
            Access can be modified later from the Sold Cases screen.
          </p>
        </div>

        <!-- Add Producer button -->
        <button mat-stroked-button color="primary" (click)="openAddProducer()" style="border-radius: 8px;">
          <mat-icon>add</mat-icon> Add New Writing Producer
        </button>

        <!-- Producers Table -->
        <mat-card *ngIf="producers.length > 0">
          <mat-card-content class="p-0">
            <table mat-table [dataSource]="producers" class="w-full">
              <!-- Writing Producer Column -->
              <ng-container matColumnDef="producer">
                <th mat-header-cell *matHeaderCellDef class="!pl-4">Writing Producer</th>
                <td mat-cell *matCellDef="let p" class="!pl-4 !py-3">
                  <div class="font-medium text-slate-900">{{ p.first_name }} {{ p.last_name }}</div>
                  <div class="text-xs text-slate-500">{{ p.role_type }}</div>
                  <div class="text-xs text-slate-400">{{ p.email }}</div>
                </td>
              </ng-container>

              <!-- L&A Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>L&amp;A Status</th>
                <td mat-cell *matCellDef="let p" class="!py-3">
                  <span class="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full"
                        [ngClass]="statusBadgeClass(p.licensing_status)">
                    {{ statusLabel(p.licensing_status) }}
                  </span>
                  <button *ngIf="p.licensing_status !== 'active'" mat-button class="!text-xs !text-indigo-600 !p-0 !min-w-0 ml-1"
                          (click)="openVerifyStatus(p)">
                    Verify Status
                  </button>
                </td>
              </ng-container>

              <!-- Compensable Code Column -->
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Compensable Code</th>
                <td mat-cell *matCellDef="let p" class="!py-3">
                  <span *ngIf="p.compensable_code" class="font-mono text-sm text-slate-900">{{ p.compensable_code }}</span>
                  <span *ngIf="!p.compensable_code" class="text-xs text-slate-400">Not verified</span>
                  <button mat-button class="!text-xs !text-indigo-600 !p-0 !min-w-0 ml-1"
                          (click)="openVerifyCode(p)">
                    {{ p.compensable_code ? 'Re-verify' : 'Verify Code' }}
                  </button>
                </td>
              </ng-container>

              <!-- Commission Split Column -->
              <ng-container matColumnDef="commission">
                <th mat-header-cell *matHeaderCellDef>Commission Split</th>
                <td mat-cell *matCellDef="let p; let i = index" class="!py-3">
                  <div class="flex items-center gap-1">
                    <input type="number" [(ngModel)]="p.commission_split"
                           (ngModelChange)="onCommissionChange()"
                           min="0" max="100" step="1"
                           class="w-16 px-2 py-1 border border-slate-300 rounded text-sm text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                    <span class="text-sm text-slate-500">%</span>
                  </div>
                </td>
              </ng-container>

              <!-- Action Column -->
              <ng-container matColumnDef="action">
                <th mat-header-cell *matHeaderCellDef class="!w-12"></th>
                <td mat-cell *matCellDef="let p; let i = index" class="!py-3">
                  <button mat-icon-button (click)="removeProducer(i)"
                          matTooltip="Remove producer" class="text-slate-400 hover:text-red-500">
                    <mat-icon style="font-size:18px;width:18px;height:18px;">delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <!-- Total Distribution row -->
            <div class="flex items-center justify-between px-4 py-3 border-t"
                 [ngClass]="totalDistribution === 100 ? 'bg-green-50' : 'bg-red-50'">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-slate-700">Total Distribution:</span>
                <span class="text-sm font-bold" [ngClass]="totalDistribution === 100 ? 'text-green-700' : 'text-red-700'">
                  {{ totalDistribution }}%
                </span>
                <mat-icon *ngIf="totalDistribution === 100" class="text-green-600" style="font-size:16px;width:16px;height:16px;">
                  check_circle
                </mat-icon>
                <span *ngIf="totalDistribution !== 100" class="text-xs text-red-600">(Must equal 100%)</span>
              </div>
              <button mat-button class="!text-xs !text-indigo-600" (click)="distributeEqually()">
                <mat-icon style="font-size:14px;width:14px;height:14px;" class="mr-1">balance</mat-icon>
                Distribute Equally
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Empty state -->
        <mat-card *ngIf="producers.length === 0">
          <mat-card-content class="p-8 text-center">
            <mat-icon class="text-slate-300 mb-2" style="font-size:48px;width:48px;height:48px;">people</mat-icon>
            <p class="text-slate-500">No writing producers assigned yet.</p>
            <p class="text-sm text-slate-400">Click "Add New Writing Producer" to get started.</p>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Right sidebar -->
      <div class="hidden lg:block w-72 space-y-4 flex-shrink-0">
        <mat-card>
          <mat-card-content class="p-4">
            <h3 class="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">info</mat-icon>
              Important Information
            </h3>
            <div class="space-y-2">
              <a class="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer">
                <mat-icon style="font-size:16px;width:16px;height:16px;">download</mat-icon>
                C&amp;B Summary
              </a>
              <a class="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer">
                <mat-icon style="font-size:16px;width:16px;height:16px;">download</mat-icon>
                Benefit Summaries
              </a>
              <a class="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer">
                <mat-icon style="font-size:16px;width:16px;height:16px;">download</mat-icon>
                Slipsheets
              </a>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content class="p-4">
            <h3 class="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <mat-icon class="text-indigo-500" style="font-size:18px;width:18px;height:18px;">description</mat-icon>
              Download Forms
            </h3>
            <div class="space-y-2">
              <a class="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer">
                <mat-icon style="font-size:16px;width:16px;height:16px;">download</mat-icon>
                Producer Appointment Form
              </a>
              <a class="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer">
                <mat-icon style="font-size:16px;width:16px;height:16px;">download</mat-icon>
                Commission Agreement
              </a>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
})
export class LicensingComponent implements OnInit {
  producers: WritingProducer[] = [];
  displayedColumns = ['producer', 'status', 'code', 'commission', 'action'];
  totalDistribution = 0;

  constructor(
    private store: WorkflowStore,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    const step = this.store.currentStep();
    if (step?.data && (step.data as any).writing_producers) {
      this.producers = [...(step.data as any).writing_producers];
      this.calculateTotal();
    }
  }

  openAddProducer(): void {
    const ref = this.dialog.open(AddProducerDialogComponent, {
      width: '500px',
      data: { existingEmails: this.producers.map(p => p.email) },
    });
    ref.afterClosed().subscribe((result: ProducerResult | undefined) => {
      if (result) {
        this.producers = [...this.producers, result as WritingProducer];
        this.calculateTotal();
      }
    });
  }

  openVerifyStatus(producer: WritingProducer): void {
    const ref = this.dialog.open(VerifyStatusDialogComponent, {
      width: '480px',
      data: {
        producerName: `${producer.first_name} ${producer.last_name}`,
        producerId: producer.id,
      },
    });
    ref.afterClosed().subscribe((result: VerifyStatusResult | undefined) => {
      if (result) {
        producer.licensing_status = result.status;
        this.producers = [...this.producers]; // trigger change detection
      }
    });
  }

  openVerifyCode(producer: WritingProducer): void {
    const ref = this.dialog.open(VerifyCodeDialogComponent, {
      width: '520px',
      data: {
        producerName: `${producer.first_name} ${producer.last_name}`,
        producerId: producer.id,
      },
    });
    ref.afterClosed().subscribe((result: VerifyCodeResult | undefined) => {
      if (result) {
        producer.compensable_code = result.compensable_code;
        this.producers = [...this.producers];
      }
    });
  }

  removeProducer(index: number): void {
    this.producers = this.producers.filter((_, i) => i !== index);
    this.calculateTotal();
  }

  onCommissionChange(): void {
    this.calculateTotal();
  }

  distributeEqually(): void {
    if (this.producers.length === 0) return;
    const share = Math.floor(100 / this.producers.length);
    const remainder = 100 - share * this.producers.length;
    this.producers.forEach((p, i) => {
      p.commission_split = share + (i < remainder ? 1 : 0);
    });
    this.producers = [...this.producers];
    this.calculateTotal();
  }

  statusBadgeClass(status: string): Record<string, boolean> {
    return {
      'bg-slate-100 text-slate-600': status === 'pending',
      'bg-green-100 text-green-700': status === 'active',
      'bg-yellow-100 text-yellow-700': status === 'not_found',
      'bg-red-100 text-red-700': status === 'not_active' || status === 'expired',
    };
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pending',
      active: 'Active',
      not_found: 'Not Found',
      not_active: 'Not Active',
      expired: 'Expired',
    };
    return labels[status] || status;
  }

  private calculateTotal(): void {
    this.totalDistribution = this.producers.reduce(
      (sum, p) => sum + (p.commission_split || 0), 0
    );
  }

  getData(): Record<string, any> {
    return {
      writing_producers: this.producers,
      total_distribution: this.totalDistribution,
    };
  }

  isValid(): boolean {
    return (
      this.producers.length > 0 &&
      this.producers.every(p => p.licensing_status === 'active') &&
      this.producers.every(p => p.compensable_code !== null) &&
      this.totalDistribution === 100
    );
  }
}
