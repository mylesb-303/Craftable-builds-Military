# Cavira Craftable Builds — v1.11.0 "Feedback Fixes"

Everything from Myles's iPad walkthrough (feedback list and 50 screenshots), except Navy, which is untouched until it has been tested.

## Engine fixes (affect many builds at once)
- **Missing windows.** The real cause: room "screen walls" (black frame, glass and sea lanterns) and wall-accent lights were set *into* the wall behind the room, which punched through outside windows. They now check the wall first. A window wall keeps its windows, and an outside wall gets the screen mounted inside instead of through it. Lights/screens showing on outside walls across all builds went from 682 cells to 272; what remains is deliberate exterior lighting.
  - This fixes the Base HQ, the HQ Admin Wing top floor, the Airfield Ops Building, the Medium and Large radars, the Radome and the dish stations.
  - It also improves the windows of the Naval HQ and Naval Operations Centre, because they share the same code. No Navy file was edited.
- **"Planning lighting 0%" freeze.** The planning passes now report real progress. A watchdog skips a pass after 4 minutes instead of letting it stall the build.
- **Red signal blocks → glowing redstone blocks.** Every aircraft-warning light on masts, dish feeds, radar arrays and the radome is now a redstone block with a hidden light above it, so it glows at night. The Naval HQ mast keeps its old beacon.
- **2-wide stairs everywhere touched.** The stair helpers have a width option. Multi-storey buildings have a 2-wide switchback stairwell with full-width landings.
- **Fences join up.** Plinth railings are 4-connected rings, and stair handrails are two posts high so each one joins the next.

## Removed (as requested)
- **Builds:** HQ Command Rotunda, Ceremonial Fountain Plaza, Army Command Bunker, Defensive Checkpoint, Air Traffic Control Tower, Logistics & Armory Hall.
- **Bunkers:** all 4 are paused for a redesign. Their code is kept.
- **Tabs:** Modular and Bunkers.

## Core
- **Main Security Gate:**
  - The ladder is now on a solid wall; the sea lantern it couldn't attach to is gone.
  - The overwatch parapet is continuous, so nothing to fall through.
- **Base HQ:** the portico is one storey tall, so its pediment no longer hides the two middle first-floor windows. 2-wide stairs.
- **HQ Admin Wing:** windows restored (engine fix). 2-wide stairs.

## Army
- **Barracks:**
  - Bunks are evenly spaced (2-block gaps) along the back and front walls, with a footlocker at each foot and lockers on the end walls.
  - The middle of each dorm and a 2-wide corridor are clear.
  - Partition walls between rooms; 2-wide stairs inside and on the fire escape.
- **Officers' Quarters:** the veranda lanterns hang from the roof, so they no longer drop as items. 2-wide stairs.
- **Armoury:** free-standing hardened magazine with no grass mound. Concrete pilasters, ribbed blast roof, signal mast with a glowing warning light.
- **Vehicle Depot:**
  - The whole front is open (x 3–39).
  - The columns sit exactly on the yellow bay lines.
  - No lamp posts or bollards in front of the bays.
  - The hall is taller, giving the overview deck full headroom.
  - 2-wide stairs; the fuel island has moved off to the side.
- **Heavy Vehicle Hangar:** the wash bay is a flat floor (no trapdoors).
- **Medical Facility:**
  - New ward layout: beds head-to-wall along the back and front with cabinets and curtains between them.
  - The nurses' station and supplies are on the side walls.
  - The middle of the ward and the entry corridor are clear.
  - Reception on the ground floor; partitions; 2-wide stairs.
- **Perimeter Wall Section (rebuilt):**
  - 4 thick with a hidden obsidian core.
  - 3-wide walkway on top behind a crenellated parapet with floodlights.
  - 2-wide steps up from the inside.
  - Snaps end to end.
- **Perimeter Corner Watch Tower (new):** turns the wall 90°, with a right turn or a left turn snap. 2-wide stairs to the walkway and the lookout roof, searchlights and a warning light.

## Air Force
- **Super Hangar:**
  - The control-room stair and gallery stairs keep their top steps (that was the "missing stair blocks"), and both are 2 wide.
  - The side galleries are 2-wide walkways, with furniture moved behind them.
  - Two more rows of hanging pendant lights over the back of the hangar light the back wall from the ceiling.
  - Solid centreline.
- **Heavy Aircraft Hangar:** the back middle ground-floor room is an operations room with a full wall of item frames for maps. Solid centreline.
- **Hardened Fighter Shelter:**
  - 8 blocks longer.
  - The arch runs solid down to the ground on both sides (no missing base line).
  - The floor trapdoor is replaced with flat floor.
  - Solid lit centreline.
- **Two-Shelter Fighter Row (renamed):** the same shelter fixes, and a concrete roof instead of grass.
- **Helicopter Hangar:** much bigger. 55-wide × 10-tall door and 44 m of clear depth for two Chinooks side by side, plus 2-wide stairs.
- **Airfield Operations Building:** back windows restored (engine fix). 2-wide stairs.

## Runways & airfield
- **Holding points:** the standing sign boards that clipped wings are gone from the modular Holding Point and the full runways. Flat painted signs replace them.
- **Full runways:**
  - Rapid exits are smooth S-curves; the pavement follows the curve too.
  - Entry connectors turn onto the parallel taxiway on smooth quarter-circles.
  - The apron link leaves on two smooth curves (both ways).
  - Holding-bay lead-ins are smooth curves.
- **New parking aprons:** stands on both sides of a lit central taxilane, curved lead-ins, and a front cross lane with curved links both ways. Each size comes with an **extension piece** (open joining end) that snaps on to grow it.
  - **Fighter:** 8 stands; replaces the old 3-stand apron.
  - **Transport:** 4 stands (C-130, KC-135, A400M, B-1B, KC-46).
  - **Heavy / Bomber:** 4 stands (C-5M, C-17, B-52H, B-2).
- **Four-Pad Heliport:** four Chinook-sized pads around a lit taxi cross.

## Strategic
- **Medium Radar:** the central tower has fully barred faces. Back windows restored.
- **Large Early-Warning Radar:** back windows restored. The pyramid stairs run all the way onto the turntable.
- **Radome:**
  - The dome shell is watertight, and the radar sits fully inside it.
  - The indoor stairs keep their top step and are 2 wide.
- **Dish Stations (Small / Medium / Large):** steps up onto the turntable at the top. Windows restored.
- **Standalone Small Dish:** the ladder hangs on a solid column and reaches the platform.
- **Standalone Large Dish:** the railings are joined fences.
- **All warning lights:** glowing redstone blocks.

## Validation (static and automated, mock runtime; not in-game)
- **Build test:** 68 structures × 4 rotations, 0 failures.
- **Pass:** ENVELOPE (6 hangars), LIGHTFIX, SLICE (worst 11.8 ms), HOLO/DRAW, RWLIGHTS, MAPROOM, SNAP, SECTIONS, RESUME, chunk tiles, direction mapping.
- **New WALL check:** 4 right turns close a perfect square in all 4 facings, and 4 left turns also close. Outer faces point outward. The walkway is continuous and 3 wide through every tower, and no obsidian is exposed.
- **Access/light pass:** every build is fully reachable with no dark floor left.
