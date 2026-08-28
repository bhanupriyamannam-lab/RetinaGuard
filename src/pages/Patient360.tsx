import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_PATIENTS } from '../data/mockData';
import { patientService } from '../services';
import { useDemo } from '../context/DemoContext';
import { Patient } from '../types';
import { RiskBadge } from '../components/common/Badge';
import { LoadingState } from '../components/common/LoadingState';
import { EditPatientModal } from '../components/common/EditPatientModal';
import { RegisterPatientModal } from '../components/common/RegisterPatientModal';
import { LongitudinalJourneyTimeline } from '../components/timeline/LongitudinalJourneyTimeline';
import { RiskTrajectoryChart } from '../components/timeline/RiskTrajectoryChart';
import { useToast } from '../context/ToastContext';
import { 
  MapPin, 
  GitPullRequest, 
  Columns, 
  ArrowRight, 
  Printer, 
  ShieldAlert,
  Calendar,
  AlertCircle,
  ScanEye,
  Edit3,
  Users,
  UserPlus,
  Search,
  Trash2,
  CheckCircle2,
  CalendarClock
} from 'lucide-react';

export const Patient360: React.FC = () => {
  const { patientId = 'p-1042' } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isDemoMode } = useDemo();

  const [patient, setPatient] = useState<Patient | null>(() => {
    if (isDemoMode) {
      return MOCK_PATIENTS.find(p => p.id === patientId || p.displayId === patientId) || MOCK_PATIENTS[0];
    }
    return null;
  });
  const [allPatientsList, setAllPatientsList] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    // Fetch all patients for directory
    patientService.getAllPatients().then(all => {
      if (isMounted) {
        setAllPatientsList(all);
      }
    });

    patientService.getPatientById(patientId)
      .then(res => {
        if (isMounted && res) {
          setPatient(res);
        } else if (isMounted) {
          // If requested ID not found (e.g. default 'p-1042'), load latest registered patient
          patientService.getAllPatients().then(all => {
            if (isMounted && all.length > 0) {
              setPatient(all[0]);
            }
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, [patientId, isDemoMode]);

  if (isLoading && !patient) {
    return <LoadingState message="Loading Patient 360 clinical dossier..." />;
  }

  if (!patient) {
    return (
      <div className="clinical-card p-12 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">No Patient Record Selected</h2>
          <p className="text-xs text-slate-500">
            Select an existing patient from Overview or register a new patient below.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            + Register New Patient
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <RegisterPatientModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onPatientCreated={(newP: any) => {
            setPatient(newP);
            setIsRegisterModalOpen(false);
          }}
        />
      </div>
    );
  }

  const historyLength = patient.historyTimeline?.length || 0;
  const hasProgressionData = historyLength >= 2;

  const trajectoryData = hasProgressionData
    ? patient.historyTimeline.map(item => ({
        date: item.date.split(',')[0],
        stageTitle: item.stageTitle,
        riskScore: item.riskScore
      }))
    : [];

  const handleCreateReferral = () => {
    showToast({
      type: 'success',
      title: 'Referral Queued',
      message: `Referral drafted for ${patient.name} to Visakha Regional Eye Hospital.`
    });
    navigate('/referrals');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Edit Patient Modal */}
      {isEditModalOpen && (
        <EditPatientModal
          isOpen={isEditModalOpen}
          patient={patient}
          onClose={() => setIsEditModalOpen(false)}
          onPatientUpdated={(updated) => setPatient(updated)}
        />
      )}

      {/* Registered Patients Directory & Quick Switcher */}
      {allPatientsList.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900">Registered Patient Directory ({allPatientsList.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  placeholder="Search directory..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-48"
                />
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Register</span>
              </button>
            </div>
          </div>

          {/* Scrollable Patient Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {allPatientsList
              .filter(p => !patientSearch.trim() || p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.displayId.toLowerCase().includes(patientSearch.toLowerCase()))
              .map(p => {
                const isSelected = p.id === patient.id || p.displayId === patient.displayId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPatient(p);
                      navigate(`/patients/${p.id}`);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left border transition-all flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-lg object-cover border border-slate-300" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        {p.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                        <span>{p.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">{p.displayId}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>{p.age}y • {p.gender}</span>
                        <span className="text-slate-300">•</span>
                        <span className={`font-semibold ${p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL' ? 'text-rose-600' : 'text-slate-600'}`}>
                          {p.riskLevel}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Patient Dossier Header Card */}
      <div className="clinical-card p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          <div
            onClick={() => setIsEditModalOpen(true)}
            className="relative flex-shrink-0 cursor-pointer group"
            title="Click to edit patient photo and details"
          >
            {patient.avatar ? (
              <img
                src={patient.avatar}
                alt={patient.name}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border border-slate-200 shadow-sm group-hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center border border-slate-200 shadow-sm group-hover:scale-105 transition-transform">
                {patient.name.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Edit3 className="w-4 h-4" />
            </div>
            {patient.riskLevel === 'HIGH' && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-3 h-3" />
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {patient.name}
              </h1>
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {patient.displayId}
              </span>
              <RiskBadge risk={patient.riskLevel} size="sm" />
              {isDemoMode && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  SAMPLE PATIENT
                </span>
              )}
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap pt-0.5">
              <span><strong>Age:</strong> {patient.age} yrs • {patient.gender}</span>
              <span className="text-slate-300">•</span>
              <span><strong>Diabetes:</strong> {patient.diabetesType} ({patient.diabetesDurationYears || 0} yrs)</span>
              <span className="text-slate-300">•</span>
              <span><strong>HbA1c:</strong> <span className="tabular-nums font-semibold text-slate-800">{patient.hba1c || '—'}%</span></span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{patient.location}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Edit Patient Details and Photo"
          >
            <Edit3 className="w-4 h-4 text-blue-600" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => navigate(`/screening?patientId=${patient.id}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <ScanEye className="w-4 h-4" />
            <span>Screening</span>
          </button>

          <button
            onClick={async () => {
              if (window.confirm(`Are you sure you want to permanently delete ${patient.name} (${patient.displayId})? This will remove the patient from all lists and queues.`)) {
                await patientService.deletePatient(patient.id);
                showToast({
                  type: 'info',
                  title: 'Patient Record Deleted',
                  message: `${patient.name} was deleted from all records.`
                });
                navigate('/');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 shadow-xs transition-colors cursor-pointer"
            title="Permanently Delete Patient Everywhere"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Delete</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Print Patient Clinical Dossier"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Longitudinal Comparison Banner */}
      {hasProgressionData ? (
        <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Baseline Scan</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5">
                {patient.historyTimeline[0]?.stageTitle || 'Initial Screening'}
              </div>
              <div className="text-xs text-slate-400">
                {patient.historyTimeline[0]?.date || 'Prior Encounter'}
              </div>
            </div>

            <div className="hidden sm:block text-slate-500 font-bold text-base">→</div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">Latest Scan</div>
              <div className="text-sm font-extrabold text-rose-300 mt-0.5">
                {patient.historyTimeline[patient.historyTimeline.length - 1]?.stageTitle || 'Latest Assessment'}
              </div>
              <div className="text-xs text-slate-300">
                {patient.historyTimeline[patient.historyTimeline.length - 1]?.date || 'Current Encounter'}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/compare?patientId=${patient.id}`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 shadow-sm transition-all whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <Columns className="w-4 h-4 text-blue-600" />
            <span>Interactive Comparison</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="rounded-2xl p-4 bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-bold text-xs text-slate-900">
                {historyLength === 0 ? "No previous retinal screenings recorded" : "Baseline screening recorded (1 encounter)"}
              </div>
              <div className="text-[11px] text-slate-500">
                {historyLength === 0 
                  ? "Perform an initial fundus screening to establish a baseline for this patient."
                  : "Progression velocity analysis requires 2 or more historical scans."}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/screening?patientId=${patient.id}`)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs"
          >
            Capture Retinal Scan
          </button>
        </div>
      )}

      {/* Grid: Retinal Health Journey (Left) + Trajectory & Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Longitudinal Journey Timeline (7 Cols) */}
        <div className="lg:col-span-7">
          {historyLength > 0 ? (
            <LongitudinalJourneyTimeline
              timeline={patient.historyTimeline}
              onCompareScans={() => navigate(`/compare?patientId=${patient.id}`)}
            />
          ) : (
            <div className="clinical-card p-8 text-center space-y-2">
              <div className="font-bold text-sm text-slate-800">No Screening Timeline</div>
              <p className="text-xs text-slate-500">
                Historical scans and AI findings will appear in chronological sequence once screenings are recorded.
              </p>
            </div>
          )}
        </div>

        {/* Predictive Trajectory & Referral Status (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Risk Trajectory Chart */}
          {hasProgressionData ? (
            <RiskTrajectoryChart data={trajectoryData} patientName={patient.name} />
          ) : (
            <div className="clinical-card p-6 text-center space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Risk Trajectory Velocity
              </h3>
              <p className="text-xs text-slate-500">
                Not enough historical screening encounters to plot longitudinal risk trajectory.
              </p>
            </div>
          )}

          {/* Clinical Referral & Follow-up Card: ONLY FOR PATIENTS WITH DETECTED DR */}
          {patient.currentSeverity === 'NO_DR' || patient.riskLevel === 'LOW' ? (
            <div className="clinical-card p-5 sm:p-6 space-y-4 border-emerald-200/80 bg-emerald-50/30">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Surveillance & Recall Protocol</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  🟢 No DR Detected
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-emerald-100 space-y-2 text-xs">
                <div className="font-bold text-slate-900">
                  Healthy Retina — No Specialist Referral Required
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Optical analysis confirmed 0 microaneurysms and 0 retinal hemorrhages. The patient is clear of diabetic retinopathy and does not require apex tertiary referral. Scheduled for routine annual recall (12 months).
                </p>
              </div>

              <button
                onClick={() => navigate('/follow-ups')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>View Annual Surveillance Recall</span>
              </button>
            </div>
          ) : (
            <div className="clinical-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Clinical Referral & Specialist Action
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Action Required: DR Detected
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between">
                  <div>
                    <span className="text-slate-500 font-medium">Assigned Apex Facility:</span>
                    <div className="font-bold text-slate-900 mt-0.5">Visakha Regional Eye Hospital</div>
                    <div className="text-[11px] text-slate-500">Dr. Arvind Swaminathan (Vitreoretinal Specialist)</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                    {patient.activeReferralId ? 'Referred' : 'Standby'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCreateReferral}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <GitPullRequest className="w-4 h-4" />
                <span>Manage Specialist Referral</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
