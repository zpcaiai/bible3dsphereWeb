#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONDONTWRITEBYTECODE=1
PYTHON_BIN="python3"
for candidate in "/Users/stephen/Documents/Projects/DoctorPro/bible3dsphere/.venv/bin/python" "/usr/bin/python3" "python3" "python"; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c "import yaml, pydantic" >/dev/null 2>&1; then
    PYTHON_BIN="$candidate"
    break
  fi
done
"$PYTHON_BIN" -B "$ROOT/scripts/validate_package.py"
"$PYTHON_BIN" -B "$ROOT/scripts/validate_truth_set.py" "$ROOT/examples/david/truth-set.yaml"
"$PYTHON_BIN" -B "$ROOT/scripts/validate_character_examples.py"
"$PYTHON_BIN" -B -m unittest discover -s "$ROOT/tests" -p "test_*.py"
printf 'SMOKE CHECK OK\n'
