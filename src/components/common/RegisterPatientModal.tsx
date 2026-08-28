import React, { useState } from 'react';
import { patientsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { X, UserPlus, Loader2, CheckCircle2, Upload, Trash2 } from 'lucide-react';

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated?: (patient: any) => void;
}

export const RegisterPatientModal: React.FC<RegisterPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientCreated
}) => {
  const { showToast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'FEMALE' | 'MALE' | 'OTHER'>('FEMALE');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Visakhapatnam');
  const [diabetesType, setDiabetesType] = useState<'TYPE_1' | 'TYPE_2' | 'GESTATIONAL'>('TYPE_2');
  const [diabetesYears, setDiabetesYears] = useState<number | ''>(5);
  const [hba1c, setHba1c] = useState<string>('7.5');
  const [currentRiskLevel, setCurrentRiskLevel] = useState<'LOW' | 'MODERATE' | 'HIGH' | 'URGENT'>('HIGH');
  const [currentSeverity, setCurrentSeverity] = useState<'NO_DR' | 'MILD_DR' | 'MODERATE_DR' | 'SEVERE_DR' | 'PROLIFERATIVE_DR' | 'PROGRESSION'>('MODERATE_DR');
  const [hasProgressionAlert, setHasProgressionAlert] = useState(false);
  const [avatar, setAvatar] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large (max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const newPatient = await patientsApi.createPatient({
        first_name: firstName.trim(),
        last_name: lastName.trim() || 'Patient',
        age: Number(age) || 45,
        gender,
        phone: phone.trim() || '+91 98480 00000',
        village: village.trim() || 'Community Ward',
        district: district.trim() || 'Visakhapatnam',
        diabetes_type: diabetesType,
        diabetes_duration_years: Number(diabetesYears) || 5,
        hba1c: Number(hba1c) || 7.5,
        current_risk_level: currentRiskLevel,
        current_severity: currentSeverity,
        has_progression_alert: hasProgressionAlert || currentSeverity === 'PROGRESSION',
        avatar: avatar || null
      });

      showToast({
        type: 'success',
        title: 'Patient Registered',
        message: `Registered ${newPatient.full_name} (${newPatient.patient_code}) successfully.`
      });

      if (onPatientCreated) {
        onPatientCreated(newPatient);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to register patient with clinical backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span>Register New Patient</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {/* Photo / Avatar Upload Section */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="relative flex-shrink-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Patient preview"
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-300 shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-lg border border-slate-300">
                  {firstName.charAt(0) || 'P'}
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-1">
              <label className="block text-xs font-bold text-slate-700">Patient Photo / Image (Optional)</label>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Upload portrait photo (PNG, JPG max 5MB)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="e.g. Ramesh"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="e.g. Varma"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Age *</label>
              <input
                type="number"
                required
                min={1}
                max={120}
                value={age}
                onChange={e => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 52"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as any)}
                className="w-full h-10 px-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">HbA1c (%)</label>
              <input
                type="number"
                step="0.1"
                value={hba1c}
                onChange={e => setHba1c(e.target.value)}
                placeholder="e.g. 8.2"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98480 12345"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Diabetes Type</label>
              <select
                value={diabetesType}
                onChange={e => setDiabetesType(e.target.value as any)}
                className="w-full h-10 px-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="TYPE_2">Type 2 Diabetes</option>
                <option value="TYPE_1">Type 1 Diabetes</option>
                <option value="GESTATIONAL">Gestational</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Village / Town</label>
              <input
                type="text"
                value={village}
                onChange={e => setVillage(e.target.value)}
                placeholder="e.g. Bheemili Ward 3"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                placeholder="Visakhapatnam"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Clinical Triage Priority & Condition */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Clinical Triage & Risk Category
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Triage Priority / Risk *</label>
                <select
                  value={currentRiskLevel}
                  onChange={e => setCurrentRiskLevel(e.target.value as any)}
                  className="w-full h-10 px-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="HIGH">High Risk (Priority Review)</option>
                  <option value="URGENT">Urgent / Critical</option>
                  <option value="MODERATE">Moderate Risk</option>
                  <option value="LOW">Low Risk (Routine)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Retinopathy Finding / Stage</label>
                <select
                  value={currentSeverity}
                  onChange={e => setCurrentSeverity(e.target.value as any)}
                  className="w-full h-10 px-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="MODERATE_DR">Moderate NPDR</option>
                  <option value="SEVERE_DR">Severe NPDR</option>
                  <option value="PROLIFERATIVE_DR">Proliferative DR (PDR)</option>
                  <option value="PROGRESSION">Longitudinal Progression Alert</option>
                  <option value="MILD_DR">Mild NPDR</option>
                  <option value="NO_DR">No Apparent DR</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={hasProgressionAlert || currentSeverity === 'PROGRESSION'}
                onChange={e => setHasProgressionAlert(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-700">Flag for Rapid Disease Progression Alert</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save Patient</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
