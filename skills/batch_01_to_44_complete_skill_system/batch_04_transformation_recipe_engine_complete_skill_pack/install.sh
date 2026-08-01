#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-${CODEX_HOME:-$HOME/.codex}/skills}"
mkdir -p "$TARGET"
for skill_dir in "$SCRIPT_DIR"/skills/*; do
  name="$(basename "$skill_dir")"
  if [ -e "$TARGET/$name" ]; then
    echo "destination exists: $TARGET/$name" >&2
    exit 2
  fi
done
for skill_dir in "$SCRIPT_DIR"/skills/*; do
  cp -R "$skill_dir" "$TARGET/$(basename "$skill_dir")"
done
echo "Installed package skills into $TARGET"
