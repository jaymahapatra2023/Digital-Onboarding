export enum OfflinePacketStatus {
  COLLECTING = 'COLLECTING',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
}

export interface RequiredFileStatus {
  file_type: string;
  label: string;
  required: boolean;
  uploaded: boolean;
  file_name?: string;
  document_id?: string;
}

export interface OfflinePacketStatusResponse {
  status: OfflinePacketStatus;
  is_complete: boolean;
  files: RequiredFileStatus[];
  missing_required: string[];
}
