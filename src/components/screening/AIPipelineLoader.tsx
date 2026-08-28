import React from 'react';
import { CheckCircle2, Loader2, Circle, BrainCircuit } from 'lucide-react';

interface AIPipelineLoaderProps {
  currentStage: number; // 1 to 5
}

const STAGES = [
  { id: 1, title: 'Preparing image & normalizing contrast', desc: 'Auto-leveling illumination gradient across macular arcades' },
  { id: 2, title: 'Detecting retinal field & landmark segmentation', desc: 'Locating optic disc center (OD) and foveal avascular zone (FAZ)' },
  { id: 3, title: 'Extracting deep microvascular embeddings', desc: 'Running convolutional feature extractors over 512x512 patches' },
  { id: 4, title: 'Assessing retinal findings & micro-lesions', desc: 'Classifying microaneurysms, blot hemorrhages & lipid exudates' },
  { id: 5, title: 'Generating Grad-CAM AI attention visualization', desc: 'Synthesizing spatial heatmaps and longitudinal delta vectors' },
];

export const AIPipelineLoader: React.FC<AIPipelineLoaderProps> = ({ currentStage }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-elevated max-w-xl w-full mx-auto text-slate-900 animate-in zoom-in-95 duration-200">
      {/* Scanner Visual Core */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-brand-600/30 mb-4">
          <BrainCircuit className="w-10 h-10 animate-pulse" />
          <div className="absolute -inset-2 rounded-3xl border-2 border-brand-400/40 animate-ping pointer-events-none" />
        </div>

        <h3 className="text-xl font-bold text-slate-900">
          Analyzing Retinal Fundus
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          RetinaGuard multi-scale deep learning model inference in progress.
        </p>
      </div>

      {/* 5-Stage Checklist */}
      <div className="space-y-4">
        {STAGES.map((stage) => {
          const isDone = currentStage > stage.id;
          const isCurrent = currentStage === stage.id;
          const isPending = currentStage < stage.id;

          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                isCurrent
                  ? 'bg-brand-50/70 border-brand-300 shadow-sm ring-1 ring-brand-500/20'
                  : isDone
                  ? 'bg-slate-50/70 border-slate-200'
                  : 'opacity-40 border-slate-100'
              }`}
            >
              {/* Stage Icon */}
              <div className="mt-0.5 flex-shrink-0">
                {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-in zoom-in-50 duration-150" />}
                {isCurrent && <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />}
                {isPending && <Circle className="w-5 h-5 text-slate-300" />}
              </div>

              {/* Stage Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-bold ${isCurrent ? 'text-brand-900' : isDone ? 'text-slate-800' : 'text-slate-500'}`}>
                    {stage.title}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    {isDone ? '✓ 100%' : isCurrent ? '● Processing' : '○'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Step {Math.min(currentStage, 5)} of 5</span>
        <span className="font-semibold text-brand-600">
          {Math.round((Math.min(currentStage, 5) / 5) * 100)}% Complete
        </span>
      </div>
    </div>
  );
};
