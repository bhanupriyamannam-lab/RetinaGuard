import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DemoScenarioType } from '../types';

interface DemoContextType {
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  toggleDemoMode: () => void;
  activeScenario: DemoScenarioType;
  setScenario: (scenario: DemoScenarioType) => void;
  isDemoModalOpen: boolean;
  setIsDemoModalOpen: (open: boolean) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // REAL MODE ONLY
  const [isDemoMode] = useState<boolean>(false);

  const [activeScenario, setActiveScenario] =
    useState<DemoScenarioType>('POSSIBLE_PROGRESSION');

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Demo mode is permanently disabled.
  const setDemoMode = (_enabled: boolean) => {
    // Intentionally disabled - application always uses real data.
  };

  const toggleDemoMode = () => {
    // Intentionally disabled - application always uses real data.
  };

  const setScenario = (scenario: DemoScenarioType) => {
    // Keep this for compatibility with existing components,
    // but DO NOT activate demo mode.
    setActiveScenario(scenario);
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        setDemoMode,
        toggleDemoMode,
        activeScenario,
        setScenario,
        isDemoModalOpen,
        setIsDemoModalOpen,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);

  if (!context) {
    throw new Error('useDemo must be used within DemoProvider');
  }

  return context;
};

export const useDataMode = () => {
  const context = useContext(DemoContext);

  if (!context) {
    throw new Error('useDataMode must be used within DemoProvider');
  }

  return {
    isDemoMode: false,
    setDemoMode: () => {},
    toggleDemoMode: () => {},
  };
};