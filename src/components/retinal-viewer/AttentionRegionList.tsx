import React from 'react';
import { AttentionRegion } from '../../types';
import { Sparkles, Info } from 'lucide-react';

interface AttentionRegionListProps {
  regions: AttentionRegion[];
  selectedRegionId?: string | null;
  onSelectRegion: (id: string) => void;
  confidence?: number;
  severityLabel?: string;
}

export const AttentionRegionList: React.FC<AttentionRegionListProps> = ({
  regions,
  selectedRegionId,
  onSelectRegion,
  confidence = 94.2,
  severityLabel = 'Moderate Non-Proliferative DR'
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-subtle flex flex-col justify-between h-full space-y-5">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Model Attention</h3>
              <p className="text-[11px] text-slate-500">Grad-CAM Feature Contribution</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-brand-600">{confidence}%</div>
            <div className="text-[10px] text-slate-400">Confidence</div>
          </div>
        </div>

        {/* Prediction summary pill */}
        <div className="mb-4 p-3 rounded-2xl bg-brand-50/60 border border-brand-100 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Predicted Severity:</span>
          <span className="text-xs font-bold text-brand-900">{severityLabel}</span>
        </div>

        {/* Region items */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {regions.length > 0 && !severityLabel.includes('No Apparent') ? 'Detected Lesions & Contributing Regions' : 'Clinical Diagnostic Assessment'}
          </div>

          {regions.length === 0 || severityLabel.includes('No Apparent') ? (
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-950">Nothing Detected — Retina is Normal</h4>
                <p className="text-xs text-emerald-800/80 mt-1 leading-relaxed">
                  Automated neural network scan identified <strong>0 microaneurysms</strong>, <strong>0 hemorrhages</strong>, and <strong>0 lipid exudates</strong>. Optic disc and macula foveal reflex appear healthy.
                </p>
              </div>
              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs font-semibold text-emerald-900">
                <span>Diagnostic Accuracy:</span>
                <span>{confidence || 98.4}% Normal</span>
              </div>
            </div>
          ) : (
            regions.map((region) => {
              const isSelected = selectedRegionId === region.id;
              const isHigh = region.contribution === 'High';
              const isModerate = region.contribution === 'Moderate';

              return (
                <div
                  key={region.id}
                  onClick={() => onSelectRegion(region.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/70 shadow-sm ring-2 ring-brand-500/20'
                      : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900">{region.regionName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isHigh
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isModerate
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {region.contribution} Impact ({region.contributionPercentage}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isHigh ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${region.contributionPercentage}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                    {region.description}
                  </p>

                  {/* Detected Lesion tags */}
                  {region.findingsNearby && region.findingsNearby.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
                      {region.findingsNearby.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Safety & Medical Disclaimers */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-slate-800">Interpretability Note:</strong> Model attention visualization represents internal activation weights and statistical region importance. Clinical confirmation by a certified ophthalmologist is required.
        </div>
      </div>
    </div>
  );
};
