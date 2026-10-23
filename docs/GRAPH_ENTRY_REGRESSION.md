# Graph entry and release regression

The graph starts independently of the optional mirror catalogue. Its lightweight
code ships in the already lazy mirror entry. Covered home WebGL rendering and
home-only data requests pause while mirror is active, then resume on return.
Catalogue import failures require a reload because the browser caches failed
module imports. Cache cleanup is bounded to one second; recovery retains mirror
navigation and has a session reload cap. Map loading retains a back control.

`Graph entry regression` builds the exact checkout and uses actual Chrome at
320/390px with the production API. Normal contexts retain service workers.
Separate, explicitly labelled negative contexts abort one asset request and/or
stall CacheStorage; they never fabricate API payloads. Original assertions stay
at five seconds, actions/navigation at30 seconds, cases at120 seconds. Browser
artifacts include real graph responses/hashes, node counts, request timing,
pending resources and PNGs without authentication headers or password captures.

`scripts/full-regression.py` executes all frontend tests, all pinned backend
digital-human tests, lint and build in one fresh300-second window. It preserves
actual child PIDs, exits, logs/hashes and immutable source pre/post snapshots.
Installation/collection preflight is not functional acceptance. Resource gates
remain two actual two-second samples ten seconds apart, at least2GiB free,
load1 at most min(32,4*CPU), and each sample completing within three seconds.

The release verifier checks exact GitHub Production deployment source metadata,
canonical served bytes and backend RUNNING/database health, plus four deployed
snapshot files against backendf8116ea1d268e5b92489cb9dac3b5f88e8558f01.
PR verification targets the currently deployed base as a verifier check only.
After merge it must verify the new main SHA; prior results cannot qualify it.

The `[verify-all100]` marker in an explicitly opted-in main merge commit enables
the production100-person job after all current-source prerequisites pass.
Alternatively an authorized operator can select `all100` on a main workflow run.
Ten groups run sequentially against holiness.uk using the existing test account,
the frozen oracle, unchanged timeouts and3300ms turn spacing. Passing requires
100 matches,200 followups,100 fresh switches/layouts,200 PNGs and310 unique real
accepted turn IDs including ten anchors. This covers one frozen topic per person.
Failures, skipped cases and failed resource admission remain unfinished.

No database migration is included. Rollback is a reviewed revert of this release
merge, preserving subsequent changes. External voice/provider accounts and health,
real media/rights, physical device evidence and authorized human approvals remain
unfinished. Native SDK tests do not establish those external journeys. Content
must remain `THEOLOGY_REVIEW`, with `speechApproved=false`.
