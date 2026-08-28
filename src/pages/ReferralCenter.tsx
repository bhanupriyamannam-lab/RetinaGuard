import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MOCK_REFERRALS, MOCK_PATIENTS } from '../data/mockData';
import { ReferralStatusBadge } from '../components/common/Badge';
import { ReferralItem, ReferralStatus, ReferralUrgency, RiskLevel, Patient } from '../types';
import { referralService, patientService } from '../services';
import { useDemo } from '../context/DemoContext';
import { useToast } from '../context/ToastContext';
import { RegisterPatientModal } from '../components/common/RegisterPatientModal';
import { 
  GitPullRequest, 
  Search, 
  Building2, 
  User, 
  ArrowRight, 
  Plus,
  Car,
  X,
  CheckCircle2,
  Inbox,
  UserPlus,
  Edit,
  Trash2
} from 'lucide-react';

export const ReferralCenter: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { isDemoMode } = useDemo();

  const [referrals, setReferrals] = useState<ReferralItem[]>(() => {
    try {
      const saved = localStorage.getItem('retinaguard_referrals_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return isDemoMode ? MOCK_REFERRALS : [];
  });
  const [patientsList, setPatientsList] = useState<Patient[]>(() => isDemoMode ? MOCK_PATIENTS : []);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // New Referral Form state
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualId, setManualId] = useState('');
  const [manualAge, setManualAge] = useState<number | ''>(52);
  const [manualRisk, setManualRisk] = useState<RiskLevel>('HIGH');

  const [newPatientId, setNewPatientId] = useState('');
  const [newUrgency, setNewUrgency] = useState<ReferralUrgency>('URGENT');
  const [newSpecialist, setNewSpecialist] = useState('');
  const [newHospital, setNewHospital] = useState('');
  const [newFacilityType, setNewFacilityType] = useState<'District Eye Hospital' | 'Tertiary Apex Center' | 'Mobile Tele-Ophthalmology Unit'>('Tertiary Apex Center');
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newTransportAssistance, setNewTransportAssistance] = useState(false);

  const [editingReferral, setEditingReferral] = useState<ReferralItem | null>(null);

  // Delete Referral
  const handleDeleteReferral = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete the referral and patient record for ${name}? This will remove the record across all screens.`)) {
      const ref = referrals.find(r => r.id === id);
      if (ref) {
        await patientService.deletePatient(ref.patientId || ref.id);
      }
      setReferrals(prev => prev.filter(r => r.id !== id));
      showToast({
        type: 'info',
        title: 'Referral Deleted',
        message: `Referral record for ${name} permanently removed.`
      });
    }
  };

  // Save Edited Referral
  const handleSaveEditedReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReferral) return;
    await patientService.updatePatient(editingReferral.patientId || editingReferral.id, {
      name: editingReferral.patientName,
      age: editingReferral.patientAge,
      riskLevel: editingReferral.riskLevel
    });
    setReferrals(prev => prev.map(r => r.id === editingReferral.id ? { ...editingReferral, lastUpdated: 'Just now' } : r));
    const targetName = editingReferral.patientName;
    setEditingReferral(null);
    showToast({
      type: 'success',
      title: 'Referral Updated',
      message: `Referral details updated for ${targetName}.`
    });
  };

  // Sync referrals to localStorage
  useEffect(() => {
    try {
      if (referrals && referrals.length > 0) {
        localStorage.setItem('retinaguard_referrals_list', JSON.stringify(referrals));
      }
    } catch {}
  }, [referrals]);

  useEffect(() => {
    let isMounted = true;
    referralService.getReferrals().then(res => {
      if (isMounted && res && res.length > 0) {
        setReferrals(res);
      }
    });
    patientService.getAllPatients().then(pts => {
      if (isMounted && pts.length > 0) {
        setPatientsList(pts);
        const queryPtId = searchParams.get('patientId');
        if (queryPtId) {
          const match = pts.find(p => p.id === queryPtId || p.displayId === queryPtId);
          if (match) {
            setNewPatientId(match.id);
            setIsModalOpen(true);
          } else {
            setNewPatientId(pts[0].id);
          }
        } else {
          setNewPatientId(pts[0].id);
        }
      }
    });

    if (searchParams.get('create') === 'true') {
      setIsModalOpen(true);
    }

    return () => { isMounted = false; };
  }, [isDemoMode, searchParams]);

  const handleAdvanceStatus = async (item: ReferralItem) => {
    const sequence: ReferralStatus[] = [
      'REFERRED',
      'NOTIFIED',
      'APPOINTMENT_BOOKED',
      'SPECIALIST_REVIEWED',
      'COMPLETED'
    ];

    const currentIdx = sequence.indexOf(item.status === 'SCREENED' ? 'REFERRED' : item.status);
    if (currentIdx < sequence.length - 1) {
      const nextStatus = sequence[currentIdx + 1];
      
      // Optimistically update UI immediately
      setReferrals(prev => prev.map(r => r.id === item.id ? { ...r, status: nextStatus, lastUpdated: 'Just now' } : r));

      try {
        const updated = await referralService.updateStatus(item.id, nextStatus);
        if (updated) {
          setReferrals(prev => prev.map(r => r.id === item.id ? updated : r));
        }
      } catch {}

      showToast({
        type: 'success',
        title: 'Referral Stage Advanced',
        message: `${item.patientName} advanced to ${nextStatus.replace('_', ' ')}`
      });
    }
  };

  const handleSetSpecificStatus = async (item: ReferralItem, newStatus: ReferralStatus) => {
    // Optimistically update UI immediately
    setReferrals(prev => prev.map(r => r.id === item.id ? { ...r, status: newStatus, lastUpdated: 'Just now' } : r));

    try {
      const updated = await referralService.updateStatus(item.id, newStatus);
      if (updated) {
        setReferrals(prev => prev.map(r => r.id === item.id ? updated : r));
      }
    } catch {}

    showToast({
      type: 'success',
      title: 'Referral Stage Updated',
      message: `${item.patientName} care track updated to ${newStatus.replace('_', ' ')}.`
    });
  };

  const handleCreateReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetPatientId = newPatientId;
    let targetDisplayId = '';
    let targetName = '';
    let targetAge = 45;
    let targetRisk: RiskLevel = 'HIGH';

    if (isManualEntry || patientsList.length === 0) {
      targetName = manualName.trim() || 'Walk-in Patient';
      targetDisplayId = manualId.trim() || `#2026/29/08/${Math.floor(10 + Math.random() * 90)}`;
      targetAge = Number(manualAge) || 50;
      targetRisk = manualRisk;
      targetPatientId = `p-${Date.now()}`;
    } else {
      const patient = patientsList.find(p => p.id === newPatientId) || patientsList[0];
      if (patient) {
        targetPatientId = patient.id;
        targetDisplayId = patient.displayId;
        targetName = patient.name;
        targetAge = patient.age;
        targetRisk = (patient.riskLevel || 'HIGH') as RiskLevel;
      }
    }

    const created = await referralService.createReferral({
      patientId: targetPatientId,
      patientDisplayId: targetDisplayId,
      patientName: targetName,
      patientAge: targetAge,
      riskLevel: targetRisk,
      urgency: newUrgency,
      specialistName: newSpecialist.trim() || 'Dr. Arvind Swaminathan (Vitreoretinal Surgeon)',
      hospitalName: newHospital.trim() || 'Visakha Government Regional Eye Hospital',
      facilityType: newFacilityType,
      primaryDiagnosis: newDiagnosis.trim() || 'High-Risk Diabetic Retinopathy Referral',
      notes: newNotes.trim() || 'Referred directly from RetinaGuard AI screening workspace.',
      transportAssistanceRequired: newTransportAssistance
    });

    setReferrals(prev => [created, ...prev.filter(r => r.id !== created.id)]);
    setIsModalOpen(false);

    // Reset inputs
    setManualName('');
    setManualId('');
    setNewSpecialist('');
    setNewHospital('');
    setNewDiagnosis('');
    setNewNotes('');
    setNewTransportAssistance(false);

    showToast({
      type: 'success',
      title: 'Referral Dispatched',
      message: `Direct electronic referral created for ${targetName} (${targetDisplayId}) to ${newHospital || 'Visakha Government Regional Eye Hospital'}.`
    });
  };

  const filteredReferrals = referrals.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.patientName.toLowerCase().includes(q) ||
        r.patientDisplayId.toLowerCase().includes(q) ||
        r.specialistName.toLowerCase().includes(q) ||
        r.hospitalName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            <GitPullRequest className="w-4 h-4" />
            <span>Specialist Care Pathway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Referral Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tracking diabetic retinopathy patients from initial screening detection to specialist intervention and treatment.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Referral</span>
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="clinical-card p-4">
          <span className="text-xs font-medium text-slate-500">Active Referrals</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tabular-nums">{referrals.length}</div>
          <span className="text-[11px] text-brand-600 font-semibold mt-0.5 inline-block">In active pipeline</span>
        </div>

        <div className="clinical-card p-4">
          <span className="text-xs font-medium text-slate-500">Urgent / Emergency</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1 tabular-nums">
            {referrals.filter(r => r.urgency === 'URGENT' || r.urgency === 'EMERGENCY').length.toString().padStart(2, '0')}
          </div>
          <span className="text-[11px] text-rose-600 font-semibold mt-0.5 inline-block">Within 7-14 days</span>
        </div>

        <div className="clinical-card p-4">
          <span className="text-xs font-medium text-slate-500">Appointment Booked</span>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 mt-1 tabular-nums">
            {referrals.filter(r => r.status === 'APPOINTMENT_BOOKED').length.toString().padStart(2, '0')}
          </div>
          <span className="text-[11px] text-purple-600 font-semibold mt-0.5 inline-block">Slot confirmed</span>
        </div>

        <div className="clinical-card p-4">
          <span className="text-xs font-medium text-slate-500">Completed Care</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 tabular-nums">
            {referrals.filter(r => r.status === 'COMPLETED').length.toString().padStart(2, '0')}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 inline-block">Laser / Anti-VEGF done</span>
        </div>
      </div>

      {/* Workflow Visual Ribbon */}
      <div className="clinical-card p-5">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Referral Lifecycle Stages
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
          {[
            { label: '1. Screened', desc: 'Lesion detected' },
            { label: '2. Referred', desc: 'Case dispatched' },
            { label: '3. Patient Notified', desc: 'SMS / Call done' },
            { label: '4. Appt Booked', desc: 'Slot assigned' },
            { label: '5. Reviewed', desc: 'OCT / Exam' },
            { label: '6. Completed', desc: 'Intervention done' },
          ].map((stage, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div className="font-bold text-slate-800">{stage.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{stage.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="clinical-card p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {['ALL', 'REFERRED', 'NOTIFIED', 'APPOINTMENT_BOOKED', 'SPECIALIST_REVIEWED', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Referrals' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search referrals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Referral Records Grid or Empty State */}
      {filteredReferrals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReferrals.map((item) => (
            <div
              key={item.id}
              className="clinical-card p-5 flex flex-col justify-between hover:border-slate-300 transition-all group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.patientName}
                      </h3>
                      <span className="font-mono text-[11px] font-semibold text-slate-400">
                        {item.patientDisplayId}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Age {item.patientAge} • Target: {item.targetDate}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <ReferralStatusBadge status={item.status} />
                    <button
                      type="button"
                      onClick={() => setEditingReferral({ ...item })}
                      title="Edit Referral"
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteReferral(item.id, item.patientName)}
                      title="Delete Referral"
                      className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Clinical Indication */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-3 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagnosis</div>
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {item.primaryDiagnosis}
                  </div>
                </div>

                {/* Hospital & Specialist */}
                <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-800">{item.hospitalName}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{item.specialistName}</span>
                  </div>
                  {item.transportAssistanceRequired && (
                    <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-medium text-[11px]">
                      <Car className="w-3 h-3 text-blue-600" />
                      <span>Transport Assistance Assigned</span>
                    </div>
                  )}
                </div>

                {/* Interactive Clickable Care Pathway Stage Stepper */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Care Pathway Track (Click to Update)</span>
                    <span className="text-blue-600 font-bold">
                      {item.status === 'COMPLETED' ? '✓ Completed' : item.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {[
                      { key: 'REFERRED', label: 'Referred' },
                      { key: 'NOTIFIED', label: 'Notified' },
                      { key: 'APPOINTMENT_BOOKED', label: 'Booked' },
                      { key: 'SPECIALIST_REVIEWED', label: 'Reviewed' },
                      { key: 'COMPLETED', label: 'Completed' }
                    ].map((st, sIdx) => {
                      const stages = ['REFERRED', 'NOTIFIED', 'APPOINTMENT_BOOKED', 'SPECIALIST_REVIEWED', 'COMPLETED'];
                      const currentIdx = stages.indexOf(item.status === 'SCREENED' ? 'REFERRED' : item.status);
                      const isPast = sIdx < currentIdx;
                      const isCurrent = sIdx === currentIdx;

                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => handleSetSpecificStatus(item, st.key as ReferralStatus)}
                          title={`Click to set stage to ${st.label}`}
                          className={`py-1.5 px-0.5 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                            isCurrent
                              ? 'bg-blue-600 text-white font-bold shadow-xs ring-2 ring-blue-500/20'
                              : isPast
                              ? 'bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200'
                              : 'bg-white text-slate-400 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                          }`}
                        >
                          <span className="text-[10px] leading-none block font-bold">
                            {isPast ? '✓' : `${sIdx + 1}`}
                          </span>
                          <span className="text-[9px] truncate w-full mt-0.5 block leading-tight font-medium">
                            {st.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => navigate(`/patients/${item.patientId}`)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>Patient 360</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                {item.status !== 'COMPLETED' ? (
                  <button
                    onClick={() => handleAdvanceStatus(item)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Advance Next Stage →
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Care Finalized</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="clinical-card p-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Active Referrals</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Referrals created from screening results or clinical triage will appear here.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Specialist Referral</span>
          </button>
        </div>
      )}

      {/* CREATE NEW REFERRAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                  <GitPullRequest className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Create Specialist Referral
                  </h3>
                  <p className="text-xs text-slate-500">Dispatch clinical care record to regional eye hospital</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReferralSubmit} className="space-y-4 text-xs">
              {/* Patient Selection Section (Dropdown + Manual Entry Mode) */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="font-bold text-slate-800 text-xs">Patient Information *</label>
                  
                  <div className="flex items-center gap-1.5 bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setIsManualEntry(false)}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        !isManualEntry ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Registered List ({patientsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsManualEntry(true)}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        isManualEntry ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Enter Manually
                    </button>
                  </div>
                </div>

                {!isManualEntry && patientsList.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={newPatientId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setNewPatientId(pid);
                        const p = patientsList.find(item => item.id === pid);
                        if (p) {
                          setNewDiagnosis(
                            p.currentSeverity === 'PROLIFERATIVE_DR'
                              ? 'Proliferative Diabetic Retinopathy (PDR) with Neovascularization Threat'
                              : p.currentSeverity === 'PROGRESSION'
                              ? 'Moderate NPDR with Rapid Progression & Early DME Threat'
                              : 'Moderate Non-Proliferative Retinopathy with Microaneurysms'
                          );
                        }
                      }}
                      className="flex-1 p-2.5 rounded-xl bg-white border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {patientsList.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.displayId}) • Risk: {p.riskLevel}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsRegisterModalOpen(true)}
                      className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors cursor-pointer"
                      title="Register a new patient"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Register</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Patient Full Name *</label>
                        <input
                          type="text"
                          required
                          value={manualName}
                          onChange={e => setManualName(e.target.value)}
                          placeholder="e.g. Bhanu Mannam"
                          className="w-full p-2 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Patient ID / Code</label>
                        <input
                          type="text"
                          value={manualId}
                          onChange={e => setManualId(e.target.value)}
                          placeholder="e.g. 2026/28/08/0"
                          className="w-full p-2 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Age (Years)</label>
                        <input
                          type="number"
                          value={manualAge}
                          onChange={e => setManualAge(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="52"
                          className="w-full p-2 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Risk Level</label>
                        <select
                          value={manualRisk}
                          onChange={e => setManualRisk(e.target.value as any)}
                          className="w-full p-2 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="HIGH">High Risk</option>
                          <option value="CRITICAL">Critical / Urgent</option>
                          <option value="MODERATE">Moderate Risk</option>
                          <option value="LOW">Low Risk</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">Or quickly register a new patient in the central database:</span>
                      <button
                        type="button"
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Register Patient</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Urgency & Facility Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Referral Urgency *</label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as ReferralUrgency)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="EMERGENCY">EMERGENCY (Within 48 Hours)</option>
                    <option value="URGENT">URGENT (Within 7-14 Days)</option>
                    <option value="PRIORITY">PRIORITY (Within 30 Days)</option>
                    <option value="ROUTINE">ROUTINE (Standard Surveillance)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Facility Tier *</label>
                  <select
                    value={newFacilityType}
                    onChange={(e) => {
                      const ft = e.target.value as any;
                      setNewFacilityType(ft);
                      if (ft === 'Tertiary Apex Center') {
                        setNewHospital('Visakha Government Regional Eye Hospital');
                        setNewSpecialist('Dr. Arvind Swaminathan (Vitreoretinal Surgeon)');
                      } else if (ft === 'District Eye Hospital') {
                        setNewHospital('District Community Eye Clinic');
                        setNewSpecialist('Dr. P. R. Reddy (Senior Consultant)');
                      } else {
                        setNewHospital('Tele-Ophthalmology Primary Node');
                        setNewSpecialist('Dr. Harish Rao (Tele-Consultant)');
                      }
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Tertiary Apex Center">Tertiary Apex Center</option>
                    <option value="District Eye Hospital">District Eye Hospital</option>
                    <option value="Mobile Tele-Ophthalmology Unit">Mobile Tele-Ophthalmology Unit</option>
                  </select>
                </div>
              </div>

              {/* Hospital & Specialist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destination Facility</label>
                  <input
                    type="text"
                    value={newHospital}
                    onChange={(e) => setNewHospital(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Specialist</label>
                  <input
                    type="text"
                    value={newSpecialist}
                    onChange={(e) => setNewSpecialist(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Primary Diagnosis */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Clinical Indication</label>
                <input
                  type="text"
                  value={newDiagnosis}
                  onChange={(e) => setNewDiagnosis(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Notes for Specialist</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:outline-none"
                />
              </div>

              {/* Transport Assistance Checkbox */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="transportAssistance"
                  checked={newTransportAssistance}
                  onChange={(e) => setNewTransportAssistance(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="transportAssistance" className="font-semibold text-slate-800 cursor-pointer">
                  Request Community Transport Assistance (Rural ASHA coordinator pickup)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Dispatch Referral</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <RegisterPatientModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onPatientCreated={(newP) => {
          setPatientsList(prev => [newP, ...prev]);
          setNewPatientId(newP.id);
          setIsManualEntry(false);
          setIsRegisterModalOpen(false);
        }}
      />

      {/* EDIT REFERRAL MODAL */}
      {editingReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Specialist Referral</h3>
                  <p className="text-xs text-slate-500">Update destination hospital, specialist, or stage for {editingReferral.patientName}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingReferral(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedReferral} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Referral Urgency</label>
                  <select
                    value={editingReferral.urgency}
                    onChange={(e) => setEditingReferral({ ...editingReferral, urgency: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="ROUTINE">Routine (Surveillance)</option>
                    <option value="PRIORITY">Priority (30 Days)</option>
                    <option value="URGENT">Urgent (7-14 Days)</option>
                    <option value="EMERGENCY">Emergency (48 Hours)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Stage</label>
                  <select
                    value={editingReferral.status}
                    onChange={(e) => setEditingReferral({ ...editingReferral, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="REFERRED">Referred</option>
                    <option value="NOTIFIED">Patient Notified</option>
                    <option value="APPOINTMENT_BOOKED">Appointment Booked</option>
                    <option value="SPECIALIST_REVIEWED">Specialist Reviewed</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Destination Hospital / Eye Center</label>
                <input
                  type="text"
                  required
                  value={editingReferral.hospitalName}
                  onChange={(e) => setEditingReferral({ ...editingReferral, hospitalName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Vitreoretinal Specialist</label>
                <input
                  type="text"
                  required
                  value={editingReferral.specialistName}
                  onChange={(e) => setEditingReferral({ ...editingReferral, specialistName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Clinical Diagnosis / Reason</label>
                <input
                  type="text"
                  required
                  value={editingReferral.primaryDiagnosis}
                  onChange={(e) => setEditingReferral({ ...editingReferral, primaryDiagnosis: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Notes & Action Plan</label>
                <textarea
                  rows={2}
                  value={editingReferral.notes || ''}
                  onChange={(e) => setEditingReferral({ ...editingReferral, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="editTransport"
                  checked={editingReferral.transportAssistanceRequired || false}
                  onChange={(e) => setEditingReferral({ ...editingReferral, transportAssistanceRequired: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editTransport" className="font-semibold text-slate-800 cursor-pointer">
                  Transport Assistance Assigned (ASHA Community Transport)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingReferral(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
