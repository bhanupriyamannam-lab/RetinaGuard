export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type RetinopathySeverity = 
  | 'NO_DR' 
  | 'MILD_DR' 
  | 'MODERATE_DR' 
  | 'SEVERE_DR' 
  | 'PROLIFERATIVE_DR' 
  | 'PROGRESSION';

export type QualityRating = 'GOOD' | 'ACCEPTABLE' | 'POOR';

export type FindingStatus = 'DETECTED' | 'NOT_DETECTED' | 'POSSIBLE' | 'SUSPECTED';

export type ReferralUrgency = 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'EMERGENCY';

export type ReferralStatus = 
  | 'SCREENED' 
  | 'REFERRED' 
  | 'NOTIFIED' 
  | 'APPOINTMENT_BOOKED' 
  | 'SPECIALIST_REVIEWED' 
  | 'COMPLETED';

export type FollowUpStatus = 'DUE_TODAY' | 'DUE_THIS_WEEK' | 'OVERDUE' | 'COMPLETED';

export interface ImageQualityReport {
  sharpness: QualityRating;
  brightness: QualityRating;
  fov: QualityRating;
  retinalVisibility: QualityRating;
  overall: QualityRating;
  issues?: string[];
  metrics?: {
    sharpnessScore: number;
    contrastRatio: number;
    illuminationUniformity: number;
    maculaCentering: number;
  };
}

export interface AttentionRegion {
  id: string;
  regionName: string;
  contribution: 'High' | 'Moderate' | 'Low';
  contributionPercentage: number;
  description: string;
  coordinates: { x: number; y: number; radius: number; label: string };
  findingsNearby: string[];
}

export interface RetinalFindings {
  microaneurysms: { status: FindingStatus; count: number; countChange?: string };
  hemorrhages: { status: FindingStatus; count: number; countChange?: string };
  exudates: { status: FindingStatus; count: number; countChange?: string };
  neovascularization: { status: FindingStatus; count: number };
  macularEdema: { status: FindingStatus; confidence: number };
}

export interface ScreeningDiagnosis {
  severity: RetinopathySeverity;
  severityLabel: string;
  confidence: number;
  riskLevel: RiskLevel;
  summary: string;
  clinicalRecommendation: string;
  findings: RetinalFindings;
  attentionRegions: AttentionRegion[];
}

export interface RetinalScan {
  id: string;
  patientId: string;
  screeningDate: string;
  eye: 'OD' | 'OS' | 'OU';
  quality: ImageQualityReport;
  diagnosis: ScreeningDiagnosis;
  imageType: 'fundus_normal' | 'fundus_mild' | 'fundus_moderate' | 'fundus_severe' | 'fundus_poor';
  isLocalOnly?: boolean;
  syncedAt?: string;
}

export interface Patient {
  id: string;
  displayId: string; // e.g. #RG-1042
  name: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  diabetesType: 'Type 1' | 'Type 2' | 'Gestational';
  diabetesDurationYears: number;
  hba1c: number;
  phone: string;
  location: string;
  village?: string;
  riskLevel: RiskLevel;
  currentSeverity: RetinopathySeverity;
  lastScreeningDate: string;
  nextFollowUpDate: string;
  followUpStatus: FollowUpStatus;
  daysOverdue?: number;
  hasProgressionAlert?: boolean;
  activeReferralId?: string;
  avatar?: string;
  historyTimeline: {
    date: string;
    stageTitle: string;
    severity: RetinopathySeverity;
    findingsSummary: string;
    actionTaken: string;
    riskScore: number;
    scanId: string;
  }[];
}

export interface TriageItem {
  id: string;
  patientId: string;
  patientDisplayId: string;
  patientName: string;
  patientAge: number;
  diabetesDuration: number;
  riskLevel: RiskLevel;
  urgencyReason: string;
  lastScreenedDate: string;
  daysWaiting: number;
  actionRequired: string;
  hasProgression: boolean;
  followUpOverdue: boolean;
  referralPending: boolean;
}

export interface ReferralItem {
  id: string;
  patientId: string;
  patientDisplayId: string;
  patientName: string;
  patientAge: number;
  riskLevel: RiskLevel;
  urgency: ReferralUrgency;
  status: ReferralStatus;
  createdDate: string;
  targetDate: string;
  specialistName: string;
  hospitalName: string;
  facilityType: 'District Eye Hospital' | 'Tertiary Apex Center' | 'Mobile Tele-Ophthalmology Unit';
  primaryDiagnosis: string;
  notes: string;
  transportAssistanceRequired: boolean;
  lastUpdated: string;
}

export interface FollowUpItem {
  id: string;
  patientId: string;
  patientDisplayId: string;
  patientName: string;
  patientAge: number;
  phone: string;
  riskLevel: RiskLevel;
  status: FollowUpStatus;
  dueDate: string;
  firstVisitedDate?: string; // 1st Visit Date (Initial Screening Date, e.g. from #2026/28/08/0)
  lastVisitedDate?: string;  // 2nd Visit Date (Last Examined / Follow-up Date)
  daysDifference: number; // positive = overdue, negative = days until due
  previousFinding: string;
  referralStatus: string;
  contactAttempts: number;
  lastContactDate?: string;
  preferredLanguage: string;
  notes?: string;
  village?: string;
  recallChannel?: 'SMS' | 'CALL' | 'ASHA_VISIT';
  outreachLogs?: {
    id: string;
    type: 'CALL' | 'SMS' | 'WHATSAPP';
    timestamp: string;
    outcome: string;
    details?: string;
    screener?: string;
    language?: string;
    audioRecordingUrl?: string;
    audioDuration?: string;
    conversationTranscript?: string;
  }[];
}

export interface CampSession {
  id: string;
  campName: string;
  location: string;
  district: string;
  date: string;
  targetCount: number;
  screenedCount: number;
  highRiskCount: number;
  referralsCount: number;
  leadWorker: string;
  batteryLevel: number;
  isOfflineMode: boolean;
  pendingSyncCount: number;
}

export type DemoScenarioType = 
  | 'HEALTHY_SCAN'
  | 'MODERATE_DR'
  | 'POSSIBLE_PROGRESSION'
  | 'POOR_IMAGE_QUALITY'
  | 'OFFLINE_SCREENING'
  | 'FOLLOWUP_OVERDUE';

export type LanguageCode = 'en' | 'te' | 'hi' | 'ta';
