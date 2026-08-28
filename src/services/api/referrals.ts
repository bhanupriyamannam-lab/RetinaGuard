import { apiClient } from './client';
import { BackendReferral } from './types';

export interface CreateReferralPayload {
  patient: string;
  screening?: string;
  facility_type?: string;
  hospital_name: string;
  specialist_name: string;
  priority?: 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'EMERGENCY';
  status?: string;
  primary_diagnosis: string;
  target_date?: string;
  transport_assistance_required?: boolean;
  clinical_notes?: string;
}

export interface ReferralFilters {
  status?: string;
  priority?: string;
  facility_type?: string;
  search?: string;
}

export const referralsApi = {
  async getReferrals(params?: ReferralFilters): Promise<BackendReferral[]> {
    const res = await apiClient.get<any>('/referrals/', params);
    if (res && Array.isArray(res.results)) {
      return res.results;
    }
    return Array.isArray(res) ? res : [];
  },

  async getReferral(id: string): Promise<BackendReferral> {
    return apiClient.get<BackendReferral>(`/referrals/${id}/`);
  },

  async createReferral(payload: CreateReferralPayload): Promise<BackendReferral> {
    return apiClient.post<BackendReferral>('/referrals/', payload);
  },

  async updateReferralStatus(id: string, status: string, notes?: string): Promise<BackendReferral> {
    return apiClient.patch<BackendReferral>(`/referrals/${id}/`, { status, notes });
  }
};
