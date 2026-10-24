import catalog from './portraitCatalog.json'

export function getArtisticPortrait(characterId) {
  return typeof characterId === 'string' && Object.hasOwn(catalog.portraits, characterId)
    ? catalog.portraits[characterId] : null
}
