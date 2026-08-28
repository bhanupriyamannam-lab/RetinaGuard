import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MOCK_PATIENTS, MOCK_SCANS } from '../data/mockData';
import { RetinalCanvasViewer } from '../components/retinal-viewer/RetinalCanvasViewer';
import { AttentionRegionList } from '../components/retinal-viewer/AttentionRegionList';
import { Sparkles, ArrowLeft, GitPullRequest, Columns, AlertCircle, ScanEye, Printer } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useDemo } from '../context/DemoContext';
import { patientService } from '../services';
import { Patient } from '../types';

export const ExplainableAIView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preset = searchParams.get('preset');
  const patientId = searchParams.get('patientId') || 'p-1042';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isDemoMode } = useDemo();

  const [selectedRegionId, setSelectedRegionId] = useState<string | null>('inferior');
  const [patient, setPatient] = useState<Patient | null>(() => {
    if (isDemoMode) {
      return MOCK_PATIENTS.find(p => p.id === patientId || p.displayId === patientId) || MOCK_PATIENTS[0];
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Diagnostic Condition Selector (Defaults to MODERATE for detected retinopathy)
  const [diagnosticCondition, setDiagnosticCondition] = useState<'HEALTHY' | 'MODERATE' | 'SEVERE'>(() => {
    if (preset === 'HEALTHY') return 'HEALTHY';
    if (preset === 'SEVERE' || preset === 'PROGRESSION') return 'SEVERE';
    return 'MODERATE';
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    patientService.getPatientById(patientId)
      .then(res => {
        if (isMounted) {
          setPatient(res || (isDemoMode ? MOCK_PATIENTS[0] : null));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, [patientId, isDemoMode]);

  if (isLoading && !patient) {
    return (
      <div className="clinical-card p-12 text-center space-y-3 max-w-xl mx-auto my-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center animate-spin">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-sm font-bold text-slate-800">Generating Explainability Map...</div>
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
          <h2 className="text-base font-bold text-slate-900">No Explainable AI Scan Available</h2>
          <p className="text-xs text-slate-500">
            Explainable AI activation maps (Grad-CAM) require an active screening session. Register a patient and perform a screening to generate heatmaps.
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
  let scan = MOCK_SCANS['scan-1042-4'];

  if (diagnosticCondition === 'HEALTHY') {
    scan = MOCK_SCANS['scan-healthy'];
  } else if (diagnosticCondition === 'MODERATE') {
    scan = MOCK_SCANS['scan-1042-4'];
  } else {
    scan = MOCK_SCANS['scan-1042-4'];
  }

  const canvasSeverity = diagnosticCondition === 'HEALTHY' ? 'NO_DR' : diagnosticCondition === 'MODERATE' ? 'MODERATE_DR' : 'PROGRESSION';

  const handleCreateReferral = () => {
    showToast({
      type: 'success',
      title: 'Referral Initiated',
      message: `Referral drafted for ${activePatient.name} based on XAI findings.`
    });
    navigate('/referrals');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Result</span>
          </button>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Explainable AI (XAI)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Why did the AI make this prediction?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Grad-CAM gradient-weighted class activation mapping for {activePatient.name} ({activePatient.displayId}).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate(`/patient-report?patientId=${activePatient.id}&autoPrint=true`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Print Clinical Report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>

          {activePatient.historyTimeline && activePatient.historyTimeline.length >= 2 && (
            <button
              onClick={() => navigate(`/compare?patientId=${activePatient.id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Columns className="w-3.5 h-3.5 text-slate-400" />
              <span>Compare Scans</span>
            </button>
          )}

          <button
            onClick={handleCreateReferral}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Create Referral</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas with Layers (Left) + Model Attention List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Retinal Viewer (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <RetinalCanvasViewer
            severity={canvasSeverity}
            initialMode="overlay"
            imageUrl={localStorage.getItem(`retinaguard_retina_image_${activePatient.id}`) || localStorage.getItem('retinaguard_last_uploaded_retina_image')}
            highlightRegion={selectedRegionId}
            title={`Grad-CAM Map • ${activePatient.name} (${activePatient.displayId})`}
            badge="Activation Overlay"
            height="h-[460px] sm:h-[540px]"
          />

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-800">Heatmap Intensity:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span className="text-[11px] text-slate-500">High Influence</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-2" />
                <span className="text-[11px] text-slate-500">Moderate</span>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ml-2" />
                <span className="text-[11px] text-slate-500">Low</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Grad-CAM Vision Backbone</span>
          </div>
        </div>

        {/* Contributing Regions Panel (5 Cols) */}
        <div className="lg:col-span-5 h-full space-y-3">
          {/* Quick Clinical Finding Override Switcher */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Diagnostic Finding Mode:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setDiagnosticCondition('MODERATE')}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  diagnosticCondition === 'MODERATE'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Moderate DR
              </button>
              <button
                type="button"
                onClick={() => setDiagnosticCondition('SEVERE')}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  diagnosticCondition === 'SEVERE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Severe DR
              </button>
              <button
                type="button"
                onClick={() => setDiagnosticCondition('HEALTHY')}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                  diagnosticCondition === 'HEALTHY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Normal (No DR)
              </button>
            </div>
          </div>

          <AttentionRegionList
            regions={scan?.diagnosis?.attentionRegions || []}
            selectedRegionId={selectedRegionId}
            onSelectRegion={(id) => setSelectedRegionId(id)}
            confidence={scan?.diagnosis?.confidence || 0.94}
            severityLabel={
              diagnosticCondition === 'HEALTHY' 
                ? 'No Apparent Retinopathy (Normal)' 
                : diagnosticCondition === 'SEVERE'
                ? 'Severe Proliferative DR Detected'
                : 'Moderate Non-Proliferative DR Detected (Exudates & Hemorrhages)'
            }
          />
        </div>
      </div>
    </div>
  );
};
