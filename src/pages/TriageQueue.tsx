import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_TRIAGE_ITEMS } from '../data/mockData';
import { triageService, patientService } from '../services';
import { useDemo } from '../context/DemoContext';
import { TriageItem } from '../types';
import { RiskBadge } from '../components/common/Badge';
import { 
  ListFilter, 
  Search, 
  Clock, 
  TrendingUp, 
  Flame, 
  Inbox, 
  ArrowRight, 
  ScanEye,
  Edit,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

type FilterTab = 'ALL' | 'HIGH_RISK' | 'MODERATE' | 'PROGRESSION' | 'OVERDUE' | 'REFERRAL_PENDING';

export const TriageQueue: React.FC = () => {
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<TriageItem[]>(() => {
    try {
      const saved = localStorage.getItem('retinaguard_triage_items');
      if (saved) return JSON.parse(saved);
    } catch {}
    return isDemoMode ? MOCK_TRIAGE_ITEMS : [];
  });
  const [editingTriage, setEditingTriage] = useState<TriageItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      if (items && items.length > 0) {
        localStorage.setItem('retinaguard_triage_items', JSON.stringify(items));
      }
    } catch {}
  }, [items]);

  const handleDeleteTriage = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete ${name}? This will remove the patient across all screens.`)) {
      const item = items.find(i => i.id === id);
      if (item) {
        await patientService.deletePatient(item.patientId || item.id);
      }
      setItems(prev => prev.filter(i => i.id !== id));
      showToast({
        type: 'info',
        title: 'Patient Record Deleted',
        message: `${name} has been permanently deleted from all records.`
      });
    }
  };

  const handleSaveEditedTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTriage) return;
    await patientService.updatePatient(editingTriage.patientId || editingTriage.id, {
      name: editingTriage.patientName,
      age: editingTriage.patientAge,
      riskLevel: editingTriage.riskLevel
    });
    setItems(prev => prev.map(i => i.id === editingTriage.id ? editingTriage : i));
    const name = editingTriage.patientName;
    setEditingTriage(null);
    showToast({
      type: 'success',
      title: 'Triage Updated',
      message: `Triage parameters updated for ${name}.`
    });
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    triageService.getTriageQueue()
      .then(res => {
        if (isMounted) {
          setItems(res || []);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, [isDemoMode]);

  const filteredItems = items.filter((item) => {
    if (activeTab === 'HIGH_RISK' && item.riskLevel !== 'HIGH' && item.riskLevel !== 'CRITICAL') return false;
    if (activeTab === 'MODERATE' && item.riskLevel !== 'MODERATE') return false;
    if (activeTab === 'PROGRESSION' && !item.hasProgression) return false;
    if (activeTab === 'OVERDUE' && !item.followUpOverdue) return false;
    if (activeTab === 'REFERRAL_PENDING' && !item.referralPending) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.patientName.toLowerCase().includes(q) ||
        item.patientDisplayId.toLowerCase().includes(q) ||
        item.urgencyReason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = items.filter(i => i.riskLevel === 'HIGH' || i.riskLevel === 'CRITICAL').length;
  const overdueCount = items.filter(i => i.followUpOverdue).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <ListFilter className="w-4 h-4" />
            <span>Clinical Risk Stratification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Who needs attention first?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dynamic clinical prioritization engine weighting lesion severity, longitudinal velocity, and follow-up delinquency.
          </p>
        </div>

        {/* Priority Summary Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
            <Flame className="w-3.5 h-3.5" />
            <span>{criticalCount} Critical Priority</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            <span>{overdueCount} Overdue Actions</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="clinical-card p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {[
            { id: 'ALL', label: 'All Cases', count: items.length },
            { id: 'HIGH_RISK', label: 'High / Critical', count: criticalCount, alert: true },
            { id: 'PROGRESSION', label: 'Progression', count: items.filter(i => i.hasProgression).length },
            { id: 'OVERDUE', label: 'Follow-up Overdue', count: overdueCount },
            { id: 'REFERRAL_PENDING', label: 'Referral Pending', count: items.filter(i => i.referralPending).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FilterTab)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white'
                    : tab.alert && tab.count > 0
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter queue by name or reason..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Triage Table or Clean Empty State */}
      <div className="clinical-card overflow-hidden">
        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Priority / Score</th>
                  <th className="py-3 px-4">Patient Details</th>
                  <th className="py-3 px-4">Urgency Driver & Findings</th>
                  <th className="py-3 px-4">Last Screened</th>
                  <th className="py-3 px-4">Follow-up Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/patients/${item.patientId}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Priority / Score */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <RiskBadge risk={item.riskLevel} size="sm" />
                        <span className="font-mono text-[11px] text-slate-500 font-semibold tabular-nums">
                          {item.daysWaiting > 0 ? `${item.daysWaiting}d delay` : 'Prompt'}
                        </span>
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                        <span>{item.patientName}</span>
                        <span className="font-mono text-[10px] text-slate-400 font-normal">
                          {item.patientDisplayId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.patientAge} yrs • T2D ({item.diabetesDuration} yrs)
                      </div>
                    </td>

                    {/* Urgency driver */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-slate-800 line-clamp-1">
                        {item.urgencyReason}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.hasProgression && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                            <TrendingUp className="w-2.5 h-2.5" />
                            <span>Progression</span>
                          </span>
                        )}
                        {item.referralPending && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                            <span>Referral Needed</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Last Screened */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.lastScreenedDate}
                    </td>

                    {/* Follow-up Status */}
                    <td className="py-3.5 px-4">
                      {item.followUpOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Clock className="w-3 h-3" />
                          <span>{item.daysWaiting}d Overdue</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">On Schedule</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setEditingTriage({ ...item })}
                          title="Edit Triage Risk Parameters"
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTriage(item.id, item.patientName)}
                          title="Dismiss / Delete from Triage"
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/patients/${item.patientId}`)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 font-bold text-xs transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                No patients currently require priority review
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All registered patients are clinically stable or awaiting initial retinal photography.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => navigate('/screening')}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs inline-flex items-center gap-1.5"
              >
                <ScanEye className="w-4 h-4" />
                <span>Start Screening</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EDIT TRIAGE MODAL */}
      {editingTriage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Edit className="w-5 h-5 text-blue-600" />
                <span>Edit Triage Risk Stratification</span>
              </div>
              <button onClick={() => setEditingTriage(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedTriage} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  value={editingTriage.patientName}
                  onChange={e => setEditingTriage({ ...editingTriage, patientName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Risk Stratification</label>
                  <select
                    value={editingTriage.riskLevel}
                    onChange={e => setEditingTriage({ ...editingTriage, riskLevel: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CRITICAL">Critical (Immediate)</option>
                    <option value="HIGH">High Risk</option>
                    <option value="MODERATE">Moderate Risk</option>
                    <option value="LOW">Low / Stable</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Days Waiting / Overdue</label>
                  <input
                    type="number"
                    value={editingTriage.daysWaiting}
                    onChange={e => setEditingTriage({ ...editingTriage, daysWaiting: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Urgency Driver / Lesion Indication</label>
                <textarea
                  rows={2}
                  required
                  value={editingTriage.urgencyReason}
                  onChange={e => setEditingTriage({ ...editingTriage, urgencyReason: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="triageProgression"
                    checked={editingTriage.hasProgression}
                    onChange={e => setEditingTriage({ ...editingTriage, hasProgression: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="triageProgression" className="font-semibold text-slate-800 cursor-pointer">
                    Longitudinal Disease Progression Detected
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="triageReferral"
                    checked={editingTriage.referralPending}
                    onChange={e => setEditingTriage({ ...editingTriage, referralPending: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="triageReferral" className="font-semibold text-slate-800 cursor-pointer">
                    Specialist Apex Referral Needed
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTriage(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
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
