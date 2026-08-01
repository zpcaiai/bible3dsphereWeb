from __future__ import annotations

from .models import Difficulty, ResistanceType


_ORDER = [
    Difficulty.D0,
    Difficulty.D1,
    Difficulty.D2,
    Difficulty.D3,
    Difficulty.D4,
    Difficulty.D5,
]


class DifficultyController:
    LOWER_ON = {
        ResistanceType.CONFUSION,
        ResistanceType.FATIGUE,
        ResistanceType.FEAR,
        ResistanceType.SHAME_FLOODING,
        ResistanceType.TRAUMA_ACTIVATION,
        ResistanceType.SCRUPULOSITY,
    }

    NEVER_RAISE_ON = {
        ResistanceType.HOSTILITY,
        ResistanceType.BOUNDARY_SETTING,
    }

    def adjust(
        self,
        current: Difficulty,
        resistance: ResistanceType,
        answer_quality: str,
        emotional_load: str,
    ) -> Difficulty:
        idx = _ORDER.index(current)

        if resistance in self.LOWER_ON or emotional_load == "overloaded":
            return _ORDER[max(0, idx - 1)]

        if resistance in self.NEVER_RAISE_ON:
            return current

        if answer_quality in {"specific", "reflective"} and emotional_load in {"low", "medium"}:
            return _ORDER[min(len(_ORDER) - 1, idx + 1)]

        return current
