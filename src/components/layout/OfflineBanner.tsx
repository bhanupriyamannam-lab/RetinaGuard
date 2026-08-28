import React from 'react';
import { useOffline } from '../../context/OfflineContext';
import { WifiOff, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OfflineBanner: React.FC = () => {
  const { isOffline, unsyncedCases, isSyncing, syncProgress, startSync } = useOffline();
  const navigate = useNavigate();

  if (!isOffline && unsyncedCases.length === 0) return null;

  return (
    <div className={`px-4 py-2.5 border-b text-xs flex items-center justify-between gap-3 flex-wrap transition-colors ${
      isOffline 
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-900' 
        : 'bg-blue-500/10 border-blue-500/20 text-blue-900'
    }`}>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 font-bold">
          {isOffline ? (
            <>
              <WifiOff className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Offline Screening Mode Active</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Online Connection Restored</span>
            </>
          )}
        </div>

        <span className="text-slate-600 hidden md:inline">
          {isOffline
            ? 'New screening scans are securely encrypted locally on device.'
            : `${unsyncedCases.length} local cases ready to synchronize to central hospital registry.`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {unsyncedCases.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
              {unsyncedCases.length} records pending
            </span>

            <button
              onClick={startSync}
              disabled={isSyncing}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                isSyncing
                  ? 'bg-brand-100 text-brand-700 cursor-not-allowed'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? `Syncing (${syncProgress.current}/${syncProgress.total})...`
                  : 'Sync to Cloud'}
              </span>
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/health-camp')}
          className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 text-[11px]"
        >
          <span>Camp Console</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
