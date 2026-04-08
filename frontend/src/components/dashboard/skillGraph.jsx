import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { LineChart as LineIcon, BarChart3, Sparkles } from 'lucide-react';
import { buildVisibleAnalysisChartData } from '../../utils/analysisChart.js';

const chartModes = [
  { id: 'line', label: 'Line', icon: LineIcon },
  { id: 'bar', label: 'Bar', icon: BarChart3 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/12 bg-neutral-900/90 p-4 shadow-2xl backdrop-blur-xl">
      <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-neutral-500">{label}</p>
      <div className="space-y-2">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }} />
              <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-tight">{entry.name}</span>
            </div>
            <span className="text-xs font-black text-white">{entry.value}{entry.name.includes('Score') ? '%' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SkillProgressGraph = ({ data = {}, loading = false }) => {
  const [chartMode, setChartMode] = useState('line');
  const analysisHistory = Array.isArray(data?.analysisHistory) ? data.analysisHistory : [];

  const { visibleData: chartData, hiddenCount, totalCount, maxVisiblePoints } = useMemo(
    () => buildVisibleAnalysisChartData(analysisHistory),
    [analysisHistory]
  );

  if (loading) {
    return (
      <div className="rounded-[32px] border border-white/8 bg-white/4 p-8 animate-pulse backdrop-blur-xl">
        <div className="mb-8 h-4 w-48 rounded-full bg-white/10" />
        <div className="h-80 rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return null;
  }

  const latest = chartData[chartData.length - 1];
  const previous = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  const matchDelta = previous ? (latest.matchScore || 0) - (previous.matchScore || 0) : 0;
  const hasDenseHistory = chartData.length > 8;
  const xAxisInterval = hasDenseHistory ? 1 : 0;
  const matchDot = hasDenseHistory ? false : { r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#000' };
  const gapDot = hasDenseHistory ? false : { r: 3, strokeWidth: 2, stroke: '#000' };

  const renderChart = () => {
    if (chartMode === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="shortLabel" interval={xAxisInterval} stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px', fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={10} />
            <YAxis yAxisId="score" domain={[0, 100]} stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px', fontWeight: 'bold' }} tickLine={false} axisLine={false} dx={-10} />
            <YAxis yAxisId="gaps" orientation="right" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px', fontWeight: 'bold' }} tickLine={false} axisLine={false} dx={10} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            <Bar yAxisId="score" dataKey="matchScore" name="Match Score" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            <Bar yAxisId="gaps" dataKey="criticalGaps" name="Critical Gaps" fill="#f43f5e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="shortLabel" interval={xAxisInterval} stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px', fontWeight: 'bold' }} tickLine={false} axisLine={false} dy={10} />
          <YAxis yAxisId="score" domain={[0, 100]} stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px', fontWeight: 'bold' }} tickLine={false} axisLine={false} dx={-10} />
          <YAxis yAxisId="gaps" orientation="right" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px', fontWeight: 'bold' }} tickLine={false} axisLine={false} dx={10} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
          <Line yAxisId="score" type="monotone" dataKey="matchScore" name="Match Score" stroke="#7c3aed" strokeWidth={4} dot={matchDot} activeDot={{ r: 6, strokeWidth: 0 }} />
          <Line yAxisId="gaps" type="monotone" dataKey="criticalGaps" name="Critical Gaps" stroke="#f43f5e" strokeWidth={3} dot={gapDot} activeDot={{ r: 5, strokeWidth: 0 }} />
          <Line yAxisId="gaps" type="monotone" dataKey="importantGaps" name="Important Gaps" stroke="#3b82f6" strokeWidth={3} dot={gapDot} activeDot={{ r: 5, strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="rounded-[32px] border border-white/8 bg-white/4 p-8 backdrop-blur-xl shadow-2xl relative group overflow-hidden">
      <div className="absolute top-0 right-0 h-32 w-32 bg-primary-500/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between relative z-10">
        <div>
          <h2 className="flex items-center gap-2.5 text-sm font-black text-white uppercase tracking-widest">
            <div className="w-8 h-8 rounded-lg bg-accent-600/20 border border-accent-500/30 flex items-center justify-center">
              <LineIcon className="h-4 w-4 text-accent-400" />
            </div>
            Performance Analytics
          </h2>
          <p className="mt-2 text-xs font-medium text-neutral-500 tracking-tight max-w-sm">
            Visualizing your trajectory toward market alignment with a cleaner rolling view of recent analyses.
          </p>
          {hiddenCount > 0 ? (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Showing last {maxVisiblePoints} of {totalCount} analyses
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 rounded-2xl bg-white/5 border border-white/8 p-1">
          {chartModes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setChartMode(id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                chartMode === id
                  ? 'bg-white/10 text-white shadow-lg active-glow'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        <div className="py-2">
          {renderChart()}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 border-t border-white/8 pt-8 md:grid-cols-3 relative z-10">
        <div className="text-center group/stat">
          <div className="text-3xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform duration-500">{totalCount}</div>
          <div className="mt-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total Analyses</div>
        </div>
        <div className="text-center group/stat">
          <div className="text-3xl font-black text-primary-400 tracking-tighter group-hover:scale-110 transition-transform duration-500">{latest.matchScore || 0}%</div>
          <div className="mt-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Market Readiness</div>
        </div>
        <div className="text-center group/stat">
          <div className={`text-3xl font-black tracking-tighter group-hover:scale-110 transition-transform duration-500 ${matchDelta >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
            {matchDelta >= 0 ? '+' : ''}{matchDelta}%
          </div>
          <div className="mt-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Momentum Shift</div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2.5 rounded-2xl bg-white/5 border border-white/5 px-4 py-3">
        <Sparkles className="h-4 w-4 text-accent-400" />
        <p className="text-[10px] font-bold text-neutral-400 tracking-tight uppercase">
          Clean View: <span className="text-neutral-200">Dense history is compressed into a recent rolling window for readability</span>.
        </p>
      </div>
    </div>
  );
};

export default SkillProgressGraph;
