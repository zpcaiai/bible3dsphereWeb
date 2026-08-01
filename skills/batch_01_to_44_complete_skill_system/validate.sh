#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VALIDATION_PYTHON="${SKILL_SYSTEM_PYTHON:-python3}"
"$VALIDATION_PYTHON" "$SCRIPT_DIR/tools/skill_system.py" validate --write-reports
