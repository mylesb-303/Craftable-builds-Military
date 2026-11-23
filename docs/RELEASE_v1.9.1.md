# Cavira Craftable Builds — v1.9.1 "Runway Lights & Hangar Pendants"

## Runway edge lights now light up and run down the runway
**Full Runways (Short, Medium, Long):**
- The edge lamps are real redstone lamps, lit by real redstone power from the foundation underneath them.
- A wave of light runs along both edges from the end you placed the runway from toward the far end, like approach "rabbit" lights:
  - each step is one lamp pair per game tick, with three lit at a time;
  - there is a 1.5-second pause between waves.
- The wave is driven by switching the block under each lamp pair to a redstone block and back.
  - A chain of repeaters isn't used, because repeaters placed by scripts can ignore the direction they're set to face (Mojang bug MCPE-190505). On rotated runways that would break the chain.
- **Taxiway lines no longer cover lamps.** Lamps where taxiway lines cross the shoulders used to be painted over; they are now placed last so they stay in place.
- **Persistence:** the light wave survives saving and reloading, up to 12 runways per world.
- **Self-cleaning:** if a runway is undone or its lamps are removed, its light wave stops on its own. It never changes a block a player has placed.
- **Only where loaded:** the wave only runs in loaded chunks, so far-away runways cost nothing.

**Modular runway pieces** (Threshold, Touchdown Zone, Straight, Junction): their edge lamps are now **always lit**, from a redstone block set into the foundation under each lamp.

## Super-Heavy Hangar: suspended ceiling lights are back
- **Fixtures:** 25 high-bay pendants (5 × 5 grid), each a 3 × 3 glowing lamp head in a dark housing under a cap, hung on chains from the roof trusses.
- **Clearance:** they hang at least 2 blocks above the top of the door opening, so nothing reaches into the aircraft area. The envelope check still passes.

## Validation (test harness, not in-game)
- New `rwlightcheck` (all 3 runways, 2 rotations):
  - every lamp has its support block under it (30 / 48 / 72 lamp pairs);
  - the wave starts at the near threshold and runs in order;
  - at most 3 pairs are lit at once;
  - nothing is left lit after a cycle.
- Super-Heavy Hangar: the envelope is clear, no stuck-on lights, 0 dark spots and every area reachable.
- Full suite: 70 × 4 rotations with 0 failures. Sections, slices, hologram, snap and load-simulation checks all PASS.
