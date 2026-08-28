import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MobileBottomBar, MobileDrawer } from './MobileNav';
import { JudgeDemoBar } from '../demo/JudgeDemoBar';
import { DemoScenarioModal } from '../demo/DemoScenarioModal';
import { OfflineBanner } from './OfflineBanner';
import { useDemo } from '../../context/DemoContext';

export const Layout: React.FC = () => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { isDemoMode } = useDemo();

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* Top Demo Bar - Only rendered when Demo Mode is explicitly enabled */}
      {isDemoMode && <JudgeDemoBar />}

      {/* Main Shell Row: Fixed Sidebar + Scrollable Content Column */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Desktop Fixed Sidebar */}
        <Sidebar />

        {/* Mobile Navigation Drawer */}
        <MobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
        />

        {/* Right Application Column: Header is pinned at top; ONLY <main> scrolls vertically */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          <div className="flex-shrink-0 z-30">
            <TopNav onOpenMobileMenu={() => setIsMobileDrawerOpen(true)} />
            <OfflineBanner />
          </div>

          {/* Scrollable Dashboard Viewport */}
          <main className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12 focus:outline-none">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Floating Bottom Bar */}
      <MobileBottomBar />

      {/* Judge Demo Scenario Guide Modal */}
      <DemoScenarioModal />
    </div>
  );
};
