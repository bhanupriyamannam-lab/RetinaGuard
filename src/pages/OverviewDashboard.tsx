import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useDemo } from '../context/DemoContext';
import { triageService, analyticsApi, patientService } from '../services';
import { TriageItem } from '../types';
import { RiskBadge } from '../components/common/Badge';
import { RegisterPatientModal } from '../components/common/RegisterPatientModal';
import { useToast } from '../context/ToastContext';
import { 
  Users, 
  AlertOctagon, 
  GitPullRequest, 
  Clock, 
  RefreshCw, 
  TrendingUp, 
  ScanEye, 
  UserPlus, 
  ArrowRight, 
  Inbox, 
  CheckCircle2, 
  AlertCircle,
  Tent,
  CalendarClock,
  ChevronRight,
  Loader2,
  Edit,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export const OverviewDashboard: React.FC = () => {
  const { user } = useAuth();
  const { unsyncedCases } = useOffline();
  const { isDemoMode } = useDemo();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // State
  const [triageFilter, setTriageFilter] = useState<'ALL' | 'HIGH' | 'PROGRESSION' | 'OVERDUE'>('ALL');
  const [triageItems, setTriageItems] = useState<TriageItem[]>([]);
  const [editingItem, setEditingItem] = useState<TriageItem | null>(null);
  const [kpis, setKpis] = useState({
    total_screened: 0,
    high_risk: 0,
    referrals: 0,
    followups: 0
  });
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Data Fetching
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const [triageData, kpiData, trendData] = await Promise.allSettled([
        triageService.getTriageQueue(),
        analyticsApi.getDashboardKPIs(),
        analyticsApi.getScreeningTrends(7)
      ]);

      let hasSuccess = false;

      if (triageData.status === 'fulfilled' && Array.isArray(triageData.value)) {
        setTriageItems(triageData.value);
        hasSuccess = true;
      } else {
        setTriageItems([]);
      }

      if (kpiData.status === 'fulfilled' && kpiData.value) {
        setKpis({
          total_screened: kpiData.value.total_screened || 0,
          high_risk: kpiData.value.high_risk_patients || 0,
          referrals: kpiData.value.active_referrals || 0,
          followups: kpiData.value.followups_due_today || 0
        });
        hasSuccess = true;
      } else {
        setKpis({ total_screened: 0, high_risk: 0, referrals: 0, followups: 0 });
      }

      if (trendData.status === 'fulfilled' && Array.isArray(trendData.value) && trendData.value.length > 0) {
        setVolumeData(trendData.value.map(t => ({
          day: t.date,
          screened: t.total_screened,
          highRisk: t.high_risk,
          referrals: t.referred
        })));
        hasSuccess = true;
      } else {
        setVolumeData([]);
      }

      if (!hasSuccess && triageData.status === 'rejected' && kpiData.status === 'rejected') {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    loadDashboardData();
    const handleDataUpdate = () => {
      loadDashboardData();
    };
    window.addEventListener('retinaguard_data_updated', handleDataUpdate);
    return () => {
      window.removeEventListener('retinaguard_data_updated', handleDataUpdate);
    };
  }, [loadDashboardData]);

  const handleDeleteTriageItem = async (e: React.MouseEvent, item: TriageItem) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete ${item.patientName} (${item.patientDisplayId})? This will remove the patient across all screens.`)) {
      await patientService.deletePatient(item.patientId || item.id);
      setTriageItems(prev => prev.filter(t => t.id !== item.id && t.patientId !== item.patientId));
      setKpis(prev => ({
        ...prev,
        total_screened: Math.max(0, prev.total_screened - 1),
        high_risk: item.riskLevel === 'HIGH' || item.riskLevel === 'CRITICAL' ? Math.max(0, prev.high_risk - 1) : prev.high_risk
      }));
      showToast({
        type: 'info',
        title: 'Patient Record Deleted',
        message: `${item.patientName} has been permanently deleted from all records.`
      });
    }
  };

  const handleSaveEditedItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    await patientService.updatePatient(editingItem.patientId || editingItem.id, {
      name: editingItem.patientName,
      age: editingItem.patientAge,
      riskLevel: editingItem.riskLevel
    });
    setTriageItems(prev => prev.map(t => t.id === editingItem.id ? editingItem : t));
    const targetName = editingItem.patientName;
    setEditingItem(null);
    showToast({
      type: 'success',
      title: 'Triage Patient Updated',
      message: `Updated triage information for ${targetName}.`
    });
  };

  // Filtered triage items
  const filteredTriage = triageItems.filter(item => {
    if (triageFilter === 'HIGH' && item.riskLevel !== 'HIGH' && item.riskLevel !== 'CRITICAL') return false;
    if (triageFilter === 'PROGRESSION' && !item.hasProgression) return false;
    if (triageFilter === 'OVERDUE' && !item.followUpOverdue) return false;
    return true;
  });

  // Clinician greeting
  const clinicianName = user 
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email.split('@')[0]
    : 'Clinician';
  
  const userGreeting = user?.role === 'DOCTOR' 
    ? `Good morning, Dr. ${clinicianName}`
    : `Good morning, ${clinicianName}`;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Patient Registration Modal */}
      <RegisterPatientModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onPatientCreated={() => {
          loadDashboardData();
          navigate('/screening');
        }}
      />

      {/* Header & Quick Action CTAs */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {userGreeting}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here is your clinical screening and patient triage overview for today.
          </p>
        </div>

        {/* Top Action CTAs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Register Patient</span>
          </button>

          <button
            onClick={() => navigate('/screening')}
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
          >
            <ScanEye className="w-4 h-4" />
            <span>New Screening</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner if Backend Call Fails */}
      {hasError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-between gap-3 text-xs text-rose-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium">
              Unable to reach the live Django backend API. Showing offline workspace view.
            </span>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs transition-colors cursor-pointer flex-shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Real Data KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Patients Screened */}
        <div className="clinical-card p-4 sm:p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Total Screened</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse my-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {kpis.total_screened}
              </div>
            )}
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              {kpis.total_screened === 0 ? 'No screenings recorded yet' : 'Total screening sessions'}
            </div>
          </div>
        </div>

        {/* Card 2: High Risk Alerts */}
        <div className="clinical-card p-4 sm:p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">High Risk Alerts</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse my-1" />
            ) : (
              <div className={`text-2xl sm:text-3xl font-black tabular-nums ${kpis.high_risk > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {kpis.high_risk}
              </div>
            )}
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              {kpis.high_risk === 0 ? 'Zero critical alerts' : 'Requires clinical review'}
            </div>
          </div>
        </div>

        {/* Card 3: Active Referrals */}
        <div className="clinical-card p-4 sm:p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Active Referrals</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <GitPullRequest className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse my-1" />
            ) : (
              <div className={`text-2xl sm:text-3xl font-black tabular-nums ${kpis.referrals > 0 ? 'text-indigo-600' : 'text-slate-900'}`}>
                {kpis.referrals}
              </div>
            )}
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              {kpis.referrals === 0 ? 'No pending referrals' : 'Specialist consultations'}
            </div>
          </div>
        </div>

        {/* Card 4: Follow-ups Due */}
        <div className="clinical-card p-4 sm:p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Follow-ups Due</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse my-1" />
            ) : (
              <div className={`text-2xl sm:text-3xl font-black tabular-nums ${kpis.followups > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {kpis.followups}
              </div>
            )}
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              {kpis.followups === 0 ? 'All recalls up-to-date' : 'Scheduled recalls pending'}
            </div>
          </div>
        </div>

        {/* Card 5: Unsynced Offline Scans */}
        <div 
          onClick={() => navigate('/offline')}
          className="clinical-card p-4 sm:p-5 flex flex-col justify-between cursor-pointer hover:border-blue-300 transition-colors col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Offline Scans</span>
            <div className={`p-1.5 rounded-lg ${unsyncedCases.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-600'}`}>
              {unsyncedCases.length > 0 ? <RefreshCw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-3xl font-black tabular-nums ${unsyncedCases.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {unsyncedCases.length}
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1">
              {unsyncedCases.length === 0 ? 'Central registry synced' : 'Local cases to sync'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Triage Queue (8 Cols) + Screening Output / Shortcuts (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Priority Triage Queue (8 Cols) */}
        <div className="lg:col-span-8 clinical-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Priority Triage Queue
                </h2>
                {filteredTriage.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {filteredTriage.length} Cases
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Patients requiring immediate clinical review, tele-consult, or specialist dispatch
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setTriageFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  triageFilter === 'ALL' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTriageFilter('HIGH')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  triageFilter === 'HIGH' ? 'bg-rose-600 font-bold text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                High Risk
              </button>
              <button
                onClick={() => setTriageFilter('PROGRESSION')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  triageFilter === 'PROGRESSION' ? 'bg-indigo-600 font-bold text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Progression
              </button>
              <button
                onClick={() => setTriageFilter('OVERDUE')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  triageFilter === 'OVERDUE' ? 'bg-amber-600 font-bold text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Overdue
              </button>
            </div>
          </div>

          {/* Table Container - Horizontal scroll only within container if width exceeds screen */}
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <div className="text-xs font-semibold text-slate-500">Loading clinical triage queue...</div>
            </div>
          ) : filteredTriage.length > 0 ? (
            <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
              <table className="w-full text-left text-xs min-w-[580px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Patient</th>
                    <th className="py-3 px-3">Risk Level</th>
                    <th className="py-3 px-3">Primary Finding</th>
                    <th className="py-3 px-3">Screening Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTriage.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/patients/${item.patientId}`)}
                    >
                      {/* Patient */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {(item.patientName || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{item.patientName || 'Patient'}</span>
                              <span className="font-mono text-[10px] text-slate-400 font-normal">{item.patientDisplayId || ''}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.patientAge || '—'} yrs • T2D ({item.diabetesDuration || 0} yrs)
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Risk */}
                      <td className="py-3 px-3">
                        <RiskBadge risk={item.riskLevel} size="sm" />
                      </td>

                      {/* Finding */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-medium text-slate-700 line-clamp-1">
                          {item.urgencyReason || 'Clinical screening finding'}
                        </div>
                      </td>

                      {/* Last Screening */}
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {item.lastScreenedDate || 'Recent'}
                      </td>

                      {/* Follow-up / Status */}
                      <td className="py-3 px-3">
                        {item.followUpOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Overdue ({item.daysWaiting}d)
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">Stable</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/patients/${item.patientId}`)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                            title="Review Patient Dossier"
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItem({ ...item })}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit Patient Info"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTriageItem(e, item)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Patient Record Everywhere"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Intentional, Clean Clinical Empty State */
            <div className="py-12 px-4 text-center space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  No priority triage cases requiring immediate review
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isDemoMode
                    ? "Filter criteria returned 0 matching records."
                    : "All screened patients are currently stable, or no new screening cases have been registered."}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2.5">
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  Register Patient
                </button>
                <button
                  onClick={() => navigate('/screening')}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  New Screening
                </button>
              </div>
            </div>
          )}

          {/* Table Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Showing {filteredTriage.length} {filteredTriage.length === 1 ? 'case' : 'cases'}
            </span>
            <button
              onClick={() => navigate('/triage')}
              className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Triage Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Screening Volume & Clinical Shortcuts (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Screening Output Chart */}
          <div className="clinical-card p-5 sm:p-6 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Screening Volume (7 Days)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Weekly screening output and referral yield
              </p>
            </div>

            {volumeData.length > 0 ? (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="screened" name="Screened" fill="#1b52eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="highRisk" name="High Risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="referrals" name="Referrals" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="font-bold text-xs text-slate-800">No screening activity recorded this week</div>
                <div className="text-[11px] text-slate-500 max-w-xs">
                  Chart populates automatically as patient screenings are completed.
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Primary care registry</span>
              <button
                onClick={() => navigate('/analytics')}
                className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Analytics →</span>
              </button>
            </div>
          </div>

          {/* Quick Clinical Shortcuts */}
          <div className="clinical-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Clinical Shortcuts
            </h3>

            <div className="space-y-1.5">
              <button
                onClick={() => navigate('/screening')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 transition-colors text-xs font-semibold text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                    <ScanEye className="w-4 h-4" />
                  </div>
                  <span>Start Retinal Screening</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => navigate('/referrals')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-xs font-semibold text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <GitPullRequest className="w-4 h-4" />
                  </div>
                  <span>Referral Pipeline</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/follow-ups')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-xs font-semibold text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <span>Follow-up & Recall Radar</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/health-camp')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors text-xs font-semibold text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <Tent className="w-4 h-4" />
                  </div>
                  <span>Health Camp & Field Screener</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Triage / Patient Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Edit className="w-5 h-5 text-blue-600" />
                <span>Edit Triage Patient Record</span>
              </div>
              <button 
                onClick={() => setEditingItem(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedItem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.patientName}
                  onChange={e => setEditingItem({ ...editingItem, patientName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={editingItem.patientAge || 45}
                    onChange={e => setEditingItem({ ...editingItem, patientAge: parseInt(e.target.value, 10) || 45 })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Risk Classification</label>
                  <select
                    value={editingItem.riskLevel}
                    onChange={e => setEditingItem({ ...editingItem, riskLevel: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CRITICAL">Critical Risk</option>
                    <option value="HIGH">High Risk</option>
                    <option value="MODERATE">Moderate Risk</option>
                    <option value="LOW">Low Risk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Clinical Finding / Reason</label>
                <textarea
                  rows={2}
                  value={editingItem.urgencyReason || ''}
                  onChange={e => setEditingItem({ ...editingItem, urgencyReason: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
