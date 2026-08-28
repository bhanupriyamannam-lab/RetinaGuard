import { apiClient } from './client';
import { BackendDashboardKPIs } from './types';

export const analyticsApi = {
  async getDashboardKPIs(organizationId?: string): Promise<BackendDashboardKPIs> {
    return apiClient.get<BackendDashboardKPIs>('/analytics/dashboard/', { organization: organizationId });
  },

  async getScreeningTrends(days: number = 30): Promise<{ date: string; total_screened: number; high_risk: number; referred: number }[]> {
    return apiClient.get('/analytics/screenings/', { days });
  },

  async getSeverityDistribution(): Promise<{ severity: string; count: number; percentage: number }[]> {
    return apiClient.get('/analytics/severity/');
  },

  async getReferralAnalytics(): Promise<any> {
    return apiClient.get('/analytics/referrals/');
  },

  async getFollowUpAnalytics(): Promise<any> {
    return apiClient.get('/analytics/followups/');
  }
};
