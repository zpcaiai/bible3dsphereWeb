# 02 — MetaPerson Integration

## Purpose

Create and manage 3D biblical-character assets. Runtime integration must be isolated behind an adapter.

## Asset requirements

For LiveSpeak custom avatars:

- export MetaPerson avatar as GLB;
- include viseme blendshapes;
- store immutable/versioned asset URLs;
- retain portrait and metadata alongside GLB;
- record asset review status.

## Recommended asset path

```text
characters/{characterId}/v{assetVersion}/
  avatar.glb
  portrait.webp
  metadata.json
```

## Generation workflow

```text
Biblical/History Research
→ Art Direction Brief
→ Concept Portrait
→ Internal Review
→ MetaPerson Generation
→ Hair/Clothes/Body Adjustments
→ GLB Export with Visemes
→ Visual QA
→ Publish Version
```

## Runtime rule

Do not generate a biblical character on every user visit. For canonical Bible characters, pre-produce and review the asset.

## Historical-appearance disclaimer

UI should clearly communicate that the avatar is an artistic reconstruction based on scripture, historical context and design choices.

## Provider isolation

Application code consumes:

```ts
interface CharacterAsset {
  characterId: string;
  modelUrl: string;
  portraitUrl: string;
  version: string;
}
```

Do not leak MetaPerson-specific identifiers across the domain model unless required for asset administration.
