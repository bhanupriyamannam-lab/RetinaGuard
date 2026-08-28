import { apiClient } from './client';
import { BackendScreeningSession, BackendRetinalImage, BackendQualityAssessment, BackendAIAnalysis } from './types';

export interface CreateScreeningPayload {
  patient: string;
  organization?: string;
  screening_camp?: string;
  notes?: string;
}

export interface AnalysisTriggerPayload {
  scenario?: 'HEALTHY' | 'MODERATE' | 'PROGRESSION' | 'POOR_QUALITY';
}

export interface ComparisonResult {
  current_scan: any;
  previous_scan: any;
  progression_alert: boolean;
  status: string;
  lesion_deltas: {
    finding_type: string;
    previous_count: number;
    current_count: number;
    delta: number;
    change_percentage: number;
    description: string;
  }[];
  summary: string;
}

export const screeningsApi = {
  async getScreenings(params?: Record<string, any>): Promise<BackendScreeningSession[]> {
    const res = await apiClient.get<any>('/screenings/', params);
    if (res && Array.isArray(res.results)) {
      return res.results;
    }
    return Array.isArray(res) ? res : [];
  },

  async getScreening(id: string): Promise<BackendScreeningSession> {
    return apiClient.get<BackendScreeningSession>(`/screenings/${id}/`);
  },

  async createScreening(payload: CreateScreeningPayload): Promise<BackendScreeningSession> {
    return apiClient.post<BackendScreeningSession>('/screenings/', payload);
  },

  async uploadRetinalImage(
    screeningId: string,
    file: File | Blob,
    eyeSide: 'RIGHT' | 'LEFT' = 'RIGHT'
  ): Promise<{ retinal_image: BackendRetinalImage; quality_assessment?: BackendQualityAssessment }> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('eye_side', eyeSide);

    return apiClient.upload<{ retinal_image: BackendRetinalImage; quality_assessment?: BackendQualityAssessment }>(
      `/screenings/${screeningId}/images/`,
      formData
    );
  },

  async triggerAIAnalysis(screeningId: string, payload?: AnalysisTriggerPayload): Promise<any> {
    return apiClient.post(`/screenings/${screeningId}/analyze/`, payload || {});
  },

  async getAIAnalysis(screeningId: string): Promise<BackendAIAnalysis> {
    return apiClient.get<BackendAIAnalysis>(`/screenings/${screeningId}/analysis/`);
  },

  async getScanComparison(screeningId: string): Promise<ComparisonResult> {
    return apiClient.get<ComparisonResult>(`/screenings/${screeningId}/comparison/`);
  },

  async getImageQuality(imageId: string): Promise<BackendQualityAssessment> {
    return apiClient.get<BackendQualityAssessment>(`/images/${imageId}/quality/`);
  },

  /**
   * Complete multi-step screening pipeline helper:
   * 1. Create screening session
   * 2. Upload fundus photograph
   * 3. Trigger optical QC + AI Inference + Explainability
   */
  async runFullScreeningWorkflow(options: {
    patientId: string;
    imageFile: File | Blob;
    eyeSide?: 'RIGHT' | 'LEFT';
    preset?: 'HEALTHY' | 'MODERATE' | 'PROGRESSION' | 'POOR_QUALITY';
    organizationId?: string;
    campId?: string;
    onProgress?: (step: number, stepName: string) => void;
  }): Promise<any> {
    const { patientId, imageFile, eyeSide = 'RIGHT', preset, organizationId, campId, onProgress } = options;

    if (onProgress) onProgress(1, 'Creating screening encounter record...');
    const screening = await this.createScreening({
      patient: patientId,
      organization: organizationId,
      screening_camp: campId,
    });

    if (onProgress) onProgress(2, 'Uploading high-resolution retinal fundus photograph...');
    const uploadRes = await this.uploadRetinalImage(screening.id, imageFile, eyeSide);

    if (onProgress) onProgress(3, 'Executing optical QC & deep learning inference...');
    const analysisRes = await this.triggerAIAnalysis(screening.id, {
      scenario: preset || 'PROGRESSION',
    });

    if (onProgress) onProgress(4, 'Synthesizing Grad-CAM heatmap & risk trajectory...');
    return {
      screening,
      upload: uploadRes,
      analysis: analysisRes,
    };
  }
};
