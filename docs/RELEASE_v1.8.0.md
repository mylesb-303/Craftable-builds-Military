# Cavira Craftable Builds — v1.8.0 "Full Redesign"

Every build in the pack has now been redesigned or rebuilt. This release covers the last 28 original designs, real furniture everywhere, built-in lighting and fully clear hangars.

## Real furniture (all interiors)
- **Beds are real Minecraft beds.** Barracks have real bunk beds with a timber frame, footlocker chests and barrel lockers. Officers' rooms have beds with rugs, bedside cabinets, lamps and desks. Medical bays have beds with glass privacy screens.
- **Tables, desks and counters** are upper-half slabs instead of solid blocks. This covers mess tables, conference tables, office desks, kitchen worktops, lab benches and workbenches.
- **Kitchens and workshops** use correctly facing smokers, furnaces, blast furnaces, barrels and looms.

## Built-in lighting (all builds)
- **New fixture pass.** After a build is generated, any light that hangs off a wall or ceiling, or floats in mid-air, is moved into the wall or ceiling it is mounted on. If there is nothing to set it into, it is replaced with an invisible light block, so the area stays lit.
  - In testing this fixed 934 "stuck-on" lights across 70 builds; a new check now finds 0.
- **Automatic darkness lighting** only recesses lights into a real ceiling surface, never into a lone block such as a shelf.
- **Super-Heavy Hangar:**
  - The door floodlights are built into the header beam's soffit instead of hanging in the opening.
  - The high-bay lights are built into the roof trusses.
  - There is a continuous light band in the side walls, a lit fascia along the bay fronts and a flush floor grid.

## Hangars are completely clear
- **Super-Heavy Hangar:**
  - The side bays are shallower and the mezzanine walkway now runs inside the bays, giving a **61-block-wide** clear floor (it was 57, with posts and decks in the way).
  - Equipment is parked in a marked zone behind the aircraft.
  - Floating pendant lights have been removed.
- **Every hangar now declares an aircraft envelope** that must contain nothing but air:
  - Super-Heavy Hangar: 61 × 23.
  - Large Aircraft Hangar: 45 × 16.
  - Helicopter Hangar: 37 × 8.
  - Hardened shelters: wing box and fin box.
  - Heavy vehicle hangar: three 7 × 7 lanes.
- A new `envelopecheck` test fails CI if any block ever appears inside an envelope.

## The 28 original builds, redesigned
**Core**
- **Guard Post:** hardened sentry booth with all-round ballistic glazing, a transaction window, console, CCTV and a canopy with lights in the soffit.
- **Main Security Gate:** a two-lane entry control point.
  - Gatehouse island with ID windows facing both lanes.
  - Wedge barriers, speed tables, a lit canopy and a sign band.
  - Rooftop overwatch reached by a ladder, and a pedestrian turnstile.
- **Base Headquarters:** two storeys with a columned portico, lobby, offices, conference room, command suite and three flagpoles.
- **HQ Command Rotunda:** domed situation room with a lit plot table, a ring of consoles, a screen wall and ring offices.
- **Ceremonial Fountain Plaza:** working tiered fountain with underwater lights, a flag circle, benches, lit bollards, hedged gardens and a memorial.

**Army**
- **Defensive Checkpoint:** serpentine chicane, covered search bay, boom barrier, two sandbag sangars with bunks and radios, and wire.
- **Perimeter Wall:** precast T-wall section with a patrol step, buttress fins, razor wire, floodlights in the coping and CCTV.
- **Heavy Vehicle Maintenance Hangar:** three drive-through lanes, two inspection pits with lit walls, a wash bay, a gantry crane, tool benches and parts racks.

**Air Force**
- **Large Aircraft Hangar:** now a 51 × 62 clear-span transport hangar.
  - 45 wide × 16 tall door, sized for the C-130J, KC-135 and A400M.
  - Rear workshops and a glazed mezzanine.
- **Watch Tower:** spiral stair inside a concrete shaft up to a 360° glazed cab with consoles, a balcony, beacon and a guard-room base.
- **Helicopter Apron:** a single heliport with a 23 × 23 touchdown pad and "H", FATO markings, green perimeter lights, windsock and refuelling point.
- **Helicopter Hangar:** 37-wide door (Chinook, Apache, Osprey), workshop, avionics and crew rooms, and a mezzanine store.
- **Hardened Fighter Shelter:** TAB-VEE-style steel-lined arch for one fighter up to A-10 span, with lights built into the liner and an exhaust port.
- **Fighter Shelter Row:** two shelters with an earth-covered ready room between them.
- **Radar Radome Facility:** geodesic radome on a two-storey equipment building with generator, comms, processing and operations rooms.
- **Fuel Tank Farm:** two bunded tanks, pipe rack, pump house, covered truck fill stand and fire monitor.

**Navy** (footprints, deck levels and channels are unchanged so existing layouts still join)
- **Pier Straight, Corner and T-Junction:**
  - Timber fender piles and rubber fenders on the berthing faces.
  - Bollards and bitts.
  - A flush utility trench and shore-power pedestals.
  - Crane rails and flush deck lights.
- **Heavy Ship Berth:** camels, a brow tower with gangway and a head-pier crane rail.
- **Submarine Service Berth:** low camels, shore-power trays, a security boom and a guard booth.
- **Naval Fuelling Pier:** pipe rack, manifold platforms with loading arms and hose reels, fire monitors and a spill kit.
- **Dry Dock Side:** stepped altars, keel blocks, ladders, bollards and lights in each riser.
- **Dry Dock Gate End:** caisson gate with a walkway and pump house.
- **Nuclear Submarine Pen:** reinforced pen with a burster-slab roof and built-in lights, a travelling crane, workshops and blast-door pockets.
- **Dockside Loading Crane:** rail-mounted portal crane with a cab, jib, hook, counterweight and ladder.
- **Coastal Defence Bunker:** earth-covered casemate with two gun embrasures, an observation slit, magazine and crew room.
- **Seawall Module:** wave-return lip, promenade, railings, built-in lights, benches and a ladder to the water.

## Validation (test harness, not in-game)
- 70 structures × 4 rotations: 0 failures (exact undo).
- 0 dark spawnable cells on every land build. The same 5 small service ledges as in v1.7 remain unreachable on foot; all 28 redesigned builds reach every area.
- ENVELOPE PASS (6 hangars).
- LIGHTFIX PASS (0 protruding lights).
- SLICE PASS: worst 12.9 ms between pauses.
- Sections, load-simulation, resume, snap, chunk-tiling, direction and bunker-floor checks: all PASS.
- 70 menu thumbnails regenerated.

## Known limitations
- Bed colour cannot be set by script, so beds use Minecraft's default colour.
- The new Air Force hangars are bigger than the versions they replace (Large Aircraft Hangar 51 × 62, Helicopter Hangar 41 × 41, shelters 25 × 27).
- Nothing in this release has been tested in-game yet.
