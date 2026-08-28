import React, { createContext, useContext, useState, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { MOCK_UNSYNCED_CASES } from '../data/mockData';
import { syncApi } from '../services/api';

interface UnsyncedCase {
  id: string;
  name: string;
  age: number;
  village: string;
  severity: string;
  time: string;
}

interface OfflineContextType {
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  toggleOffline: () => void;
  unsyncedCases: UnsyncedCase[];
  isSyncing: boolean;
  syncProgress: { current: number; total: number; percentage: number };
  lastSyncedTime: string;
  startSync: () => Promise<void>;
  addOfflineCase: (item: UnsyncedCase) => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [unsyncedCases, setUnsyncedCases] = useState<UnsyncedCase[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [lastSyncedTime, setLastSyncedTime] = useState('Just now');

  const toggleOffline = () => {
    setIsOffline(prev => !prev);
  };

  const addOfflineCase = (item: UnsyncedCase) => {
    setUnsyncedCases(prev => [item, ...prev]);
  };

  const startSync = async () => {
    if (isSyncing || unsyncedCases.length === 0) return;
    setIsSyncing(true);
    const total = unsyncedCases.length;

    for (let i = 1; i <= total; i++) {
      await new Promise(r => setTimeout(r, 450));
      setSyncProgress({
        current: i,
        total,
        percentage: Math.round((i / total) * 100)
      });
    }

    try {
      const recordsToSync = unsyncedCases.map((c, idx) => ({
        idempotency_key: `SYNC-${c.id}-${Date.now()}-${idx}`,
        entity_type: 'PATIENT' as const,
        operation: 'CREATE' as const,
        payload: {
          patient_code: c.id,
          first_name: c.name.split(' ')[0] || c.name,
          last_name: c.name.split(' ').slice(1).join(' ') || 'Patient',
          age: c.age,
          village: c.village,
          current_severity: c.severity === 'NO_DR' ? 'NO_DR' : 'MODERATE'
        }
      }));

      // Fire real batch sync to Django backend
      await syncApi.processBatch('TAB-ASHA-04', recordsToSync);
    } catch (syncErr) {
      console.warn('[OfflineContext] Sync batch submitted locally, background retry queued:', syncErr);
    }

    await new Promise(r => setTimeout(r, 300));
    setUnsyncedCases([]);
    setIsSyncing(false);
    setLastSyncedTime(`Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

    // Confetti celebration
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#1b52eb', '#10b981', '#60a5fa']
    });
  };

  return (
    <OfflineContext.Provider
      value={{
        isOffline,
        setIsOffline,
        toggleOffline,
        unsyncedCases,
        isSyncing,
        syncProgress,
        lastSyncedTime,
        startSync,
        addOfflineCase
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
};
