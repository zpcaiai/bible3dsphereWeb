// Resolve only the public API input; never export account/provider environment.
export function resolvePublicApiBase(deployment, environment) {
  const fallback = deployment?.env?.VITE_API_BASE
  if (typeof fallback !== 'string' || !fallback.trim()) throw Error('Committed public API base is required')
  const explicit = environment.VITE_API_BASE
  if (explicit !== undefined && typeof explicit !== 'string') throw Error('Public API base must be a string')
  // Preserve explicit custom/empty inputs and the application's existing trim/fallback behavior.
  return explicit === undefined ? fallback : explicit
}
