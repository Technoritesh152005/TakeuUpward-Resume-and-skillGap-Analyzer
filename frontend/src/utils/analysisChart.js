const MAX_VISIBLE_ANALYSIS_POINTS = 12;

const formatCompactAnalysisLabel = (point) => {
  const rawDate = point?.date ? new Date(point.date) : null;
  const dateLabel = rawDate && !Number.isNaN(rawDate.getTime())
    ? rawDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : point?.label || 'Analysis';

  return point?.label ? `${point.label} • ${dateLabel}` : dateLabel;
};

const buildVisibleAnalysisChartData = (analysisHistory = []) => {
  const normalized = analysisHistory.map((point, index) => ({
    ...point,
    shortLabel: point?.label || `A${index + 1}`,
    displayLabel: formatCompactAnalysisLabel(point),
  }));

  const hiddenCount = Math.max(0, normalized.length - MAX_VISIBLE_ANALYSIS_POINTS);
  const visibleData = hiddenCount > 0
    ? normalized.slice(-MAX_VISIBLE_ANALYSIS_POINTS)
    : normalized;

  return {
    visibleData,
    hiddenCount,
    totalCount: normalized.length,
    maxVisiblePoints: MAX_VISIBLE_ANALYSIS_POINTS,
  };
};

export {
  MAX_VISIBLE_ANALYSIS_POINTS,
  buildVisibleAnalysisChartData,
};
