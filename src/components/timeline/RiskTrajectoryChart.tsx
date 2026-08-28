import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface RiskTrajectoryPoint {
  date: string;
  stageTitle: string;
  riskScore: number;
}

interface RiskTrajectoryChartProps {
  data: RiskTrajectoryPoint[];
  patientName?: string;
}

export const RiskTrajectoryChart: React.FC<RiskTrajectoryChartProps> = ({
  data
}) => {
  return (
    <div className="clinical-card p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 text-brand-600 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Predictive Analytics</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              Risk Trajectory Over Time
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low (&lt;30)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Moderate (30-70)
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> High (&gt;70)
            </span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-60 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                ticks={[0, 30, 70, 100]}
              />

              {/* Muted Reference Risk Zones */}
              <ReferenceArea y1={0} y2={30} fill="#f0fdf4" fillOpacity={0.6} />
              <ReferenceArea y1={30} y2={70} fill="#fffbeb" fillOpacity={0.6} />
              <ReferenceArea y1={70} y2={100} fill="#fef2f2" fillOpacity={0.6} />

              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.7} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.7} />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-md text-xs">
                        <div className="font-semibold text-slate-300">{d.date}</div>
                        <div className="text-brand-300 font-bold mt-0.5">{d.stageTitle}</div>
                        <div className="text-amber-400 font-black mt-1 text-sm tabular-nums">
                          Risk Score: {d.riskScore} / 100
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Line
                type="monotone"
                dataKey="riskScore"
                stroke="#1b52eb"
                strokeWidth={3}
                dot={{ r: 4.5, fill: '#1b52eb', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Progression velocity: <strong className="text-rose-600 font-bold tabular-nums">+1.8 pts / mo</strong></span>
        <span>Risk forecast: <strong className="text-rose-700 font-bold">Severe NPDR / DME</strong></span>
      </div>
    </div>
  );
};
