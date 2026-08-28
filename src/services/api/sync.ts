import { apiClient } from './client';

export interface SyncBatchRecord {
  idempotency_key: string;
  entity_type: 'PATIENT' | 'SCREENING' | 'REFERRAL' | 'FOLLOWUP';
  operation: 'CREATE' | 'UPDATE';
  client_timestamp?: string;
  payload: Record<string, any>;
}

export interface SyncBatchResponse {
  device_id: string;
  total_processed: number;
  synced_count: number;
  failed_count: number;
  results: {
    idempotency_key: string;
    entity_type?: string;
    entity_id?: string;
    status: 'SYNCED' | 'FAILED' | 'CONFLICT';
    error?: string;
    data?: any;
  }[];
}

export const syncApi = {
  async processBatch(deviceId: string, records: SyncBatchRecord[], organizationId?: string): Promise<SyncBatchResponse> {
    return apiClient.post<SyncBatchResponse>('/sync/', {
      device_id: deviceId,
      organization: organizationId,
      records,
    });
  },

  async getSyncRecords(): Promise<any[]> {
    const res = await apiClient.get<any>('/sync/');
    if (res && Array.isArray(res.results)) return res.results;
    return Array.isArray(res) ? res : [];
  }
};
