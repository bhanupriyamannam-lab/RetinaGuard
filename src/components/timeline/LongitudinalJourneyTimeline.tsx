import React from 'react';
import { SeverityBadge } from '../common/Badge';
import { RetinopathySeverity } from '../../types';
import { Calendar, ArrowRight, Eye, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TimelineStage {
  date: string;
  stageTitle: string;
  severity: RetinopathySeverity;
  findingsSummary: string;
  actionTaken: string;
  riskScore: number;
  scanId: string;
}

interface LongitudinalJourneyTimelineProps {
  timeline: TimelineStage[];
  onCompareScans?: () => void;
}

export const LongitudinalJourneyTimeline: React.FC<LongitudinalJourneyTimelineProps> = ({
  timeline,
  onCompareScans
}) => {
  const navigate = useNavigate();

  return (
    <div className="clinical-card p-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 text-brand-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Signature Longitudinal Tracking</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
            Retinal Health Journey
          </h3>
        </div>

        {onCompareScans && (
          <button
            onClick={onCompareScans}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold text-xs border border-slate-200 transition-colors shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Compare Baseline vs Current</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Timeline items list */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {timeline.map((item, idx) => {
          const isLatest = idx === timeline.length - 1;

          return (
            <div key={idx} className="relative group">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                  isLatest
                    ? 'border-rose-600 ring-4 ring-rose-50 shadow-xs'
                    : item.riskScore < 30
                    ? 'border-emerald-500'
                    : item.riskScore < 70
                    ? 'border-amber-500'
                    : 'border-rose-500'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isLatest
                      ? 'bg-rose-600'
                      : item.riskScore < 30
                      ? 'bg-emerald-500'
                      : item.riskScore < 70
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
              </div>

              {/* Timeline Card */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isLatest
                    ? 'bg-rose-50/20 border-rose-200/80 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.date}</span>
                    </div>

                    <SeverityBadge severity={item.severity} size="sm" />

                    {isLatest && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-rose-600 text-white px-2 py-0.2 rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className={`font-mono font-bold tabular-nums ${
                      item.riskScore < 30 ? 'text-emerald-600' :
                      item.riskScore < 70 ? 'text-amber-600' :
                      'text-rose-600'
                    }`}>
                      {item.riskScore}/100
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {item.stageTitle}
                </h4>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {item.findingsSummary}
                </p>

                <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <strong className="font-semibold text-slate-900">Action:</strong>
                    <span className="text-slate-600">{item.actionTaken}</span>
                  </div>

                  <button
                    onClick={() => navigate(`/explainable-ai?scanId=${item.scanId}`)}
                    className="text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <span>View Scan Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
