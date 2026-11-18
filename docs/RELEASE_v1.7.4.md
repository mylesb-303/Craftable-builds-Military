# Cavira Craftable Builds — v1.7.4 "Lighting Fix"

## Fix: Super-Heavy Hangar (and other big builds) failed with "InternalError: interrupted"
**What happened:** the in-game error trace pointed at `lightPass` → `spawnSpot` (postprocess.js). The automatic lighting pass checked every block of the build for dark spots where mobs could spawn. Several of its loops ran through the whole build without pausing. On the 81 × 113 hangar, one uninterrupted stretch took about 93 ms in the test harness and much longer on an iPad. Bedrock stops a background job slice that runs that long, so the build failed.

**Fix:**
- Every loop in the lighting and access passes now hands control back to the game regularly, every 512–2,048 cells.
  - This covers the darkness survey, both light-placement sweeps, the final check, the light spread, the reachability flood and the room scan.
- The "does this spot have a roof?" check is now remembered instead of recalculated, which makes both passes cheaper.
- The results are unchanged: the same lights, the same doors and ladders, and 0 dark spawnable cells on every build.

## Validation (test harness, not in-game)
- New `slicecheck`: the longest stretch of work between pauses across all 70 builds is now 12–17 ms. It was 93 ms on the hangar, with 24 build/pass combinations over 15 ms. CI now checks this on every push.
- The full suite still passes:
  - 70 structures × 4 rotations: 0 failures.
  - Lighting and access results are identical to v1.7.3.
  - Sections, load simulation, resume and snap checks: PASS.
