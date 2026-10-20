# CAVIRA Craftable Builds v1.4.0 — Correction Test Checklist

Test on a copy of the world. Remove older Craftable Builds packs first, import v1.4.0, activate both packs, and enable the required creator/script experiments used by the previous working versions.

For every build, test: menu entry, preview outline, reposition, left/right rotation, construction, camouflage finish, interior access, lighting, and session undo.

## Core Base & HQ

- [ ] Guard Post — `8 × 8 × 9`
- [ ] Main Security Gate — `25 × 9 × 10`
- [ ] Base Headquarters — `21 × 17 × 11`
- [ ] HQ Administration Wing — `27 × 17 × 11`
- [ ] HQ Command Rotunda — `25 × 25 × 14`
- [ ] Ceremonial Fountain Plaza — `31 × 31 × 6`

## Army

- [ ] Army Barracks — `23 × 41 × 9`
- [ ] Officers' Quarters — `19 × 25 × 10`
- [ ] Army Armoury — `21 × 17 × 10`
- [ ] Multi-Bay Vehicle Depot — `29 × 23 × 12`
- [ ] Heavy Vehicle Maintenance Hangar — `35 × 27 × 15`
- [ ] Army Medical Facility — `23 × 19 × 10`
- [ ] Army Command Bunker — `21 × 17 × 8`
- [ ] Defensive Checkpoint — `19 × 13 × 9`
- [ ] Perimeter Wall Module — `21 × 5 × 8`

## Air Force

- [ ] Heavy Aircraft Hangar — `31 × 25 × 18`
- [ ] Hardened Fighter Shelter — `21 × 25 × 12`
- [ ] Three-Shelter Fighter Row — `49 × 25 × 12`
- [ ] Helicopter Hangar — `41 × 27 × 14`
- [ ] Airfield Operations Building — `25 × 19 × 10`
- [ ] Air Traffic Control Tower — `13 × 13 × 24`
- [ ] Airbase Watch Tower — `23 × 23 × 64`

## Navy

- [ ] Naval Headquarters — `27 × 21 × 12`
- [ ] Naval Operations Centre — `25 × 19 × 10`
- [ ] Harbour Control Tower — `15 × 15 × 26`
- [ ] Sailors' Barracks — `23 × 41 × 9`
- [ ] Dockyard Logistics Warehouse — `31 × 25 × 12`
- [ ] Ship Maintenance Workshop — `35 × 27 × 15`
- [ ] Pier Straight — `15 × 31 × 7`
- [ ] Pier Corner — `21 × 21 × 7`
- [ ] Pier T-Junction — `31 × 21 × 7`
- [ ] Heavy Ship Berth — `21 × 41 × 8`
- [ ] Submarine Service Berth — `31 × 41 × 8`
- [ ] Naval Fueling Pier — `17 × 31 × 9`
- [ ] Dry-Dock Side Module — `11 × 41 × 12`
- [ ] Dry-Dock Gate & End — `31 × 13 × 12`
- [ ] Nuclear Submarine Pen — `39 × 45 × 24`
- [ ] Dockside Loading Crane — `15 × 17 × 26`
- [ ] Naval Ammunition Bunker — `21 × 17 × 10`
- [ ] Coastal Defence Bunker — `25 × 19 × 10`
- [ ] Seawall Module — `21 × 7 × 9`

### Waterfront checks

- [ ] Cyan preview grid exactly matches the finished deck/walkway height
- [ ] Submarine fits through the 19-block clear Service Berth channel
- [ ] Submarine fits through the 23-block clear Nuclear Submarine Pen channel
- [ ] Pier and berth decks appear above the selected water surface
- [ ] Supports extend below the waterline without emptying the surrounding water
- [ ] Ship and submarine channels remain filled with water after construction
- [ ] Dry-dock modules connect cleanly when rotated and repeated
- [ ] Straight, corner and T-junction pier modules align at matching deck height
- [ ] Undo restores every original water and terrain block

## Bunkers

- [ ] Small Nuclear Bunker — `23 × 19 × 20`, main level approximately 7 blocks underground
- [ ] Medium Nuclear Bunker — `31 × 25 × 25`, main level approximately 9 blocks underground
- [ ] Large Nuclear Bunker — `41 × 33 × 31`, two operational levels approximately 9 blocks underground
- [ ] Strategic Underground Operations Centre — `51 × 41 × 37`, three operational levels approximately 9 blocks underground

### Underground checks

- [ ] Surface entrance appears at the selected ground level
- [ ] Main bunker remains fully underground with natural terrain above it
- [ ] Obsidian continuously surrounds the underground roof, walls and lowest floor
- [ ] Reinforced inner shell is visible inside the obsidian frame
- [ ] Main access shaft reaches every operational level
- [ ] Independent emergency escape shaft reaches the surface
- [ ] Rooms, corridors and blast-door openings are fully excavated
- [ ] No unintended giant empty cavity is created around the bunker
- [ ] Undo restores all excavated terrain and surface blocks
- [ ] Strategic Centre completes without freezing or closing Minecraft on iPad

## Strategic / Joint

- [ ] Small Tactical Radar Post — `19 × 19 × 20`
- [ ] Medium Radar Station — `31 × 27 × 27`
- [ ] Large Early-Warning Radar Complex — `45 × 39 × 38`
- [ ] Radar & Radome Facility — `33 × 33 × 22`
- [ ] Small Communications Dish Station — `17 × 17 × 20`
- [ ] Medium Satellite Dish Station — `29 × 29 × 30`
- [ ] Large Strategic Satellite Array — `45 × 45 × 44`
- [ ] Standalone Small Satellite Dish — `13 × 13 × 17`
- [ ] Standalone Medium Satellite Dish — `21 × 21 × 23`
- [ ] Standalone Large Satellite Dish — `31 × 31 × 33`

### Radar and satellite checks

- [ ] Every radar and satellite bowl is circular, elevated and visibly open toward the sky
- [ ] Radar panels, dish bowls, feed arms and pedestals construct without missing blocks
- [ ] Operations stations remain accessible and fully furnished
- [ ] Standalone dishes have complete foundations and unobstructed maintenance areas
- [ ] The Large Early-Warning Radar Complex completes without freezing or closing Minecraft on iPad
- [ ] The Large Strategic Satellite Array completes without freezing or closing Minecraft on iPad

## Logistics & Support

- [ ] Logistics & Armory Hall — `31 × 25 × 12`
- [ ] Airbase Fuel Tank Farm — `29 × 23 × 14`

## Modular Base

- [ ] Runway Threshold — `21 × 21 × 3`
- [ ] Runway Straight — `21 × 41 × 3`
- [ ] Taxiway Straight — `13 × 31 × 3`
- [ ] Taxiway Corner — `21 × 21 × 3`
- [ ] Aircraft Parking Apron — `31 × 31 × 3`
- [ ] Four-Pad Helicopter Apron — `41 × 41 × 3`

## Aircraft clearance checks

- [ ] F-22 enters, parks and exits the Hardened Fighter Shelter
- [ ] F-22 enters each bay of the Three-Shelter Fighter Row
- [ ] F-22 and B-2 enter, turn and park inside the Heavy Aircraft Hangar
- [ ] Helicopter has safe rotor clearance inside each Helicopter Hangar bay
- [ ] Aircraft can follow hangar/apron guide lines without clipping the structure

## Performance and safety checks

- [ ] Cyan floor/deck preview appears on ordinary buildings, pathways, walls and waterfront modules
- [ ] Finished walkable surface appears at the cyan preview height in every rotation
- [ ] No isolated glass-pane computer screens or glass-pane barriers remain
- [ ] Walk-in properties have accessible rooms, solid computer furnishings, stair seating and working ceiling lights
- [ ] Naval Headquarters has a furnished command room, administration area, storage and lighting
- [ ] Construction completes without content-log warnings
- [ ] No visible half-built structure after construction
- [ ] Preview cancellation restores every marked block
- [ ] Undo restores terrain and previous blocks
- [ ] Largest builds do not freeze or close Minecraft on iPad
- [ ] Pack works after leaving and reopening the world
- [ ] Tablet icon and every category remain visible
- [ ] Navy category contains all 19 builds in the order shown above
- [ ] Bunkers category contains all four underground builds in size order
- [ ] Strategic / Joint category contains all ten builds in the order shown above

## Feedback format

Copy this for each problem:

```text
Build:
Device: iPad / Xbox
Finish selected:
Rotation:
What worked:
What needs changing:
Any alert or content-log text:
Screenshot/video attached: Yes / No
```
