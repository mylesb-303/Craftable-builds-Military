# Cavira Craftable Builds — v1.7.2 "Sectioned Runways"

## Fix: the full runways were too big to spawn
The Short, Medium and Long runways needed the whole site loaded at once. On the Long runway that meant up to 6 ticking areas and hundreds of chunks. It also drew a preview of up to 44,000 marker blocks in a single tick. Both are too much for a tablet or console.

Very large builds are now **built in sections**:
- The build is split along its length into sections of at most 64 chunks each.
  - Short runway: 3 sections.
  - Medium runway: 6 sections.
  - Long runway: 14 sections.
- Sections are built one at a time, starting at the end nearest you. Each section loads only one temporary ticking area, builds, and then releases it before the next one loads. So a runway needs just **1** free ticking area, whatever its length.
- Progress shows as, for example, "Constructing (section 5/14)".
- The preview of a sectioned build shows the outline only, about 3,300 markers on the Long runway instead of 44,000.
  - Only the nearby part of the outline shows, because the far end isn't loaded yet.
  - A chat message tells you how long the build is and how many sections it has.
- The placement check only needs the section nearest you to be loaded.
- **Undo** removes the sections one by one, newest first, loading each one again.
- If a section can't be loaded, construction stops cleanly. The sections already built stay in Undo, so you can remove them.

## Robustness
- Block reads in unloaded chunks no longer throw script errors. This covers the preview, the placement check, the site survey and preview recovery. Those blocks are now treated as "not loaded".

## Validation (test harness, not in-game)
- The sectioned build of each runway, in 2 rotations, places exactly the same blocks as a one-shot build. The only differences are where the lighting planner put a few light blocks, which happen differently at section edges.
- Undo restores every block (0 differences).
- Section sizes: no section exceeds 64 chunks.
- The full suite still passes:
  - 70 structures × 4 rotations: 0 failures.
  - Snap, direction and multi-tile chunk checks pass.
  - 0 dark cells on every build.
  - Bunker floors check: OK.
