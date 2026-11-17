# Cavira Craftable Builds — v1.7.1 "Full Runways"

## New: three complete runways (Runways & Taxiways menu)

Each runway goes down in one placement. Every runway includes:
- Blast pads with yellow chevrons and approach lights at both ends.
- Green threshold light bars and piano keys.
- Reciprocal runway numbers at the two ends. You type the number for the end nearest you and the far end is worked out for you: 09 → 27, 27L → 09R, 36C → 18C.
- Touchdown-zone bars, aiming-point blocks and PAPI lights.
- A lit centreline and edge lamps.
- A full-length parallel taxiway.
- Taxi-on: entry connectors at both runway ends, each with a holding point (dashed and solid hold lines, a red stop bar and red mandatory signs).
- Taxi-off: one rapid-exit taxiway for each landing direction, with green lead-off lights that start on the runway centreline.
- Holding bays beside both runway ends, so aircraft can wait without blocking the taxiway.
- An apron link stub on the east side. Taxiway, Corner and Apron modules snap onto it.
- Windsocks beside both thresholds.

The sizes come from the Cavira Airforce add-on's own aircraft models (1 block = 1 m):

| Runway | Paved width | Length (incl. blast pads) | Footprint | Taxiway separation | Built for |
|---|---|---|---|---|---|
| Fighter (Short) | 31 + 4 m shoulders | 289 | 111 × 289 | 45 | F-22, F-35A, F/A-18, Typhoon, F-15E, A-10, MQ-9, helicopters (largest span ≈ 17) |
| Tactical & Transport (Medium) | 45 + 5 m shoulders | 449 | 140 × 449 | 60 | Adds KC-135, C-130J, AC-130J, A400M, B-1B (span ≤ 42). Same cross-section as the modular runway pieces, so you can extend it. |
| Strategic Heavy (Long) | 61 + 7 m shoulders | 641 | 179 × 641 | 85 | Every aircraft, including the C-5M (span 66.5), B-52H, C-17 and B-2 |

The taxiway separation keeps the wingtips of an aircraft on the taxiway clear of an aircraft on the runway. Lights and markings are flush with the surface, so no blocks stand in the way of wings.

## Engine
- Big sites are now loaded with several temporary ticking areas. Bedrock limits one ticking area to 100 chunks, so the site is split into tiles:
  - Short runway: up to 2 areas.
  - Medium runway: up to 3 areas.
  - Long runway: up to 6 areas.
- The pool of temporary ticking areas grew from 6 to 8. Leftover areas are still removed on world load.
- The designator prompt explains that the far end gets the reciprocal number.

## Validation (harness, not in-game)
- 70 structures × 4 rotations: staged build matches the reference and undo restores exactly (failures = 0).
- Full runways: 0 dark spawnable cells after the light pass and 0 unreachable areas.
- Snap check: each full runway's apron link sits exactly 1 block from a snapped Taxiway Straight in all 4 rotations.
- Multi-tile ticking-area check: the 641 × 179 site uses 6 areas, each ≤ 100 chunks, and all 6 are removed afterwards.
- Bunker floors check: OK.

## Known limitations
- The Long runway is the largest job in the pack: about 205k block writes including the undo capture. Expect roughly 20–40 s to build on console or tablet.
- The Long runway needs 6 free ticking areas. Bedrock allows 10 per world, so it fails if the world already has more than 4 of its own.
- None of this has been tested in-game yet.
