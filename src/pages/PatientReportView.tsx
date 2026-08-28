import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MOCK_PATIENTS } from '../data/mockData';
import { BrandLogo } from '../components/common/BrandLogo';
import { useDemo } from '../context/DemoContext';
import { patientService } from '../services';
import { Patient } from '../types';
import { 
  AlertTriangle, 
  Printer, 
  ArrowLeft, 
  QrCode,
  AlertCircle,
  ScanEye
} from 'lucide-react';

export const PatientReportView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') || 'p-1042';
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();

  const [patient, setPatient] = useState<Patient | null>(() => {
    if (isDemoMode) {
      return MOCK_PATIENTS.find(p => p.id === patientId) || MOCK_PATIENTS[0];
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    if (searchParams.get('autoPrint') === 'true' && patient) {
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [patient, searchParams]);

  const handlePrint = () => {
    window.print();
  };

  const uploadedImage = (patient ? localStorage.getItem(`retinaguard_retina_image_${patient.id}`) : null) || localStorage.getItem('retinaguard_last_uploaded_retina_image');

  if (!patient) {
    return (
      <div className="clinical-card p-12 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">No Patient Handout Available</h2>
          <p className="text-xs text-slate-500">
            A patient must be registered and screened before generating an official medical referral slip.
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-150">
      {/* Action Bar (Hidden on print) */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Patient Slip</span>
        </button>
      </div>

      {/* Printable Patient Slip Card */}
      <div className="clinical-card p-8 sm:p-10 text-slate-900 space-y-7 print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <BrandLogo size="md" />
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Date of Screening</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div className="font-mono text-xs text-slate-500">{patient.displayId}</div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Patient Name</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">{patient.name}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Age / Gender</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">{patient.age} yrs • {patient.gender}</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Diabetes Duration</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">{patient.diabetesDurationYears} Years</div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Screening Center</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">{patient.location || 'Clinical Center'}</div>
          </div>
        </div>

        {/* Side-by-Side Fundus Photographs: Reference vs Patient Scan */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Diagnostic Fundus Photographs (45° Optical Field)
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Capture Quality: 94% Sharpness (PASSED)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Healthy Reference Fundus */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <circle cx="100" cy="100" r="95" fill="#881337" />
                  <circle cx="65" cy="100" r="24" fill="#fed7aa" />
                  <circle cx="65" cy="100" r="14" fill="#fff7ed" />
                  <circle cx="125" cy="100" r="16" fill="#4c0519" />
                  {/* Healthy clean retinal vessels */}
                  <path d="M 65 100 Q 90 60 150 45" stroke="#4c0519" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                  <path d="M 65 100 Q 90 140 150 155" stroke="#4c0519" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                  <path d="M 65 100 Q 40 70 20 60" stroke="#4c0519" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 65 100 Q 40 130 20 140" stroke="#4c0519" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white font-bold text-[10px]">
                  Healthy Reference Standard
                </span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Standard baseline: Intact foveal reflex, 0 microaneurysms.
              </div>
            </div>

            {/* Right: Patient Captured Fundus Scan */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                {uploadedImage ? (
                  <img
                    src={uploadedImage}
                    alt="Patient captured fundus photography"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <circle cx="100" cy="100" r="95" fill="#881337" />
                    <circle cx="65" cy="100" r="24" fill="#fed7aa" />
                    <circle cx="65" cy="100" r="14" fill="#fff7ed" />
                    <circle cx="125" cy="100" r="16" fill="#4c0519" />
                    {/* Retinal vessels */}
                    <path d="M 65 100 Q 90 60 150 45" stroke="#4c0519" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                    <path d="M 65 100 Q 90 140 150 155" stroke="#4c0519" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                    {/* Diabetic Lesions */}
                    {patient.currentSeverity !== 'NO_DR' ? (
                      <>
                        {/* Microaneurysms */}
                        <circle cx="115" cy="75" r="2.5" fill="#ef4444" />
                        <circle cx="135" cy="65" r="2.8" fill="#ef4444" />
                        <circle cx="105" cy="125" r="2.2" fill="#ef4444" />
                        <circle cx="140" cy="130" r="3" fill="#ef4444" />
                        {/* Flame Hemorrhage */}
                        <ellipse cx="125" cy="140" rx="8" ry="4" fill="#991b1b" transform="rotate(-15 125 140)" />
                        {/* Hard Exudates */}
                        <circle cx="110" cy="92" r="2" fill="#fef08a" />
                        <circle cx="114" cy="95" r="1.8" fill="#fef08a" />
                      </>
                    ) : null}
                  </svg>
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600/90 text-white font-bold text-[10px]">
                  Patient Captured Scan ({patient.displayId})
                </span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                {patient.currentSeverity === 'NO_DR' 
                  ? 'Patient scan: Clear optical fields with 0 microvascular lesions.'
                  : 'Patient scan: Microaneurysms and focal hemorrhages detected along arcade.'}
              </div>
            </div>
          </div>
        </div>


        {/* AI Findings Biomarker Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            AI Automated Biomarker Analysis
          </h3>

          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Biomarker / Finding</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Severity / Count</th>
                  <th className="p-3 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Diabetic Retinopathy Grade</td>
                  <td className="p-3">
                    <span className={`font-bold px-2 py-0.5 rounded ${patient.currentSeverity === 'NO_DR' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {patient.currentSeverity.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">ICDR Clinical Scale</td>
                  <td className="p-3 text-right font-bold text-slate-900">94.2%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-800">Microaneurysms (Capillary Dilations)</td>
                  <td className="p-3 font-semibold text-slate-700">{patient.currentSeverity === 'NO_DR' ? '0 Detected' : 'Detected (4+)'}</td>
                  <td className="p-3 text-slate-600">Inferior Temporal Arcade</td>
                  <td className="p-3 text-right font-semibold text-slate-700">92.4%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-800">Retinal Blot Hemorrhages</td>
                  <td className="p-3 font-semibold text-slate-700">{patient.currentSeverity === 'NO_DR' ? '0 Detected' : 'Detected (2)'}</td>
                  <td className="p-3 text-slate-600">Superior Vascular Arcade</td>
                  <td className="p-3 text-right font-semibold text-slate-700">88.6%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-slate-800">Clinically Significant Macular Edema</td>
                  <td className="p-3 font-semibold text-slate-700">{patient.riskLevel === 'HIGH' ? 'Suspected Risk' : 'Low Risk'}</td>
                  <td className="p-3 text-slate-600">Perimacular Ring (500µm)</td>
                  <td className="p-3 text-right font-semibold text-slate-700">85.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Big Simple Result Message for Patient */}
        <div className={`p-5 sm:p-6 rounded-2xl border space-y-2 ${patient.currentSeverity === 'NO_DR' ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-amber-50/80 border-amber-200 text-amber-950'}`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>CLINICAL TRIAGE RECOMMENDATION</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black">
            {patient.currentSeverity === 'NO_DR' ? 'No Immediate Specialist Intervention Required' : 'Specialist Vitreoretinal Review Recommended'}
          </h2>

          <p className="text-xs sm:text-sm leading-relaxed pt-0.5">
            {patient.currentSeverity === 'NO_DR'
              ? 'Your retinal scan shows healthy blood vessels and optic nerve. Continue your current diabetic care regimen and return for annual surveillance in 12 months.'
              : 'Microvascular diabetic changes were identified during your retinal screening. Visiting the assigned regional eye hospital ensures timely protection of your eyesight.'}
          </p>
        </div>

        {/* Assigned Referral & Outreach Center */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Assigned Care Pathway
          </h3>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                1
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Assigned Regional Eye Center</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  <strong>Visakha Government Regional Eye Hospital</strong> • Vitreoretinal Department, Maharanipeta, Visakhapatnam
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                2
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Target Appointment Window</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Within <strong>14 Days</strong> (Before {new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Signatures Block */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="h-10 border-b border-slate-300 flex items-end pb-1 font-serif italic text-slate-700">
              Bhanu Mannam (Senior ASHA)
            </div>
            <div className="text-slate-500 text-[11px] mt-1">Screening Technician / Health Worker</div>
          </div>
          <div>
            <div className="h-10 border-b border-slate-300 flex items-end pb-1 font-serif italic text-slate-700">
              Dr. S. K. Murthy, MS (Ophth)
            </div>
            <div className="text-slate-500 text-[11px] mt-1">Medical Officer / Reviewing Ophthalmologist</div>
          </div>
        </div>

        {/* QR Code & Slip Validation */}
        <div className="pt-5 border-t border-slate-200 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl">
              <QrCode className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Scan at Hospital Reception</div>
              <div className="text-[11px] text-slate-500">Fast-track direct token for Retina Clinic</div>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Helpline: <strong>1800-425-RETINA</strong></div>
            <div className="text-[11px]">Free community tele-screening support</div>
          </div>
        </div>

        {/* Disclaimer Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed text-center">
          <strong>Important Medical Notice:</strong> This is an AI-assisted screening assessment and does not replace a comprehensive examination by an eye care specialist.
        </div>
      </div>
    </div>
  );
};
