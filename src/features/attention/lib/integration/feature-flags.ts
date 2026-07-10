export function attentionFeatureFlags(env = import.meta.env) {
  const bool = (key: string, fallback: boolean) => {
    const raw = String(env[key] ?? '').trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(raw)) return true
    if (['0', 'false', 'no', 'off'].includes(raw)) return false
    return fallback
  }
  return {
    ATTENTION_MODULE_ENABLED: bool('VITE_ATTENTION_MODULE_ENABLED', true),
    ATTENTION_AI_ENABLED: bool('VITE_ATTENTION_AI_ENABLED', true),
    ATTENTION_COMMUNITY_ENABLED: bool('VITE_ATTENTION_COMMUNITY_ENABLED', true),
    ATTENTION_GROUPS_ENABLED: bool('VITE_ATTENTION_GROUPS_ENABLED', true),
    ATTENTION_ADMIN_ENABLED: bool('VITE_ATTENTION_ADMIN_ENABLED', true),
    ATTENTION_E2E_MODE: bool('VITE_ATTENTION_E2E_MODE', false),
    ATTENTION_DEMO_SEED_ENABLED: bool('VITE_ATTENTION_DEMO_SEED_ENABLED', false),
  }
}
