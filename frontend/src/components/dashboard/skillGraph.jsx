import { useState } from 'react';
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { AreaChart as AreaIcon, LineChart as LineIcon, BarChart3, Radar as RadarIcon } from 'lucide-react';

const SkillProgressGraph = ({ data = {}, loading = false }) => {
  const [chartType, setChartType] = useState('area');
  const { weeklyProgress = [] } = data;

  const chartTypes = [
    { id: 'area', name: 'Area', icon: AreaIcon },
    { id: 'line', name: 'Line', icon: LineIcon },
    { id: 'bar', name: 'Bar', icon: BarChart3 },
    { id: 'radar', name: 'Radar', icon: RadarIcon },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-neutral-600 dark:text-neutral-400">
                {entry.name}:
              </span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 animate-pulse">
        <div className="h-6 w-40 bg-neutral-200 dark:bg-neutral-700 rounded mb-4" />
        <div className="h-80 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    );
  }

  if (!weeklyProgress || weeklyProgress.length === 0) {
    return null;
  }

  // Get all skill names (exclude 'week' key)
  const skillNames = weeklyProgress.length > 0 
    ? Object.keys(weeklyProgress[0]).filter(key => key !== 'week')
    : [];

  // Colors for different skills
  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#06b6d4', // cyan
  ];

  // Prepare data for radar chart
  const radarData = skillNames.map((skill, index) => ({
    skill,
    value: weeklyProgress[weeklyProgress.length - 1][skill],
    fullMark: 100,
  }));

  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={weeklyProgress}>
              <defs>
                {skillNames.map((skill, index) => (
                  <linearGradient key={skill} id={`color${skill}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[index]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors[index]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-neutral-700" />
              <XAxis 
                dataKey="week" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
              />
              {skillNames.map((skill, index) => (
                <Area
                  key={skill}
                  type="monotone"
                  dataKey={skill}
                  stroke={colors[index]}
                  strokeWidth={2}
                  fill={`url(#color${skill})`}
                  animationDuration={1000}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-neutral-700" />
              <XAxis 
                dataKey="week" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
              />
              {skillNames.map((skill, index) => (
                <Line
                  key={skill}
                  type="monotone"
                  dataKey={skill}
                  stroke={colors[index]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={1000}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-neutral-700" />
              <XAxis 
                dataKey="week" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
              />
              {skillNames.map((skill, index) => (
                <Bar
                  key={skill}
                  dataKey={skill}
                  fill={colors[index]}
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" className="dark:stroke-neutral-700" />
              <PolarAngleAxis 
                dataKey="skill" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Radar
                name="Skill Level"
                dataKey="value"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.3}
                animationDuration={1000}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          Weekly Progress
        </h2>

        {/* Chart type selector */}
        <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
          {chartTypes.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setChartType(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                chartType === id
                  ? 'bg-white dark:bg-neutral-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="mt-4">
        {renderChart()}
      </div>

      {/* Stats summary */}
      <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {skillNames.length}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Skills Tracked
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              {weeklyProgress.length}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Weeks
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-500">
              {Math.round(
                skillNames.reduce((sum, skill) => 
                  sum + (weeklyProgress[weeklyProgress.length - 1]?.[skill] || 0), 0
                ) / skillNames.length
              )}%
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Avg Progress
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillProgressGraph;