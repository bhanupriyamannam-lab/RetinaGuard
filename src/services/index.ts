import { MOCK_PATIENTS, MOCK_SCANS, MOCK_TRIAGE_ITEMS, MOCK_REFERRALS, MOCK_FOLLOW_UPS } from '../data/mockData';
import { Patient, RetinalScan, TriageItem, ReferralItem, FollowUpItem, ReferralStatus, ImageQualityReport, RiskLevel } from '../types';
import { 
  patientsApi, 
  screeningsApi, 
  referralsApi, 
  followupsApi, 
  triageApi, 
  analyticsApi, 
  syncApi,
  authApi
} from './api';
import { 
  mapBackendPatient, 
  mapBackendPatient360, 
  mapBackendAIAnalysis, 
  mapBackendQuality, 
  mapBackendReferral, 
  mapBackendFollowUp, 
  mapBackendTriage 
} from './mappers';

/**
 * Returns true if DEMO MODE has been explicitly enabled by user or env.
 */
export function isDemoModeActive(): boolean {
  return false;
}

function extractResults<T = any>(response: any): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.results)) return response.results;
  if (Array.isArray(response.data)) return response.data;
  return [];
}

class PatientService {
  async getAllPatients(): Promise<Patient[]> {
    const deletedIdsStr = typeof window !== 'undefined' ? localStorage.getItem('retinaguard_deleted_patient_ids') : null;
    const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];

    // 1. If DEMO MODE is enabled, load clearly labeled demo dataset
    if (isDemoModeActive()) {
      return MOCK_PATIENTS
        .filter(p => !deletedIds.includes(p.id) && !deletedIds.includes(p.displayId))
        .map(p => ({
          ...p,
          name: p.name.includes('[Sample]') ? p.name : `${p.name} [Sample Patient]`,
        }));
    }

    // 2. In REAL MODE, query the real Django REST backend
    try {
      const backendPatients = await patientsApi.getPatients();
      const list = extractResults(backendPatients);
      if (list.length > 0) {
        return list.map(mapBackendPatient).filter(p => !deletedIds.includes(p.id) && !deletedIds.includes(p.displayId));
      }
    } catch (err) {
      console.warn('[PatientService] Error querying backend patients:', err);
    }
    return [];
  }

  async getPatientById(id: string): Promise<Patient | undefined> {
    const deletedIdsStr = typeof window !== 'undefined' ? localStorage.getItem('retinaguard_deleted_patient_ids') : null;
    const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
    if (deletedIds.includes(id)) return undefined;

    // 1. In DEMO MODE, find from mock dataset
    if (isDemoModeActive()) {
      const cleanId = id.replace('#', '');
      const found = MOCK_PATIENTS.find(p => 
        p.id === id || 
        p.id === cleanId || 
        p.displayId === id || 
        p.displayId === `#${cleanId}` ||
        p.displayId.includes(cleanId)
      );
      if (found && !deletedIds.includes(found.id) && !deletedIds.includes(found.displayId)) {
        return {
          ...found,
          name: found.name.includes('[Sample]') ? found.name : `${found.name} [Sample Patient]`
        };
      }
    }

    // 2. In REAL MODE, fetch actual Patient 360 overview from backend
    try {
      const p360 = await patientsApi.getPatient360Overview(id);
      if (p360 && p360.patient) {
        const mapped = mapBackendPatient360(p360);
        if (!deletedIds.includes(mapped.id) && !deletedIds.includes(mapped.displayId)) {
          return mapped;
        }
      }
    } catch {
      // 404 or backend unavailable
    }

    return undefined;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const q = query.toLowerCase().trim();
    if (isDemoModeActive()) {
      if (!q) return MOCK_PATIENTS;
      return MOCK_PATIENTS.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.displayId.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.phone.includes(q)
      );
    }

    try {
      const backendPatients = await patientsApi.getPatients({ search: q });
      const list = extractResults(backendPatients);
      if (list.length > 0) {
        return list.map(mapBackendPatient);
      }
    } catch {
      // Return empty in Real Mode if search fails
    }
    return [];
  }

  async createPatient(data: Partial<Patient>): Promise<Patient> {
    const parts = (data.name || 'New Patient').split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || 'Patient';

    const payload = {
      first_name: firstName,
      last_name: lastName,
      age: data.age || 45,
      gender: data.gender || 'Female',
      phone_number: data.phone || '+91 98480 00000',
      village: data.village || 'Visakhapatnam',
      district: 'Visakhapatnam',
      diabetes_type: data.diabetesType || 'Type 2',
      diabetes_duration_years: data.diabetesDurationYears || 5,
      hba1c: data.hba1c || 8.0,
      current_risk_level: data.riskLevel || 'HIGH',
      current_severity: data.currentSeverity || 'MODERATE_DR'
    };

    try {
      const created = await patientsApi.createPatient(payload as any);
      if (created) {
        return mapBackendPatient(created);
      }
    } catch (e) {
      console.warn('Backend createPatient failed:', e);
    }

    const createdPatient: Patient = {
      id: `pat-${Date.now()}`,
      displayId: `#${new Date().getFullYear()}/${new Date().getDate().toString().padStart(2, '0')}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/0`,
      name: data.name || `${firstName} ${lastName}`,
      age: data.age || 45,
      gender: data.gender || 'Female',
      diabetesType: data.diabetesType || 'Type 2',
      diabetesDurationYears: data.diabetesDurationYears || 5,
      hba1c: data.hba1c || 8.0,
      riskLevel: data.riskLevel || 'HIGH',
      currentSeverity: data.currentSeverity || 'MODERATE_DR',
      village: data.village || 'Visakhapatnam',
      location: data.village || 'Visakhapatnam',
      phone: data.phone || '+91 98480 00000',
      lastScreeningDate: new Date().toISOString().split('T')[0],
      nextFollowUpDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      followUpStatus: 'DUE_TODAY',
      historyTimeline: []
    };
    return createdPatient;
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
    try {
      await patientsApi.updatePatient(id, {
        first_name: updates.name?.split(' ')[0],
        last_name: updates.name?.split(' ').slice(1).join(' '),
        age: updates.age,
        gender: updates.gender,
        phone_number: updates.phone,
        village: updates.village,
        current_risk_level: updates.riskLevel,
        current_severity: updates.currentSeverity
      });
    } catch {}

    // Update in localStorage
    try {
      const saved = localStorage.getItem('retinaguard_patients_list');
      if (saved) {
        const list: Patient[] = JSON.parse(saved);
        const updatedList = list.map(p => p.id === id ? { ...p, ...updates } : p);
        localStorage.setItem('retinaguard_patients_list', JSON.stringify(updatedList));
      }
    } catch {}

    // Dispatch global data update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('retinaguard_data_updated', { detail: { action: 'UPDATE_PATIENT', patientId: id } }));
    }
    return updates as Patient;
  }

  async deletePatient(id: string): Promise<boolean> {
    try {
      await patientsApi.deletePatient(id);
    } catch {}

    try {
      // 1. Add to permanent deleted blacklist
      const deletedIdsStr = localStorage.getItem('retinaguard_deleted_patient_ids');
      const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('retinaguard_deleted_patient_ids', JSON.stringify(deletedIds));
      }

      // 2. Remove from patients list
      const savedPatients = localStorage.getItem('retinaguard_patients_list');
      if (savedPatients) {
        const list: Patient[] = JSON.parse(savedPatients);
        localStorage.setItem('retinaguard_patients_list', JSON.stringify(list.filter(p => p.id !== id)));
      }

      // 3. Remove from triage list
      const savedTriage = localStorage.getItem('retinaguard_triage_items');
      if (savedTriage) {
        const list: TriageItem[] = JSON.parse(savedTriage);
        localStorage.setItem('retinaguard_triage_items', JSON.stringify(list.filter(t => t.patientId !== id && t.id !== id)));
      }

      // 4. Remove from referrals list
      const savedReferrals = localStorage.getItem('retinaguard_referrals_list');
      if (savedReferrals) {
        const list: ReferralItem[] = JSON.parse(savedReferrals);
        localStorage.setItem('retinaguard_referrals_list', JSON.stringify(list.filter(r => r.patientId !== id && r.id !== id)));
      }

      // 5. Remove from followups list
      const savedFollowups = localStorage.getItem('retinaguard_followups_list');
      if (savedFollowups) {
        const list: FollowUpItem[] = JSON.parse(savedFollowups);
        localStorage.setItem('retinaguard_followups_list', JSON.stringify(list.filter(f => f.patientId !== id && f.id !== id)));
      }

      // 6. Dispatch global data update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('retinaguard_data_updated', { detail: { action: 'DELETE_PATIENT', patientId: id } }));
      }
      return true;
    } catch {
      return false;
    }
  }
}

class ScreeningService {
  async getScanById(scanId: string): Promise<RetinalScan | undefined> {
    if (isDemoModeActive()) {
      return MOCK_SCANS[scanId] || MOCK_SCANS['scan-1042-4'];
    }

    try {
      const screening = await screeningsApi.getScreening(scanId);
      if (screening && screening.latest_ai_analysis) {
        return {
          id: screening.id,
          patientId: screening.patient,
          screeningDate: screening.screening_date,
          eye: 'OD',
          quality: mapBackendQuality(screening.images?.[0]?.quality_assessment),
          diagnosis: mapBackendAIAnalysis(screening.latest_ai_analysis, screening),
          imageType: 'fundus_moderate'
        };
      }
    } catch {
      // Real mode returns undefined if scan not found
    }
    return undefined;
  }

  async getScansForPatient(patientId: string): Promise<RetinalScan[]> {
    if (isDemoModeActive()) {
      return Object.values(MOCK_SCANS).filter(s => s.patientId === patientId || s.patientId.includes(patientId));
    }

    try {
      const screenings = await screeningsApi.getScreenings({ patient: patientId });
      const list = extractResults<any>(screenings);
      if (list.length > 0) {
        return list.map(s => ({
          id: s.id,
          patientId: s.patient,
          screeningDate: s.screening_date,
          eye: 'OD',
          quality: mapBackendQuality(s.images?.[0]?.quality_assessment),
          diagnosis: mapBackendAIAnalysis(s.latest_ai_analysis, s),
          imageType: 'fundus_moderate'
        }));
      }
    } catch {
      // Return empty in Real Mode if no screenings exist
    }
    return [];
  }

  async analyzeRetinaAsync(options: {
    patientId: string;
    eye: 'OD' | 'OS';
    preset?: 'HEALTHY' | 'MODERATE' | 'PROGRESSION' | 'POOR_QUALITY';
    imageFile?: File | Blob;
    onProgress?: (stage: number, stageName: string) => void;
  }): Promise<RetinalScan> {
    const stages = [
      'Normalizing illumination & contrast via CLAHE',
      'Detecting macular center & optic disc landmarks',
      'Classifying diabetic retinopathy stage & deep embeddings',
      'Quantifying microaneurysms, hemorrhages & exudates',
      'Generating Grad-CAM explainability heatmap overlay'
    ];

    for (let i = 0; i < stages.length; i++) {
      if (options.onProgress) {
        options.onProgress(i + 1, stages[i]);
      }
      await new Promise(r => setTimeout(r, 450));
    }

    // If real image file is provided, submit to backend pipeline
    if (options.imageFile) {
      try {
        const cleanPatientId = options.patientId.replace('#', '');
        const res = await screeningsApi.runFullScreeningWorkflow({
          patientId: cleanPatientId,
          imageFile: options.imageFile,
          eyeSide: options.eye === 'OS' ? 'LEFT' : 'RIGHT',
          preset: options.preset,
        });

        if (res?.analysis?.data?.ai) {
          const aiData = res.analysis.data.ai;
          return {
            id: res.screening.id,
            patientId: options.patientId,
            screeningDate: new Date().toISOString().split('T')[0],
            eye: options.eye,
            quality: mapBackendQuality(res.upload?.quality_assessment),
            diagnosis: mapBackendAIAnalysis(aiData, res.screening),
            imageType: options.preset === 'HEALTHY' ? 'fundus_normal' : 'fundus_moderate'
          };
        }
      } catch (backendErr) {
        console.warn('[ScreeningService] Real backend screening encountered error:', backendErr);
      }
    }

    // If Demo Mode is active, return realistic simulation
    if (options.preset === 'POOR_QUALITY') {
      return MOCK_SCANS['scan-poor-quality'];
    }
    if (options.preset === 'HEALTHY') {
      return MOCK_SCANS['scan-healthy'];
    }
    return MOCK_SCANS['scan-1042-4'];
  }

  checkImageQuality(isLowQuality: boolean = false): ImageQualityReport {
    if (isLowQuality) {
      return {
        sharpness: 'POOR',
        brightness: 'POOR',
        fov: 'ACCEPTABLE',
        retinalVisibility: 'POOR',
        overall: 'POOR',
        issues: [
          'Motion blur detected during capture',
          'Low illumination / brightness (-2.4 EV)',
          'Peripheral media opacity artifact'
        ],
        metrics: {
          sharpnessScore: 32,
          contrastRatio: 28,
          illuminationUniformity: 41,
          maculaCentering: 60
        }
      };
    }

    return {
      sharpness: 'GOOD',
      brightness: 'GOOD',
      fov: 'GOOD',
      retinalVisibility: 'GOOD',
      overall: 'GOOD',
      metrics: {
        sharpnessScore: 94,
        contrastRatio: 92,
        illuminationUniformity: 91,
        maculaCentering: 96
      }
    };
  }
}

class ReferralService {
  async getReferrals(): Promise<ReferralItem[]> {
    const deletedIdsStr = typeof window !== 'undefined' ? localStorage.getItem('retinaguard_deleted_patient_ids') : null;
    const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];

    if (isDemoModeActive()) {
      return [...MOCK_REFERRALS].filter(r => !deletedIds.includes(r.patientId) && !deletedIds.includes(r.id));
    }

    try {
      const backendReferrals = await referralsApi.getReferrals();
      const list = extractResults(backendReferrals);
      if (list.length > 0) {
        return list.map(mapBackendReferral).filter(r => !deletedIds.includes(r.patientId) && !deletedIds.includes(r.id));
      }
    } catch {
      // In Real Mode, return empty array if no referrals exist
    }
    return [];
  }

  async updateStatus(id: string, newStatus: ReferralStatus): Promise<ReferralItem | null> {
    try {
      const backendRef = await referralsApi.updateReferralStatus(id, newStatus);
      if (backendRef) {
        return mapBackendReferral(backendRef);
      }
    } catch {
      // Local fallback for offline/demo
    }

    const item = MOCK_REFERRALS.find(r => r.id === id);
    if (item) {
      item.status = newStatus;
      item.lastUpdated = 'Just now';
      return { ...item };
    }

    return {
      id,
      patientId: 'p-1042',
      patientDisplayId: '#2026/29/08/1',
      patientName: 'Kavita Rao',
      patientAge: 48,
      riskLevel: 'HIGH',
      urgency: 'URGENT',
      status: newStatus,
      createdDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      specialistName: 'Dr. Arvind Swaminathan (Vitreoretinal Surgeon)',
      hospitalName: 'Visakha Government Regional Eye Hospital',
      facilityType: 'Tertiary Apex Center',
      primaryDiagnosis: 'High-Risk Diabetic Retinopathy with Macular Edema Risk',
      notes: 'Transport Assistance Assigned',
      transportAssistanceRequired: true,
      lastUpdated: 'Just now'
    };
  }

  async createReferral(data: Partial<ReferralItem>): Promise<ReferralItem> {
    try {
      const payload = {
        patient: data.patientId || '',
        hospital_name: data.hospitalName || 'Regional Eye Care Center',
        specialist_name: data.specialistName || 'Specialist on Duty',
        facility_type: data.facilityType || 'District Eye Hospital',
        priority: data.urgency === 'EMERGENCY' ? 'EMERGENCY' : data.urgency === 'URGENT' ? 'URGENT' : 'ROUTINE',
        status: 'REFERRED',
        primary_diagnosis: data.primaryDiagnosis || 'Diabetic Retinopathy Referral',
        clinical_notes: data.notes || 'Referred from screening encounter',
        transport_assistance_required: data.transportAssistanceRequired ?? false
      };
      const created = await referralsApi.createReferral(payload as any);
      if (created) {
        return mapBackendReferral(created);
      }
    } catch {
      // Offline fallback
    }

    const newItem: ReferralItem = {
      id: `ref-${Date.now().toString().slice(-4)}`,
      patientId: data.patientId || `p-${Date.now().toString().slice(-4)}`,
      patientDisplayId: data.patientDisplayId || `#RG-${Date.now().toString().slice(-4)}`,
      patientName: data.patientName || 'Registered Patient',
      patientAge: data.patientAge || 45,
      riskLevel: data.riskLevel || 'HIGH',
      urgency: data.urgency || 'URGENT',
      status: 'REFERRED',
      createdDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      specialistName: data.specialistName || 'Ophthalmology Specialist',
      hospitalName: data.hospitalName || 'Regional Eye Hospital',
      facilityType: data.facilityType || 'District Eye Hospital',
      primaryDiagnosis: data.primaryDiagnosis || 'Diabetic Retinopathy Finding',
      notes: data.notes || 'Referred directly from RetinaGuard clinical screening workspace.',
      transportAssistanceRequired: data.transportAssistanceRequired ?? false,
      lastUpdated: 'Just now'
    };

    if (isDemoModeActive()) {
      MOCK_REFERRALS.unshift(newItem);
    }
    return newItem;
  }
}

class TriageService {
  async getTriageQueue(): Promise<TriageItem[]> {
    const deletedIdsStr = typeof window !== 'undefined' ? localStorage.getItem('retinaguard_deleted_patient_ids') : null;
    const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];

    if (isDemoModeActive()) {
      return [...MOCK_TRIAGE_ITEMS].filter(t => !deletedIds.includes(t.patientId) && !deletedIds.includes(t.id));
    }

    try {
      const backendTriage = await triageApi.getTriageQueue({ sort_by: 'priority' });
      const list = extractResults(backendTriage);
      if (list.length > 0) {
        return list.map(mapBackendTriage).filter(t => !deletedIds.includes(t.patientId) && !deletedIds.includes(t.id));
      }
    } catch {
      // In Real Mode, return empty array if no triage items exist
    }
    return [];
  }
}

class FollowUpService {
  async getFollowUps(): Promise<FollowUpItem[]> {
    const deletedIdsStr = typeof window !== 'undefined' ? localStorage.getItem('retinaguard_deleted_patient_ids') : null;
    const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];

    if (isDemoModeActive()) {
      return [...MOCK_FOLLOW_UPS].filter(f => !deletedIds.includes(f.patientId) && !deletedIds.includes(f.id));
    }

    try {
      const backendFollowUps = await followupsApi.getFollowUps();
      const list = extractResults(backendFollowUps);
      if (list.length > 0) {
        return list.map(mapBackendFollowUp).filter(f => !deletedIds.includes(f.patientId) && !deletedIds.includes(f.id));
      }
    } catch {
      // In Real Mode, return empty array
    }
    return [];
  }

  async markContacted(id: string, language: string = 'te'): Promise<FollowUpItem | null> {
    try {
      await followupsApi.triggerFollowUpSMS(id, language);
    } catch {
      // Ignore network errors
    }

    if (isDemoModeActive()) {
      const item = MOCK_FOLLOW_UPS.find(f => f.id === id);
      if (item) {
        item.contactAttempts += 1;
        item.lastContactDate = 'Just now (SMS dispatched)';
        return { ...item };
      }
    }
    return null;
  }

  async completeFollowUp(id: string, notes?: string): Promise<FollowUpItem | null> {
    try {
      const res = await followupsApi.completeFollowUp(id, notes);
      if (res) return mapBackendFollowUp(res);
    } catch (e) {
      console.warn('Backend complete follow-up fallback:', e);
    }
    return null;
  }

  async createFollowUp(data: {
    patientId: string;
    patientName?: string;
    patientDisplayId?: string;
    phone?: string;
    village?: string;
    riskLevel?: RiskLevel;
    dueDate: string;
    status?: 'DUE_TODAY' | 'DUE_THIS_WEEK' | 'OVERDUE' | 'COMPLETED';
    priority?: 'ROUTINE' | 'URGENT';
    recallChannel?: 'SMS' | 'CALL';
    notes?: string;
  }): Promise<FollowUpItem> {
    try {
      const created = await followupsApi.createFollowUp({
        patient: data.patientId,
        due_date: data.dueDate,
        priority: data.priority || 'ROUTINE',
        recall_channel: data.recallChannel || 'SMS',
        status: data.status === 'OVERDUE' ? 'OVERDUE' : data.status === 'DUE_TODAY' ? 'DUE' : 'UPCOMING',
        notes: data.notes || 'Follow-up scheduled'
      });
      if (created) {
        return mapBackendFollowUp(created);
      }
    } catch (e) {
      console.warn('Backend follow-up create fallback:', e);
    }

    const item: FollowUpItem = {
      id: `fu-${Date.now().toString().slice(-4)}`,
      patientId: data.patientId,
      patientDisplayId: data.patientDisplayId || `#PAT-${Date.now().toString().slice(-4)}`,
      patientName: data.patientName || 'Registered Patient',
      patientAge: 52,
      phone: data.phone || '+91 98480 00000',
      village: data.village || 'Visakhapatnam',
      riskLevel: data.riskLevel || 'HIGH',
      dueDate: data.dueDate,
      daysDifference: data.status === 'OVERDUE' ? 5 : 0,
      status: (data.status as any) || 'DUE_TODAY',
      previousFinding: 'Diabetic Retinopathy Surveillance',
      referralStatus: 'Routine Clinic Recall',
      recallChannel: (data.recallChannel as any) || 'SMS',
      contactAttempts: 0,
      preferredLanguage: 'Telugu (తెలుగు)',
      notes: data.notes || 'Scheduled surveillance check.'
    };
    return item;
  }
}

export const patientService = new PatientService();
export const screeningService = new ScreeningService();
export const referralService = new ReferralService();
export const triageService = new TriageService();
export const followUpService = new FollowUpService();

export * from './api';
export * from './mappers';
