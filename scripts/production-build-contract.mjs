// Keep whole import.meta.env references from exporting unrelated deployment or
// provider variables. These are the existing browser-consumed public settings.
export const PUBLIC_BUILD_ENV_KEYS = Object.freeze([
  'VITE_API_BASE', 'VITE_AI_FORMATION_ENABLED',
  'VITE_ATTENTION_MODULE_ENABLED', 'VITE_ATTENTION_AI_ENABLED',
  'VITE_ATTENTION_COMMUNITY_ENABLED', 'VITE_ATTENTION_GROUPS_ENABLED',
  'VITE_ATTENTION_ADMIN_ENABLED', 'VITE_ATTENTION_E2E_MODE',
  'VITE_ATTENTION_DEMO_SEED_ENABLED',
  'VITE_BOOK_BASE', 'VITE_CESIUM_TOKEN', 'VITE_HYMN_AUDIO_BASE',
  'VITE_MAPBOX_TOKEN', 'NEXT_PUBLIC_MAPBOX_TOKEN', 'VITE_MAPLIBRE_STYLE',
  'VITE_MAP_PROVIDER', 'VITE_TEMPLE_GLTF_URL',
])

// Explicit definitions also populate whole import.meta.env references. Do this
// before Vite creates its define plugin; a configResolved filter is too late.
export function publicBuildDefinitions(deployment, environment) {
  const definitions = {}
  for (const key of PUBLIC_BUILD_ENV_KEYS) {
    if (environment[key] !== undefined) definitions['import.meta.env.' + key] = JSON.stringify(environment[key])
  }
  definitions['import.meta.env.VITE_API_BASE'] = JSON.stringify(resolvePublicApiBase(deployment, environment))
  return definitions
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
