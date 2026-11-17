# CAVIRA Craftable Builds — Military v1.7.0
## Lighting, access, previews and 17 redesigned buildings

Bedrock 26.40+ · `@minecraft/server` 2.9.0 · `@minecraft/server-ui` 2.1.0 · vanilla blocks only. Pack UUIDs and all structure IDs are unchanged.

## Every build: spawn-proof lighting
Hostile mobs in current Bedrock need **block light 0** to spawn. Before placement, every build is now run through a light simulation:
- **Indoors:** every walkable floor is lit to at least level 8, using **visible ceiling lights** where there's a ceiling within reach.
- **Outdoors:** surfaces such as runways, aprons and roofs get **invisible light blocks** (`light_block_15`, no collision) until every spawnable block reaches at least level 1.
- **Result:** across all 67 builds, the number of dark spawnable surfaces left after the pass is **0**.

## Every build: guaranteed access
Before placement, the build is walked like a player: stepping up 1, dropping up to 3, and climbing ladders and scaffolding.
- Any enclosed indoor floor it can't reach gets a 2-high doorway through a 1–2 block wall, or a ladder up from the floor below.
- Fixed in shared code:
  - **Ground holes:** clearing no longer digs below ground level, so round or partial footprints don't leave pits.
  - **Multi-storey stairs:** the stairs in multi-storey buildings are now switchbacks with clear landings. Before, wall lights blocked the flights.
  - **Floating roof equipment:** rooftop equipment on the radar and dish stations sat one block above the roof. It now sits on it.
  - **Extra stairs:** added to the dish plinths, the early-warning radar pyramid, the strategic-array plinth and the medium-station drum.
- **Result:** 62 of 67 builds are fully reachable. The other five have small service ledges on dish mounts and the radome ring left unreached.

## Previews before placing
- **Picture thumbnails:** every build shows a rendered image on its tablet button.
- **Try It Full Size:** the build is placed for real. Walk around it, then use the tablet to **Keep It**, **Remove It** (exact restore) or **Remove & Move It**, which puts you straight back into placement preview at the same spot.

## Super-Heavy Aircraft Hangar
- **Mezzanine:** a continuous walkway down both sides links the stairs to every upper bay. The upper bays had no access before.
- **Lighting:** high-bay pendant lamps hang on rods 15 blocks above the floor (clear of a B-52 fin), with a flush floor-light grid, lights under the walkway and a light band above the bays.
- **Doors:** personnel doors in both side walls.

## 17 buildings redesigned
| Build | New design |
|---|---|
| Army Barracks | 3 floors, gable roof, mess/office, 2 bunk floors, ablutions, external fire escape, canopy, flag |
| Officers' Quarters | brick, dark-oak gable roof, colonnaded veranda, officers' mess, private rooms, lawn |
| Army Armoury | earth-bermed hardened magazine, blast-door portal, guard booth, weapon racks |
| Army Vehicle Depot | sawtooth-roof hall, 3 vehicle doors, workshop, office + mezzanine, wash bay, fuel island |
| Army Medical Facility | white 2-floor hospital, wards + decon, red-cross roof helipad, ambulance canopy |
| Army Command Bunker | earth-bermed, command + comms rooms, blast door, sandbag chicane, camo-netted masts |
| Airfield Operations | briefing/office/command/comms, glazed stair end, met mast and windsock |
| Air Traffic Control Tower | base building + shaft with spiral stairs to a flared glazed cab, gallery, beacons |
| Naval Operations Centre | white and navy, map room, servers, command floor, radar mast, ensign |
| Sailors' Barracks | 3 floors, balconies with blue rails, mess + galley, prismarine roof |
| Dockyard Logistics Warehouse | gable warehouse, roller doors, loading dock, racking rows, gantry rail |
| Ship Maintenance Workshop | barrel-roof hall, 27-wide door, gantry crane, keel blocks, 2-level side galleries |
| Naval Ammunition Bunker | earth-covered igloo magazine, headwall, blast door, traverse walls |
| Harbour Control Tower | red/white round tower, spiral stairs, glazed cab, gallery, beacon |
| Naval Headquarters | 3 floors, classical portico, flagpoles, conference and command floors |
| HQ Administration Wing | 3 floors, glazed, colonnaded covered walkway |
| Logistics Hall | sawtooth hall, loading dock, supply racking, forklift |

The five Navy builds that used to reuse Army or Air Force code now have designs of their own.

## Validation
| Check | Result |
|---|---|
| 67 structures × 4 rotations: staged = direct, undo exact | Pass |
| Lighting: dark spawnable surfaces after pass | 0 on all 67 |
| Access: unreachable indoor floors | 0 on 62 / 67 (5 have minor service ledges) |
| Bunker floors reachable; stair/ladder facing; snap; chunk loading | Pass |
| In-game testing | **Awaiting your test** |

## Known limitations
- Invisible light blocks can't be broken in survival without a light block item. They have no collision.
- Some builds aren't redesigned yet: the guard post, main gate, HQ, rotunda, plaza, checkpoint, perimeter wall, the older hangars and shelters, the watch tower, waterfront modules and the fuel farm. They do get the new lighting and access passes. They're next on the list.
