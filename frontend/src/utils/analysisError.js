export const getSafeAnalysisError = (error) => {
  const raw = String(error || '').trim();
  if (!raw) return 'The analysis worker could not finish this request.';

  const normalized = raw.toLowerCase();
  const retryDelayMatch = raw.match(/retry after\s+(\d+)s/i);

  if (normalized.includes('quota') || normalized.includes('rate limit') || normalized.includes('(429)')) {
    return retryDelayMatch
      ? `Analysis could not finish because the AI provider hit a quota or rate limit. Retry after ${retryDelayMatch[1]}s.`
      : 'Analysis could not finish because the AI provider hit a quota or rate limit.';
  }
  if (normalized.includes('service unavailable') || normalized.includes('(503)')) {
    return 'Analysis could not finish because the primary AI model was temporarily unavailable.';
  }
  if (normalized.includes('timeout')) {
    return 'Analysis generation timed out before the worker could finish.';
  }
  if (normalized.includes('json') || normalized.includes('parse')) {
    return 'Analysis generation returned an invalid response format.';
  }

  return 'Analysis failed before completion.';
};
