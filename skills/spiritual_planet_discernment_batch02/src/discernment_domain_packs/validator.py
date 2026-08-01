from __future__ import annotations
import json
from pathlib import Path
from jsonschema import Draft202012Validator

def validate_json(instance_path: Path, schema_path: Path) -> list[str]:
    instance=json.loads(instance_path.read_text(encoding="utf-8"))
    schema=json.loads(schema_path.read_text(encoding="utf-8"))
    validator=Draft202012Validator(schema)
    return [e.message for e in sorted(validator.iter_errors(instance), key=lambda e: list(e.path))]
