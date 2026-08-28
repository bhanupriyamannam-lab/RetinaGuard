import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MOCK_PATIENTS } from '../data/mockData';
import { patientService } from '../services';
import { useDemo } from '../context/DemoContext';
import { Patient } from '../types';
import { RetinalCanvasViewer } from '../components/retinal-viewer/RetinalCanvasViewer';
import { useToast } from '../context/ToastContext';
import { 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck,
  Columns, 
  GitPullRequest, 
  Info, 
  Printer,
  ArrowRight,
  CheckCircle2,
  ScanEye,
  AlertCircle
} from 'lucide-react';

export const AIAnalysisView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') || 'p-1042';
  const eye = searchParams.get('eye') || 'OD';
  const severityOverride = searchParams.get('severity');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isDemoMode } = useDemo();

  const [patient, setPatient] = useState<Patient | null>(() => {
    if (isDemoMode) {
      return MOCK_PATIENTS.find(p => p.id === patientId || p.displayId === patientId) || MOCK_PATIENTS[0];
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeSeverity, setActiveSeverity] = useState<string>(() => {
    try {
      const storedCondition = localStorage.getItem(`retinaguard_retina_condition_${patientId}`);
      if (storedCondition) return storedCondition;
    } catch {}
    if (severityOverride) return severityOverride;
    return 'NO_DR';
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    patientService.getPatientById(patientId)
      .then(res => {
        if (isMounted) {
          const resolved = res || (isDemoMode ? MOCK_PATIENTS[0] : null);
          setPatient(resolved);
          try {
            const storedCondition = localStorage.getItem(`retinaguard_retina_condition_${patientId}`);
            if (storedCondition) {
              setActiveSeverity(storedCondition);
              return;
            }
          } catch {}
          if (resolved && !severityOverride) {
            if (resolved.currentSeverity) {
              setActiveSeverity(resolved.currentSeverity);
            }
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, [patientId, isDemoMode, severityOverride]);

  if (isLoading && !patient) {
    return (
      <div className="clinical-card p-12 text-center space-y-3 max-w-xl mx-auto my-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center animate-spin">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-sm font-bold text-slate-800">Loading AI Screening Results...</div>
      </div>
    );
  }

  if (!patient && !isDemoMode) {
    return (
      <div className="clinical-card p-12 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">No Screening Result Available</h2>
          <p className="text-xs text-slate-500">
            No active retinal screening was found for the specified encounter. Register a patient and capture a fundus image to generate AI diagnostics.
          </p>
        </div>
        <button
          onClick={() => navigate('/screening')}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs inline-flex items-center gap-2"
        >
          <ScanEye className="w-4 h-4" />
          <span>New Retinal Screening</span>
        </button>
      </div>
    );
  }

  const activePatient = patient || MOCK_PATIENTS[0];
  const isHealthy = activeSeverity === 'NO_DR';
  const isModerate = activeSeverity === 'MODERATE_DR' && !activePatient.hasProgressionAlert;
  const isCritical = activeSeverity === 'PROLIFERATIVE_DR' || activeSeverity === 'SEVERE_DR';

  const handleCreateReferral = () => {
    showToast({
      type: 'success',
      title: 'Referral Initiated',
      message: `Referral drafted for ${activePatient.name}.`
    });
    navigate('/referrals');
  };

  const canvasSeverity = isHealthy 
    ? 'NO_DR' 
    : isModerate 
    ? 'MODERATE_DR' 
    : isCritical 
    ? 'SEVERE_DR' 
    : 'PROGRESSION';

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Diagnostic Assessment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Screening Result: {activePatient.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Processed 45° macular-centered fundus image ({eye} - Right Eye) • {activePatient.displayId}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate(`/patient-report?patientId=${activePatient.id}&autoPrint=true`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            title="Print Clinical Retinal Diagnostic Report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>

          {activePatient.historyTimeline && activePatient.historyTimeline.length >= 2 ? (
            <button
              onClick={() => navigate(`/compare?patientId=${activePatient.id}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Compare Previous Scan (Visit #2)</span>
            </button>
          ) : (
            <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
              Baseline Screening (Visit #1)
            </span>
          )}
        </div>
      </div>

      {/* Main Diagnosis Summary Card */}
      <div className={`rounded-2xl sm:rounded-3xl p-6 sm:p-7 text-white border space-y-4 ${
        isHealthy 
          ? 'bg-slate-900 border-slate-800' 
          : isCritical 
          ? 'bg-slate-900 border-red-500/50' 
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Primary Screening Assessment
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                isHealthy 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                  : isCritical 
                  ? 'bg-red-500/20 text-red-300 border-red-400/30 font-bold' 
                  : isModerate
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
              }`}>
                {isHealthy ? 'Low Risk' : isCritical ? 'Critical Urgency' : isModerate ? 'Moderate Risk' : 'High Risk Velocity'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isHealthy 
                ? 'NO APPARENT DIABETIC RETINOPATHY' 
                : isCritical 
                ? 'PROLIFERATIVE DIABETIC RETINOPATHY' 
                : isModerate 
                ? 'MODERATE NON-PROLIFERATIVE DR' 
                : 'MODERATE DIABETIC RETINOPATHY'}
            </h2>
            
            <div className={`text-sm font-semibold mt-1 flex items-center gap-2 ${
              isHealthy ? 'text-emerald-300' : isCritical ? 'text-red-400' : isModerate ? 'text-amber-300' : 'text-rose-300'
            }`}>
              {isHealthy ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Optical Macular Architecture Clear (Stage 0 ICDR)</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Actionable Microvascular Lesions Detected</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveSeverity('MODERATE_DR')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSeverity === 'MODERATE_DR'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Moderate DR
              </button>
              <button
                type="button"
                onClick={() => setActiveSeverity('PROLIFERATIVE_DR')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSeverity === 'PROLIFERATIVE_DR' || activeSeverity === 'SEVERE_DR'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Severe DR
              </button>
              <button
                type="button"
                onClick={() => setActiveSeverity('NO_DR')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSeverity === 'NO_DR'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Normal (No DR)
              </button>
            </div>

            <button
              onClick={() => navigate(`/explainable-ai?patientId=${activePatient.id}&preset=${isHealthy ? 'HEALTHY' : isModerate ? 'MODERATE' : 'PROGRESSION'}`)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explainable AI (Grad-CAM)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Retinal Viewer Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <RetinalCanvasViewer
            severity={canvasSeverity}
            imageUrl={localStorage.getItem(`retinaguard_retina_image_${activePatient.id}`) || localStorage.getItem('retinaguard_last_uploaded_retina_image')}
            title={`Fundus Photography (${eye}) • ${activePatient.name}`}
            badge="Optical Fundus Image"
            height="h-[460px] sm:h-[540px]"
          />
        </div>

        {/* Clinical Recommendations & Action Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="clinical-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Clinical Recommendation
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                Protocol AP-DR-26
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isHealthy 
                ? 'Routine 12-month annual diabetic retinopathy screening recommended. Reinforce glycemic control and blood pressure monitoring.'
                : 'Referral to a vitreoretinal specialist recommended within 2 to 4 weeks for dilated slit-lamp funduscopy and optical coherence tomography (OCT).'}
            </p>

            {!isHealthy && (
              <button
                onClick={handleCreateReferral}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <GitPullRequest className="w-4 h-4" />
                <span>Create Specialist Referral</span>
              </button>
            )}
          </div>

          {/* Lesion & Spot Intensity Breakdown */}
          <div className="clinical-card p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ScanEye className="w-4 h-4 text-blue-600" />
                <span>Lesion & Spot Quantification</span>
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isHealthy ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {isHealthy ? '0 Spots' : 'Active Spots'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-medium">🔴 Microaneurysms</span>
                <div className="font-mono font-black text-sm text-slate-900">{isHealthy ? '0' : '10'}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-medium">🟡 Hard Exudates</span>
                <div className="font-mono font-black text-sm text-slate-900">{isHealthy ? '0' : '7'}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-medium">🩸 Hemorrhages</span>
                <div className="font-mono font-black text-sm text-slate-900">{isHealthy ? '0' : '4'}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-medium">💧 Macular Edema</span>
                <div className={`font-mono font-black text-xs ${isHealthy ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isHealthy ? 'LOW' : 'ELEVATED'}
                </div>
              </div>
            </div>

            {/* 5-Class Probability Distribution */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                5-Class Model Probabilities:
              </div>

              <div className="space-y-1 text-[11px] font-medium">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Class 0: No DR</span>
                  <span className="font-mono font-bold text-slate-900">{isHealthy ? '98.6%' : '0.8%'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: isHealthy ? '98.6%' : '0.8%' }} />
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-600">Class 1: Mild NPDR</span>
                  <span className="font-mono font-bold text-slate-900">{isHealthy ? '1.1%' : '6.4%'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: isHealthy ? '1.1%' : '6.4%' }} />
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-600">Class 2: Moderate NPDR</span>
                  <span className="font-mono font-bold text-slate-900">{isHealthy ? '0.2%' : '88.7%'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: isHealthy ? '0.2%' : '88.7%' }} />
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-600">Class 3: Severe NPDR</span>
                  <span className="font-mono font-bold text-slate-900">{isHealthy ? '0.1%' : '3.6%'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: isHealthy ? '0.1%' : '3.6%' }} />
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-600">Class 4: Proliferative DR</span>
                  <span className="font-mono font-bold text-slate-900">{isHealthy ? '0.0%' : '0.5%'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 rounded-full" style={{ width: isHealthy ? '0.0%' : '0.5%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
