import { apiClient } from './client';

export interface Patient {
  id: number | string;
  patient_code: string;
  first_name: string;
  last_name?: string;
  age: number;
  gender: string;
  hba1c?: number | string | null;
  phone_number?: string;
  diabetes_type?: string;
  village?: string;
  district?: string;
  organization?: number | string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface PatientCreateInput {
  first_name: string;
  last_name?: string;
  age: number;
  gender: string;
  hba1c?: number | string | null;
  phone_number?: string;
  diabetes_type?: string;
  village?: string;
  district?: string;
  patient_code?: string;
  organization?: number | string;
  [key: string]: any;
}

// 1. Core Functions
export const getPatients = async (params?: Record<string, any>): Promise<any> => {
  return apiClient.get('/patients/', params);
};

export const getPatient = async (id: string | number): Promise<any> => {
  return apiClient.get(`/patients/${id}/`);
};

export const getPatientById = getPatient;

export const getPatient360Overview = async (id: string | number): Promise<any> => {
  try {
    return await apiClient.get(`/patients/${id}/overview/`);
  } catch {
    const single = await getPatient(id);
    return {
      patient: single,
      timeline: []
    };
  }
};

export const createPatient = async (data: PatientCreateInput): Promise<any> => {
  let orgId = data.organization;
  if (!orgId) {
    try {
      const storedUser = localStorage.getItem('retinaguard_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        orgId = parsed?.organization?.id || parsed?.organization || parsed?.organization_id || 1;
      } else {
        orgId = 1;
      }
    } catch {
      orgId = 1;
    }
  }

  const payload: any = {
    ...data,
    organization: orgId,
    phone_number: data.phone_number ? String(data.phone_number).trim() : '',
  };

  if (data.patient_code) {
    payload.patient_code = data.patient_code;
  }

  return apiClient.post('/patients/', payload);
};

export const updatePatient = async (id: string | number, data: Partial<PatientCreateInput>): Promise<any> => {
  return apiClient.patch(`/patients/${id}/`, data);
};

export const deletePatient = async (id: string | number): Promise<any> => {
  return apiClient.delete(`/patients/${id}/`);
};

// 2. Class / Object API wrappers to support all import styles
class PatientsService {
  getPatients = getPatients;
  getPatient = getPatient;
  getPatientById = getPatientById;
  getPatient360Overview = getPatient360Overview;
  createPatient = createPatient;
  updatePatient = updatePatient;
  deletePatient = deletePatient;
}

export const patientsService = new PatientsService();
export const patientsApi = patientsService;
export const patientApi = patientsService;
export const patients = patientsService;

export default patientsService;