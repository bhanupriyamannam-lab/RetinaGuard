import React from 'react';
import { useDemo } from '../../context/DemoContext';
import { DEMO_SCENARIOS } from './JudgeDemoBar';
import { X, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoScenarioModal: React.FC = () => {
  const { isDemoModalOpen, setIsDemoModalOpen, activeScenario, setScenario } = useDemo();
  const navigate = useNavigate();

  if (!isDemoModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/80 rounded-t-3xl">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-brand-600 text-white rounded-2xl shadow-md shadow-brand-600/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">RetinaGuard Judge Demonstration Kit</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                  Hackathon Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-lg">
                Explore each core pillar of RetinaGuard: longitudinal progression tracking, explainable AI, rural health camp workflow, and actionable triage.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDemoModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 30-Second Core Concept Banner */}
        <div className="mx-6 my-4 p-4 rounded-2xl bg-gradient-to-r from-brand-900 via-navy-900 to-indigo-950 text-white shadow-md">
          <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>The 30-Second Vision</span>
          </div>
          <p className="text-sm font-medium text-slate-100 leading-relaxed">
            “RetinaGuard does not stop at detecting diabetic retinopathy. It tracks the patient's retinal journey, identifies possible progression, prioritizes high-risk cases, and helps healthcare workers manage referrals and follow-ups.”
          </p>
        </div>

        {/* Scenario Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_SCENARIOS.map((s) => {
            const isSelected = activeScenario === s.id;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setScenario(s.id);
                  setIsDemoModalOpen(false);
                  navigate(s.targetRoute);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left group ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/50 shadow-md ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100">
                        {s.icon}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                        {s.label}
                      </h4>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${s.badgeColor}`}>
                      {s.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {s.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-xs font-semibold text-brand-600">
                  <span>Launch Scenario</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 rounded-b-3xl">
          <span>Preset selection instantly populates patient scans and longitudinal graphs.</span>
          <button
            onClick={() => setIsDemoModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
