import { Patient, RetinalScan, TriageItem, ReferralItem, FollowUpItem, CampSession } from '../types';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p-1042',
    displayId: '#RG-1042',
    name: 'Anita Rao',
    age: 54,
    gender: 'Female',
    diabetesType: 'Type 2',
    diabetesDurationYears: 8,
    hba1c: 8.4,
    phone: '+91 98450 31245',
    location: 'Bheemunipatnam Rural Ward 4',
    riskLevel: 'HIGH',
    currentSeverity: 'PROGRESSION',
    lastScreeningDate: '2026-07-15',
    nextFollowUpDate: '2026-08-01',
    followUpStatus: 'OVERDUE',
    daysOverdue: 14,
    hasProgressionAlert: true,
    activeReferralId: 'ref-301',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    historyTimeline: [
      {
        date: 'Jan 18, 2025',
        stageTitle: 'No Apparent DR',
        severity: 'NO_DR',
        findingsSummary: 'Clear fundus, no microaneurysms detected. Optic disc and fovea sharp.',
        actionTaken: 'Routine annual diabetic eye screening scheduled.',
        riskScore: 12,
        scanId: 'scan-1042-1'
      },
      {
        date: 'Jul 22, 2025',
        stageTitle: 'Mild Non-Proliferative DR',
        severity: 'MILD_DR',
        findingsSummary: '3 isolated microaneurysms in temporal perifoveal region. No exudates or edema.',
        actionTaken: 'Glycemic control reinforced. Follow-up tightened to 6 months.',
        riskScore: 38,
        scanId: 'scan-1042-2'
      },
      {
        date: 'Jan 14, 2026',
        stageTitle: 'Moderate Non-Proliferative DR',
        severity: 'MODERATE_DR',
        findingsSummary: '3 microaneurysms, 1 blot hemorrhage along inferior arcade. Trace lipid.',
        actionTaken: 'Tele-consult requested. Retinal monitoring initiated.',
        riskScore: 65,
        scanId: 'scan-1042-3'
      },
      {
        date: 'Jul 15, 2026',
        stageTitle: 'Possible Progression Alert',
        severity: 'PROGRESSION',
        findingsSummary: '8 microaneurysms (+5), 4 hemorrhages (+3), 2 hard exudates clusters (+2). Inferior arcade activity.',
        actionTaken: 'URGENT ophthalmology referral initiated. Specialist review requested within 14 days.',
        riskScore: 89,
        scanId: 'scan-1042-4'
      }
    ]
  },
  {
    id: 'p-1051',
    displayId: '#RG-1051',
    name: 'Ramesh Kumar',
    age: 58,
    gender: 'Male',
    diabetesType: 'Type 2',
    diabetesDurationYears: 12,
    hba1c: 7.9,
    phone: '+91 94481 72910',
    location: 'Anandapuram Health Sub-Center',
    riskLevel: 'MODERATE',
    currentSeverity: 'MODERATE_DR',
    lastScreeningDate: '2026-05-18',
    nextFollowUpDate: '2026-08-18',
    followUpStatus: 'DUE_TODAY',
    hasProgressionAlert: false,
    activeReferralId: 'ref-304',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    historyTimeline: [
      {
        date: 'Nov 10, 2025',
        stageTitle: 'Mild DR',
        severity: 'MILD_DR',
        findingsSummary: '2 microaneurysms detected in nasal quadrant.',
        actionTaken: '6-month screening advised.',
        riskScore: 35,
        scanId: 'scan-1051-1'
      },
      {
        date: 'May 18, 2026',
        stageTitle: 'Moderate DR',
        severity: 'MODERATE_DR',
        findingsSummary: 'Microaneurysms and small dot hemorrhages in inferior temporal arcade.',
        actionTaken: 'Referred to district tele-ophthalmology unit.',
        riskScore: 62,
        scanId: 'scan-1051-2'
      }
    ]
  },
  {
    id: 'p-1031',
    displayId: '#RG-1031',
    name: 'Sunita Verma',
    age: 62,
    gender: 'Female',
    diabetesType: 'Type 2',
    diabetesDurationYears: 15,
    hba1c: 9.1,
    phone: '+91 98230 45678',
    location: 'Padmanabham Community Hall',
    riskLevel: 'HIGH',
    currentSeverity: 'MODERATE_DR',
    lastScreeningDate: '2026-02-10',
    nextFollowUpDate: '2026-08-10',
    followUpStatus: 'OVERDUE',
    daysOverdue: 18,
    hasProgressionAlert: false,
    activeReferralId: 'ref-302',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    historyTimeline: [
      {
        date: 'Feb 10, 2026',
        stageTitle: 'Moderate DR with Macular Threat',
        severity: 'MODERATE_DR',
        findingsSummary: 'Multiple microaneurysms, blot hemorrhages near macula boundary.',
        actionTaken: 'Ophthalmology appointment referral issued.',
        riskScore: 78,
        scanId: 'scan-1031-1'
      }
    ]
  },
  {
    id: 'p-1088',
    displayId: '#RG-1088',
    name: 'Rajesh Patel',
    age: 48,
    gender: 'Male',
    diabetesType: 'Type 2',
    diabetesDurationYears: 4,
    hba1c: 6.8,
    phone: '+91 97123 88990',
    location: 'Tagarapuvalasa PHC',
    riskLevel: 'LOW',
    currentSeverity: 'NO_DR',
    lastScreeningDate: '2026-08-20',
    nextFollowUpDate: '2027-08-20',
    followUpStatus: 'COMPLETED',
    hasProgressionAlert: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    historyTimeline: [
      {
        date: 'Aug 20, 2026',
        stageTitle: 'Healthy Normal Retina',
        severity: 'NO_DR',
        findingsSummary: 'Normal retinal vasculature, crisp optic cup/disc ratio 0.3, sharp fovea.',
        actionTaken: 'Standard 12-month annual screening scheduled.',
        riskScore: 8,
        scanId: 'scan-1088-1'
      }
    ]
  },
  {
    id: 'p-1029',
    displayId: '#RG-1029',
    name: 'Lakshmi Devi',
    age: 51,
    gender: 'Female',
    diabetesType: 'Type 2',
    diabetesDurationYears: 14,
    hba1c: 9.8,
    phone: '+91 98840 11223',
    location: 'Chittivalasa Camp Centre',
    riskLevel: 'CRITICAL',
    currentSeverity: 'PROLIFERATIVE_DR',
    lastScreeningDate: '2026-08-24',
    nextFollowUpDate: '2026-08-29',
    followUpStatus: 'DUE_THIS_WEEK',
    hasProgressionAlert: true,
    activeReferralId: 'ref-300',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    historyTimeline: [
      {
        date: 'Aug 24, 2026',
        stageTitle: 'Proliferative DR / Severe Ischemia',
        severity: 'PROLIFERATIVE_DR',
        findingsSummary: 'Extensive hemorrhages across 4 quadrants, suspected neovascularization tufts at disc margin.',
        actionTaken: 'EMERGENCY referral to Apex Eye Hospital for panretinal photocoagulation evaluation.',
        riskScore: 96,
        scanId: 'scan-1029-1'
      }
    ]
  },
  {
    id: 'p-1077',
    displayId: '#RG-1077',
    name: 'Mohammed Imran',
    age: 44,
    gender: 'Male',
    diabetesType: 'Type 1',
    diabetesDurationYears: 10,
    hba1c: 7.2,
    phone: '+91 93910 88231',
    location: 'Gajuwaka Sub-Center',
    riskLevel: 'LOW',
    currentSeverity: 'MILD_DR',
    lastScreeningDate: '2026-08-10',
    nextFollowUpDate: '2027-02-10',
    followUpStatus: 'COMPLETED',
    hasProgressionAlert: false,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    historyTimeline: [
      {
        date: 'Aug 10, 2026',
        stageTitle: 'Mild Stable DR',
        severity: 'MILD_DR',
        findingsSummary: 'Single microaneurysm in superior temporal quadrant. No leakage or edema.',
        actionTaken: '6-month surveillance plan created.',
        riskScore: 24,
        scanId: 'scan-1077-1'
      }
    ]
  }
];

export const MOCK_SCANS: Record<string, RetinalScan> = {
  'scan-1042-4': {
    id: 'scan-1042-4',
    patientId: 'p-1042',
    screeningDate: '2026-07-15T10:30:00Z',
    eye: 'OD',
    imageType: 'fundus_moderate',
    quality: {
      sharpness: 'GOOD',
      brightness: 'GOOD',
      fov: 'GOOD',
      retinalVisibility: 'GOOD',
      overall: 'GOOD',
      metrics: {
        sharpnessScore: 92,
        contrastRatio: 94,
        illuminationUniformity: 88,
        maculaCentering: 95
      }
    },
    diagnosis: {
      severity: 'PROGRESSION',
      severityLabel: 'Possible Progression (Moderate NPDR)',
      confidence: 94.2,
      riskLevel: 'HIGH',
      summary: 'Significant increase in microaneurysms and flame hemorrhages compared to scan on Jan 14, 2026. New hard exudates detected in superior-temporal zone.',
      clinicalRecommendation: 'Direct referral to vitreoretinal ophthalmologist within 14 days. Optical Coherence Tomography (OCT) recommended to rule out diabetic macular edema.',
      findings: {
        microaneurysms: { status: 'DETECTED', count: 8, countChange: '3 → 8 (+5)' },
        hemorrhages: { status: 'DETECTED', count: 4, countChange: '1 → 4 (+3)' },
        exudates: { status: 'DETECTED', count: 2, countChange: '0 → 2 (+2)' },
        neovascularization: { status: 'NOT_DETECTED', count: 0 },
        macularEdema: { status: 'POSSIBLE', confidence: 68 }
      },
      attentionRegions: [
        {
          id: 'inferior',
          regionName: 'Inferior Retinal Region',
          contribution: 'High',
          contributionPercentage: 58,
          description: 'High concentration of flame hemorrhages and microvascular leakage along inferior vascular arcade.',
          coordinates: { x: 340, y: 380, radius: 85, label: 'Inferior Arcade Activity' },
          findingsNearby: ['Microaneurysms (x5)', 'Blot Hemorrhage (x2)']
        },
        {
          id: 'temporal',
          regionName: 'Temporal Perifoveal Region',
          contribution: 'Moderate',
          contributionPercentage: 29,
          description: 'Hard exudates forming early circinate rings 500μm from foveal avascular zone boundary.',
          coordinates: { x: 420, y: 220, radius: 65, label: 'Lipid Exudates' },
          findingsNearby: ['Hard Exudates (x2)', 'Microaneurysms (x2)']
        },
        {
          id: 'macular',
          regionName: 'Macular Core Region',
          contribution: 'Low',
          contributionPercentage: 13,
          description: 'Subtle foveal reflex preservation, minimal central disruption detected.',
          coordinates: { x: 360, y: 280, radius: 45, label: 'Foveal Center' },
          findingsNearby: ['Normal Central Reflex']
        }
      ]
    }
  },
  'scan-1042-3': {
    id: 'scan-1042-3',
    patientId: 'p-1042',
    screeningDate: '2026-01-14T09:15:00Z',
    eye: 'OD',
    imageType: 'fundus_moderate',
    quality: {
      sharpness: 'GOOD',
      brightness: 'GOOD',
      fov: 'GOOD',
      retinalVisibility: 'GOOD',
      overall: 'GOOD'
    },
    diagnosis: {
      severity: 'MODERATE_DR',
      severityLabel: 'Moderate Non-Proliferative DR',
      confidence: 91.8,
      riskLevel: 'MODERATE',
      summary: '3 microaneurysms and 1 blot hemorrhage. No exudates present.',
      clinicalRecommendation: 'Routine 6-month surveillance with A1c optimization.',
      findings: {
        microaneurysms: { status: 'DETECTED', count: 3 },
        hemorrhages: { status: 'DETECTED', count: 1 },
        exudates: { status: 'NOT_DETECTED', count: 0 },
        neovascularization: { status: 'NOT_DETECTED', count: 0 },
        macularEdema: { status: 'NOT_DETECTED', confidence: 12 }
      },
      attentionRegions: []
    }
  },
  'scan-healthy': {
    id: 'scan-healthy-01',
    patientId: 'p-1088',
    screeningDate: '2026-08-20T11:00:00Z',
    eye: 'OU',
    imageType: 'fundus_normal',
    quality: {
      sharpness: 'GOOD',
      brightness: 'GOOD',
      fov: 'GOOD',
      retinalVisibility: 'GOOD',
      overall: 'GOOD',
      metrics: {
        sharpnessScore: 96,
        contrastRatio: 92,
        illuminationUniformity: 94,
        maculaCentering: 97
      }
    },
    diagnosis: {
      severity: 'NO_DR',
      severityLabel: 'No Apparent Diabetic Retinopathy',
      confidence: 98.4,
      riskLevel: 'LOW',
      summary: 'Clean retinal fundus with normal vascular caliber. No microaneurysms, hemorrhages, or exudative deposits found.',
      clinicalRecommendation: 'Repeat standard screening in 12 months. Maintain target HbA1c < 7.0%.',
      findings: {
        microaneurysms: { status: 'NOT_DETECTED', count: 0 },
        hemorrhages: { status: 'NOT_DETECTED', count: 0 },
        exudates: { status: 'NOT_DETECTED', count: 0 },
        neovascularization: { status: 'NOT_DETECTED', count: 0 },
        macularEdema: { status: 'NOT_DETECTED', confidence: 2 }
      },
      attentionRegions: [
        {
          id: 'optic-disc',
          regionName: 'Optic Disc & Vasculature',
          contribution: 'High',
          contributionPercentage: 60,
          description: 'Sharp disc margins, physiologic cup/disc ratio 0.3.',
          coordinates: { x: 220, y: 270, radius: 60, label: 'Optic Disc' },
          findingsNearby: ['Healthy Cup/Disc']
        },
        {
          id: 'macula',
          regionName: 'Macula & Fovea',
          contribution: 'Moderate',
          contributionPercentage: 35,
          description: 'Uniform avascular zone, bright foveal reflex.',
          coordinates: { x: 380, y: 280, radius: 50, label: 'Fovea' },
          findingsNearby: ['Intact Fovea']
        }
      ]
    }
  },
  'scan-poor-quality': {
    id: 'scan-poor-01',
    patientId: 'p-1051',
    screeningDate: '2026-08-28T08:20:00Z',
    eye: 'OS',
    imageType: 'fundus_poor',
    quality: {
      sharpness: 'POOR',
      brightness: 'POOR',
      fov: 'ACCEPTABLE',
      retinalVisibility: 'POOR',
      overall: 'POOR',
      issues: [
        'Severe motion blur detected during capture',
        'Sub-optimal illumination / Low brightness (underexposed by -2.4 EV)',
        'Media opacity / Cataract flare artifact along superior margin'
      ],
      metrics: {
        sharpnessScore: 32,
        contrastRatio: 28,
        illuminationUniformity: 41,
        maculaCentering: 60
      }
    },
    diagnosis: {
      severity: 'NO_DR',
      severityLabel: 'Inconclusive — Quality Insufficient',
      confidence: 34.0,
      riskLevel: 'LOW',
      summary: 'Image resolution and contrast below clinical threshold. AI inference aborted to prevent misclassification.',
      clinicalRecommendation: 'Dilate pupil if possible and retake retinal photograph in darkened room.',
      findings: {
        microaneurysms: { status: 'SUSPECTED', count: 0 },
        hemorrhages: { status: 'SUSPECTED', count: 0 },
        exudates: { status: 'SUSPECTED', count: 0 },
        neovascularization: { status: 'NOT_DETECTED', count: 0 },
        macularEdema: { status: 'SUSPECTED', confidence: 0 }
      },
      attentionRegions: []
    }
  }
};

export const MOCK_TRIAGE_ITEMS: TriageItem[] = [
  {
    id: 'tri-01',
    patientId: 'p-1042',
    patientDisplayId: '#RG-1042',
    patientName: 'Anita Rao',
    patientAge: 54,
    diabetesDuration: 8,
    riskLevel: 'HIGH',
    urgencyReason: 'Rapid progression alert (+5 microaneurysms, +3 hemorrhages in 6 mo)',
    lastScreenedDate: 'Jul 15, 2026 (6 weeks ago)',
    daysWaiting: 14,
    actionRequired: 'Review scan diff & confirm referral',
    hasProgression: true,
    followUpOverdue: true,
    referralPending: true
  },
  {
    id: 'tri-02',
    patientId: 'p-1029',
    patientDisplayId: '#RG-1029',
    patientName: 'Lakshmi Devi',
    patientAge: 51,
    diabetesDuration: 14,
    riskLevel: 'CRITICAL',
    urgencyReason: 'Suspected proliferative neovascularization & extensive 4-quadrant hemorrhages',
    lastScreenedDate: 'Aug 24, 2026 (4 days ago)',
    daysWaiting: 4,
    actionRequired: 'Urgent Apex Retina Center dispatch',
    hasProgression: true,
    followUpOverdue: false,
    referralPending: true
  },
  {
    id: 'tri-03',
    patientId: 'p-1031',
    patientDisplayId: '#RG-1031',
    patientName: 'Sunita Verma',
    patientAge: 62,
    diabetesDuration: 15,
    riskLevel: 'HIGH',
    urgencyReason: 'Follow-up overdue by 18 days with untreated moderate retinopathy',
    lastScreenedDate: 'Feb 10, 2026 (6 months ago)',
    daysWaiting: 18,
    actionRequired: 'Direct ASHA worker telephone contact',
    hasProgression: false,
    followUpOverdue: true,
    referralPending: true
  },
  {
    id: 'tri-04',
    patientId: 'p-1051',
    patientDisplayId: '#RG-1051',
    patientName: 'Ramesh Kumar',
    patientAge: 58,
    diabetesDuration: 12,
    riskLevel: 'MODERATE',
    urgencyReason: 'Moderate NPDR with microaneurysms, scheduled checkup due today',
    lastScreenedDate: 'May 18, 2026 (3 months ago)',
    daysWaiting: 0,
    actionRequired: 'Routine tele-consult review',
    hasProgression: false,
    followUpOverdue: false,
    referralPending: false
  },
  {
    id: 'tri-05',
    patientId: 'p-1014',
    patientDisplayId: '#RG-1014',
    patientName: 'Meenakshi S',
    patientAge: 67,
    diabetesDuration: 16,
    riskLevel: 'HIGH',
    urgencyReason: 'Suspected diabetic macular edema threatening fovea',
    lastScreenedDate: 'Aug 12, 2026 (16 days ago)',
    daysWaiting: 7,
    actionRequired: 'Order Optical Coherence Tomography (OCT)',
    hasProgression: false,
    followUpOverdue: false,
    referralPending: true
  },
  {
    id: 'tri-06',
    patientId: 'p-1065',
    patientDisplayId: '#RG-1065',
    patientName: 'K. Venkatesh',
    patientAge: 59,
    diabetesDuration: 9,
    riskLevel: 'MODERATE',
    urgencyReason: 'Moderate non-proliferative changes requiring second tele-opinion',
    lastScreenedDate: 'Aug 02, 2026 (26 days ago)',
    daysWaiting: 9,
    actionRequired: 'Assign to visiting specialist queue',
    hasProgression: false,
    followUpOverdue: false,
    referralPending: true
  }
];

export const MOCK_REFERRALS: ReferralItem[] = [
  {
    id: 'ref-301',
    patientId: 'p-1042',
    patientDisplayId: '#RG-1042',
    patientName: 'Anita Rao',
    patientAge: 54,
    riskLevel: 'HIGH',
    urgency: 'URGENT',
    status: 'NOTIFIED',
    createdDate: '2026-07-16',
    targetDate: '2026-07-30',
    specialistName: 'Dr. Arvind Swaminathan (Vitreoretinal Surgeon)',
    hospitalName: 'Visakha Government Regional Eye Hospital',
    facilityType: 'Tertiary Apex Center',
    primaryDiagnosis: 'Moderate NPDR with Rapid Progression & Early DME',
    notes: 'Patient notified via SMS & phone. Transport coordinator assigned for rural pickup.',
    transportAssistanceRequired: true,
    lastUpdated: '2 hours ago'
  },
  {
    id: 'ref-300',
    patientId: 'p-1029',
    patientDisplayId: '#RG-1029',
    patientName: 'Lakshmi Devi',
    patientAge: 51,
    riskLevel: 'CRITICAL',
    urgency: 'EMERGENCY',
    status: 'APPOINTMENT_BOOKED',
    createdDate: '2026-08-24',
    targetDate: '2026-08-29',
    specialistName: 'Dr. Sunanda Mukherjee',
    hospitalName: 'Apex Regional Institute of Ophthalmology',
    facilityType: 'Tertiary Apex Center',
    primaryDiagnosis: 'Proliferative Diabetic Retinopathy (PDR)',
    notes: 'Slot confirmed: Monday 10:00 AM. Emergency laser photocoagulation evaluation.',
    transportAssistanceRequired: true,
    lastUpdated: 'Yesterday'
  },
  {
    id: 'ref-302',
    patientId: 'p-1031',
    patientDisplayId: '#RG-1031',
    patientName: 'Sunita Verma',
    patientAge: 62,
    riskLevel: 'HIGH',
    urgency: 'PRIORITY',
    status: 'REFERRED',
    createdDate: '2026-08-10',
    targetDate: '2026-08-25',
    specialistName: 'Dr. P. R. Reddy',
    hospitalName: 'District Community Eye Clinic',
    facilityType: 'District Eye Hospital',
    primaryDiagnosis: 'Moderate NPDR with hard exudates',
    notes: 'Referral letter generated. Patient pending confirmation call.',
    transportAssistanceRequired: false,
    lastUpdated: '3 days ago'
  },
  {
    id: 'ref-303',
    patientId: 'p-1014',
    patientDisplayId: '#RG-1014',
    patientName: 'Meenakshi S',
    patientAge: 67,
    riskLevel: 'HIGH',
    urgency: 'URGENT',
    status: 'SPECIALIST_REVIEWED',
    createdDate: '2026-08-13',
    targetDate: '2026-08-27',
    specialistName: 'Dr. Arvind Swaminathan',
    hospitalName: 'Visakha Government Regional Eye Hospital',
    facilityType: 'Tertiary Apex Center',
    primaryDiagnosis: 'Clinically Significant Macular Edema (CSME)',
    notes: 'OCT completed: central retinal thickness 340μm. Anti-VEGF injection scheduled.',
    transportAssistanceRequired: false,
    lastUpdated: '5 days ago'
  },
  {
    id: 'ref-304',
    patientId: 'p-1051',
    patientDisplayId: '#RG-1051',
    patientName: 'Ramesh Kumar',
    patientAge: 58,
    riskLevel: 'MODERATE',
    urgency: 'ROUTINE',
    status: 'COMPLETED',
    createdDate: '2026-05-20',
    targetDate: '2026-06-15',
    specialistName: 'Dr. Harish Rao',
    hospitalName: 'Tele-Ophthalmology Primary Node',
    facilityType: 'Mobile Tele-Ophthalmology Unit',
    primaryDiagnosis: 'Stable Moderate NPDR',
    notes: 'Reviewed and confirmed. Continue glycemic control and 6-month imaging.',
    transportAssistanceRequired: false,
    lastUpdated: '2 months ago'
  }
];

export const MOCK_FOLLOW_UPS: FollowUpItem[] = [
  {
    id: 'fol-01',
    patientId: 'p-1031',
    patientDisplayId: '#RG-1031',
    patientName: 'Sunita Verma',
    patientAge: 62,
    phone: '+91 98230 45678',
    riskLevel: 'HIGH',
    status: 'OVERDUE',
    dueDate: 'Aug 10, 2026',
    daysDifference: 18, // 18 days overdue
    previousFinding: 'Moderate DR with Hard Exudates',
    referralStatus: 'Referred (Pending Visit)',
    contactAttempts: 2,
    lastContactDate: 'Aug 22, 2026 (No response)',
    preferredLanguage: 'Telugu'
  },
  {
    id: 'fol-02',
    patientId: 'p-1042',
    patientDisplayId: '#RG-1042',
    patientName: 'Anita Rao',
    patientAge: 54,
    phone: '+91 98450 31245',
    riskLevel: 'HIGH',
    status: 'OVERDUE',
    dueDate: 'Aug 01, 2026',
    daysDifference: 14, // 14 days overdue
    previousFinding: 'Possible Progression (+5 MA, +3 Hemorrhages)',
    referralStatus: 'Patient Notified',
    contactAttempts: 3,
    lastContactDate: 'Aug 26, 2026 (Confirmed visit for next Tuesday)',
    preferredLanguage: 'English / Telugu'
  },
  {
    id: 'fol-03',
    patientId: 'p-1051',
    patientDisplayId: '#RG-1051',
    patientName: 'Ramesh Kumar',
    patientAge: 58,
    phone: '+91 94481 72910',
    riskLevel: 'MODERATE',
    status: 'DUE_TODAY',
    dueDate: 'Today (Aug 28, 2026)',
    daysDifference: 0,
    previousFinding: 'Moderate NPDR (Microaneurysms & blot)',
    referralStatus: 'Tele-consult Scheduled',
    contactAttempts: 1,
    lastContactDate: 'Yesterday (SMS Reminder Sent)',
    preferredLanguage: 'Telugu'
  },
  {
    id: 'fol-04',
    patientId: 'p-1029',
    patientDisplayId: '#RG-1029',
    patientName: 'Lakshmi Devi',
    patientAge: 51,
    phone: '+91 98840 11223',
    riskLevel: 'CRITICAL',
    status: 'DUE_THIS_WEEK',
    dueDate: 'Aug 29, 2026 (Tomorrow)',
    daysDifference: -1,
    previousFinding: 'Proliferative DR (Critical)',
    referralStatus: 'Appointment Booked (Apex Hospital)',
    contactAttempts: 2,
    lastContactDate: 'Aug 27, 2026 (Transport arranged)',
    preferredLanguage: 'Telugu'
  }
];

export const MOCK_CAMP_SESSION: CampSession = {
  id: 'camp-2026-08',
  campName: 'Bheemunipatnam Rural Eye Health Camp',
  location: 'Primary Health Centre (PHC), Ward 4',
  district: 'Visakhapatnam District',
  date: 'Today, 28 August 2026',
  targetCount: 100,
  screenedCount: 64,
  highRiskCount: 5,
  referralsCount: 8,
  leadWorker: 'Kavitha Devi (Senior ASHA Coordinator)',
  batteryLevel: 84,
  isOfflineMode: false,
  pendingSyncCount: 7
};

export const MOCK_UNSYNCED_CASES = [
  { id: 'offline-01', name: 'G. Nookaraju', age: 61, village: 'Kothavalasa', severity: 'MILD_DR', time: '09:14 AM' },
  { id: 'offline-02', name: 'P. Appanna', age: 55, village: 'Kothavalasa', severity: 'MODERATE_DR', time: '09:28 AM' },
  { id: 'offline-03', name: 'M. Varalakshmi', age: 49, village: 'Bheemili Ward 2', severity: 'NO_DR', time: '09:45 AM' },
  { id: 'offline-04', name: 'B. Satyanarayana', age: 67, village: 'Bheemili Ward 3', severity: 'PROGRESSION', time: '10:02 AM' },
  { id: 'offline-05', name: 'K. Somulu', age: 53, village: 'Moolakuddu', severity: 'NO_DR', time: '10:18 AM' },
  { id: 'offline-06', name: 'Ch. Venkataramana', age: 58, village: 'Moolakuddu', severity: 'MODERATE_DR', time: '10:35 AM' },
  { id: 'offline-07', name: 'S. Parvathi', age: 50, village: 'Narasimhapuram', severity: 'MILD_DR', time: '10:48 AM' }
];

export const SCREENING_VOLUME_7D = [
  { day: 'Sat', screened: 16, highRisk: 1, referrals: 2 },
  { day: 'Sun', screened: 4, highRisk: 0, referrals: 0 },
  { day: 'Mon', screened: 24, highRisk: 2, referrals: 3 },
  { day: 'Tue', screened: 28, highRisk: 1, referrals: 4 },
  { day: 'Wed', screened: 22, highRisk: 1, referrals: 3 },
  { day: 'Thu', screened: 30, highRisk: 2, referrals: 4 },
  { day: 'Today', screened: 24, highRisk: 1, referrals: 1 }
];

export const SCREENING_VOLUME_30D = [
  { day: 'Wk 1', screened: 112, highRisk: 8, referrals: 15 },
  { day: 'Wk 2', screened: 145, highRisk: 11, referrals: 19 },
  { day: 'Wk 3', screened: 138, highRisk: 9, referrals: 18 },
  { day: 'Wk 4', screened: 168, highRisk: 14, referrals: 22 }
];

export const SEVERITY_DISTRIBUTION = [
  { name: 'No Apparent DR', value: 68, color: '#10b981', percentage: '53.1%' },
  { name: 'Mild NPDR', value: 32, color: '#3b82f6', percentage: '25.0%' },
  { name: 'Moderate NPDR', value: 20, color: '#f59e0b', percentage: '15.6%' },
  { name: 'Severe NPDR', value: 6, color: '#ef4444', percentage: '4.7%' },
  { name: 'Proliferative DR', value: 2, color: '#991b1b', percentage: '1.6%' }
];

export const REFERRAL_FUNNEL = [
  { stage: 'Screened', count: 128, percentage: 100, color: '#3b82f6' },
  { stage: 'Referred', count: 28, percentage: 21.8, color: '#6366f1' },
  { stage: 'Notified', count: 24, percentage: 18.7, color: '#8b5cf6' },
  { stage: 'Appt Booked', count: 18, percentage: 14.0, color: '#ec4899' },
  { stage: 'Reviewed', count: 14, percentage: 10.9, color: '#10b981' }
];

export const SCREENING_LOCATIONS = [
  { location: 'Bheemunipatnam PHC', count: 48, percentage: 37.5, highRisk: 4 },
  { location: 'Tagarapuvalasa Sub-Center', count: 32, percentage: 25.0, highRisk: 2 },
  { location: 'Padmanabham Community Hall', count: 26, percentage: 20.3, highRisk: 1 },
  { location: 'Anandapuram Camp Unit', count: 22, percentage: 17.2, highRisk: 1 }
];
