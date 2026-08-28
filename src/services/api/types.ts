/**
 * TypeScript definitions mapping to RetinaGuard Django REST Framework backend schemas.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[] | string>;
}

export interface BackendUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'DOCTOR' | 'HEALTHCARE_WORKER' | 'SCREENING_OPERATOR' | 'PATIENT';
  phone?: string;
  designation?: string;
  organization?: string;
  organization_name?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: BackendUser;
}

export interface BackendPatient {
  id: string;
  patient_code: string;
  display_id?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: 'FEMALE' | 'MALE' | 'OTHER';
  date_of_birth?: string;
  age: number;
  phone: string;
  village?: string;
  district: string;
  state: string;
  organization: string;
  organization_name?: string;
  diabetes_type: 'TYPE_1' | 'TYPE_2' | 'GESTATIONAL';
  diabetes_duration_years: number;
  hba1c?: number;
  current_risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT';
  current_severity: 'NO_DR' | 'MILD' | 'MODERATE' | 'SEVERE' | 'PROLIFERATIVE' | 'UNDETERMINED';
  has_progression_alert: boolean;
  last_screening_date?: string;
  created_at: string;
  updated_at: string;
}

export interface BackendConsent {
  id: string;
  consent_type: string;
  granted: boolean;
  granted_at: string;
  signature_hash?: string;
  notes?: string;
}

export interface BackendTimelineEvent {
  id: string;
  date: string;
  stage_title: string;
  severity: string;
  findings_summary: string;
  action_taken: string;
  risk_score: number;
  screening_id: string;
}

export interface BackendPatient360 {
  patient: BackendPatient;
  latest_screening?: {
    id: string;
    screening_code: string;
    date: string;
    status: string;
    images_count: number;
    ai?: BackendAIAnalysis;
    risk?: BackendRisk;
    explanation?: BackendExplainability;
    progression?: {
      alert: boolean;
      status: string;
      message: string;
      deltas: any[];
    };
  };
  referral?: {
    id: string;
    status: string;
    priority: string;
    specialist_name: string;
    hospital_name: string;
    target_date: string;
  };
  followup?: {
    id: string;
    due_date: string;
    status: string;
    priority: string;
    is_overdue: boolean;
    channel: string;
  };
  timeline: BackendTimelineEvent[];
  risk_trajectory: { date: string; risk_score: number; severity: string }[];
  consents: BackendConsent[];
}

export interface BackendQualityAssessment {
  id: string;
  overall_quality: 'GOOD' | 'ACCEPTABLE' | 'POOR';
  sharpness: number;
  brightness: number;
  contrast: number;
  retinal_visibility: number;
  field_of_view: number;
  issues: string[];
  recommendation: 'ACCEPT' | 'RETAKE' | 'MANUAL_REVIEW';
  assessed_at: string;
}

export interface BackendFinding {
  id: string;
  finding_type: 'MICROANEURYSM' | 'HEMORRHAGE' | 'EXUDATE' | 'NEOVASCULARIZATION' | 'COTTON_WOOL_SPOT' | 'MACULAR_EDEMA' | 'OPTIC_DISC_NORMAL';
  confidence: number;
  severity: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  eye_side: 'RIGHT' | 'LEFT' | 'BOTH';
  metadata?: Record<string, any>;
}

export interface BackendRegion {
  id: string;
  name: string;
  contribution: 'High' | 'Moderate' | 'Low';
  contribution_percentage: number;
  description: string;
  coordinates: { x: number; y: number; radius: number; label: string };
  findings_nearby: string[];
}

export interface BackendExplainability {
  id: string;
  method: string;
  heatmap_url?: string;
  overlay_url?: string;
  regions: BackendRegion[];
  metadata?: Record<string, any>;
}

export interface BackendAIAnalysis {
  id: string;
  screening: string;
  provider: string;
  model_name: string;
  model_version: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  predicted_stage: 'NO_DR' | 'MILD' | 'MODERATE' | 'SEVERE' | 'PROLIFERATIVE' | 'UNDETERMINED';
  confidence: number;
  processing_time_ms: number;
  findings: BackendFinding[];
  explainability?: BackendExplainability;
  is_simulation: boolean;
  created_at: string;
}

export interface BackendRisk {
  id?: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'URGENT';
  risk_score: number;
  risk_factors: string[];
  recommendation: {
    action: string;
    timeframe_days: number;
    target_facility: string;
    transport_assistance: boolean;
    clinical_guidance: string;
  };
  is_prototype_score?: boolean;
}

export interface BackendRetinalImage {
  id: string;
  screening: string;
  eye_side: 'RIGHT' | 'LEFT';
  image_url: string;
  status: string;
  quality_assessment?: BackendQualityAssessment;
  uploaded_at: string;
}

export interface BackendScreeningSession {
  id: string;
  screening_code: string;
  patient: string;
  patient_code: string;
  patient_name: string;
  organization: string;
  organization_name?: string;
  screening_camp?: string;
  performed_by?: string;
  status: 'CREATED' | 'IMAGE_PENDING' | 'QUALITY_CHECK' | 'ANALYZING' | 'ANALYZED' | 'REVIEW_REQUIRED' | 'REFERRED' | 'COMPLETED' | 'FAILED';
  screening_date: string;
  notes?: string;
  images: BackendRetinalImage[];
  latest_ai_analysis?: BackendAIAnalysis;
  risk_assessment?: BackendRisk;
  created_at: string;
  updated_at: string;
}

export interface BackendReferral {
  id: string;
  patient: string;
  patient_code: string;
  patient_name: string;
  patient_age?: number;
  screening?: string;
  created_by?: string;
  assigned_doctor?: string;
  doctor_name?: string;
  facility_type: string;
  hospital_name: string;
  specialist_name: string;
  priority: 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'EMERGENCY';
  status: 'CREATED' | 'REFERRED' | 'PATIENT_NOTIFIED' | 'APPOINTMENT_BOOKED' | 'SPECIALIST_REVIEW' | 'COMPLETED' | 'CANCELLED';
  primary_diagnosis: string;
  target_date?: string;
  transport_assistance_required: boolean;
  clinical_notes?: string;
  created_at: string;
  updated_at: string;
  stage_history?: {
    id: string;
    from_stage: string;
    to_stage: string;
    changed_by_name?: string;
    notes?: string;
    timestamp: string;
  }[];
}

export interface BackendFollowUp {
  id: string;
  patient: string;
  patient_code: string;
  patient_name: string;
  patient_phone?: string;
  referral?: string;
  screening?: string;
  due_date: string;
  completed_date?: string;
  status: 'UPCOMING' | 'DUE' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED';
  priority: 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'EMERGENCY';
  recall_channel: 'SMS' | 'PHONE_CALL' | 'ASHA_VISIT' | 'WHATSAPP';
  notes?: string;
  assigned_to?: string;
  created_at: string;
}

export interface BackendCamp {
  id: string;
  name: string;
  organization: string;
  organization_name?: string;
  location: string;
  district: string;
  state: string;
  start_date: string;
  end_date: string;
  target_capacity: number;
  screened_count: number;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  coordinator_name?: string;
  notes?: string;
}

export interface BackendCampStats {
  camp_id: string;
  camp_name: string;
  target_capacity: number;
  screened_count: number;
  high_risk_count: number;
  referrals_generated: number;
  completion_rate: number;
  status: string;
}

export interface BackendDashboardKPIs {
  total_patients: number;
  total_screened: number;
  high_risk_patients: number;
  active_referrals: number;
  total_referrals: number;
  completed_referrals: number;
  followups_due_today: number;
  followups_overdue: number;
  active_camps: number;
  high_risk_yield_rate: number;
}

export interface BackendTriageItem {
  id: string;
  patient_id: string;
  patient_code: string;
  display_id: string;
  name: string;
  age: number;
  diabetes_duration_years: number;
  hba1c?: number;
  risk_level: string;
  risk_score: number;
  severity: string;
  has_progression_alert: boolean;
  priority_score: number;
  urgency_reason: string;
  recommended_action: string;
  last_screening_date?: string;
  days_overdue: number;
  active_referral?: boolean;
}
