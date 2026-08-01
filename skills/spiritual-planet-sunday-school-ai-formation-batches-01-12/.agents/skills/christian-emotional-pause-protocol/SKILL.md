---
name: christian-emotional-pause-protocol
description: "Implement Spiritual Planet’s adult emotional and impulse pause protocol for anger, anxiety, sexual urge, doomscrolling, shopping, arguments, impulsive posting, late-night use, and avoidance; include ordered steps, delays, support, S0–S3 escalation, privacy, UI, and tests. Use to restore choice, not suppress emotion or replace care."
---

# Required resources

Read:

- `references/online-speech-and-pause-policy.md`
- `references/progress-and-privacy-policy.md`
- `schemas/pause-protocol.schema.json`
- the Batch 01 pastoral safety policy and Schema.

# Goal

Give the learner a short, embodied sequence that interrupts automatic behavior and restores truthful, relational and responsible choice.

# Required sequence

Implement the ordered sequence:

1. `STOP_INPUT`
2. `ATTEND_BODY`
3. `NAME_EMOTION`
4. `IDENTIFY_STORY`
5. `TEST_TRUTH`
6. `CHOOSE_ACTION`
7. `REPAIR_IF_NEEDED`

The UI may abbreviate it, but must preserve meaning and allow a one-tap “I need urgent help” route.

# Workflow

1. Inspect existing modal, bottom-sheet, crisis interrupt and offline patterns.
2. Implement `PauseProtocolV1`.
3. Let learners preconfigure trigger types, delay duration and support actions.
4. During use, minimize typing; offer categorical choices.
5. Do not claim emotions are false or sinful merely because they are intense.
6. Distinguish emotion, interpretation, desire and chosen behavior.
7. Route S2/S3 through Batch 01 safety handling.
8. Store the protocol and completion event, not sensitive narrative.
9. Offer repair after harmful action.

# Prohibited

- telling a user to breathe instead of seeking emergency help;
- treating panic, trauma or compulsive behavior as merely lack of faith;
- collecting detailed sexual or abuse disclosures in the pause UI;
- using the protocol to silence truthful reports of harm;
- forcing the user to contact a church leader.

# Tests

Cover all triggers, ordered steps, delay, offline use, S2/S3 interruption, trusted-contact choice, no narrative analytics, repair path, keyboard, screen reader, reduced motion and rapid repeated activation.

# Definition of done

The protocol is fast enough for a real trigger, safe enough for sensitive situations, and clear that it supports rather than replaces human care.
