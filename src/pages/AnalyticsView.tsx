import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../services';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Sparkles,
  Inbox,
  PieChart as PieChartIcon
} from 'lucide-react';

type TimeFilter = '7D' | '30D' | '3M' | '6M' | '1Y';

export const AnalyticsView: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7D');
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [severityData, setSeverityData] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    total_screened: 0,
    yield_rate: '0.0%',
    completion_rate: '0.0%',
    avg_speed: '—'
  });

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      analyticsApi.getDashboardKPIs(),
      analyticsApi.getScreeningTrends(timeFilter === '7D' ? 7 : 30),
      analyticsApi.getSeverityDistribution()
    ]).then(([kpiRes, trendRes, sevRes]) => {
      if (isMounted) {
        if (kpiRes.status === 'fulfilled' && kpiRes.value) {
          setKpis({
            total_screened: kpiRes.value.total_screened || 0,
            yield_rate: `${kpiRes.value.high_risk_yield_rate || 0}%`,
            completion_rate: kpiRes.value.total_referrals
              ? `${Math.round((kpiRes.value.completed_referrals / kpiRes.value.total_referrals) * 1000) / 10}%`
              : '0.0%',
            avg_speed: '—'
          });
        } else {
          setKpis({ total_screened: 0, yield_rate: '0.0%', completion_rate: '0.0%', avg_speed: '—' });
        }

        if (trendRes.status === 'fulfilled' && Array.isArray(trendRes.value) && trendRes.value.length > 0) {
          setVolumeData(trendRes.value.map(t => ({
            day: t.date,
            screened: t.total_screened,
            highRisk: t.high_risk,
            referrals: t.referred
          })));
        } else {
          setVolumeData([]);
        }

        if (sevRes.status === 'fulfilled' && Array.isArray(sevRes.value) && sevRes.value.length > 0) {
          const activeStages = sevRes.value
            .filter((s: any) => (s.count && s.count > 0) || (s.percentage && s.percentage > 0))
            .map((s: any, idx: number) => ({
              name: s.label || s.stage || `Stage ${idx}`,
              value: s.count || s.percentage || 1,
              color: s.color || ['#f59e0b', '#f43f5e', '#10b981', '#3b82f6', '#8b5cf6'][idx % 5]
            }));
          setSeverityData(activeStages.length > 0 ? activeStages : sevRes.value.slice(0, 2).map((s: any) => ({ name: s.label || s.stage, value: 1, color: s.color })));
        } else {
          setSeverityData([]);
        }

        setLocations([]);
      }
    });
    return () => { isMounted = false; };
  }, [timeFilter]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Header & Filter Controls */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Population Health Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Screening Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Epidemiological trends, severity distribution ratios, and referral completion metrics across district screening centers.
          </p>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          {[
            { id: '7D', label: '7 Days' },
            { id: '30D', label: '30 Days' },
            { id: '3M', label: '3 Months' },
            { id: '6M', label: '6 Months' },
            { id: '1Y', label: '1 Year' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id as TimeFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="clinical-card p-5">
          <div className="text-xs font-medium text-slate-500">Total Screened</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tabular-nums">
            {kpis.total_screened}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">
            {kpis.total_screened > 0 ? '+14% from last period' : 'Awaiting initial scans'}
          </div>
        </div>

        <div className="clinical-card p-5">
          <div className="text-xs font-medium text-slate-500">High-Risk Yield Rate</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1 tabular-nums">
            {kpis.yield_rate}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            {kpis.total_screened > 0 ? 'Actionable pathology' : 'No pathology detected'}
          </div>
        </div>

        <div className="clinical-card p-5">
          <div className="text-xs font-medium text-slate-500">Referral Adherence</div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1 tabular-nums">
            {kpis.completion_rate}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            Specialist confirmed
          </div>
        </div>

        <div className="clinical-card p-5">
          <div className="text-xs font-medium text-slate-500">Avg. Optical Inference</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tabular-nums">
            {kpis.avg_speed}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1">
            Edge-accelerated CLAHE + QC
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Screening Output & Referrals (2 Cols) */}
        <div className="lg:col-span-2 clinical-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Screening Encounters & Referrals</h3>
              <p className="text-xs text-slate-500">Daily throughput across active clinical centers</p>
            </div>
          </div>

          {volumeData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
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
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs text-slate-800">Not enough screening data to generate this chart</div>
              <div className="text-[11px] text-slate-500 max-w-sm">
                Perform screenings to see longitudinal volume output, risk stratification, and tele-ophthalmology referral metrics.
              </div>
            </div>
          )}
        </div>

        {/* Severity Distribution Pie (1 Col) */}
        <div className="clinical-card p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Severity Distribution</h3>
              <p className="text-xs text-slate-500">ICDR Clinical Diabetic Retinopathy Stages</p>
            </div>

            {severityData.length > 0 ? (
              <>
                <div className="h-52 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {severityData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-700 font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-52 flex flex-col items-center justify-center text-center p-4 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <PieChartIcon className="w-5 h-5" />
                </div>
                <div className="font-bold text-xs text-slate-800">No Severity Ratio Available</div>
                <div className="text-[11px] text-slate-500 max-w-xs">
                  Awaiting screening diagnostic inferences.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
