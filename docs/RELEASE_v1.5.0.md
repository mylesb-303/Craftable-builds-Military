# CAVIRA Craftable Builds — Military v1.5.0
## Bunkers, Radars & Super-Heavy Hangar

Branch: `claude/audit-v1.4.1` (continues from v1.4.1)
Target: Minecraft Bedrock 26.40+, `@minecraft/server` 2.9.0, `@minecraft/server-ui` 2.1.0, vanilla blocks only.
Manifest UUIDs and all existing structure IDs are unchanged. One new ID: `super_heavy_aircraft_hangar`.

The full audit and roadmap are in the masterplan doc ("CAVIRA Craftable Builds — Military Base Masterplan").

## New and rebuilt

### Bunkers (rebuilt from your four reference cut-aways)
The v1.4 bunkers could not be entered. Each access shaft was a sealed obsidian box, with no doorway into the bunker and no ladder or stairs inside.

| Build | Size | Floors | Access |
|---|---|---|---|
| Small Nuclear Bunker | 39 × 28 × 23 | 1 | spiral stairs + ladder hatch |
| Medium Nuclear Bunker | 71 × 28 × 27 | 1 | stairs + scaffolding lift + ladder |
| Large Nuclear Bunker | 69 × 44 × 27 | 3 | twin stairwells + central lift + ladder |
| Strategic Operations Centre | 97 × 60 × 31 | 5 | twin stairwells + central lift + ladder; 2-storey command atrium |

- **Envelope:** an obsidian blast skin around a polished-deepslate structural core, with a central corridor on every floor and furnished rooms on both sides. There are 17 room types, including command, bunks, mess, medical, decon, generators, water, ventilation and servers.
- **Stairwells** rise exactly 8 blocks per turn, so each one lands on every floor.
- **Lift:** a scaffolding column. Jump to climb and sneak to descend. It works on touch, controller and keyboard.
- **Placement** uses excavation mode: only the bunker and its shafts are written, and the surrounding earth is left untouched.

### Radars and dishes (9 builds, rebuilt to match your images)
- **Dishes:** tilted parabolic reflectors with a dark rim, panel seams, a three-legged feed horn with a lit receiver, and yoke bearings.
- **Radars:** tilted phased-array faces with a frame, grid and beacons, mounted on turntable pedestals, lattice towers or a stepped pyramid.
- **Stations:** fenced or fortified compounds with furnished multi-storey ops buildings, internal stairs, roof decks and lamp posts.

### Super-Heavy Aircraft Hangar (new — Air Force)
- **Size:** 81 × 101 × 37, plus a 12-block apron. It clears a B-52 (56.4 m span, 48.5 m long, 12.4 m tall) and a B-2.
- **Shell:** elliptical arched roof with yellow trusses and crown skylights, and a 65 × 24 door opening with striped door-leaf pockets.
- **Interior:** 2-storey maintenance bays down both sides with railed mezzanines, plus workshop, raised glazed control room and storage at the rear.
- **Floor:** centreline, a bomber clearance box, parking chevrons, a tow tractor, a fuel bowser and loader trolleys.

### Engine v2
- **Grid compiler:** each build compiles into a palette-indexed grid at 2 bytes per block, so a 400k-block build stays well under 1 MB.
- **Fast box fills:** large areas are filled directly, without per-block objects.
- **Compact undo:** the snapshot uses the same grid format.
- **Unchanged from v1.4.1:** staged multi-tick placement, safe write order, unloaded-chunk abort, preview protection and crash recovery.

### Build kit (`kit.js`, `interiors.js`, `buildings.js`)
Rotation-aware stairs and ladders, three access-shaft types, dish, array and lattice geometry, 17 furnished room types, and ops-building, compound-wall and plinth components. The upcoming area rebuilds will reuse all of these.

## Validation performed

| Check | Result |
|---|---|
| JSON and manifests, `node --check` on all scripts | Pass |
| Harness: 64 structures × 4 rotations; staged = direct build, undo exact | Pass (0 failures) |
| Rotated stair, ladder and lift facing (16 combinations) | Pass |
| Walkability: every bunker floor reachable on foot from the surface | Pass for all 4 bunkers, in all rotations tested |
| Visual check: rendered isometrics and plans compared with your references | Done |
| In-game testing (Xbox / iPad / Windows / Realms) | **Not yet done — awaiting user testing** |

## Known limitations
- Block states for ladders and stairs follow the conventions already in this pack. If a block state is rejected in-game, the kit places the block's default form and logs a `[CAVIRA]` warning instead of failing the build.
- The hangar does not include a model bomber. Parking clearance is based on real-world dimensions.
- Large builds (the hangar and Strategic Centre) take several seconds. Their duration on real hardware has not been measured yet.
- Existing builds outside these three areas are unchanged. They are scheduled in the masterplan roadmap.
