import { kit, spiralStairwell, liftShaft, ladderShaft, accessHut, latticeMast } from "../kit.js";
import { furnishRoom } from "../interiors.js";

// ---------------------------------------------------------------------------
// CAVIRA Deep Bunkers v2 (v1.5.0) — rebuilt from the reference cut-aways.
//
// Every bunker is generated from a layout spec:
//   * obsidian blast envelope + polished-deepslate structural layer
//   * one or more floors, 8 blocks apart, each with a central corridor and
//     furnished rooms on both sides
//   * WORKING access (the v1.4 bunkers had sealed shafts):
//       - main spiral stairwell to a surface entrance (rises 8/rev, so it
//         lands exactly on every floor)
//       - optional second stairwell, scaffolding lift and ladder escape shaft
//   * optional two-storey command atrium with balcony (strategic centre)
//
// Placement: excavation mode — only the bunker and its shafts are written;
// the surrounding earth is left untouched.
// ---------------------------------------------------------------------------

const FLOOR_SPACING = 8;
const ROOM_H = 6; // air rows; ceiling at walk + 6
const W0 = 3; // walk level of the lowest floor (obsidian at y = 0)

function rowWidth(row) {
  return row.reduce((s, r) => s + r[0], 0) + row.length - 1;
}

function normaliseRows(floors) {
  const iw = Math.max(...floors.flatMap((f) => [rowWidth(f.north), rowWidth(f.south)]));
  for (const f of floors) {
    for (const row of [f.north, f.south]) {
      const diff = iw - rowWidth(row);
      if (diff > 0) {
        // widen the last non-lift room
        for (let i = row.length - 1; i >= 0; i--) if (row[i][1] !== "lift") { row[i] = [row[i][0] + diff, row[i][1]]; break; }
      }
    }
  }
  return iw;
}

/** Derives full geometry for a spec (also used by the registry for sizes). */
export function bunkerGeometry(spec) {
  const floors = spec.floors.map((f) => ({ north: f.north.map((r) => [...r]), south: f.south.map((r) => [...r]) }));
  const IW = normaliseRows(floors);
  const IX1 = 7;
  const IX2 = IX1 + IW - 1;
  const IZ1 = 2;
  const Dn = spec.Dn;
  const Ds = spec.Ds;
  const corridorZ1 = IZ1 + Dn + 1;
  const IZ2 = corridorZ1 + 3 + Ds;
  const eastStairs = !!spec.eastStairs;
  const SX = eastStairs ? IX2 + 8 : IX2 + 6;
  const SZ = IZ2 + 3;
  const n = floors.length;
  const Wt = W0 + FLOOR_SPACING * (n - 1);
  const surfaceWalk = Wt + FLOOR_SPACING * (spec.cover ?? 2);
  const SY = surfaceWalk + 9;
  return { floors, IW, IX1, IX2, IZ1, IZ2, Dn, Ds, corridorZ1, SX, SZ, SY, n, Wt, surfaceWalk, eastStairs };
}

export function bunkerSize(spec) {
  const g = bunkerGeometry(spec);
  return { size: { x: g.SX, y: g.SY, z: g.SZ }, foundationDepth: g.surfaceWalk };
}

function buildBunker(dimension, origin, rotation, variantId, spec) {
  const g = bunkerGeometry(spec);
  const size = { x: g.SX, y: g.SY, z: g.SZ };
  const c = kit(dimension, origin, rotation, size, variantId);
  const B = c.B;
  const top = g.Wt + 7; // structural ceiling of the top floor
  const cz = g.corridorZ1 + 1; // corridor centre line

  // 1) Blast envelope: obsidian skin, solid structural core.
  c.shell(0, 0, 0, g.SX - 1, top + 1, g.SZ - 1, B.obsidian);
  c.fill(1, 1, 1, g.SX - 2, top, g.SZ - 2, B.concrete);

  const liftCols = [];
  for (let k = 0; k < g.n; k++) {
    const walk = W0 + FLOOR_SPACING * k;
    const f = g.floors[k];

    // corridor
    c.clear(g.IX1, walk, g.corridorZ1, g.IX2, walk + ROOM_H - 2, g.corridorZ1 + 2);
    c.fill(g.IX1, walk - 1, g.corridorZ1, g.IX2, walk - 1, g.corridorZ1 + 2, B.andesite);
    for (let x = g.IX1; x <= g.IX2; x++) c.set(x, walk - 1, cz, x % 2 ? B.tile : B.blackstone);
    for (let x = g.IX1 + 2; x <= g.IX2; x += 5) c.set(x, walk + ROOM_H - 1, cz, B.sea);
    // corridor walls lined in light stone with dark pillars
    for (const zWall of [g.corridorZ1 - 1, g.corridorZ1 + 3]) {
      for (let x = g.IX1 - 1; x <= g.IX2 + 1; x++) for (let y = walk; y <= walk + ROOM_H - 2; y++) c.set(x, y, zWall, x % 6 === 0 ? B.tile : B.andesite);
    }

    // rooms
    for (const [rowName, row] of [["north", f.north], ["south", f.south]]) {
      let x = g.IX1;
      const z1 = rowName === "north" ? g.IZ1 : g.corridorZ1 + 4;
      const z2 = rowName === "north" ? g.corridorZ1 - 2 : g.IZ2;
      for (const [w, type] of row) {
        const x1 = x;
        const x2 = x + w - 1;
        x = x2 + 2;
        if (type === "lift") {
          liftCols.push({ x: x1 + 1, z: g.corridorZ1 - 2 });
          continue;
        }
        if (type === "solid") continue;
        const upper = type === "atrium_upper";
        c.clear(x1, walk, z1, x2, walk + ROOM_H - 1, z2);
        // light partition walls + dark corner pillars
        for (const px of [x1 - 1, x2 + 1]) for (let y = walk; y <= walk + ROOM_H - 1; y++) for (let z = z1; z <= z2; z++) c.set(px, y, z, B.andesite);
        for (const px of [x1 - 1, x2 + 1]) for (const pz of [z1 - 1, z2 + 1]) c.fill(px, walk - 1, pz, px, walk + ROOM_H, pz, B.tile);
        c.fill(x1, walk - 1, z1, x2, walk - 1, z2, B.smooth);
        // doorway to corridor (2 wide, 3 tall) with lit frame
        const dz = rowName === "north" ? g.corridorZ1 - 1 : g.corridorZ1 + 3;
        const doorX = Math.floor((x1 + x2) / 2);
        c.clear(doorX, walk, dz, doorX + 1, walk + 2, dz);
        c.fill(doorX - 1, walk, dz, doorX - 1, walk + 3, dz, B.tile);
        c.fill(doorX + 2, walk, dz, doorX + 2, walk + 3, dz, B.tile);
        c.fill(doorX, walk + 3, dz, doorX + 1, walk + 3, dz, B.tile);
        c.set(doorX - 1, walk + 2, dz, B.sea);
        if (upper) {
          // open the slab into the atrium below, leaving a 1-block balcony with rails
          c.clear(x1 + 1, walk - 2, z1 + 1, x2 - 1, walk - 1, z2 - 1);
          for (let xx = x1; xx <= x2; xx++) for (let zz = z1; zz <= z2; zz++) {
            const edge = xx === x1 || xx === x2 || zz === z1 || zz === z2;
            if (edge && !(zz === (rowName === "north" ? z2 : z1) && Math.abs(xx - doorX - 0.5) <= 1)) c.set(xx, walk, zz, B.bars);
          }
          // rail must not block the doorway landing
          c.clear(doorX, walk, rowName === "north" ? z2 : z1, doorX + 1, walk + 1, rowName === "north" ? z2 : z1);
          for (let xx = x1 + 2; xx < x2 - 1; xx += 4) c.set(xx, walk + ROOM_H, (z1 + z2) >> 1, B.sea);
          continue;
        }
        furnishRoom(c, {
          x1, z1, x2, z2, walk, h: ROOM_H, type,
          door: rowName === "north" ? "south" : "north",
          doorU: rowName === "north" ? doorX - x1 : x2 - doorX - 1
        });
      }
    }
  }

  // 2) Access systems.
  const exits = (side) => {
    const list = [];
    for (let k = 0; k < g.n; k++) list.push({ walk: W0 + FLOOR_SPACING * k, side });
    list.push({ walk: g.surfaceWalk, side });
    return list;
  };
  const westX0 = 2;
  const ringZ0 = cz;
  // Surface huts are built first so the shafts can cut through their floors.
  accessHut(c, { x: westX0 + 2, z: ringZ0 + 2, walk: g.surfaceWalk, radius: 4, height: 5, door: "east", doorWidth: 3, mast: true });
  spiralStairwell(c, { x0: westX0, z0: ringZ0, bottomWalk: W0, topWalk: g.surfaceWalk, corner: "ne", exits: exits("east"), openTop: true });

  if (g.eastStairs) {
    const x0 = g.IX2 + 2;
    accessHut(c, { x: x0 + 1, z: ringZ0 + 2, walk: g.surfaceWalk, radius: 4, height: 5, door: "west", doorWidth: 3, mast: true });
    spiralStairwell(c, { x0, z0: ringZ0, bottomWalk: W0, topWalk: g.surfaceWalk, corner: "nw", exits: exits("west"), openTop: true });
    // emergency ladder beside the south-east room, opening into it on every floor
    const lx = g.IX2 + 3;
    const lz = g.IZ2 - 1;
    ladderShaftWithHut(c, g, lx, lz, "east", "west");
    for (let k = 0; k < g.n; k++) {
      const walk = W0 + FLOOR_SPACING * k;
      c.clear(g.IX2 + 1, walk, lz, g.IX2 + 1, walk + 1, lz);
      c.set(g.IX2 + 1, walk - 1, lz, B.yellow);
    }
  } else {
    // ladder escape at the east end of the corridor
    const lx = g.IX2 + 2;
    ladderShaftWithHut(c, g, lx, cz, "east", "west");
  }

  for (const col of liftCols) {
    accessHut(c, { x: col.x, z: col.z, walk: g.surfaceWalk, radius: 2, height: 5, door: "south" });
    const lexits = [];
    for (let k = 0; k < g.n; k++) lexits.push({ walk: W0 + FLOOR_SPACING * k, side: "south" });
    lexits.push({ walk: g.surfaceWalk, side: "south" });
    liftShaft(c, { x: col.x, z: col.z, bottomWalk: W0, topWalk: g.surfaceWalk, exits: lexits });
    // corridor-side doorway through the corridor wall on every floor
    for (let k = 0; k < g.n; k++) {
      const walk = W0 + FLOOR_SPACING * k;
      c.clear(col.x, walk, g.corridorZ1 - 1, col.x, walk + 1, g.corridorZ1 - 1);
      c.set(col.x, walk - 1, g.corridorZ1 - 1, B.yellow);
    }
  }

  // 3) Surface details: ventilation stacks and an antenna mast.
  const vents = spec.vents ?? 2;
  for (let i = 0; i < vents; i++) {
    const vx = g.IX1 + Math.round(((i + 1) * g.IW) / (vents + 1));
    const vz = g.IZ2 - 1;
    c.fill(vx, top + 2, vz, vx, g.surfaceWalk + 3, vz, B.blackstoneBricks);
    c.set(vx, g.surfaceWalk + 4, vz, B.bars);
    c.set(vx, g.surfaceWalk + 3, vz - 1, B.bars);
    c.set(vx, g.surfaceWalk + 3, vz + 1, B.bars);
  }
  if (spec.mast) latticeMast(c, { x: g.IX1 + 2, z: g.IZ1, y1: g.surfaceWalk, y2: g.surfaceWalk + 7, width: 3 });
}

function ladderShaftWithHut(c, g, x, z, wallSide, exitSide) {
  const exits = [];
  for (let k = 0; k < g.n; k++) exits.push({ walk: W0 + FLOOR_SPACING * k, side: exitSide });
  exits.push({ walk: g.surfaceWalk, side: exitSide });
  accessHut(c, { x, z, walk: g.surfaceWalk, radius: 2, height: 4, door: exitSide === "north" ? "north" : exitSide });
  ladderShaft(c, { x, z, bottomWalk: W0, topWalk: g.surfaceWalk, wallSide, exits });
}

// ---------------------------------------------------------------------------
// Layout specs (rooms: [width, type])
// ---------------------------------------------------------------------------

export const BUNKER_SPECS = {
  small_nuclear_bunker: {
    Dn: 7, Ds: 7, cover: 2, vents: 1,
    floors: [
      { north: [[9, "command"], [7, "bunks"], [9, "supplies"]], south: [[9, "generator"], [7, "hvac"], [9, "storage"]] }
    ]
  },
  medium_nuclear_bunker: {
    Dn: 9, Ds: 9, cover: 2, vents: 2, mast: true,
    floors: [
      {
        north: [[13, "bunks"], [7, "armoury"], [13, "command"], [3, "lift"], [11, "medical"], [7, "decon"]],
        south: [[13, "mess"], [11, "generator"], [11, "water"], [9, "servers"], [11, "storage"]]
      }
    ]
  },
  large_nuclear_bunker: {
    Dn: 9, Ds: 9, cover: 2, eastStairs: true, vents: 3, mast: true,
    floors: [
      { north: [[13, "generator"], [11, "water"], [3, "lift"], [11, "hvac"], [13, "generator"]], south: [[13, "storage"], [13, "workshop"], [13, "water"], [12, "storage"]] },
      { north: [[13, "bunks"], [11, "medical"], [3, "lift"], [11, "decon"], [13, "bunks"]], south: [[13, "mess"], [13, "kitchen"], [13, "medical"], [12, "storage"]] },
      { north: [[13, "command"], [11, "servers"], [3, "lift"], [11, "servers"], [13, "comms"]], south: [[13, "conference"], [13, "office"], [13, "lab"], [12, "armoury"]] }
    ]
  },
  strategic_operations_bunker: {
    Dn: 9, Ds: 13, cover: 2, eastStairs: true, vents: 4, mast: true,
    floors: [
      { north: [[11, "generator"], [11, "generator"], [13, "water"], [3, "lift"], [13, "hvac"], [11, "workshop"], [11, "storage"]], south: [[15, "generator"], [15, "water"], [19, "hvac"], [15, "storage"], [15, "workshop"]] },
      { north: [[11, "bunks"], [11, "bunks"], [13, "mess"], [3, "lift"], [13, "kitchen"], [11, "bunks"], [11, "bunks"]], south: [[15, "medical"], [15, "decon"], [19, "mess"], [15, "officers"], [15, "storage"]] },
      { north: [[11, "armoury"], [11, "storage"], [13, "servers"], [3, "lift"], [13, "servers"], [11, "lab"], [11, "office"]], south: [[15, "briefing"], [15, "office"], [19, "servers"], [15, "conference"], [15, "medical"]] },
      { north: [[11, "office"], [11, "comms"], [13, "conference"], [3, "lift"], [13, "briefing"], [11, "comms"], [11, "office"]], south: [[15, "servers"], [15, "command"], [19, "command"], [15, "command"], [15, "servers"]] },
      { north: [[11, "command"], [11, "comms"], [13, "office"], [3, "lift"], [13, "office"], [11, "comms"], [11, "command"]], south: [[15, "conference"], [15, "briefing"], [19, "atrium_upper"], [15, "briefing"], [15, "conference"]] }
    ]
  }
};

export function buildSmallNuclearBunker(dimension, origin, rotation, variantId) {
  buildBunker(dimension, origin, rotation, variantId, BUNKER_SPECS.small_nuclear_bunker);
}
export function buildMediumNuclearBunker(dimension, origin, rotation, variantId) {
  buildBunker(dimension, origin, rotation, variantId, BUNKER_SPECS.medium_nuclear_bunker);
}
export function buildLargeNuclearBunker(dimension, origin, rotation, variantId) {
  buildBunker(dimension, origin, rotation, variantId, BUNKER_SPECS.large_nuclear_bunker);
}
export function buildStrategicOperationsBunker(dimension, origin, rotation, variantId) {
  buildBunker(dimension, origin, rotation, variantId, BUNKER_SPECS.strategic_operations_bunker);
}
