import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { 
  LayoutDashboard, 
  ScanEye, 
  Users, 
  ListFilter, 
  GitPullRequest,
  Tent,
  X
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

export const MobileBottomBar: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const items = [
    { to: '/', label: t.navOverview, icon: LayoutDashboard },
    { to: '/screening', label: 'Screen', icon: ScanEye },
    { to: '/patients/p-1042', label: 'Patients', icon: Users },
    { to: '/triage', label: 'Triage', icon: ListFilter },
    { to: '/health-camp', label: 'Camp', icon: Tent },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-3 flex items-center justify-around shadow-elevated select-none">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all ${
              isActive ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600 scale-110' : 'text-slate-400'} transition-transform`} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export const MobileDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in" 
      />

      {/* Drawer */}
      <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <BrandLogo size="sm" />
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <NavLink onClick={onClose} to="/" className="flex items-center gap-3 p-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span>{t.navOverview}</span>
          </NavLink>
          <NavLink onClick={onClose} to="/screening" className="flex items-center gap-3 p-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <ScanEye className="w-4 h-4 text-slate-400" />
            <span>{t.navScreening}</span>
          </NavLink>
          <NavLink onClick={onClose} to="/patients/p-1042" className="flex items-center gap-3 p-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Users className="w-4 h-4 text-slate-400" />
            <span>{t.navPatients}</span>
          </NavLink>
          <NavLink onClick={onClose} to="/triage" className="flex items-center gap-3 p-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <ListFilter className="w-4 h-4 text-slate-400" />
            <span>{t.navTriage}</span>
          </NavLink>
          <NavLink onClick={onClose} to="/referrals" className="flex items-center gap-3 p-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <GitPullRequest className="w-4 h-4 text-slate-400" />
            <span>{t.navReferrals}</span>
          </NavLink>
          <NavLink onClick={onClose} to="/health-camp" className="flex items-center gap-3 p-3 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50">
            <Tent className="w-4 h-4 text-emerald-600" />
            <span>{t.navHealthCamp}</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
};
