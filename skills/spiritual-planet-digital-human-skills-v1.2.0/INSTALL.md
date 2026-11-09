# Install / Adopt

## Option A — Copy into an application repository

```bash
mkdir -p .skills/spiritual-planet-digital-human
cp -R spiritual-planet-digital-human-skills-v1.0.0/* .skills/spiritual-planet-digital-human/
```

Then instruct your coding agent to read:

1. `.skills/spiritual-planet-digital-human/SKILL.md`
2. `.skills/spiritual-planet-digital-human/AGENTS.md`
3. the relevant file under `docs/`

## Option B — Keep as a shared skills repository

Add this package as a git submodule or internal package and reference `SKILL.md` from project-level `AGENTS.md`.

## Required external services / accounts

- MetaPerson / Avatar SDK account
- LiveSpeak credentials/entitlement as required by your plan
- LiveKit Cloud or self-hosted LiveKit
- Azure Speech or another supported LiveSpeak TTS path
- LLM provider
- Bible text/data source with appropriate license

## Required project secrets

See `configs/.env.example`. Never put actual secrets in source control.

## Validation

```bash
python scripts/validate_package.py
python scripts/validate_truth_set.py examples/david/truth-set.yaml
```
