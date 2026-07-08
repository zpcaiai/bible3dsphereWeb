/**
 * Global Vitest setup — runs before every test file.
 * Provides minimal browser-API shims needed by src/ modules.
 */

// localStorage shim (jsdom provides it, but let's make it explicit)
if (typeof globalThis.localStorage === 'undefined') {
  const store = {}
  globalThis.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
  }
}

// Silence console.log noise from api.js during tests
vi.spyOn(console, 'log').mockImplementation(() => {})

// jsdom intentionally does not implement scrolling APIs. Components use
// scrollTo after successful submissions; tests only need the call to be safe.
if (typeof window !== 'undefined' && !window.scrollTo?.mock) {
  window.scrollTo = vi.fn()
}
