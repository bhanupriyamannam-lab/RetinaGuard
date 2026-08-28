import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  ArrowRight, 
  GitPullRequest, 
  ShieldAlert
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface FindingsDiffCardProps {
  patientId?: string;
  patientName?: string;
  onCreateReferral?: () => void;
}

export const FindingsDiffCard: React.FC<FindingsDiffCardProps> = ({
  patientId = 'p-1042',
  patientName = 'Anita Rao',
  onCreateReferral
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleCreateReferral = () => {
    if (onCreateReferral) {
      onCreateReferral();
    } else {
      showToast({
        type: 'success',
        title: 'Referral Drafted',
        message: `High-priority referral created for ${patientName} to Visakha Eye Hospital.`
      });
      navigate(`/referrals?patientId=${patientId}`);
    }
  };

  return (
    <div className="clinical-card p-6 space-y-6">
      {/* Title & Changes Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Longitudinal Scan Delta</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            Changes Detected (Jan 2026 → Jul 2026)
          </h3>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          Progression Velocity: High
        </span>
      </div>

      {/* Numerical Metrics Delta Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Microaneurysms */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-2">
            <span>Microaneurysms</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 rounded-md font-bold text-rose-700">+5 New</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">3 → 8</span>
            <span className="text-xs font-bold text-rose-600">(+166%)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            New focal clusters in inferior temporal arcade.
          </p>
        </div>

        {/* Hemorrhages */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-2">
            <span>Hemorrhages</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 rounded-md font-bold text-amber-700">+3 New</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">1 → 4</span>
            <span className="text-xs font-bold text-amber-600">(+300%)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Flame & blot hemorrhages crossing nerve layers.
          </p>
        </div>

        {/* Exudates */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-2">
            <span>Hard Exudates</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 rounded-md font-bold text-purple-700">+2 New</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">0 → 2</span>
            <span className="text-xs font-bold text-purple-600">(New Emergence)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Lipid ring deposits 500μm from foveal edge.
          </p>
        </div>
      </div>

      {/* POSSIBLE PROGRESSION Alert Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5 max-w-xl">
          <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs flex-shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                AI Assessment
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30">
                94.2% Confidence
              </span>
            </div>
            <h4 className="text-base font-bold text-white mt-1">
              POSSIBLE PROGRESSION: Moderate NPDR with Macular Threat
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Comparison with baseline scan from Jan 14, 2026 indicates rapid microvascular disease advancement. Progression velocity exceeds standard expected thresholds; immediate specialist vitreoretinal evaluation is strongly advised.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleCreateReferral}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 shadow-md transition-all self-stretch sm:self-auto justify-center whitespace-nowrap"
        >
          <GitPullRequest className="w-4 h-4 text-brand-600" />
          <span>Create Specialist Referral</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
