# CAVIRA Craftable Builds — Military v1.4.1 "Staged Construction"

Branch: `claude/audit-v1.4.1` (based on `codex/placement-interior-overhaul-v1.4.0`)
Target: Minecraft Bedrock 26.40+, `@minecraft/server` 2.9.0, `@minecraft/server-ui` 2.1.0
Manifest UUIDs and all structure IDs are unchanged from v1.4.0.

## Why this release

In v1.4.0, every structure was validated, snapshotted, cleared and built in a
**single game tick**. For the largest build (Large Strategic Satellite Array)
that was about **295,000 block operations in one tick**. On Xbox and iPad this
can freeze the game for several seconds, or trip the script watchdog part-way
through a build. A tripped watchdog can leave a half-built structure with no
undo.

## Changes

### Staged construction engine (`scripts/construction_engine.js`)

- Builders run against a *recording* dimension. Each build compiles into a
  de-duplicated list of writes, where the last write to a position wins.
- Writes that would not change anything (for example air → air) are dropped. The worst
  build falls from about 295k operations to about 89k, and typical builds fall much further.
- Capture (for undo) and construction run through `system.runJob`, spread across as
  many ticks as the device needs. Progress shows in the action bar.
- Safe write order for construction and undo:
  1. Solid blocks, bottom-up.
  2. Air, top-down, after the shell is sealed. This is water-safe for coastal and Navy builds.
  3. Attachables last: doors, ladders, pressure plates and terrain plants.
- If any part of the site is in an unloaded chunk, construction aborts **before
  any block changes**.
- Undo is staged in the same way, and only restores the blocks that were actually changed.
- Each player has a job lock. Using the tablet during a job shows its progress
  and doesn't start a second job.

### Preview safety (`scripts/preview_guard.js`)

- **Preview markers can't be broken.** In v1.4.0, survival players could mine the
  lime, cyan, yellow and orange concrete markers and keep them, and the cancel
  step would put the original blocks back. That was a free-concrete duplication exploit.
- **Leaving the game clears your preview.** In v1.4.0, the markers were left
  permanently in the world.
- **Crash and reload recovery.** Restore data for a live preview is saved to a
  world dynamic property, palette-compressed and chunked under the 32 KB limit.
  If the game closes or a Realm restarts mid-preview, the terrain is restored on
  the next load, retrying every 5 s until the chunks are loaded. Each world
  session uses its own key namespace, so recovery never touches a preview that is live now.
- Each preview stores its own dimension. In v1.4.0, a preview could be "restored"
  into the wrong dimension if the player went through a portal.

### Validation

- The preview/build site check no longer reads every block in the volume
  (up to 89k reads per check). It now checks the world-height range plus an
  8-block sample grid for loaded chunks. The engine still verifies every block it touches.

### Tooling

- `tools/engine-harness`: an offline regression test that the CI workflow now runs before packaging.
- The workflow also packages `claude/**` branches.

## Validation performed

| Check | Result |
|---|---|
| JSON syntax, all pack files | Pass |
| `node --check`, all scripts | Pass |
| Harness: 63 structures × 4 rotations, staged result identical to the v1.4.0 single-tick result | Pass (0 failures) |
| Harness: undo restores the original terrain exactly, all 252 cases | Pass |
| Harness: unloaded chunk aborts with zero writes | Pass |
| Harness: world-height check | Pass |
| Harness: preview persistence and crash recovery; live preview untouched | Pass |
| In-game testing (Xbox / iPad / Windows / Realms) | **Not yet done — awaiting user testing** |

The harness mocks the Minecraft API. It proves the logic, not real engine behaviour.

## Known limitations

- If the world closes *during* a construction job, the partly built structure stays
  in the world and session undo is lost. A full block snapshot is too large to save safely.
- Undo is still per play session, and it is cleared when you leave the world.
- Explosions and pistons can still disturb preview markers. Only player block-breaking is blocked.
- Build duration on real hardware has not been measured yet. Please note how long the
  largest builds take on Xbox and iPad.
