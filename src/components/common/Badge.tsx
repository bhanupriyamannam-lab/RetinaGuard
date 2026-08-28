import React from 'react';
import { RiskLevel, RetinopathySeverity, ReferralStatus, QualityRating } from '../../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Flame, 
  Clock, 
  CheckCircle, 
  UserCheck, 
  Calendar, 
  FileCheck2,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface RiskBadgeProps {
  risk: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, size = 'md', showIcon = true }) => {
  const styles = {
    LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    MODERATE: 'bg-amber-50 text-amber-800 border-amber-200/80',
    HIGH: 'bg-rose-50 text-rose-700 border-rose-200/80',
    CRITICAL: 'bg-red-100 text-red-900 border-red-300 font-bold animate-pulse'
  };

  const icons = {
    LOW: <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    MODERATE: <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    HIGH: <AlertOctagon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    CRITICAL: <Flame className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
  };

  const labels = {
    LOW: 'Low Risk',
    MODERATE: 'Moderate Risk',
    HIGH: 'High Risk',
    CRITICAL: 'Critical Risk'
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${styles[risk]} ${sizeClasses[size]}`}>
      {showIcon && icons[risk]}
      <span>{labels[risk]}</span>
    </span>
  );
};

interface SeverityBadgeProps {
  severity: RetinopathySeverity;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const configs: Record<RetinopathySeverity, { label: string; style: string; icon: React.ReactNode }> = {
    NO_DR: {
      label: 'No Apparent DR',
      style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <ShieldCheck className="w-3.5 h-3.5" />
    },
    MILD_DR: {
      label: 'Mild NPDR',
      style: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Sparkles className="w-3.5 h-3.5" />
    },
    MODERATE_DR: {
      label: 'Moderate NPDR',
      style: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <AlertTriangle className="w-3.5 h-3.5" />
    },
    SEVERE_DR: {
      label: 'Severe NPDR',
      style: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <AlertOctagon className="w-3.5 h-3.5" />
    },
    PROLIFERATIVE_DR: {
      label: 'Proliferative DR (PDR)',
      style: 'bg-red-100 text-red-900 border-red-300 font-bold',
      icon: <Flame className="w-3.5 h-3.5" />
    },
    PROGRESSION: {
      label: 'Possible Progression',
      style: 'bg-purple-50 text-purple-800 border-purple-200 font-semibold',
      icon: <TrendingUp className="w-3.5 h-3.5" />
    }
  };

  const item = configs[severity] || configs.NO_DR;
  const padding = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${item.style} ${padding}`}>
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

export const ReferralStatusBadge: React.FC<{ status: ReferralStatus }> = ({ status }) => {
  const configs: Record<ReferralStatus, { label: string; style: string; icon: React.ReactNode }> = {
    SCREENED: { label: 'Screened', style: 'bg-slate-100 text-slate-700 border-slate-200', icon: <FileCheck2 className="w-3 h-3" /> },
    REFERRED: { label: 'Referred', style: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock className="w-3 h-3" /> },
    NOTIFIED: { label: 'Patient Notified', style: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <UserCheck className="w-3 h-3" /> },
    APPOINTMENT_BOOKED: { label: 'Appt Booked', style: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Calendar className="w-3 h-3" /> },
    SPECIALIST_REVIEWED: { label: 'Specialist Reviewed', style: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Sparkles className="w-3 h-3" /> },
    COMPLETED: { label: 'Completed', style: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle className="w-3 h-3" /> }
  };

  const item = configs[status] || configs.SCREENED;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${item.style}`}>
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

export const QualityBadge: React.FC<{ rating: QualityRating }> = ({ rating }) => {
  if (rating === 'GOOD') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3 h-3" /> GOOD
      </span>
    );
  }
  if (rating === 'ACCEPTABLE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3 h-3" /> ACCEPTABLE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
      <AlertOctagon className="w-3 h-3" /> POOR
    </span>
  );
};
