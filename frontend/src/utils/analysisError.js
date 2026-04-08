export const getSafeAnalysisError = (error) => {
  const raw = String(error || '').trim();
  if (!raw) return 'The analysis worker could not finish this request.';

  const normalized = raw.toLowerCase();
  if (normalized.includes('quota') || normalized.includes('rate limit')) {
    return 'Analysis could not finish because the AI provider was temporarily unavailable.';
  }
  if (normalized.includes('timeout')) {
    return 'Analysis generation timed out before the worker could finish.';
  }
  if (normalized.includes('json') || normalized.includes('parse')) {
    return 'Analysis generation returned an invalid response format.';
  }

  return 'Analysis failed before completion.';
};
