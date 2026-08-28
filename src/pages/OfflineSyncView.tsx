import React from 'react';
import { useOffline } from '../context/OfflineContext';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  Database, 
  HardDrive
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const OfflineSyncView: React.FC = () => {
  const { 
    isOffline, 
    toggleOffline, 
    unsyncedCases, 
    isSyncing, 
    syncProgress, 
    lastSyncedTime, 
    startSync 
  } = useOffline();

  const { showToast } = useToast();

  const handleManualSync = () => {
    if (unsyncedCases.length === 0) {
      showToast({
        type: 'info',
        title: 'Already Synchronized',
        message: 'All local retinal scans are up-to-date with central repository.'
      });
      return;
    }
    startSync();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-brand-600 text-xs font-bold uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>Local Storage & Edge Sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Offline Screening Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Zero-connectivity edge architecture designed for remote rural camps without cell towers.
          </p>
        </div>

        {/* Network Toggle Button */}
        <button
          onClick={toggleOffline}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors ${
            isOffline
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
          <span>{isOffline ? 'Simulating: OFFLINE MODE' : 'Simulating: ONLINE MODE'}</span>
        </button>
      </div>

      {/* Main Sync Status Hero Card */}
      <div className="clinical-card p-6 sm:p-7 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className={`p-3.5 rounded-2xl text-white shadow-xs ${
              isOffline ? 'bg-amber-500' : 'bg-emerald-600'
            }`}>
              {isOffline ? <WifiOff className="w-6 h-6" /> : <Database className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {isOffline ? 'Offline Screening Active' : 'Connected to Central Registry'}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isOffline ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isOffline ? 'Local Cache' : 'Cloud Sync'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                New screening results will be stored locally and synchronized when connectivity returns.
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Last Synchronized</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">{lastSyncedTime}</div>
          </div>
        </div>

        {/* Sync Progress Bar if Syncing */}
        {isSyncing && (
          <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-brand-900">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-brand-600 animate-spin" />
                <span>Syncing Local Records ({syncProgress.current} / {syncProgress.total})...</span>
              </span>
              <span className="tabular-nums">{syncProgress.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-brand-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-300"
                style={{ width: `${syncProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Sync Button & Info */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <HardDrive className="w-4 h-4 text-slate-400" />
            <span>Encrypted Storage: <strong>4.8 MB / 500 MB</strong> (SQLite IndexedDB)</span>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing || unsyncedCases.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors ${
              isSyncing || unsyncedCases.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-brand-600 hover:bg-brand-700 text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : `Sync ${unsyncedCases.length} Cases Now`}</span>
          </button>
        </div>
      </div>

      {/* Unsynced Cases Table / List */}
      <div className="clinical-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Local Queue ({unsyncedCases.length} Records)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Encrypted scans stored in browser/device memory</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            AES-256 Validated
          </span>
        </div>

        {unsyncedCases.length === 0 ? (
          <div className="p-10 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="text-sm font-bold text-slate-900">All Scans Synchronized</div>
            <p className="text-xs max-w-sm mx-auto">
              No pending cases in local storage. All records are safely mirrored in the central database.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {unsyncedCases.map((item) => (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Age {item.age} • Village: {item.village} • Captured: {item.time}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {item.severity.replace('_', ' ')}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
