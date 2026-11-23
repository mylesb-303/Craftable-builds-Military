# Cavira Craftable Builds — v1.9.0 "Hologram Preview"

## New: hologram placement
Choosing a build now shows a **glowing, see-through hologram of the actual finished building** before anything is placed.
- **It follows your view.** It sits where your crosshair points and turns with you, so you can walk, fly and line it up against roads, runways or other buildings.
- **It's the real build.** It is generated from the same blocks the build will place, shown as its outer shell, tinted to roughly match the real colours (grey walls, blue glass, yellow markings, lights) with a holographic cyan cast.
- **Only you can see it.** It uses `Player.spawnParticle`, which is visible only to that player, so it won't distract others on a Realm.
- **It never changes the world.** You can cancel at any time with nothing to clean up.
- **It turns red** if the spot is outside the world's height limits.
- **Tablet controls while it follows you:**
  - 📍 Lock Here: loads the area, checks it, and adds the ground outline.
  - Construct Here / Try It Full Size: these lock automatically first.
  - Rotate Left / Right: turns it relative to the way you're facing.
  - Snap to the last runway or taxiway piece.
  - Cancel.
- **Once locked:** Move With My View unlocks it again, and Rotate, Construct and the other buttons work as before.

### Keeping it smooth on tablets and consoles
- **Particle budget:** at most 1,600 hologram particles per player.
  - Small builds are shown block for block (1:1).
  - Big builds are drawn at a coarser level of detail: the Super-Heavy Hangar at 1:5, the Large Aircraft Hangar and runways at 1:3.
- **No long tasks:** the hologram is worked out in short steps, so it can't trigger the "interrupted" script error. The longest step is 10 ms in the test harness.
- **Very long runways:** the hologram covers the end nearest you.

## Files
- `scripts/hologram.js` (new): builds the hologram model, picks the level of detail, and draws it.
- `RP/particles/cavira_holo_voxel.json` (new): additive-blend billboard, tinted per block, fades out over 1.2 s.
- `RP/textures/particle/cavira_holo.png` (new): 16×16 voxel frame.

## Validation (test harness, not in-game)
- `holocheck`: all 70 builds produce a hologram within the 1,600-particle budget, with every cell inside the build volume. The longest step is 10 ms.
- Draw test: one full refresh covers every cell. Every particle lands inside the placed build's footprint, in all 4 rotations, for the Super Hangar, Watch Tower, Guard Post, Long Runway and Pier Corner.
- Full regression still passes:
  - 70 structures × 4 rotations: 0 failures.
  - Envelope, lighting-fixture, slice, sections, load-simulation and snap checks: all PASS.

## Known limitations
- Particle size, brightness and transparency can't be checked outside the game. They may need tuning after your first look on iPad and Xbox (one number each).
- The hologram shows the outside of the building, not the furniture inside.
