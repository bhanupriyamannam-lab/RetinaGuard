import { apiClient } from './client';
import { BackendTriageItem } from './types';

export interface TriageParams {
  risk?: string;
  severity?: string;
  progression?: boolean;
  sort_by?: 'priority' | 'date' | 'risk';
}

export const triageApi = {
  async getTriageQueue(params?: TriageParams): Promise<BackendTriageItem[]> {
    const res = await apiClient.get<BackendTriageItem[]>('/triage/', params);
    return Array.isArray(res) ? res : [];
  }
};
