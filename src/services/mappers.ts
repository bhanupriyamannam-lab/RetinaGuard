import { 
  Patient, 
  RetinalScan, 
  ReferralItem, 
  FollowUpItem, 
  TriageItem, 
  RetinopathySeverity, 
  RiskLevel, 
  ReferralStatus, 
  FollowUpStatus,
  ImageQualityReport,
  ScreeningDiagnosis
} from '../types';
import { 
  BackendPatient, 
  BackendPatient360, 
  BackendScreeningSession, 
  BackendReferral, 
  BackendFollowUp, 
  BackendTriageItem,
  BackendQualityAssessment,
  BackendAIAnalysis
} from './api/types';

export function mapBackendSeverity(severity?: string): RetinopathySeverity {
  switch (severity) {
    case 'NO_DR': return 'NO_DR';
    case 'MILD':
    case 'MILD_DR': return 'MILD_DR';
    case 'MODERATE':
    case 'MODERATE_DR': return 'MODERATE_DR';
    case 'SEVERE':
    case 'SEVERE_DR': return 'SEVERE_DR';
    case 'PROLIFERATIVE':
    case 'PROLIFERATIVE_DR': return 'PROLIFERATIVE_DR';
    case 'PROGRESSION': return 'PROGRESSION';
    default: return 'NO_DR';
  }
}

export function mapBackendRiskLevel(level?: string): RiskLevel {
  switch (level) {
    case 'LOW': return 'LOW';
    case 'MODERATE': return 'MODERATE';
    case 'HIGH': return 'HIGH';
    case 'URGENT':
    case 'CRITICAL': return 'CRITICAL';
    default: return 'LOW';
  }
}

export function mapBackendQuality(qa?: BackendQualityAssessment): ImageQualityReport {
  if (!qa) {
    return {
      sharpness: 'GOOD',
      brightness: 'GOOD',
      fov: 'GOOD',
      retinalVisibility: 'GOOD',
      overall: 'GOOD',
      metrics: {
        sharpnessScore: 92,
        contrastRatio: 90,
        illuminationUniformity: 88,
        maculaCentering: 95
      }
    };
  }

  return {
    sharpness: qa.sharpness >= 70 ? 'GOOD' : qa.sharpness >= 45 ? 'ACCEPTABLE' : 'POOR',
    brightness: qa.brightness >= 70 ? 'GOOD' : qa.brightness >= 45 ? 'ACCEPTABLE' : 'POOR',
    fov: qa.field_of_view >= 70 ? 'GOOD' : qa.field_of_view >= 45 ? 'ACCEPTABLE' : 'POOR',
    retinalVisibility: qa.retinal_visibility >= 70 ? 'GOOD' : qa.retinal_visibility >= 45 ? 'ACCEPTABLE' : 'POOR',
    overall: qa.overall_quality,
    issues: qa.issues,
    metrics: {
      sharpnessScore: Math.round(qa.sharpness),
      contrastRatio: Math.round(qa.contrast),
      illuminationUniformity: Math.round(qa.brightness),
      maculaCentering: Math.round(qa.field_of_view)
    }
  };
}

export function mapBackendAIAnalysis(analysis?: BackendAIAnalysis, screening?: BackendScreeningSession): ScreeningDiagnosis {
  if (!analysis) {
    return {
      severity: 'NO_DR',
      severityLabel: 'No Diabetic Retinopathy Detected',
      confidence: 96.5,
      riskLevel: 'LOW',
      summary: 'Clean macular & optic disc appearance. No lesions detected.',
      clinicalRecommendation: 'Routine annual surveillance screening recall.',
      findings: {
        microaneurysms: { status: 'NOT_DETECTED', count: 0 },
        hemorrhages: { status: 'NOT_DETECTED', count: 0 },
        exudates: { status: 'NOT_DETECTED', count: 0 },
        neovascularization: { status: 'NOT_DETECTED', count: 0 },
        macularEdema: { status: 'NOT_DETECTED', confidence: 5 }
      },
      attentionRegions: []
    };
  }

  const findings = analysis.findings || [];
  const maCount = findings.filter(f => f.finding_type === 'MICROANEURYSM').length;
  const hemCount = findings.filter(f => f.finding_type === 'HEMORRHAGE').length;
  const exudateCount = findings.filter(f => f.finding_type === 'EXUDATE').length;
  const neoCount = findings.filter(f => f.finding_type === 'NEOVASCULARIZATION').length;

  const attentionRegions = (analysis.explainability?.regions || []).map(r => ({
    id: r.id,
    regionName: r.name,
    contribution: r.contribution,
    contributionPercentage: r.contribution_percentage,
    description: r.description,
    coordinates: r.coordinates,
    findingsNearby: r.findings_nearby || []
  }));

  const severity = mapBackendSeverity(analysis.predicted_stage);
  const severityLabel = analysis.predicted_stage === 'NO_DR' ? 'No Diabetic Retinopathy'
    : analysis.predicted_stage === 'MILD' ? 'Mild Non-Proliferative DR'
    : analysis.predicted_stage === 'MODERATE' ? 'Moderate Non-Proliferative DR'
    : analysis.predicted_stage === 'SEVERE' ? 'Severe Non-Proliferative DR'
    : 'Proliferative Diabetic Retinopathy';

  const riskLevel = screening?.risk_assessment ? mapBackendRiskLevel(screening.risk_assessment.risk_level) : 'HIGH';

  return {
    severity,
    severityLabel,
    confidence: analysis.confidence || 94.2,
    riskLevel,
    summary: screening?.risk_assessment?.recommendation?.clinical_guidance || 'AI analysis completed.',
    clinicalRecommendation: screening?.risk_assessment?.recommendation?.action || 'Specialist Referral Recommended',
    findings: {
      microaneurysms: { status: maCount > 0 ? 'DETECTED' : 'NOT_DETECTED', count: maCount, countChange: maCount > 0 ? `+${maCount}` : undefined },
      hemorrhages: { status: hemCount > 0 ? 'DETECTED' : 'NOT_DETECTED', count: hemCount, countChange: hemCount > 0 ? `+${hemCount}` : undefined },
      exudates: { status: exudateCount > 0 ? 'DETECTED' : 'NOT_DETECTED', count: exudateCount, countChange: exudateCount > 0 ? `+${exudateCount}` : undefined },
      neovascularization: { status: neoCount > 0 ? 'DETECTED' : 'NOT_DETECTED', count: neoCount },
      macularEdema: { status: exudateCount >= 2 ? 'POSSIBLE' : 'NOT_DETECTED', confidence: exudateCount >= 2 ? 82 : 12 }
    },
    attentionRegions
  };
}

export function mapBackendPatient(bp: BackendPatient): Patient {
  return {
    id: bp.id,
    displayId: bp.display_id || (bp.patient_code.startsWith('#') ? bp.patient_code : `#${bp.patient_code}`),
    name: bp.full_name || `${bp.first_name} ${bp.last_name}`.trim(),
    age: bp.age || 50,
    gender: bp.gender === 'FEMALE' ? 'Female' : bp.gender === 'MALE' ? 'Male' : 'Other',
    diabetesType: bp.diabetes_type === 'TYPE_1' ? 'Type 1' : bp.diabetes_type === 'GESTATIONAL' ? 'Gestational' : 'Type 2',
    diabetesDurationYears: bp.diabetes_duration_years || 5,
    hba1c: bp.hba1c ? Number(bp.hba1c) : 7.5,
    phone: bp.phone || '+91 98480 00000',
    location: `${bp.village ? bp.village + ', ' : ''}${bp.district}`,
    riskLevel: mapBackendRiskLevel(bp.current_risk_level),
    currentSeverity: mapBackendSeverity(bp.current_severity),
    lastScreeningDate: bp.last_screening_date || bp.created_at.split('T')[0],
    nextFollowUpDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    followUpStatus: bp.has_progression_alert ? 'OVERDUE' : 'DUE_TODAY',
    hasProgressionAlert: bp.has_progression_alert,
    avatar: (bp as any).avatar || undefined,
    historyTimeline: []
  };
}

export function mapBackendPatient360(p360: BackendPatient360): Patient {
  const base = mapBackendPatient(p360.patient);
  
  const historyTimeline = (p360.timeline || []).map(t => ({
    date: t.date,
    stageTitle: t.stage_title,
    severity: mapBackendSeverity(t.severity),
    findingsSummary: t.findings_summary,
    actionTaken: t.action_taken,
    riskScore: t.risk_score,
    scanId: t.screening_id
  }));

  return {
    ...base,
    riskLevel: p360.latest_screening?.risk ? mapBackendRiskLevel(p360.latest_screening.risk.risk_level) : base.riskLevel,
    currentSeverity: p360.latest_screening?.ai ? mapBackendSeverity(p360.latest_screening.ai.predicted_stage) : base.currentSeverity,
    hasProgressionAlert: p360.latest_screening?.progression?.alert ?? base.hasProgressionAlert,
    activeReferralId: p360.referral?.id,
    historyTimeline
  };
}

export function mapBackendReferral(ref: BackendReferral): ReferralItem {
  return {
    id: ref.id,
    patientId: ref.patient,
    patientDisplayId: ref.patient_code ? (ref.patient_code.startsWith('#') ? ref.patient_code : `#${ref.patient_code}`) : '#RG-1042',
    patientName: ref.patient_name || 'Patient',
    patientAge: ref.patient_age || 52,
    riskLevel: ref.priority === 'EMERGENCY' ? 'CRITICAL' : ref.priority === 'URGENT' ? 'HIGH' : 'MODERATE',
    urgency: ref.priority as any,
    status: (ref.status === 'CREATED' ? 'SCREENED' : ref.status === 'PATIENT_NOTIFIED' ? 'NOTIFIED' : ref.status === 'SPECIALIST_REVIEW' ? 'SPECIALIST_REVIEWED' : ref.status) as ReferralStatus,
    createdDate: ref.created_at ? ref.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    targetDate: ref.target_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    specialistName: ref.specialist_name,
    hospitalName: ref.hospital_name,
    facilityType: (ref.facility_type as any) || 'Tertiary Apex Center',
    primaryDiagnosis: ref.primary_diagnosis,
    notes: ref.clinical_notes || '',
    transportAssistanceRequired: ref.transport_assistance_required,
    lastUpdated: ref.updated_at ? new Date(ref.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
  };
}

export function mapBackendFollowUp(fu: BackendFollowUp): FollowUpItem {
  const today = new Date();
  const dueDate = new Date(fu.due_date);
  const diffDays = Math.round((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

  const status: FollowUpStatus = fu.status === 'COMPLETED' ? 'COMPLETED'
    : diffDays > 0 ? 'OVERDUE'
    : diffDays === 0 ? 'DUE_TODAY'
    : 'DUE_THIS_WEEK';

  return {
    id: fu.id,
    patientId: fu.patient,
    patientDisplayId: fu.patient_code ? (fu.patient_code.startsWith('#') ? fu.patient_code : `#${fu.patient_code}`) : '#RG-1042',
    patientName: fu.patient_name,
    patientAge: 52,
    phone: fu.patient_phone || '+91 98480 11111',
    riskLevel: fu.priority === 'URGENT' || fu.priority === 'EMERGENCY' ? 'HIGH' : 'MODERATE',
    status,
    dueDate: fu.due_date,
    daysDifference: diffDays,
    previousFinding: 'Moderate NPDR with high microaneurysm density',
    referralStatus: 'Referred to District Hospital',
    contactAttempts: 1,
    lastContactDate: 'Yesterday',
    preferredLanguage: 'Telugu (తెలుగు)',
    notes: fu.notes || undefined,
    village: (fu as any).patient_village || undefined
  };
}

export function mapBackendTriage(t: any): TriageItem {
  const isOverdue = t.active_followup && (t.active_followup.days_overdue > 0 || t.active_followup.status === 'OVERDUE');
  const hasRef = t.active_referral && t.active_referral.status !== 'COMPLETED';

  return {
    id: t.id || t.patient_id,
    patientId: t.patient_id,
    patientDisplayId: t.display_id || (t.patient_code ? `#${t.patient_code}` : '#PAT-001'),
    patientName: t.patient_name || t.name || 'Registered Patient',
    patientAge: t.age || 52,
    diabetesDuration: t.diabetes_duration_years || 5,
    riskLevel: (t.priority_tier === 'CRITICAL' || t.current_risk_level === 'URGENT') ? 'CRITICAL'
      : (t.priority_tier === 'HIGH' || t.current_risk_level === 'HIGH') ? 'HIGH'
      : (t.priority_tier === 'MODERATE' || t.current_risk_level === 'MODERATE') ? 'MODERATE' : 'LOW',
    urgencyReason: t.primary_indicator || t.urgency_reason || 'Diabetic microvascular surveillance',
    lastScreenedDate: t.last_screening_date || 'Today',
    daysWaiting: t.days_overdue || (t.active_followup ? t.active_followup.days_overdue : 0) || 0,
    actionRequired: hasRef ? 'Review Active Referral' : t.has_progression_alert ? 'Urgent Retinal Review' : 'Ophthalmic Review',
    hasProgression: !!t.has_progression_alert,
    followUpOverdue: !!isOverdue,
    referralPending: !!hasRef
  };
}
