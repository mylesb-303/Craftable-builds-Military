# CAVIRA Craftable Builds — Military v1.6.0
## Airfield rebuild, dish restyle, large-build chunk loading

Branch `claude/audit-v1.4.1` · Bedrock 26.40+ · `@minecraft/server` 2.9.0 · `@minecraft/server-ui` 2.1.0 · vanilla blocks only.
Pack UUIDs and existing IDs are unchanged. New IDs: `runway_touchdown_zone`, `runway_taxiway_junction`, `taxiway_holding_point`.

## Fixes
- **Super-Heavy Hangar (and other huge builds) refused with "unloaded chunk".** The hangar is 113 blocks deep, so its far end was outside the chunks your iPad keeps loaded. The tablet now adds a temporary ticking area over the build site while you preview, build and undo, waits for it to load, then removes it.
  - It uses a fixed pool of names (`cavira_build_0`–`cavira_build_5`).
  - Leftovers from a crash are removed when the world next loads.
  - Ticking areas you made yourself are never touched.

## Runways & Taxiways (new tablet category)
Rebuilt to match the style of your own airbase:
- **Surface:** dark speckled asphalt (black + grey concrete).
- **Edges:** lighter shoulders, white edge lines and flush edge lamps.
- **Centreline:** white dashes with embedded sea-lantern lights.

| Module | Size | Notes |
|---|---|---|
| Runway Threshold & Designator | 55 × 112 | blast pad with yellow chevrons + approach lights, green threshold bar, piano keys, **your runway number** (form asks, e.g. `38R`) |
| Runway Touchdown Zone | 55 × 64 | 3-bar / 2-bar touchdown markings and aiming-point blocks |
| Runway Straight | 55 × 64 | tileable runway section |
| Runway / Taxiway Junction | 87 × 64 | taxiway exit with widened fillet, Y-shaped lead-off lines, holding point, sign |
| Taxiway Straight | 25 × 32 | lit yellow centreline |
| Taxiway Holding Point | 25 × 32 | holding markings, red stop bar, sign |
| Taxiway Curve (90°) | 45 × 45 | smooth arc |
| Aircraft Parking Apron | 81 × 72 | 3 stands, curved lead-ins, stop bars, fishbone guides, floodlights |
| Four-Pad Helicopter Apron | unchanged | moved into this category |

**Snap-together placement.** After you build a piece, the preview menu offers:
- **Snap to End of …**, which lines the new piece up exactly with the last one.
- **Snap to Taxiway Exit of …**, for pieces built after a junction.

Snapping always turns the new piece the right way round:
- A threshold snapped onto the far end of a runway faces away, ready for a second runway number.
- A straight snapped after a curve follows the turn.

## Satellite dishes restyled (to match your references)
- **Reflectors:** white panelled surfaces on charcoal frames, with yellow clamp brackets around the rims.
- **Feed horns:** three charcoal struts with yellow joints, and a glowing cyan receiver.
- **Mounts:** charcoal yoke columns with a cyan light strip, yellow-banded bearings and cable pipes.
- **Rails and lights:** yellow handrails (bamboo fence) on stairs, platforms and roof decks, plus cyan corner lamps on yellow bases.
- **Large dish:** a light rim with amber lights, as in your image.

## Validation performed
| Check | Result |
|---|---|
| JSON and manifests, `node --check` on all scripts | Pass |
| 67 structures × 4 rotations: staged = direct build, undo exact | Pass (0 failures) |
| Snap maths (16 cases: straight, far-end threshold, curve turn, junction branch, all rotations) | Pass |
| Temporary chunk loading (unloaded site → area added, loads, released; no command when already loaded) | Pass (mocked) |
| Stair, ladder and lift facing; bunker floors reachable | Pass |
| In-game testing | **Awaiting your test** |

## Known limitations
- Ticking areas are limited by Minecraft to about 100 chunks each. Every current build fits.
- Taxiway curves turn one way. For the other direction, enter the curve from its other end; snapping handles this.
- The redstone-block stop bar can power redstone placed right next to it.
- Your existing hand-built runways are untouched. These modules are for new sections.
