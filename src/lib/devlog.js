// devlog — development-only console logging helper.
//
// Why this exists: this app logs emotion/crisis/mental-health metadata, and
// journal / prayer / check-in content, plus emails and query text. Those must
// NEVER reach production logs (privacy + PII exposure). Route all such
// diagnostic logging through devlog() so it no-ops in production builds.
//
// Defense-in-depth: Vite/esbuild already strips `console.log` from the prod
// bundle, BUT (a) not every build path goes through that transform, and
// (b) `console.info`/`console.debug`/`console.error` are not stripped. Gating
// explicitly here guarantees sensitive data never logs in prod regardless of
// build path.
//
// Keep genuine error/warning reporting on console.error / console.warn — but
// ensure those never dump tokens or raw user content.
export function devlog(...args) {
  // import.meta.env.DEV is true only during `vite dev`; false in prod builds.
  if (import.meta.env && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(...args)
  }
}
