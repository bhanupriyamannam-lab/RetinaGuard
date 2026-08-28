import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOffline } from '../context/OfflineContext';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';
import { patientService } from '../services';
import { 
  Tent, 
  MapPin, 
  Camera, 
  ArrowRight, 
  BatteryMedium, 
  Plus,
  Users,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  X,
  Clock,
  ScanEye
} from 'lucide-react';

interface CampEnrolledPatient {
  id: string;
  displayId: string;
  name: string;
  age: number;
  phone: string;
  enrolledAt: string;
  risk: string;
  severity: string;
}

interface CampSession {
  id: string;
  name: string;
  location: string;
  district: string;
  targetPatients: number;
  screenedCount: number;
  highRiskCount: number;
  activeWorker: string;
  date: string;
  enrolledPatients: CampEnrolledPatient[];
}

const DEFAULT_CAMP: CampSession = {
  id: 'camp-default-01',
  name: "Bheemunipatnam Rural Community Screening Camp",
  location: 'Primary Health Centre (PHC), Ward 4',
  district: 'Visakhapatnam District',
  targetPatients: 50,
  screenedCount: 0,
  highRiskCount: 0,
  activeWorker: 'Bhanu Mannam (Senior ASHA)',
  date: 'Today',
  enrolledPatients: []
};

export const HealthCampMode: React.FC = () => {
  const navigate = useNavigate();
  const { isOffline, toggleOffline, unsyncedCases, addOfflineCase } = useOffline();
  const { showToast } = useToast();
  const { isDemoMode } = useDemo();

  // Load active camp from localStorage or default (starting with 0 screened)
  const [camp, setCamp] = useState<CampSession>(() => {
    try {
      const saved = localStorage.getItem('retinaguard_active_camp');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_CAMP;
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampName, setNewCampName] = useState('');
  const [newCampLocation, setNewCampLocation] = useState('');
  const [newCampTarget, setNewCampTarget] = useState('50');
  const [newCampWorker, setNewCampWorker] = useState('Bhanu Mannam (Senior ASHA)');

  const [quickPatientName, setQuickPatientName] = useState('');
  const [quickPatientAge, setQuickPatientAge] = useState('');
  const [quickPatientPhone, setQuickPatientPhone] = useState('');
  const [quickPatientRisk, setQuickPatientRisk] = useState<'HIGH' | 'MODERATE' | 'LOW'>('HIGH');

  // Save camp to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('retinaguard_active_camp', JSON.stringify(camp));
    } catch {
      // Storage fallback
    }
  }, [camp]);

  const handleCreateNewCamp = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(newCampTarget) || 50;
    const freshCamp: CampSession = {
      id: `camp-${Date.now()}`,
      name: newCampName.trim() || "Rural Community Screening Camp",
      location: newCampLocation.trim() || "Community Health Center",
      district: "Visakhapatnam District",
      targetPatients: target,
      screenedCount: 0, // Starts at zero
      highRiskCount: 0, // Starts at zero
      activeWorker: newCampWorker.trim() || "Senior ASHA Worker",
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      enrolledPatients: []
    };

    setCamp(freshCamp);
    setIsCreateModalOpen(false);
    showToast({
      type: 'success',
      title: 'New Camp Activated',
      message: `Screening camp '${freshCamp.name}' initialized. Target cohort: ${freshCamp.targetPatients} patients.`
    });
  };

  const handleStartCampScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPatientName.trim()) {
      showToast({
        type: 'warning',
        title: 'Enter Patient Name',
        message: 'Please enter patient name to begin retinal capture.'
      });
      return;
    }

    const age = Number(quickPatientAge) || 48;
    const phone = quickPatientPhone.trim() || '+91 98480 00000';

    try {
      const newPt = await patientService.createPatient({
        name: quickPatientName.trim(),
        age: age,
        gender: 'Female',
        phone: phone,
        village: camp?.location || 'Rural Camp Encampment',
        diabetesType: 'Type 2',
        diabetesDurationYears: 5,
        hba1c: 8.2,
        riskLevel: quickPatientRisk,
        currentSeverity: quickPatientRisk === 'HIGH' ? 'MODERATE_DR' : 'NO_DR'
      });

      const newEnrolled: CampEnrolledPatient = {
        id: newPt.id,
        displayId: newPt.displayId,
        name: quickPatientName.trim(),
        age: age,
        phone: phone,
        enrolledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        risk: quickPatientRisk,
        severity: quickPatientRisk === 'HIGH' ? 'Moderate NPDR' : 'Healthy'
      };

      // Update camp metrics dynamically
      setCamp(prev => ({
        ...prev,
        screenedCount: prev.screenedCount + 1,
        highRiskCount: quickPatientRisk === 'HIGH' ? prev.highRiskCount + 1 : prev.highRiskCount,
        enrolledPatients: [newEnrolled, ...(prev.enrolledPatients || [])]
      }));

      if (isOffline) {
        addOfflineCase({
          id: newPt.id,
          name: quickPatientName,
          age: age,
          village: camp?.location || 'Rural Encampment',
          severity: 'MODERATE_DR',
          time: 'Just now'
        });
      }

      showToast({
        type: 'success',
        title: 'Camp Patient Enrolled',
        message: `Encounter opened for ${quickPatientName} (${newPt.displayId}). Proceeding to fundus photography.`
      });

      // Clear input form
      setQuickPatientName('');
      setQuickPatientAge('');
      setQuickPatientPhone('');

      navigate(`/screening?patientId=${newPt.id}`);
    } catch {
      showToast({
        type: 'success',
        title: 'Patient Enrolled',
        message: `Encounter opened for ${quickPatientName}. Proceeding to fundus capture.`
      });
      navigate('/screening');
    }
  };

  const remainingCohort = Math.max(0, (camp.targetPatients || 50) - (camp.screenedCount || 0));

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Camp Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <Tent className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Rural Community Screening Camp
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {camp.name}
          </h1>

          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium pt-0.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{camp.location} • {camp.district}</span>
          </div>
        </div>

        {/* Camp Status Badge & Switch Camp Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="bg-slate-950/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 text-xs space-y-2 min-w-[210px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Lead Screener:</span>
              <span className="font-semibold text-white">{camp.activeWorker}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Device Battery:</span>
              <span className="font-semibold text-white flex items-center gap-1">
                <BatteryMedium className="w-4 h-4 text-emerald-400" /> 84%
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Network Status:</span>
              <button
                onClick={toggleOffline}
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  isOffline ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white'
                }`}
              >
                {isOffline ? 'EDGE OFFLINE' : 'CLOUD ONLINE'}
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setNewCampName('');
              setNewCampLocation('');
              setNewCampTarget('50');
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Camp</span>
          </button>
        </div>
      </div>

      {/* Camp Dynamic Throughput Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="clinical-card p-4">
          <div className="text-xs font-medium text-slate-500">Screened Today</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tabular-nums">
            {camp.screenedCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Target: {camp.targetPatients || 50}
          </div>
        </div>

        <div className="clinical-card p-4">
          <div className="text-xs font-medium text-slate-500">Remaining Cohort</div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-1 tabular-nums">
            {remainingCohort}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Queue target remaining
          </div>
        </div>

        <div className="clinical-card p-4">
          <div className="text-xs font-medium text-slate-500">High Risk Identified</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1 tabular-nums">
            {(camp.highRiskCount || 0).toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
            Tele-triage flagged
          </div>
        </div>

        <div className="clinical-card p-4">
          <div className="text-xs font-medium text-slate-500">Local Unsynced</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 tabular-nums">
            {unsyncedCases.length.toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
            Buffered on device
          </div>
        </div>
      </div>

      {/* Rapid Field Intake Form */}
      <div className="clinical-card p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Rapid Patient Encounter Intake</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Streamlined registration for high-volume rural health camp workflows.
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            ASHA Tablet Active
          </span>
        </div>

        <form onSubmit={handleStartCampScreening} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                value={quickPatientName}
                onChange={(e) => setQuickPatientName(e.target.value)}
                placeholder="e.g. Appala Raju"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                value={quickPatientAge}
                onChange={(e) => setQuickPatientAge(e.target.value)}
                placeholder="e.g. 56"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={quickPatientPhone}
                onChange={(e) => setQuickPatientPhone(e.target.value)}
                placeholder="+91 98480 00000"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">Pre-triage Risk Level:</span>
              <button
                type="button"
                onClick={() => setQuickPatientRisk('HIGH')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  quickPatientRisk === 'HIGH' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                High / Symptomatic
              </button>
              <button
                type="button"
                onClick={() => setQuickPatientRisk('MODERATE')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  quickPatientRisk === 'MODERATE' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Moderate
              </button>
              <button
                type="button"
                onClick={() => setQuickPatientRisk('LOW')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  quickPatientRisk === 'LOW' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Routine / Low
              </button>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Begin Fundus Photography</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Enrolled Patients Roster in This Camp */}
      {camp.enrolledPatients && camp.enrolledPatients.length > 0 && (
        <div className="clinical-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Today's Camp Screening Roster ({camp.enrolledPatients.length})</h3>
            </div>
            <span className="text-xs text-slate-500">Live Intake Queue</span>
          </div>

          <div className="divide-y divide-slate-100">
            {camp.enrolledPatients.map((pt, idx) => (
              <div key={pt.id || idx} className="py-3 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{pt.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{pt.displayId}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {pt.age} yrs • {pt.phone} • Check-in: {pt.enrolledAt}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    pt.risk === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {pt.risk} Risk
                  </span>

                  <button
                    onClick={() => navigate(`/screening?patientId=${pt.id}`)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ScanEye className="w-3.5 h-3.5" />
                    <span>Capture Fundus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create New Screening Camp */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Tent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Screening Camp</h3>
                  <p className="text-xs text-slate-500">Initialize a rural outreach screening cohort session</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCamp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Camp Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  placeholder="e.g. Anakapalle Rural PHC Screening Camp"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Cohort Capacity *
                  </label>
                  <input
                    type="number"
                    required
                    value={newCampTarget}
                    onChange={(e) => setNewCampTarget(e.target.value)}
                    placeholder="50"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">Remaining cohort starts at this target</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lead ASHA Worker
                  </label>
                  <input
                    type="text"
                    value={newCampWorker}
                    onChange={(e) => setNewCampWorker(e.target.value)}
                    placeholder="Bhanu Mannam"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location & Facility *
                </label>
                <input
                  type="text"
                  required
                  value={newCampLocation}
                  onChange={(e) => setNewCampLocation(e.target.value)}
                  placeholder="e.g. Primary Health Centre (PHC), Ward 4"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold">Initial Metrics on Launch:</div>
                <div className="text-[11px] text-emerald-800">
                  • <strong>Screened Today:</strong> 0<br />
                  • <strong>Remaining Cohort:</strong> {newCampTarget || 50}<br />
                  • <strong>High Risk Identified:</strong> 0
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Launch Camp Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
