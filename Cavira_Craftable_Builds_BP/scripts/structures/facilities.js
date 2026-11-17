import { kit, spiralStairwell, latticeMast, hazardBorder, OPPOSITE } from "../kit.js";
import { furnishRoom } from "../interiors.js";
import { opsBuilding, externalStairs, lampPost, stairFlight } from "../buildings.js";

// ---------------------------------------------------------------------------
// Base facilities v2 (v1.7.0) — redesigned replacements for the v1.x
// flat-roofed boxes. Every building has: a clear lit entrance with canopy and
// path, internal or external stairs to every floor, furnished lit rooms, and a
// distinct silhouette (gable, sawtooth, barrel or bermed roofs).
// Ground: walk level y = 2 (foundationDepth 2). Entrances face local south.
// ---------------------------------------------------------------------------

const WALK = 2;

export const FACILITY_SIZES = {
  army_barracks: { x: 33, y: 26, z: 21 },
  officers_quarters: { x: 29, y: 20, z: 25 },
  army_armoury: { x: 27, y: 12, z: 23 },
  army_vehicle_depot: { x: 43, y: 16, z: 35 },
  army_medical_facility: { x: 35, y: 18, z: 27 },
  army_command_bunker: { x: 29, y: 14, z: 27 },
  airfield_operations_building: { x: 35, y: 20, z: 25 },
  air_traffic_control_tower: { x: 23, y: 40, z: 23 },
  naval_operations_centre: { x: 37, y: 22, z: 27 },
  sailors_barracks: { x: 35, y: 26, z: 21 },
  dockyard_logistics_warehouse: { x: 41, y: 18, z: 35 },
  ship_maintenance_workshop: { x: 39, y: 24, z: 47 },
  naval_ammunition_bunker: { x: 25, y: 12, z: 29 },
  harbour_control_tower: { x: 19, y: 36, z: 19 },
  naval_headquarters: { x: 39, y: 24, z: 29 },
  hq_administration_wing: { x: 41, y: 20, z: 23 },
  logistics_hall: { x: 41, y: 18, z: 35 }
};

function ctx(id, dimension, origin, rotation, variantId) {
  const size = FACILITY_SIZES[id];
  return { c: kit(dimension, origin, rotation, size, variantId), size };
}

// ---------------------------------------------------------------------------
// Toolkit
// ---------------------------------------------------------------------------

/** Paved site with a lit path from the south edge to the entrance. */
export function site(c, size, pathX1, pathX2, toZ, opts = {}) {
  c.fill(0, WALK - 1, 0, size.x - 1, WALK - 1, size.z - 1, opts.ground ?? c.B.andesite);
  for (let z = toZ; z < size.z; z++) for (let x = pathX1; x <= pathX2; x++) c.set(x, WALK - 1, z, (x === pathX1 || x === pathX2) ? c.B.smooth : c.V.floor);
  for (let z = toZ + 2; z < size.z; z += 4) { lampPost(c, pathX1 - 1, z, WALK, 2); lampPost(c, pathX2 + 1, z, WALK, 2); }
}

/** Solid gable roof. Ridge runs along `axis` ("x" or "z"). Attic is filled so it never becomes a dark void. */
export function gableRoof(c, x1, z1, x2, z2, y, o = {}) {
  const axis = o.axis ?? "x";
  const stairId = o.stair ?? "minecraft:deepslate_tile_stairs";
  const fill = o.fill ?? c.B.tile;
  const gable = o.gable ?? c.V.wall;
  if (axis === "x") {
    for (let i = 0; ; i++) {
      const a = z1 - 1 + i, b = z2 + 1 - i, yy = y + i;
      if (a > b) break;
      for (let x = x1 - 1; x <= x2 + 1; x++) {
        if (a === b) c.set(x, yy, a, fill);
        else { c.set(x, yy, a, c.stairs(stairId, "south")); c.set(x, yy, b, c.stairs(stairId, "north")); }
        if (x >= x1 && x <= x2) for (let z = a + 1; z <= b - 1; z++) c.set(x, yy, z, (x === x1 || x === x2) ? gable : fill);
      }
      if (a === b) break;
    }
  } else {
    for (let i = 0; ; i++) {
      const a = x1 - 1 + i, b = x2 + 1 - i, yy = y + i;
      if (a > b) break;
      for (let z = z1 - 1; z <= z2 + 1; z++) {
        if (a === b) c.set(a, yy, z, fill);
        else { c.set(a, yy, z, c.stairs(stairId, "east")); c.set(b, yy, z, c.stairs(stairId, "west")); }
        if (z >= z1 && z <= z2) for (let x = a + 1; x <= b - 1; x++) c.set(x, yy, z, (z === z1 || z === z2) ? gable : fill);
      }
      if (a === b) break;
    }
  }
}

/** Sawtooth north-light roof over an open hall (teeth run along x, glazing faces north). */
export function sawtoothRoof(c, x1, z1, x2, z2, y, tooth = 6) {
  for (let zs = z1; zs <= z2; zs += tooth) {
    const ze = Math.min(z2, zs + tooth - 1);
    const h = Math.min(4, ze - zs);
    for (let x = x1; x <= x2; x++) {
      for (let k = 0; k <= h; k++) c.set(x, y + k, zs, k === 0 || x === x1 || x === x2 ? c.B.tile : c.B.glass);
      for (let z = zs + 1; z <= ze; z++) {
        const k = Math.max(0, Math.round(h - ((z - zs) * h) / (ze - zs + 1)));
        c.set(x, y + k, z, c.stairs("minecraft:deepslate_tile_stairs", "north"));
        for (let kk = 0; kk < k; kk++) if (x === x1 || x === x2) c.set(x, y + kk, z, c.V.wall);
      }
    }
  }
}

/** Barrel-vault roof along z spanning x1..x2. */
export function barrelRoof(c, x1, z1, x2, z2, y, rise, mat, rib) {
  const cx = (x1 + x2) / 2;
  const half = (x2 - x1) / 2 + 0.5;
  for (let x = x1; x <= x2; x++) {
    const t = (x - cx) / half;
    const yy = y + Math.round(rise * Math.sqrt(Math.max(0, 1 - t * t)));
    for (let z = z1; z <= z2; z++) {
      const r = (z - z1) % 6 === 0 && rib;
      c.set(x, yy, z, r ? rib : mat);
      if (z === z1 || z === z2) for (let k = y; k < yy; k++) c.set(x, k, z, c.V.wall);
    }
  }
}

/** Grass-covered earth berm sloping out from a wall line (bunkers, magazines). */
export function berm(c, x1, z1, x2, z2, walk, h, sides = ["north", "east", "west"]) {
  for (let k = 0; k < h; k++) {
    const y = walk + k;
    const o = h - k;
    if (sides.includes("north")) c.fill(x1 - o, y, z1 - o, x2 + o, y, z1 - 1, k === h - 1 ? c.B.grass : c.B.dirt);
    if (sides.includes("south")) c.fill(x1 - o, y, z2 + 1, x2 + o, y, z2 + o, k === h - 1 ? c.B.grass : c.B.dirt);
    if (sides.includes("west")) c.fill(x1 - o, y, z1, x1 - 1, y, z2, k === h - 1 ? c.B.grass : c.B.dirt);
    if (sides.includes("east")) c.fill(x2 + 1, y, z1, x2 + o, y, z2, k === h - 1 ? c.B.grass : c.B.dirt);
  }
  // grass on each exposed step
  for (let k = 0; k < h - 1; k++) {
    const y = walk + k, o = h - k;
    if (sides.includes("north")) c.fill(x1 - o, y, z1 - o, x2 + o, y, z1 - o, c.B.grass);
    if (sides.includes("west")) c.fill(x1 - o, y, z1, x1 - o, y, z2, c.B.grass);
    if (sides.includes("east")) c.fill(x2 + o, y, z1, x2 + o, y, z2, c.B.grass);
  }
}

/** Entrance canopy with lights on the south face (z = zFace). */
export function canopy(c, x1, x2, zFace, y, depth = 3, mat) {
  c.fill(x1, y, zFace + 1, x2, y, zFace + depth, mat ?? c.V.frame);
  for (let x = x1; x <= x2; x += 2) c.set(x, y - 1, zFace + depth, c.B.bars);
  c.set(x1, y, zFace + depth, c.B.sea);
  c.set(x2, y, zFace + depth, c.B.sea);
  for (const x of [x1, x2]) c.fill(x, WALK, zFace + depth, x, y - 1, zFace + depth, c.B.blackstoneBricks);
}

export function flagpole(c, x, z, h, colours) {
  c.set(x, WALK, z, c.B.stoneBrick);
  c.fill(x, WALK + 1, z, x, WALK + h, z, c.B.bars);
  colours.forEach((col, i) => { c.fill(x + 1, WALK + h - i, z, x + 3, WALK + h - i, z, col); });
  c.set(x, WALK + h + 1, z, c.B.yellow);
}

/** Big vehicle/hangar door opening with striped retracted leaf on one side. */
export function bigDoor(c, x1, x2, zFace, h) {
  c.clear(x1, WALK, zFace, x2, WALK + h - 1, zFace);
  for (let x = x1; x <= x2; x++) c.set(x, WALK + h, zFace, x % 2 ? c.B.yellow : c.B.black);
  c.set(x1 - 1, WALK + h - 1, zFace, c.B.sea);
  c.set(x2 + 1, WALK + h - 1, zFace, c.B.sea);
}

/** Open-plan hall with gable/sawtooth/barrel roof, big doors and a side office block. */
export function hall(c, o) {
  const { x1, z1, x2, z2, h } = o;
  c.fill(x1, WALK - 1, z1, x2, WALK - 1, z2, c.B.smooth);
  c.walls(x1, WALK, z1, x2, WALK + h - 1, z2, c.V.wall);
  for (let x = x1; x <= x2; x += 6) c.fill(x, WALK, z1, x, WALK + h - 1, z1, c.V.frame);
  for (let z = z1; z <= z2; z += 6) { c.fill(x1, WALK, z, x1, WALK + h - 1, z, c.V.frame); c.fill(x2, WALK, z, x2, WALK + h - 1, z, c.V.frame); }
  c.clear(x1 + 1, WALK, z1 + 1, x2 - 1, WALK + h + 8, z2 - 1);
  // high clerestory windows
  for (let z = z1 + 2; z < z2 - 1; z++) if ((z - z1) % 6 !== 0) { c.set(x1, WALK + h - 3, z, c.B.glass); c.set(x2, WALK + h - 3, z, c.B.glass); c.set(x1, WALK + h - 2, z, c.B.glass); c.set(x2, WALK + h - 2, z, c.B.glass); }
  if (o.roof === "gable") gableRoof(c, x1, z1, x2, z2, WALK + h, { axis: o.ridge ?? "z", fill: o.attic ?? c.B.tile });
  else if (o.roof === "sawtooth") sawtoothRoof(c, x1, z1, x2, z2, WALK + h);
  else if (o.roof === "barrel") barrelRoof(c, x1, z1, x2, z2, WALK + h, o.rise ?? 6, c.B.lightGrey, c.B.tile);
  else c.fill(x1, WALK + h, z1, x2, WALK + h, z2, c.V.accent);
  // floor bay markings
  for (let x = x1 + 1; x < x2; x++) if ((x - x1) % 10 === 0) for (let z = z1 + 2; z < z2 - 1; z++) c.set(x, WALK - 1, z, c.B.yellow);
}

// ---------------------------------------------------------------------------
// Army
// ---------------------------------------------------------------------------

export function buildArmyBarracksV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("army_barracks", dimension, origin, rotation, variantId);
  site(c, size, 15, 17, 16);
  const b = opsBuilding(c, {
    x1: 2, z1: 2, x2: 30, z2: 15, walk: WALK, floorH: 6,
    floors: [
      [{ u1: 5, u2: 16, type: "mess" }, { u1: 18, u2: 29, type: "office" }],
      [{ u1: 5, u2: 16, type: "bunks" }, { u1: 18, u2: 29, type: "bunks" }],
      [{ u1: 5, u2: 16, type: "bunks" }, { u1: 18, u2: 29, type: "decon" }]
    ],
    doorX: 16
  });
  gableRoof(c, 2, 2, 30, 15, b.top, { axis: "x" });
  canopy(c, 13, 19, 15, WALK + 4);
  // external fire escape on the east end
  externalStairs(c, 31, 14, "north", WALK, 6, 1, "minecraft:polished_deepslate_stairs");
  c.fill(31, WALK + 5, 3, 32, WALK + 5, 8, c.B.andesite);
  c.clear(30, WALK + 6, 5, 30, WALK + 7, 6);
  flagpole(c, 5, 18, 8, [c.B.green, c.B.black]);
}

export function buildOfficersQuartersV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("officers_quarters", dimension, origin, rotation, variantId);
  site(c, size, 13, 15, 17, { ground: c.B.grass });
  const brick = c.P("minecraft:bricks");
  const b = opsBuilding(c, {
    x1: 2, z1: 2, x2: 26, z2: 15, walk: WALK, floorH: 6, wall: brick,
    floors: [[{ u1: 5, u2: 14, type: "mess" }, { u1: 16, u2: 25, type: "office" }], [{ u1: 5, u2: 25, type: "officers" }]],
    doorX: 14
  });
  gableRoof(c, 2, 2, 26, 15, b.top, { axis: "x", stair: "minecraft:dark_oak_stairs", fill: c.B.darkOak, gable: brick });
  // colonnaded veranda along the front
  c.fill(2, WALK - 1, 16, 26, WALK - 1, 18, c.B.smooth);
  c.fill(2, WALK + 4, 16, 26, WALK + 4, 18, c.P("minecraft:quartz_block"));
  for (let x = 2; x <= 26; x += 4) c.fill(x, WALK, 18, x, WALK + 3, 18, c.P("minecraft:quartz_pillar"));
  for (let x = 4; x <= 24; x += 4) c.set(x, WALK + 3, 17, c.B.lantern);
  // lawn and hedges
  for (let x = 1; x < size.x - 1; x++) if (x < 12 || x > 16) { c.set(x, WALK, 21, c.P("minecraft:oak_leaves")); }
}

export function buildArmyArmouryV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("army_armoury", dimension, origin, rotation, variantId);
  site(c, size, 12, 14, 18);
  // hardened single-storey magazine with earth berm on three sides
  c.room(5, WALK - 1, 4, 21, WALK + 6, 17, c.B.concrete, c.B.smooth, c.B.concrete);
  furnishRoom(c, { x1: 6, z1: 5, x2: 20, z2: 16, walk: WALK, h: 6, type: "armoury", door: "south", doorU: 7 });
  berm(c, 5, 4, 21, 17, WALK, 6, ["north", "east", "west"]);
  c.fill(4, WALK + 7, 3, 22, WALK + 7, 18, c.B.grass);
  // blast-door portal with hazard frame and guard booth
  c.clear(12, WALK, 17, 14, WALK + 2, 17);
  c.fill(11, WALK, 18, 15, WALK + 3, 18, c.B.blackstoneBricks);
  c.clear(12, WALK, 18, 14, WALK + 2, 18);
  for (let x = 11; x <= 15; x++) c.set(x, WALK + 4, 18, x % 2 ? c.B.yellow : c.B.black);
  c.set(11, WALK + 3, 19, c.B.sea); c.set(15, WALK + 3, 19, c.B.sea);
  c.room(17, WALK - 1, 19, 20, WALK + 3, 21, c.V.wall, c.V.floor, c.V.accent);
  c.clear(17, WALK, 20, 17, WALK + 1, 20);
  c.set(18, WALK, 20, c.B.blackstone); c.set(18, WALK + 1, 20, c.B.daylight);
  latticeMast(c, { x: 12, z: 10, y1: WALK + 8, y2: WALK + 10, width: 1 });
}

export function buildArmyVehicleDepotV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("army_vehicle_depot", dimension, origin, rotation, variantId);
  site(c, size, 19, 23, 28);
  hall(c, { x1: 2, z1: 2, x2: 40, z2: 27, h: 8, roof: "sawtooth" });
  for (const x of [5, 15, 25]) bigDoor(c, x, x + 7, 27, 6);
  // office block inside the east end, with a mezzanine reached by stairs
  c.room(33, WALK - 1, 3, 39, WALK + 4, 12, c.V.wall, c.V.floor, c.B.andesite);
  c.clear(33, WALK, 9, 33, WALK + 2, 10);
  furnishRoom(c, { x1: 34, z1: 4, x2: 38, z2: 11, walk: WALK, h: 4, type: "office", door: "west", doorU: 2 });
  stairFlight(c, 33, 19, "north", WALK, 6);
  c.fill(33, WALK + 5, 3, 39, WALK + 5, 13, c.B.andesite);
  for (let x = 34; x <= 39; x++) c.set(x, WALK + 6, 13, c.B.rail);
  furnishRoom(c, { x1: 34, z1: 4, x2: 38, z2: 11, walk: WALK + 6, h: 4, type: "storage", door: "south", doorU: 2 });
  // workshop benches along the north wall, wash bay and fuel island outside
  furnishRoom(c, { x1: 3, z1: 3, x2: 31, z2: 8, walk: WALK, h: 7, type: "workshop", door: "south", doorU: 14 });
  c.fill(3, WALK - 1, 29, 12, WALK - 1, 33, c.B.blueGlass);
  hazardBorder(c, 3, WALK - 1, 29, 12, 33);
  c.fill(30, WALK, 30, 34, WALK, 31, c.B.concrete);
  for (const x of [31, 33]) { c.set(x, WALK + 1, 30, c.B.red); c.set(x, WALK + 2, 30, c.B.sea); }
  c.fill(29, WALK + 4, 29, 35, WALK + 4, 32, c.V.frame);
  for (const [x, z] of [[29, 29], [35, 29], [29, 32], [35, 32]]) c.fill(x, WALK, z, x, WALK + 3, z, c.B.blackstoneBricks);
}

export function buildArmyMedicalFacilityV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("army_medical_facility", dimension, origin, rotation, variantId);
  site(c, size, 16, 18, 21);
  const b = opsBuilding(c, {
    x1: 2, z1: 2, x2: 32, z2: 20, walk: WALK, floorH: 6, wall: c.B.white, frame: c.B.lightGrey,
    floors: [[{ u1: 5, u2: 17, type: "medical" }, { u1: 19, u2: 31, type: "decon" }], [{ u1: 5, u2: 31, type: "medical" }]],
    roofDeck: true, doorX: 17
  });
  // red-cross helipad on the roof
  c.fill(6, b.top - 1, 5, 28, b.top - 1, 17, c.B.white);
  for (let k = -5; k <= 5; k++) { for (let w = -1; w <= 1; w++) { c.set(17 + k, b.top - 1, 11 + w, c.B.red); c.set(17 + w, b.top - 1, 11 + k, c.B.red); } }
  for (const [x, z] of [[6, 5], [28, 5], [6, 17], [28, 17]]) c.set(x, b.top - 1, z, c.B.sea);
  // ambulance bay canopy
  canopy(c, 12, 22, 20, WALK + 4, 5, c.B.white);
  for (let x = 12; x <= 22; x++) c.set(x, WALK - 1, 24, x % 2 ? c.B.red : c.B.white);
}

export function buildArmyCommandBunkerV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("army_command_bunker", dimension, origin, rotation, variantId);
  site(c, size, 13, 15, 21);
  c.room(5, WALK - 1, 4, 23, WALK + 6, 20, c.B.concrete, c.B.smooth, c.B.concrete);
  // two rooms: command (rear) and comms (front), joined by a doorway
  c.fill(6, WALK, 12, 22, WALK + 5, 12, c.B.andesite);
  c.clear(13, WALK, 12, 15, WALK + 2, 12);
  furnishRoom(c, { x1: 6, z1: 5, x2: 22, z2: 11, walk: WALK, h: 6, type: "command", door: "south", doorU: 7 });
  furnishRoom(c, { x1: 6, z1: 13, x2: 22, z2: 19, walk: WALK, h: 6, type: "comms", door: "south", doorU: 7 });
  berm(c, 5, 4, 23, 20, WALK, 6, ["north", "east", "west"]);
  c.fill(4, WALK + 7, 3, 24, WALK + 7, 21, c.B.grass);
  // blast door, sandbag chicane and camouflage-netted antennas
  c.clear(13, WALK, 20, 15, WALK + 2, 20);
  for (let x = 12; x <= 16; x++) c.set(x, WALK + 3, 21, x % 2 ? c.B.yellow : c.B.black);
  c.fill(10, WALK, 23, 12, WALK + 1, 23, c.P("minecraft:mud_bricks")); c.fill(16, WALK, 23, 18, WALK + 1, 23, c.P("minecraft:mud_bricks"));
  latticeMast(c, { x: 8, z: 7, y1: WALK + 8, y2: WALK + 12, width: 1 });
  latticeMast(c, { x: 20, z: 7, y1: WALK + 8, y2: WALK + 10, width: 1 });
  c.fill(10, WALK + 8, 9, 18, WALK + 8, 14, c.P("minecraft:moss_carpet"));
}

// ---------------------------------------------------------------------------
// Air Force
// ---------------------------------------------------------------------------

export function buildAirfieldOperationsBuildingV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("airfield_operations_building", dimension, origin, rotation, variantId);
  site(c, size, 16, 18, 20);
  const b = opsBuilding(c, {
    x1: 2, z1: 2, x2: 32, z2: 19, walk: WALK, floorH: 6, glass: c.B.lightBlueGlass,
    floors: [[{ u1: 5, u2: 17, type: "briefing" }, { u1: 19, u2: 31, type: "office" }], [{ u1: 5, u2: 17, type: "command" }, { u1: 19, u2: 31, type: "comms" }]],
    roofDeck: true, doorX: 17
  });
  // fully glazed corner stair tower look on the east end
  for (let y = WALK; y < b.top; y++) for (let z = 4; z <= 17; z++) if (y % 6 !== 1) c.set(32, y, z, c.B.lightBlueGlass);
  canopy(c, 13, 21, 19, WALK + 4);
  // met mast and windsock on the roof
  latticeMast(c, { x: 28, z: 4, y1: b.top, y2: b.top + 7, width: 1 });
  c.fill(29, b.top + 7, 4, 31, b.top + 7, 4, c.B.orange);
  c.fill(6, b.top, 6, 8, b.top + 1, 8, c.B.lightGrey);
}

export function buildAirTrafficControlTowerV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("air_traffic_control_tower", dimension, origin, rotation, variantId);
  site(c, size, 10, 12, 19);
  // two-storey base building
  const b = opsBuilding(c, { x1: 1, z1: 9, x2: 21, z2: 18, walk: WALK, floorH: 6, floors: [[{ u1: 10, u2: 20, type: "office" }], [{ u1: 10, u2: 20, type: "briefing" }]], doorX: 11 });
  // tower shaft with a spiral stairwell from the ground to the cab
  const x0 = 8, z0 = 3;
  const cabWalk = WALK + 8 * 3;
  c.fill(x0 - 2, WALK - 1, z0 - 2, x0 + 5, cabWalk - 1, z0 + 5, c.V.wall);
  // ground-floor passage into the base building and a floor-2 bridge
  c.clear(x0 + 3, WALK, z0 + 5, x0 + 3, WALK + 2, 9);
  c.clear(x0 + 3, WALK + 8, z0 + 5, x0 + 3, WALK + 10, z0 + 5);
  // shaft windows and beacon stripes
  for (let y = WALK + 3; y < cabWalk - 1; y += 4) { c.set(x0 - 2, y, z0 + 1, c.B.sea); c.set(x0 + 5, y, z0 + 2, c.B.sea); }
  // flared glazed cab (wider than the shaft) with a gallery and roof equipment
  const cx1 = x0 - 5, cz1 = z0 - 3, cx2 = x0 + 8, cz2 = z0 + 7;
  c.fill(cx1, cabWalk - 1, cz1 + 1, cx2, cabWalk - 1, cz2 - 1, c.B.concrete);
  c.fill(cx1 + 1, cabWalk - 1, cz1, cx2 - 1, cabWalk - 1, cz2, c.B.concrete);
  for (let y = cabWalk; y <= cabWalk + 3; y++) {
    for (let x = cx1 + 1; x <= cx2 - 1; x++) { c.set(x, y, cz1 + 1, c.B.lightBlueGlass); c.set(x, y, cz2 - 1, c.B.lightBlueGlass); }
    for (let z = cz1 + 1; z <= cz2 - 1; z++) { c.set(cx1 + 1, y, z, c.B.lightBlueGlass); c.set(cx2 - 1, y, z, c.B.lightBlueGlass); }
  }
  c.clear(cx1 + 2, cabWalk, cz1 + 2, cx2 - 2, cabWalk + 3, cz2 - 2);
  c.fill(cx1, cabWalk + 4, cz1, cx2, cabWalk + 4, cz2, c.V.accent);
  // stairwell cut last so the cab floor cannot seal it
  spiralStairwell(c, { x0, z0, bottomWalk: WALK, topWalk: cabWalk, corner: "se", exits: [{ walk: WALK, side: "south" }, { walk: WALK + 8, side: "south" }, { walk: cabWalk, side: "south" }], wall: c.V.frame });

  for (let x = cx1; x <= cx2; x++) { c.set(x, cabWalk, cz1, c.B.rail); c.set(x, cabWalk, cz2, c.B.rail); }
  for (let z = cz1; z <= cz2; z++) { c.set(cx1, cabWalk, z, c.B.rail); c.set(cx2, cabWalk, z, c.B.rail); }
  for (let x = cx1 + 2; x <= cx2 - 2; x++) if (x < x0 - 1 || x > x0 + 4) { c.set(x, cabWalk, cz1 + 2, c.B.blackstone); c.set(x, cabWalk + 1, cz1 + 2, c.B.daylight); }
  for (let x = cx1 + 2; x <= cx2 - 2; x += 3) c.set(x, cabWalk + 4, cz1 + 3, c.B.sea);
  latticeMast(c, { x: x0 + 1, z: z0 + 1, y1: cabWalk + 5, y2: cabWalk + 9, width: 1 });
  c.set(cx1, cabWalk + 5, cz1, c.B.red); c.set(cx2, cabWalk + 5, cz2, c.B.red);
  void b;
}

// ---------------------------------------------------------------------------
// Navy
// ---------------------------------------------------------------------------

function navyBand(c, x1, x2, z, y) {
  for (let x = x1; x <= x2; x++) c.set(x, y, z, c.B.blue);
}

export function buildNavalOperationsCentreV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("naval_operations_centre", dimension, origin, rotation, variantId);
  site(c, size, 17, 19, 22);
  const b = opsBuilding(c, {
    x1: 2, z1: 2, x2: 34, z2: 21, walk: WALK, floorH: 7, wall: c.B.white, frame: c.B.blue, glass: c.B.lightBlueGlass,
    floors: [[{ u1: 5, u2: 18, type: "conference" }, { u1: 20, u2: 33, type: "servers" }], [{ u1: 5, u2: 33, type: "command" }]],
    roofDeck: true, doorX: 18
  });
  navyBand(c, 2, 34, 21, WALK + 6);
  canopy(c, 14, 22, 21, WALK + 4, 3, c.B.blue);
  // radar mast and signal yard
  latticeMast(c, { x: 26, z: 6, y1: b.top, y2: b.top + 6, width: 3, beacon: false });
  c.fill(23, b.top + 7, 7, 31, b.top + 7, 7, c.B.blackstoneBricks);
  c.fill(25, b.top + 8, 7, 29, b.top + 8, 7, c.B.black);
  c.set(27, b.top + 9, 7, c.B.red);
  flagpole(c, 5, 24, 9, [c.B.white, c.B.blue, c.B.red]);
}

export function buildSailorsBarracksV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("sailors_barracks", dimension, origin, rotation, variantId);
  site(c, size, 16, 18, 18);
  const b = opsBuilding(c, {
    x1: 2, z1: 2, x2: 32, z2: 15, walk: WALK, floorH: 6, wall: c.B.white, frame: c.B.blue,
    floors: [[{ u1: 5, u2: 18, type: "mess" }, { u1: 20, u2: 31, type: "kitchen" }], [{ u1: 5, u2: 31, type: "bunks" }], [{ u1: 5, u2: 31, type: "bunks" }]],
    doorX: 17
  });
  // balconies with blue railings on each upper floor
  for (const y of [WALK + 5, WALK + 11]) {
    c.fill(4, y, 16, 30, y, 16, c.B.andesite);
    for (let x = 4; x <= 30; x++) c.set(x, y + 1, 16, x % 4 === 0 ? c.B.blue : c.B.bars);
    for (let x = 6; x <= 28; x += 6) c.clear(x, y + 1, 15, x, y + 2, 15);
  }
  gableRoof(c, 2, 2, 32, 15, b.top, { axis: "x", stair: "minecraft:prismarine_brick_stairs", fill: c.P("minecraft:dark_prismarine") });
  canopy(c, 14, 20, 15, WALK + 4, 2, c.B.blue);
}

export function buildDockyardLogisticsWarehouseV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("dockyard_logistics_warehouse", dimension, origin, rotation, variantId);
  site(c, size, 18, 22, 29);
  hall(c, { x1: 2, z1: 2, x2: 38, z2: 28, h: 9, roof: "gable", ridge: "z" });
  // roller doors with a raised loading dock along the front
  for (const x of [5, 16, 27]) bigDoor(c, x, x + 6, 28, 6);
  c.fill(3, WALK, 29, 37, WALK, 30, c.B.concrete);
  for (let x = 3; x <= 37; x++) c.set(x, WALK, 31, x % 2 ? c.B.yellow : c.B.black);
  // racking rows inside
  for (const z of [6, 12, 18]) furnishRoom(c, { x1: 4, z1: z, x2: 36, z2: z + 3, walk: WALK, h: 7, type: "storage", door: "south", doorU: 16 });
  // gantry crane rail across the hall
  c.fill(3, WALK + 7, 4, 37, WALK + 7, 4, c.B.yellow);
  c.fill(3, WALK + 7, 25, 37, WALK + 7, 25, c.B.yellow);
  c.fill(19, WALK + 7, 5, 21, WALK + 7, 24, c.B.yellow);
}

export function buildShipMaintenanceWorkshopV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("ship_maintenance_workshop", dimension, origin, rotation, variantId);
  site(c, size, 17, 21, 41);
  hall(c, { x1: 2, z1: 2, x2: 36, z2: 40, h: 12, roof: "barrel", rise: 7 });
  bigDoor(c, 6, 32, 40, 11);
  // travelling gantry crane
  for (const x of [4, 34]) c.fill(x, WALK, 6, x, WALK + 10, 6, c.B.yellow);
  c.fill(4, WALK + 11, 6, 34, WALK + 11, 6, c.B.yellow);
  c.fill(18, WALK + 9, 6, 20, WALK + 10, 6, c.B.blackstoneBricks);
  // keel blocks and workshop galleries
  for (let z = 10; z <= 34; z += 4) { c.fill(18, WALK, z, 20, WALK, z, c.B.blackstoneBricks); c.set(19, WALK + 1, z, c.B.spruce); }
  for (const xs of [[3, 8], [30, 35]]) {
    furnishRoom(c, { x1: xs[0], z1: 9, x2: xs[1], z2: 36, walk: WALK, h: 6, type: "workshop", door: xs[0] === 3 ? "east" : "west", doorU: 12 });
    c.fill(xs[0], WALK + 6, 9, xs[1], WALK + 6, 36, c.B.andesite);
    for (let z = 9; z <= 36; z++) c.set(xs[0] === 3 ? 9 : 29, WALK + 7, z, c.B.rail);
    furnishRoom(c, { x1: xs[0], z1: 9, x2: xs[1], z2: 36, walk: WALK + 7, h: 4, type: "storage", door: xs[0] === 3 ? "east" : "west", doorU: 12 });
  }
  stairFlight(c, 10, 37, "north", WALK, 7);
  stairFlight(c, 28, 37, "north", WALK, 7);
}

export function buildNavalAmmunitionBunkerV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("naval_ammunition_bunker", dimension, origin, rotation, variantId);
  site(c, size, 11, 13, 23);
  // earth-covered igloo magazine (barrel vault under a grass mound)
  c.fill(4, WALK - 1, 3, 20, WALK - 1, 21, c.B.smooth);
  for (let x = 4; x <= 20; x++) {
    const t = (x - 12) / 8.5;
    const yy = WALK + Math.round(6 * Math.sqrt(Math.max(0, 1 - t * t)));
    for (let z = 3; z <= 21; z++) {
      c.set(x, yy, z, c.B.concrete);
      for (let k = yy + 1; k <= yy + 2; k++) c.set(x, k, z, k === yy + 2 ? c.B.grass : c.B.dirt);
    }
    for (let k = WALK; k < yy; k++) { c.set(x, k, 3, c.B.concrete); c.set(x, k, 21, c.B.concrete); }
  }
  furnishRoom(c, { x1: 7, z1: 4, x2: 17, z2: 20, walk: WALK, h: 4, type: "armoury", door: "south", doorU: 4 });
  // headwall with blast door and traverse walls
  c.clear(11, WALK, 21, 13, WALK + 2, 21);
  for (let x = 4; x <= 20; x++) c.set(x, WALK + 4, 21, x % 2 ? c.B.yellow : c.B.black);
  for (const x of [3, 21]) c.fill(x, WALK, 21, x, WALK + 3, 26, c.B.concrete);
  c.set(10, WALK + 3, 22, c.B.sea); c.set(14, WALK + 3, 22, c.B.sea);
}

export function buildHarbourControlTowerV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("harbour_control_tower", dimension, origin, rotation, variantId);
  site(c, size, 8, 10, 15);
  const cx = 9, cz = 8;
  const cabWalk = WALK + 24;
  // round tower in white and red bands
  for (let y = WALK - 1; y < cabWalk; y++) c.cyl(cx, cz, y, y, 5, (Math.floor((y - WALK) / 4) % 2) ? c.B.red : c.B.white, 1);
  c.cyl(cx, cz, WALK - 1, WALK - 1, 4, c.B.smooth);
  // spiral stairwell inside, landing at the cab
  spiralStairwell(c, { x0: cx - 2, z0: cz - 2, bottomWalk: WALK, topWalk: cabWalk, corner: "se", exits: [{ walk: WALK, side: "south" }, { walk: cabWalk, side: "south" }], wall: c.B.white });
  c.clear(cx + 1, WALK, cz + 3, cx + 1, WALK + 2, cz + 5);
  for (let y = WALK + 4; y < cabWalk; y += 6) c.set(cx - 5, y, cz, c.B.lightBlueGlass);
  // glazed cab with a gallery
  c.cyl(cx, cz, cabWalk - 1, cabWalk - 1, 7, c.B.concrete);
  for (let y = cabWalk; y <= cabWalk + 3; y++) c.cyl(cx, cz, y, y, 6, c.B.lightBlueGlass, 1);
  c.cyl(cx, cz, cabWalk, cabWalk, 7, c.B.rail, 1);
  c.cyl(cx, cz, cabWalk + 4, cabWalk + 4, 7, c.B.red);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.set(Math.round(cx + Math.cos(a) * 4), cabWalk + 4, Math.round(cz + Math.sin(a) * 4), c.B.sea); }
  c.set(cx, cabWalk + 5, cz, c.B.lantern);
  c.fill(cx, cabWalk + 6, cz, cx, cabWalk + 8, cz, c.B.bars);
  c.set(cx, cabWalk + 9, cz, c.B.red);
  // consoles around the cab facing the harbour
  for (let k = 0; k < 6; k++) { const a = Math.PI * (0.15 + k * 0.14); c.set(Math.round(cx + Math.cos(a) * 4), cabWalk, Math.round(cz + Math.sin(a) * 4), c.B.blackstone); }
}

export function buildNavalHeadquartersV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("naval_headquarters", dimension, origin, rotation, variantId);
  site(c, size, 17, 21, 21);
  const b = opsBuilding(c, {
    x1: 2, z1: 2, x2: 36, z2: 20, walk: WALK, floorH: 6, wall: c.B.white, frame: c.B.blue, glass: c.B.lightBlueGlass,
    floors: [[{ u1: 5, u2: 18, type: "lobby" }, { u1: 20, u2: 35, type: "office" }], [{ u1: 5, u2: 35, type: "conference" }], [{ u1: 5, u2: 18, type: "command" }, { u1: 20, u2: 35, type: "office" }]],
    roofDeck: true, doorX: 19
  });
  // classical portico with columns and a pediment band
  c.fill(13, WALK - 1, 21, 25, WALK - 1, 24, c.B.quartz);
  for (let x = 13; x <= 25; x += 3) c.fill(x, WALK, 24, x, WALK + 6, 24, c.P("minecraft:quartz_pillar"));
  c.fill(12, WALK + 7, 21, 26, WALK + 7, 24, c.B.quartz);
  navyBand(c, 12, 26, 24, WALK + 8);
  c.set(19, WALK + 8, 24, c.B.yellow);
  for (const x of [8, 30]) flagpole(c, x, 24, 10, [c.B.white, c.B.blue, c.B.red]);
  latticeMast(c, { x: 31, z: 4, y1: b.top, y2: b.top + 5, width: 1 });
}

// ---------------------------------------------------------------------------
// Core & logistics
// ---------------------------------------------------------------------------

export function buildHQAdministrationWingV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("hq_administration_wing", dimension, origin, rotation, variantId);
  site(c, size, 18, 22, 18);
  const b = opsBuilding(c, {
    x1: 2, z1: 2, x2: 38, z2: 15, walk: WALK, floorH: 6, glass: c.B.lightBlueGlass,
    floors: [[{ u1: 5, u2: 19, type: "lobby" }, { u1: 21, u2: 37, type: "office" }], [{ u1: 5, u2: 37, type: "office" }], [{ u1: 5, u2: 19, type: "conference" }, { u1: 21, u2: 37, type: "office" }]],
    roofDeck: true, doorX: 20
  });
  // covered walkway (colonnade) along the front linking to the HQ
  c.fill(2, WALK - 1, 16, 38, WALK - 1, 19, c.B.smooth);
  c.fill(2, WALK + 4, 16, 38, WALK + 4, 19, c.V.frame);
  for (let x = 2; x <= 38; x += 4) c.fill(x, WALK, 19, x, WALK + 3, 19, c.B.quartz);
  for (let x = 4; x <= 36; x += 4) c.set(x, WALK + 4, 17, c.B.sea);
  c.fill(10, b.top, 5, 14, b.top + 1, 9, c.B.lightGrey);
}

export function buildLogisticsHallV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("logistics_hall", dimension, origin, rotation, variantId);
  site(c, size, 18, 22, 29);
  hall(c, { x1: 2, z1: 2, x2: 38, z2: 28, h: 9, roof: "sawtooth" });
  for (const x of [5, 16, 27]) bigDoor(c, x, x + 6, 28, 6);
  for (const z of [6, 12, 18]) furnishRoom(c, { x1: 4, z1: z, x2: 36, z2: z + 3, walk: WALK, h: 7, type: "supplies", door: "south", doorU: 16 });
  c.fill(3, WALK, 29, 37, WALK, 30, c.B.concrete);
  for (let x = 3; x <= 37; x++) c.set(x, WALK, 31, x % 2 ? c.B.yellow : c.B.black);
  // forklift parked by the doors
  c.fill(10, WALK, 25, 11, WALK, 26, c.B.orange); c.set(10, WALK + 1, 25, c.B.black); c.fill(12, WALK, 25, 12, WALK + 1, 26, c.B.bars);
}

export { OPPOSITE };
