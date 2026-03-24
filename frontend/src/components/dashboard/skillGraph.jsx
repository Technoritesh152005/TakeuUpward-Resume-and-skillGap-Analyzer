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
import { CalendarRange, LineChart as LineIcon, BarChart3, TrendingUp } from 'lucide-react';

const chartModes = [
  { id: 'line', label: 'Line', icon: LineIcon },
  { id: 'bar', label: 'Bar', icon: BarChart3 },
];

const formatPointLabel = (point) => {
  const rawDate = point?.date ? new Date(point.date) : null;
  const dateLabel = rawDate && !Number.isNaN(rawDate.getTime())
    ? rawDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : point?.label || 'Analysis';

  return point?.label ? `${point.label} • ${dateLabel}` : dateLabel;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
      <p className="mb-2 text-sm font-semibold text-neutral-900 dark:text-white">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-neutral-600 dark:text-neutral-400">{entry.name}:</span>
          <span className="font-semibold text-neutral-900 dark:text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const SkillProgressGraph = ({ data = {}, loading = false }) => {
  const [chartMode, setChartMode] = useState('line');
  const analysisHistory = Array.isArray(data?.analysisHistory) ? data.analysisHistory : [];

  const chartData = useMemo(
    () =>
      analysisHistory.map((point) => ({
        ...point,
        displayLabel: formatPointLabel(point),
      })),
    [analysisHistory]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 animate-pulse dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mb-4 h-6 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-80 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return null;
  }

  const latest = chartData[chartData.length - 1];
  const previous = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  const matchDelta = previous ? (latest.matchScore || 0) - (previous.matchScore || 0) : 0;

  const renderChart = () => {
    if (chartMode === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-neutral-700" />
            <XAxis dataKey="displayLabel" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="score" domain={[0, 100]} stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="gaps" orientation="right" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar yAxisId="score" dataKey="matchScore" name="Match Score" fill="#14b8a6" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="gaps" dataKey="criticalGaps" name="Critical Gaps" fill="#f97316" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-neutral-700" />
          <XAxis dataKey="displayLabel" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis yAxisId="score" domain={[0, 100]} stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis yAxisId="gaps" orientation="right" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line yAxisId="score" type="monotone" dataKey="matchScore" name="Match Score" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line yAxisId="gaps" type="monotone" dataKey="criticalGaps" name="Critical Gaps" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} />
          <Line yAxisId="gaps" type="monotone" dataKey="importantGaps" name="Important Gaps" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900 dark:text-white">
            <CalendarRange className="h-5 w-5 text-primary-600" />
            Analysis Progress Over Time
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Real history from your saved analyses. Match score should rise over time while gap counts should fall.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-700">
          {chartModes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setChartMode(id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                chartMode === id
                  ? 'bg-white text-primary-600 shadow-sm dark:bg-neutral-600 dark:text-primary-300'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {renderChart()}

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-neutral-200 pt-6 dark:border-neutral-700 md:grid-cols-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">{chartData.length}</div>
          <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Analyses Tracked</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{latest.matchScore || 0}%</div>
          <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Latest Match Score</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${matchDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {matchDelta >= 0 ? '+' : ''}{matchDelta}%
          </div>
          <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Change From Previous Analysis</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-300">
        <span className="font-semibold text-neutral-900 dark:text-white">Reading the graph:</span> the green line is your real match score. The orange and blue lines show how many critical and important gaps remained in each saved analysis.
      </div>
    </div>
  );
};

export default SkillProgressGraph;
