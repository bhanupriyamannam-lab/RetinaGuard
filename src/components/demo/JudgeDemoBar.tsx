import React from 'react';
import { useDemo } from '../../context/DemoContext';
import { DemoScenarioType } from '../../types';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ImageOff, 
  WifiOff, 
  Clock, 
  Layers
} from 'lucide-react';

interface ScenarioDef {
  id: DemoScenarioType;
  label: string;
  badge: string;
  badgeColor: string;
  desc: string;
  icon: React.ReactNode;
  targetRoute: string;
}

export const DEMO_SCENARIOS: ScenarioDef[] = [
  {
    id: 'HEALTHY_SCAN',
    label: '1. Healthy / Normal Retina',
    badge: 'No DR',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Normal fundus, sharp foveal reflex, no microaneurysms (Rajesh Patel #RG-1088)',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    targetRoute: '/explainable-ai?preset=HEALTHY'
  },
  {
    id: 'MODERATE_DR',
    label: '2. Moderate Retinopathy',
    badge: 'Moderate',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Microaneurysms & blot hemorrhages along vascular arcade (Ramesh Kumar #RG-1051)',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
    targetRoute: '/explainable-ai?preset=MODERATE'
  },
  {
    id: 'POSSIBLE_PROGRESSION',
    label: '3. Rapid Progression Alert',
    badge: 'Signature',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold',
    desc: 'Longitudinal scan diff +5 MA, +3 Hemorrhages, +2 Exudates (Anita Rao #RG-1042)',
    icon: <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />,
    targetRoute: '/patients/p-1042'
  },
  {
    id: 'POOR_IMAGE_QUALITY',
    label: '4. Poor Quality & Blurring',
    badge: 'Safety',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    desc: 'Automated pre-AI sharpness & brightness checks with retake prompt',
    icon: <ImageOff className="w-3.5 h-3.5 text-rose-400" />,
    targetRoute: '/screening?preset=POOR_QUALITY'
  },
  {
    id: 'OFFLINE_SCREENING',
    label: '5. Offline Rural Health Camp',
    badge: 'Rural ASHA',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Offline storage queue, zero connectivity UI, 7 unsynced batch cases',
    icon: <WifiOff className="w-3.5 h-3.5 text-blue-400" />,
    targetRoute: '/health-camp'
  },
  {
    id: 'FOLLOWUP_OVERDUE',
    label: '6. Follow-up Overdue (>18d)',
    badge: 'Triage',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Actionable intervention radar for lost-to-follow-up diabetic patients',
    icon: <Clock className="w-3.5 h-3.5 text-purple-400" />,
    targetRoute: '/follow-ups'
  }
];

export const JudgeDemoBar: React.FC = () => {
  const { activeScenario, setScenario, setIsDemoModalOpen } = useDemo();
  const navigate = useNavigate();

  const handleSelect = (scenario: ScenarioDef) => {
    setScenario(scenario.id);
    navigate(scenario.targetRoute);
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800 text-white px-4 py-2 flex items-center justify-between gap-4 flex-wrap text-xs select-none">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30 font-bold uppercase tracking-wider text-[10px]">
          <Sparkles className="w-3 h-3" />
          <span>Demo Scenarios</span>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar max-w-full">
        {DEMO_SCENARIOS.map((s) => {
          const isActive = activeScenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap text-[11px] ${
                isActive
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {s.icon}
              <span>{s.label.split('.')[1]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsDemoModalOpen(true)}
          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-medium py-1 px-2 rounded hover:bg-slate-900 transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Guide</span>
        </button>
      </div>
    </div>
  );
};
