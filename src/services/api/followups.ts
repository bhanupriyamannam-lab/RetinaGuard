import { apiClient } from './client';
import { BackendFollowUp } from './types';

export interface FollowUpFilters {
  status?: 'today' | 'overdue' | 'completed' | 'UPCOMING' | 'DUE' | 'OVERDUE' | 'COMPLETED';
  priority?: string;
  recall_channel?: string;
}

export interface TriggerSMSResult {
  followup_id: string;
  patient_phone: string;
  status: string;
  message_preview: string;
  timestamp: string;
}

export const followupsApi = {
  async getFollowUps(params?: FollowUpFilters): Promise<BackendFollowUp[]> {
    const res = await apiClient.get<any>('/followups/', params);
    if (res && Array.isArray(res.results)) {
      return res.results;
    }
    return Array.isArray(res) ? res : [];
  },

  async triggerFollowUpSMS(id: string, language: string = 'te'): Promise<TriggerSMSResult> {
    return apiClient.post<TriggerSMSResult>(`/followups/${id}/trigger_sms/`, { language });
  },

  async completeFollowUp(id: string, notes?: string): Promise<BackendFollowUp> {
    return apiClient.post<BackendFollowUp>(`/followups/${id}/complete/`, { notes });
  },

  async createFollowUp(data: {
    patient: string;
    due_date: string;
    priority?: string;
    recall_channel?: string;
    status?: string;
    notes?: string;
  }): Promise<BackendFollowUp> {
    return apiClient.post<BackendFollowUp>('/followups/', data);
  }
};
