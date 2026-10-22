// Keep the catalogue lazy while avoiding a large object-literal JavaScript AST.
// Vite's raw loader emits one string; JSON.parse preserves the canonical data.
import catalogueJson from './mirrorData.json?raw'

const catalogue = JSON.parse(catalogueJson)
export const MIRROR_CHARACTERS = catalogue.MIRROR_CHARACTERS
export const MIRROR_THEMES = catalogue.MIRROR_THEMES
