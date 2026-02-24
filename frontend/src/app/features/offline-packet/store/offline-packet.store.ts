import { Injectable, computed, signal } from '@angular/core';
import {
  OfflinePacketStatus,
  OfflinePacketStatusResponse,
  RequiredFileStatus,
} from '../../../core/models/offline-packet.model';

@Injectable({ providedIn: 'root' })
export class OfflinePacketStore {
  private _loading = signal(false);
  private _submitting = signal(false);
  private _status = signal<OfflinePacketStatus>(OfflinePacketStatus.COLLECTING);
  private _files = signal<RequiredFileStatus[]>([]);
  private _isComplete = signal(false);
  private _missingRequired = signal<string[]>([]);
  private _workflowInstanceId = signal<string | null>(null);

  loading = this._loading.asReadonly();
  submitting = this._submitting.asReadonly();
  status = this._status.asReadonly();
  files = this._files.asReadonly();
  isComplete = this._isComplete.asReadonly();
  missingRequired = this._missingRequired.asReadonly();
  workflowInstanceId = this._workflowInstanceId.asReadonly();

  isSubmitted = computed(() =>
    this._status() === OfflinePacketStatus.SUBMITTED ||
    this._status() === OfflinePacketStatus.IN_REVIEW
  );

  missingLabels = computed(() => {
    const fileMap = new Map(this._files().map(f => [f.file_type, f.label]));
    return this._missingRequired().map(ft => fileMap.get(ft) || ft);
  });

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setSubmitting(submitting: boolean): void {
    this._submitting.set(submitting);
  }

  setPacketStatus(response: OfflinePacketStatusResponse): void {
    this._status.set(response.status);
    this._files.set(response.files);
    this._isComplete.set(response.is_complete);
    this._missingRequired.set(response.missing_required);
  }

  setWorkflowInstanceId(id: string): void {
    this._workflowInstanceId.set(id);
  }
}
