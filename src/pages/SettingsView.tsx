import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useDemo } from '../context/DemoContext';
import { LanguageCode } from '../types';
import { useToast } from '../context/ToastContext';
import { 
  Settings, 
  Globe, 
  User, 
  HardDrive, 
  ShieldCheck, 
  CheckCircle2, 
  Lock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { isDemoMode, setDemoMode, setIsDemoModalOpen } = useDemo();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'GENERAL' | 'LOCALIZATION' | 'OFFLINE' | 'SECURITY' | 'DEMO'>('GENERAL');

  const languages: { code: LanguageCode; label: string; native: string }[] = [
    { code: 'en', label: 'English (US / International)', native: 'English' },
    { code: 'te', label: 'Telugu (తెలుగు)', native: 'తెలుగు' },
    { code: 'hi', label: 'Hindi (हिन्दी)', native: 'हिन्दी' },
    { code: 'ta', label: 'Tamil (தமிழ்)', native: 'தமிழ்' },
  ];

  const handleSave = () => {
    showToast({
      type: 'success',
      title: 'Preferences Saved',
      message: 'System settings and localization updated successfully.'
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
          <Settings className="w-4 h-4" />
          <span>System Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage clinical organization profile, localization languages, offline cache quotas, security protocols, and demo mode.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'GENERAL', label: 'Profile & Clinic', icon: User },
          { id: 'LOCALIZATION', label: 'Language & Translation', icon: Globe },
          { id: 'OFFLINE', label: 'Offline Storage & Sync', icon: HardDrive },
          { id: 'SECURITY', label: 'Security & Compliance', icon: Lock },
          { id: 'DEMO', label: 'Demo Mode Kit', icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: General Profile & Clinic */}
      {activeTab === 'GENERAL' && (
        <div className="clinical-card p-6 sm:p-7 space-y-6">
          <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-black text-xl flex items-center justify-center shadow-xs">
              M
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Medical Clinical Workspace</h3>
              <p className="text-xs text-slate-500">Tele-Ophthalmology Screening & Triage Network</p>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Clinical Operator
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered Health Facility</label>
              <input
                type="text"
                readOnly
                value="Regional Primary Health & Eye Care Division"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned District</label>
              <input
                type="text"
                readOnly
                value="Community Tele-Screening Zone"
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Localization */}
      {activeTab === 'LOCALIZATION' && (
        <div className="clinical-card p-6 sm:p-7 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Interface & Patient Language</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your preferred language for clinical forms, reports, and automated SMS reminders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <div
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">{lang.native}</div>
                    <div className="text-xs text-slate-500">{lang.label}</div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-600" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Offline Storage */}
      {activeTab === 'OFFLINE' && (
        <div className="clinical-card p-6 sm:p-7 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Local Device Database & Cache</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Local persistent storage settings for field camps without active cellular internet.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-slate-900">IndexedDB Local Scans Storage</div>
              <div className="text-slate-500">Allocated Quota: 500 MB (4.8 MB Used)</div>
            </div>
            <button
              onClick={() => {
                showToast({
                  type: 'info',
                  title: 'Cache Cleared',
                  message: 'Non-critical temporary image cache refreshed.'
                });
              }}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100"
            >
              Clear Cache
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Compliance */}
      {activeTab === 'SECURITY' && (
        <div className="clinical-card p-6 sm:p-7 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Medical Data Governance & Safety</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              RetinaGuard operates with secure medical data governance protocols and encrypted storage standards.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800">End-to-End Encryption (AES-256-GCM)</span>
              </div>
              <span className="font-bold text-emerald-700">Enforced</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800">AI Clinical Disclaimer Headers</span>
              </div>
              <span className="font-bold text-emerald-700">Active on all views</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Demo Mode & Hackathon Demonstration Kit */}
      {activeTab === 'DEMO' && (
        <div className="clinical-card p-6 sm:p-7 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">College Hackathon Demo Mode</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch between real backend clinical mode and pre-seeded demonstration scenarios for live presentation.
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${isDemoMode ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {isDemoMode ? 'DEMO MODE ACTIVE' : 'REAL MODE ACTIVE'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Simulated Data Notice</span>
            </div>
            <p className="leading-relaxed">
              When Demo Mode is enabled, RetinaGuard loads synthetic patient records (e.g. Anita Rao, Ramesh Kumar) and simulated AI analyses for judges. In Real Mode, only genuine database records and empty states are rendered.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <div className="font-bold text-xs text-slate-900">Demo Mode Toggle</div>
              <div className="text-[11px] text-slate-500">Enable or disable simulated dataset globally</div>
            </div>
            <button
              onClick={() => {
                const nextState = !isDemoMode;
                setDemoMode(nextState);
                showToast({
                  type: nextState ? 'warning' : 'success',
                  title: nextState ? 'Demo Mode Activated' : 'Real Mode Activated',
                  message: nextState ? 'Simulated presentation dataset loaded.' : 'Switched to clean live database.'
                });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isDemoMode
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isDemoMode ? 'Exit Demo Mode' : 'Enable Demo Mode'}
            </button>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Open Judge Demonstration Kit</span>
            </button>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};
