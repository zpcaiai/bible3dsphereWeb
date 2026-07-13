#!/usr/bin/env python3
"""Build deterministic CUV/ESV matches for the curated homepage emotions."""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONCEPTS_FILE = ROOT / "src" / "data" / "anthropicEmotionConcepts.js"
BIBLE_DIR = ROOT.parent / "bible3dsphere" / "bible"
OUTPUT_FILE = ROOT / "src" / "data" / "emotionScriptureMatches.json"

# References are (canonical book number, chapter, verse). Each group combines
# pastoral relevance with a direct biblical response to the emotional state.
GROUPS = {
    "peace": {
        "terms": {"at ease", "calm", "content", "peaceful", "relaxed", "relieved", "safe", "satisfied", "serene"},
        "refs": [(43, 14, 27), (50, 4, 7), (19, 4, 8)],
    },
    "wonder": {
        "terms": {"awestruck", "amazed", "surprised", "shocked"},
        "refs": [(19, 139, 14), (45, 11, 33), (19, 8, 4)],
    },
    "joy": {
        "terms": {"amused", "cheerful", "delighted", "elated", "excited", "happy", "joyful", "pleased"},
        "refs": [(19, 16, 11), (50, 4, 4), (45, 15, 13)],
    },
    "care": {
        "terms": {"compassionate", "empathetic", "loving"},
        "refs": [(51, 3, 12), (45, 12, 15), (46, 13, 4)],
    },
    "energy_and_hope": {
        "terms": {"eager", "energized", "enthusiastic", "hopeful", "inspired", "invigorated", "optimistic"},
        "refs": [(23, 40, 31), (45, 15, 13), (50, 3, 14)],
    },
    "gratitude": {
        "terms": {"fulfilled", "grateful", "thankful"},
        "refs": [(52, 5, 18), (19, 107, 1), (50, 4, 11)],
    },
    "alert": {
        "terms": {"alert"},
        "refs": [(60, 5, 8), (41, 14, 38), (49, 6, 18)],
    },
    "confusion": {
        "terms": {"bewildered", "disoriented", "troubled", "unsettled"},
        "refs": [(20, 3, 5), (19, 25, 4), (43, 14, 1)],
    },
    "exposed_identity": {
        "terms": {"ashamed", "embarrassed", "humiliated", "self-conscious", "vulnerable", "worthless"},
        "refs": [(19, 34, 5), (45, 8, 1), (23, 43, 4)],
    },
    "attachment": {
        "terms": {"envious", "infatuated", "jealous"},
        "refs": [(20, 4, 23), (46, 13, 4), (59, 3, 16)],
    },
    "memory": {
        "terms": {"nostalgic", "reflective"},
        "refs": [(19, 77, 11), (19, 143, 5), (42, 2, 19)],
    },
    "pride": {
        "terms": {"proud"},
        "refs": [(48, 6, 14), (46, 1, 31), (59, 4, 6)],
    },
    "boredom": {
        "terms": {"bored"},
        "refs": [(51, 3, 23), (21, 9, 10), (45, 12, 11)],
    },
    "brooding": {
        "terms": {"brooding"},
        "refs": [(50, 4, 8), (47, 10, 5), (19, 139, 23)],
    },
    "sadness": {
        "terms": {"depressed", "dispirited", "miserable", "sad"},
        "refs": [(19, 42, 11), (19, 34, 18), (40, 5, 4)],
    },
    "despair": {
        "terms": {"desperate", "trapped"},
        "refs": [(19, 40, 2), (19, 130, 1), (47, 4, 8)],
    },
    "grief": {
        "terms": {"grief-stricken", "heartbroken", "hurt"},
        "refs": [(19, 147, 3), (43, 11, 35), (66, 21, 4)],
    },
    "guilt": {
        "terms": {"guilty", "regretful", "remorseful", "sorry"},
        "refs": [(62, 1, 9), (47, 7, 10), (19, 51, 17)],
    },
    "fatigue": {
        "terms": {"listless", "overwhelmed", "stressed", "tired", "weary"},
        "refs": [(40, 11, 28), (23, 40, 29), (19, 61, 2)],
    },
    "loneliness": {
        "terms": {"lonely"},
        "refs": [(19, 27, 10), (19, 68, 6), (58, 13, 5)],
    },
    "fear": {
        "terms": {"afraid", "anxious", "distressed", "nervous", "worried"},
        "refs": [(23, 41, 10), (50, 4, 6), (60, 5, 7)],
    },
    "panic": {
        "terms": {"alarmed", "frightened", "on edge", "panicked", "tense"},
        "refs": [(19, 56, 3), (19, 46, 2), (41, 4, 40)],
    },
    "restlessness": {
        "terms": {"restless"},
        "refs": [(19, 62, 1), (19, 131, 2), (40, 6, 34)],
    },
    "anger": {
        "terms": {"angry", "annoyed", "enraged", "impatient", "irritated"},
        "refs": [(49, 4, 26), (59, 1, 20), (20, 15, 1)],
    },
    "resentment": {
        "terms": {"bitter", "resentful"},
        "refs": [(58, 12, 15), (49, 4, 31), (51, 3, 13)],
    },
    "contempt": {
        "terms": {"contemptuous", "disgusted", "offended"},
        "refs": [(40, 7, 3), (42, 6, 37), (45, 12, 18)],
    },
    "frustration": {
        "terms": {"frustrated"},
        "refs": [(48, 6, 9), (20, 16, 3), (45, 5, 3)],
    },
    "indignation": {
        "terms": {"indignant"},
        "refs": [(49, 4, 26), (33, 6, 8), (45, 12, 19)],
    },
    "upset": {
        "terms": {"upset"},
        "refs": [(19, 55, 22), (43, 14, 1), (19, 131, 2)],
    },
}


def load_selected_terms() -> list[str]:
    source = CONCEPTS_FILE.read_text(encoding="utf-8")
    return re.findall(r"concept\('([^']+)',\s*'[^']+',\s*'[^']+'\)", source)


def load_bible(path: Path, *, compact_chinese: bool) -> dict[tuple[int, int, int], dict]:
    rows = {}
    with path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            key = (int(row["book number"]), int(row["chapter"]), int(row["verse"]))
            text = row["text"]
            if compact_chinese:
                text = re.sub(r"\s+", "", text)
            rows[key] = {"book": row["book"], "text": text}
    return rows


def main() -> None:
    selected = load_selected_terms()
    term_to_group = {}
    for group_name, group in GROUPS.items():
        for term in group["terms"]:
            if term in term_to_group:
                raise ValueError(f"duplicate scripture group for {term}")
            term_to_group[term] = group_name

    missing = sorted(set(selected) - set(term_to_group))
    extra = sorted(set(term_to_group) - set(selected))
    if missing or extra:
        raise ValueError(f"scripture coverage mismatch; missing={missing}, extra={extra}")

    cuv = load_bible(BIBLE_DIR / "cuv_bible.csv", compact_chinese=True)
    esv = load_bible(BIBLE_DIR / "esv_bible.csv", compact_chinese=False)
    output = {}
    for term in selected:
        group_name = term_to_group[term]
        refs = GROUPS[group_name]["refs"]
        cuv_matches = []
        esv_matches = []
        for book_number, chapter, verse in refs:
            key = (book_number, chapter, verse)
            if key not in cuv or key not in esv:
                raise ValueError(f"missing Bible verse {key} for {term}")
            pk_id = f"B{book_number:02d}-{chapter:03d}-{verse:03d}"
            cuv_matches.append({
                "pk_id": pk_id,
                "book_name": cuv[key]["book"],
                "chapter": chapter,
                "verse": verse,
                "raw_text": cuv[key]["text"],
                "score": 1.0,
            })
            esv_matches.append({
                "pk_id": pk_id,
                "book_name": esv[key]["book"],
                "chapter": chapter,
                "verse": verse,
                "raw_text": esv[key]["text"],
                "score": 1.0,
            })
        output[term] = {
            "source": "curated-biblical-pastoral-map-v1",
            "pastoral_group": group_name,
            "matches": {"cuv": cuv_matches, "esv": esv_matches},
        }

    OUTPUT_FILE.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(output)} emotion mappings to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
