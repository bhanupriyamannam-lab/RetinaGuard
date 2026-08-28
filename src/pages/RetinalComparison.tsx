import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MOCK_PATIENTS } from '../data/mockData';
import { patientService } from '../services';
import { useDemo } from '../context/DemoContext';
import { Patient } from '../types';
import { RetinalComparisonSlider } from '../components/comparison/RetinalComparisonSlider';
import { FindingsDiffCard } from '../components/comparison/FindingsDiffCard';
import { Columns, ArrowLeft, GitPullRequest, ScanEye, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const RetinalComparison: React.FC = () => {
  const [searchParams] = useSearchParams();
  const patientIdFromParams = searchParams.get('patientId') || 'p-1042';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isDemoMode } = useDemo();

  const [selectedPatientId, setSelectedPatientId] = useState(patientIdFromParams);
  const [patient, setPatient] = useState<Patient | null>(() => {
    if (isDemoMode) {
      return MOCK_PATIENTS.find(p => p.id === selectedPatientId) || MOCK_PATIENTS[0];
    }
    return null;
  });
  const [patientsList, setPatientsList] = useState<Patient[]>(() => isDemoMode ? MOCK_PATIENTS : []);

  useEffect(() => {
    let isMounted = true;
    patientService.getAllPatients().then(list => {
      if (isMounted) {
        setPatientsList(list);
        const current = list.find(p => p.id === selectedPatientId) || list[0] || null;
        setPatient(current);
      }
    });
    return () => { isMounted = false; };
  }, [selectedPatientId, isDemoMode]);

  const timeline = patient?.historyTimeline || [];
  const hasMultipleScans = timeline.length >= 2;
  const currentItem = timeline[timeline.length - 1];
  const baselineItem = timeline[0];

  const handleCreateReferral = () => {
    showToast({
      type: 'success',
      title: 'Referral Queued',
      message: `Urgent referral dispatched for ${patient?.name || 'patient'} due to confirmed longitudinal progression.`
    });
    navigate('/referrals');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <Columns className="w-4 h-4" />
            <span>Longitudinal Scan Comparison</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Compare Retinal Scans: {patient ? patient.name : 'Patient Comparison'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {hasMultipleScans 
              ? `Anatomical microvascular delta comparison between baseline (${baselineItem?.date || 'Jan 18, 2025'}) and current (${currentItem?.date || 'Jul 15, 2026'}) fundus photography.`
              : 'Scan comparison is only available for returning patients on their second visit onwards.'}
          </p>
        </div>

        {/* Patient Switcher & Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {patientsList.length > 0 && (
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 focus:outline-none cursor-pointer shadow-xs"
            >
              {patientsList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.displayId})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => navigate(`/patient-report?patientId=${patient?.id || ''}&autoPrint=true`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Print Clinical Retinal Report"
          >
            <span>Print Report</span>
          </button>

          {hasMultipleScans && (
            <button
              onClick={handleCreateReferral}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            >
              <GitPullRequest className="w-4 h-4" />
              <span>Create Referral</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Comparison or 1st Visit Notice */}
      {!hasMultipleScans ? (
        <div className="clinical-card p-12 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Initial Baseline Screening (Visit #1)</h2>
            <p className="text-xs text-slate-500">
              {patient?.name} has 1 recorded screening encounter. Longitudinal delta comparison is enabled for returning patients on their second visit onwards.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/ai-analysis?patientId=${patient?.id}`)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <span>View Current AI Report</span>
            </button>
            <button
              onClick={() => navigate('/follow-ups')}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Schedule 2nd Follow-up Visit</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <RetinalComparisonSlider
            previousDate={baselineItem?.date || 'Initial Visit'}
            currentDate={currentItem?.date || patient?.lastScreeningDate || 'Today'}
            previousSeverity={(baselineItem?.severity as any) || 'NO_DR'}
            currentSeverity={(currentItem?.severity as any) || (patient?.currentSeverity === 'PROLIFERATIVE_DR' ? 'PROGRESSION' : patient?.currentSeverity as any) || 'MODERATE_DR'}
          />

          <FindingsDiffCard
            patientId={patient?.id || 'p-1042'}
            patientName={patient?.name || 'Kavita Rao'}
            onCreateReferral={handleCreateReferral}
          />
        </>
      )}
    </div>
  );
};
