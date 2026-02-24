export enum DocumentType {
  MASTER_APP = 'MASTER_APP',
  DATA_GATHERING_TOOL = 'DATA_GATHERING_TOOL',
  CENSUS_TEMPLATE = 'CENSUS_TEMPLATE',
  COMMISSION_ACK = 'COMMISSION_ACK',
  SUPPLEMENTAL = 'SUPPLEMENTAL',
  ENROLLMENT_FORM = 'ENROLLMENT_FORM',
}

export interface Document {
  id: string;
  client_id: string;
  workflow_instance_id?: string;
  file_name: string;
  file_description?: string;
  file_type: DocumentType;
  file_path: string;
  file_size_bytes?: number;
  mime_type?: string;
  uploaded_by_user_id?: string;
  uploaded_at?: string;
}
