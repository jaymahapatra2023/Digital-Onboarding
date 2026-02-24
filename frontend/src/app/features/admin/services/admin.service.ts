import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface SlaAlert {
  client_id: string;
  client_name: string;
  status: string;
  days_stale: number;
  severity: 'warning' | 'critical';
}

export interface SlaAlertsResponse {
  alerts: SlaAlert[];
  total: number;
}

export interface StuckStep {
  client_id: string;
  client_name: string;
  step_id: string;
  days_stuck: number;
}

export interface DashboardMetrics {
  total_cases: number;
  by_status: Record<string, number>;
  stuck_steps: StuckStep[];
  stale_cases: SlaAlert[];
  avg_cycle_time_days: number | null;
  submissions_last_7_days: number;
  submissions_last_30_days: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private api: ApiService) {}

  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.api.get<DashboardMetrics>('/admin/dashboard/metrics');
  }

  getSlaAlerts(): Observable<SlaAlertsResponse> {
    return this.api.get<SlaAlertsResponse>('/admin/sla/alerts');
  }
}
