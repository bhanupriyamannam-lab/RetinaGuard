import { apiClient } from './client';
import { BackendCamp, BackendCampStats } from './types';

export const campsApi = {
  async getCamps(): Promise<BackendCamp[]> {
    const res = await apiClient.get<any>('/camps/');
    if (res && Array.isArray(res.results)) return res.results;
    return Array.isArray(res) ? res : [];
  },

  async getCamp(id: string): Promise<BackendCamp> {
    return apiClient.get<BackendCamp>(`/camps/${id}/`);
  },

  async getCampStatistics(id: string): Promise<BackendCampStats> {
    return apiClient.get<BackendCampStats>(`/camps/${id}/statistics/`);
  }
};
