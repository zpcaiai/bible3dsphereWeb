#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-${CODEX_HOME:-$HOME/.codex}/skills}"
INSTALL_PYTHON="${SKILL_SYSTEM_PYTHON:-python3}"
"$INSTALL_PYTHON" "$SCRIPT_DIR/tools/skill_system.py" install "$TARGET"
