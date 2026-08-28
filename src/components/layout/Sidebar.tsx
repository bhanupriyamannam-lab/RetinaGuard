import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';
import { useOffline } from '../../context/OfflineContext';
import { useDemo } from '../../context/DemoContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  ScanEye, 
  Users, 
  ListFilter, 
  GitPullRequest, 
  CalendarClock, 
  BarChart3, 
  Tent, 
  Sparkles, 
  Settings, 
  Wifi, 
  WifiOff, 
  ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isOffline, toggleOffline, unsyncedCases } = useOffline();
  const { setIsDemoModalOpen } = useDemo();
  const { t } = useLanguage();
  const { user } = useAuth();

  const primaryNavItems = [
    { to: '/', label: t.navOverview, icon: LayoutDashboard },
    { to: '/screening', label: t.navScreening, icon: ScanEye },
    { to: '/patients/p-1042', label: t.navPatients, icon: Users, badge: 'Signature' },
    { to: '/triage', label: t.navTriage, icon: ListFilter },
    { to: '/referrals', label: t.navReferrals, icon: GitPullRequest },
    { to: '/follow-ups', label: t.navFollowUps, icon: CalendarClock },
    { to: '/analytics', label: t.navAnalytics, icon: BarChart3 },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 h-full flex-shrink-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <NavLink to="/" className="hover:opacity-90 transition-opacity">
          <BrandLogo size="md" />
        </NavLink>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Clinical Workspace
          </div>
          <nav className="space-y-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-[10px] uppercase font-bold tracking-tight bg-brand-100 text-brand-700 px-1.5 py-0.2 rounded-md">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 pt-4">
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Field & Demos
          </div>
          <div className="space-y-1">
            <NavLink
              to="/health-camp"
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Tent className="w-4 h-4 text-emerald-600" />
                <span>{t.navHealthCamp}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                Rural
              </span>
            </NavLink>

            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>{t.navDemoMode}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Controls & Status */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        {/* Offline Toggle Simulator */}
        <button
          onClick={toggleOffline}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
            isOffline
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
          title="Click to toggle offline mode simulation"
        >
          <div className="flex items-center gap-2">
            {isOffline ? (
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="font-semibold">{isOffline ? 'Offline Mode' : 'Online Sync Active'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {unsyncedCases.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300/50">
                {unsyncedCases.length} unsynced
              </span>
            )}
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
          </div>
        </button>

        {/* Settings Link */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isActive ? 'text-brand-700 bg-brand-50/80 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`
          }
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>{t.navSettings}</span>
        </NavLink>

        {/* Doctor Profile */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user ? (user.first_name?.[0] || user.email?.[0] || 'D').toUpperCase() : 'D'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Clinical Operator'}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {user?.designation || (user?.role === 'DOCTOR' ? 'Vitreoretinal Specialist' : 'Clinical Screener')}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
