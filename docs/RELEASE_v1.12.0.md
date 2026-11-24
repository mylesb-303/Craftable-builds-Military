# Cavira Craftable Builds (Military) — v1.12.0 "Airfield Expansion"

Eleven new builds, all new IDs. Existing IDs, UUIDs and builds are unchanged. Navy is untouched.

## Airfield tab
| Build | Size (x×z×y) | Snapping |
|---|---|---|
| Taxiway 90° Left Turn | 45×45×6 | Snaps onto any taxiway end; turns the opposite way to the existing 90° corner |
| Taxiway Straight (Long ×3) | 25×96×6 | Three standard straights in one; snaps end to end |
| Taxiway T-Junction | 69×45×6 | Enter from the stem; continue with **Right Exit** or **Left Exit** |
| Runway Arresting Gear | 55×32×6 | Snaps between runway sections like a straight |
| Runway End Overrun | 55×48×6 | Snaps onto the far end of a runway; ends the runway (no further snap) |
| ILS Localiser Array | 33×11×9 | Standalone; place beyond the far runway end, on the centreline |
| ILS Glideslope Mast | 11×11×20 | Standalone; place beside the touchdown zone |
| VOR/DME Beacon | 25×25×12 | Standalone |

## Air Force tab
| Build | Size | Notes |
|---|---|---|
| Bomb-Loading Revetments | 69×44×10 | Two 28-wide earth-filled blast-wall bays, weapons staging boxes, munitions trailers, wall floodlights |
| B-52 Tail Maintenance Dock | 41×32×22 | Tail-first dock, 23 × 15 tail door, work platforms either side of the fin with 2-wide stairs, rear workshop + stores |
| MQ-9 Drone Shelter & Control Station | 41×26×12 | Open-fronted shelter + GCS cabin with 4 operator seats, screen wall, satellite dish, mast |

All runway/taxiway pieces are flush with the surface (nothing for wingtips to hit) and use the same solid lit centrelines as the rest of the airfield set. The three aircraft buildings have aircraft clearance boxes checked to be empty.

## Engine/tooling
- Snap button only shows when the last piece actually has a forward connector (so the overrun does not offer a dead "Snap to End").
- New `snapcheck2.mjs` (56 checks) added to CI; `test.mjs` `ONLY=` accepts a comma list.
