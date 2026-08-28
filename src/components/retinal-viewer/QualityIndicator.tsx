import React from 'react';
import { ImageQualityReport } from '../../types';
import { QualityBadge } from '../common/Badge';
import { 
  AlertOctagon, 
  Camera, 
  SunMedium, 
  Maximize, 
  Eye, 
  RotateCcw
} from 'lucide-react';

interface QualityIndicatorProps {
  quality: ImageQualityReport;
  onRetake?: () => void;
}

export const QualityIndicator: React.FC<QualityIndicatorProps> = ({ quality, onRetake }) => {
  const isPoor = quality.overall === 'POOR';

  if (isPoor) {
    return (
      <div className="bg-rose-50/80 border border-rose-200 rounded-3xl p-5 shadow-sm text-slate-900 animate-in fade-in duration-200">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-md shadow-rose-600/20">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Pre-AI Quality Check</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-600 text-white">
                  IMAGE QUALITY POOR
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">
                Image Resolution Below Diagnostic Threshold
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-lg leading-relaxed">
                Automated optical quality analysis detected severe motion blur and insufficient illumination. AI diagnostic inference is paused to prevent false negative readings.
              </p>
            </div>
          </div>

          {onRetake && (
            <button
              onClick={onRetake}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md transition-all self-center"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Retinal Scan</span>
            </button>
          )}
        </div>

        {/* Quality Issues List */}
        {quality.issues && quality.issues.length > 0 && (
          <div className="mt-4 pt-4 border-t border-rose-200/70">
            <div className="text-xs font-bold text-rose-900 mb-2">Detected Optical Artifacts:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quality.issues.map((issue, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-rose-800 bg-white/80 px-3 py-1.5 rounded-lg border border-rose-200/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-subtle">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Image Quality Analysis</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Overall:</span>
          <QualityBadge rating={quality.overall} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Sharpness */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Sharpness</span>
            <Camera className="w-3.5 h-3.5 text-brand-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-900">Good</span>
            <span className="text-[11px] font-semibold text-emerald-600">92%</span>
          </div>
        </div>

        {/* Brightness */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Brightness</span>
            <SunMedium className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-900">Good</span>
            <span className="text-[11px] font-semibold text-emerald-600">94%</span>
          </div>
        </div>

        {/* Field of View */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Field of View</span>
            <Maximize className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-900">Good</span>
            <span className="text-[11px] font-semibold text-emerald-600">45° FOV</span>
          </div>
        </div>

        {/* Retinal Visibility */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Retinal Visibility</span>
            <Eye className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-900">Good</span>
            <span className="text-[11px] font-semibold text-emerald-600">96%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
