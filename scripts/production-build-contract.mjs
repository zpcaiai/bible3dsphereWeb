// Keep whole import.meta.env references from exporting unrelated deployment or
// provider variables. These are the existing browser-consumed public settings.
export const PUBLIC_BUILD_ENV_PREFIXES = Object.freeze([
  'VITE_API_BASE', 'VITE_AI_FORMATION_ENABLED',
  'VITE_ATTENTION_MODULE_ENABLED', 'VITE_ATTENTION_AI_ENABLED',
  'VITE_ATTENTION_COMMUNITY_ENABLED', 'VITE_ATTENTION_GROUPS_ENABLED',
  'VITE_ATTENTION_ADMIN_ENABLED', 'VITE_ATTENTION_E2E_MODE',
  'VITE_ATTENTION_DEMO_SEED_ENABLED',
  'VITE_BOOK_BASE', 'VITE_CESIUM_TOKEN', 'VITE_HYMN_AUDIO_BASE',
  'VITE_MAPBOX_TOKEN', 'NEXT_PUBLIC_MAPBOX_TOKEN', 'VITE_MAPLIBRE_STYLE',
  'VITE_MAP_PROVIDER', 'VITE_TEMPLE_GLTF_URL',
])

// Vite envPrefix matches prefixes; filter the final environment by exact name
// as well, so e.g. VITE_API_BASE_DEBUG_SECRET cannot enter a browser bundle.
export function constrainPublicBuildEnvironment(environment) {
  for (const key of Object.keys(environment)) {
    if ((key.startsWith('VITE_') || key.startsWith('NEXT_PUBLIC_')) && !PUBLIC_BUILD_ENV_PREFIXES.includes(key)) delete environment[key]
  }
}

// Resolve only the public API input; never export account/provider environment.
export function resolvePublicApiBase(deployment, environment) {
  const fallback = deployment?.env?.VITE_API_BASE
  if (typeof fallback !== 'string' || !fallback.trim()) throw Error('Committed public API base is required')
  const explicit = environment.VITE_API_BASE
  if (explicit !== undefined && typeof explicit !== 'string') throw Error('Public API base must be a string')
  // Preserve explicit custom/empty inputs and the application's existing trim/fallback behavior.
  return explicit === undefined ? fallback : explicit
}
