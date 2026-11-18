# Cavira Craftable Builds — v1.7.3 "Runway Section Fix"

## Fix: sectioned runways stopped after section 1
**Cause:** every section reused the same temporary ticking-area name, `cavira_build_0`. Bedrock had not finished removing section 1's area when section 2 tried to add one with that name, so the add failed ("already exists") and construction stopped.

A test harness that copies this Bedrock behaviour reproduces the bug on v1.7.2: the build stops at 1 of 14 sections.

**Fix:**
- Each section now gets a different name from the pool, least recently used first.
- A failed add is retried up to 3 times, with a different name and a short wait each time.
- Far-away sections get up to 40 seconds to load instead of 15.
- If a section still fails, the message now shows Bedrock's actual error.

## New: ▶ Resume
If a sectioned build is ever interrupted, the tablet's main menu shows **▶ Resume <runway> (section N of M)** at the top. It carries on from where it stopped. Undo still removes everything built so far.

## Validation (test harness, not in-game)
- Load simulation of the Long runway, where unloaded chunks throw and re-adding a just-removed name fails:
  - All 14 of 14 sections built.
  - Never more than 1 ticking area in use at a time.
  - 0 ticking areas left over.
  - **LOADSIM PASS**. v1.7.2 fails the same test at 1/14.
- Resume test: a forced failure at section 6 stops at 5/14, and Resume completes 14/14. **RESUME PASS**.
- The full suite still passes:
  - 70 structures × 4 rotations: 0 failures.
  - Sections, snap, chunk and direction checks pass.
