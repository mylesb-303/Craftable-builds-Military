# Cavira Craftable Builds — v1.10.0 "Operations Map Room"

## New build: Operations Map Room (Core Base & HQ)
A 31 × 25 briefing and planning building.

### The relief map table (21 × 9)
- **Live terrain:** when you build the room, it scans the land around it and lays out a raised miniature of it on the table. Each table square is 6 × 6 blocks, so the table covers about 126 × 54 blocks centred on the room.
- **Surfaces** are classed from the top block the scan finds:
  - water (blue);
  - beach (sand);
  - grassland;
  - forest (dark green, with moss tufts);
  - rock (stone);
  - snow;
  - bare soil;
  - anything man-made (light grey).
- **Relief:** hills rise above the table in steps, one step for every 8 blocks of height, up to three steps.
- **Orientation and "you are here":** the map lines up with the room, so the far edge of the table is the land beyond the room's back wall, and a north-arrow rod marks that edge. A red candle cluster marks the room's own position.
- **Fallback planning map:** where land isn't loaded when you build, that part of the table shows the designed planning map (coast, river, mountain ridge, forests, roads, town and an airbase). If less than a quarter of the area could be scanned, the whole table shows the planning map, with blue and red unit markers, and you get a chat message saying so.

### The rest of the room
- **Wall chart:** a framed strategic chart of an invented coastline on the north wall, behind a raised briefing dais and lectern.
- **Plotting boards:** framed boards with red and blue markers on both side walls, with counters, chart chests and radio sets beneath them.
- **Front block:**
  - an entrance vestibule with double doors and a lit canopy;
  - a radio and comms room;
  - a map archive with chart drawers, bookcases and a reading desk with a lectern.
- **Building:** stools at both ends of the table, a clerestory window band, recessed ceiling lights on a 4-block grid, a blue and white sign band, a flagpole and planters.

## Also
- Renamed "Three-Shelter Fighter Row" to **"Twin-Shelter Fighter Row"** (it has two shelters and a ready room).

## Validation (test harness, not in-game)
- New `maproomcheck`, run in 2 rotations:
  - **Fully loaded land:** all 189 table cells are filled from the scan, the test lake shows as water and the test hill shows as raised relief.
  - **Half the land loaded:** scanned cells are mixed with planning-map cells, with no gaps.
  - **No land loaded:** the full planning map is shown.
- Map room: 0 dark spots, every area reachable, no stuck-on lights.
- Full suite: 71 structures × 4 rotations with 0 failures.
- Envelope, lighting-fixture, slice, hologram, runway-light, sections and snap checks: all PASS.

## Known limitations
- The map is a snapshot of the land at the moment you build. Rebuild the room to refresh it.
- The scan only sees land that is loaded around you at the time.
- The hologram preview shows the planning map on the table, because the land is only scanned at the moment you build.
