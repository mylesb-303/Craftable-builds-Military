import { kit, hazardBorder } from "../kit.js";
import { furnishRoom } from "../interiors.js";
import { stairFlight } from "../buildings.js";

// ---------------------------------------------------------------------------
// Army builds, redesigned in v1.8.0.
// References: forward checkpoint practice (sangars, serpentine/chicane of
// concrete barriers, search bay under cover, boom barrier, overwatch),
// precast T-wall perimeters with patrol step and wire, and drive-through
// heavy vehicle maintenance halls (pits, gantry crane, side workshops).
// Ground walk level y = 2. Lights are set into structure.
// ---------------------------------------------------------------------------

const WALK = 2;

export const ARMY_SIZES = {
  army_defensive_checkpoint: { x: 19, y: 9, z: 13 },
  army_perimeter_wall: { x: 21, y: 12, z: 9 },
  army_perimeter_corner_tower: { x: 11, y: 18, z: 11 },
  heavy_vehicle_maintenance_hangar: { x: 35, y: 15, z: 27 }
};

// three drive-through vehicle lanes (x ranges) in the maintenance hall
const HV_LANES = [[3, 11], [13, 21], [23, 31]];
export const HEAVY_HANGAR_ENVELOPE = HV_LANES.map(([x1, x2]) => ({ x1: x1 + 1, x2: x2 - 1, y1: WALK, y2: WALK + 6, z1: 0, z2: 24 }));

/**
 * Perimeter wall snap connectors (v1.11). Straight sections chain end to end along local x;
 * the corner tower turns the wall 90° — "out" turns right (clockwise run, outside on the left),
 * "branch" turns left. All walkways line up at the same height and centreline.
 */
export const PERIMETER_SNAP = {
  army_perimeter_wall: { family: "perimeter", in: { x: 0, z: 3, dir: "west" }, out: { x: 20, z: 3, dir: "east" } },
  army_perimeter_corner_tower: { family: "perimeter", in: { x: 0, z: 3, dir: "west" }, out: { x: 7, z: 10, dir: "south" }, branch: { x: 3, z: 0, dir: "north" }, labels: { out: "Right Turn", branch: "Left Turn" } }
};

const ctx = (id, d, o, r, v) => ({ c: kit(d, o, r, ARMY_SIZES[id], v), size: ARMY_SIZES[id] });

/** Sandbag sangar (fortified guard post) with firing slits, bunk and radio desk. */
function sangar(c, x1, z1, x2, z2, doorSide) {
  const B = c.B;
  const sand = B.mudBricks;
  c.fill(x1, WALK - 1, z1, x2, WALK - 1, z2, B.smooth);
  c.walls(x1, WALK, z1, x2, WALK + 3, z2, sand);
  c.clear(x1 + 1, WALK, z1 + 1, x2 - 1, WALK + 3, z2 - 1);
  // firing slits on every side at eye level
  for (let x = x1 + 1; x < x2; x += 2) { c.set(x, WALK + 2, z1, B.air); c.set(x, WALK + 2, z2, B.air); }
  for (let z = z1 + 1; z < z2; z += 2) { c.set(x1, WALK + 2, z, B.air); c.set(x2, WALK + 2, z, B.air); }
  // corrugated roof with a sandbag layer and a recessed light
  c.fill(x1, WALK + 4, z1, x2, WALK + 4, z2, B.tile);
  c.fill(x1, WALK + 5, z1, x2, WALK + 5, z2, sand);
  c.set(Math.floor((x1 + x2) / 2), WALK + 4, Math.floor((z1 + z2) / 2), B.sea);
  // door
  const mx = Math.floor((x1 + x2) / 2);
  if (doorSide === "south") c.clear(mx, WALK, z2, mx, WALK + 2, z2);
  else c.clear(mx, WALK, z1, mx, WALK + 2, z1);
  // interior: bunk along the back, radio desk under a slit
  const back = doorSide === "south" ? z1 + 1 : z2 - 1;
  c.bed(x1 + 1, WALK, back, "east");
  c.set(x2 - 1, WALK, back, c.slabTop("minecraft:spruce_slab"));
  c.set(x2 - 1, WALK + 1, back, B.jukebox);
  c.set(x2 - 1, WALK, doorSide === "south" ? z2 - 1 : z1 + 1, c.barrel("west"));
}

// ---------------------------------------------------------------------------
// Army Defensive Checkpoint
// ---------------------------------------------------------------------------
export function buildArmyDefensiveCheckpoint(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("army_defensive_checkpoint", dimension, origin, rotation, variantId);
  const B = c.B;
  c.fill(0, WALK - 2, 0, size.x - 1, WALK - 2, size.z - 1, B.concrete);
  c.fill(0, WALK - 1, 0, size.x - 1, WALK - 1, size.z - 1, c.P("minecraft:gravel"));
  // road x 6..12 running along z with edge lines
  c.fill(6, WALK - 1, 0, 12, WALK - 1, size.z - 1, B.black);
  for (let z = 0; z < size.z; z++) { c.set(6, WALK - 1, z, B.white); c.set(12, WALK - 1, z, B.white); }
  // serpentine chicane: staggered barrier blocks force vehicles to slow
  for (const [x1, x2, z] of [[7, 9, 1], [10, 11, 3], [7, 8, 10], [10, 11, 12]]) for (let x = x1; x <= x2; x++) { c.set(x, WALK, z, B.stoneBrick); c.set(x, WALK + 1, z, x % 2 ? B.yellow : B.black); }
  // covered search bay with lights set into the canopy soffit
  for (const [x, z] of [[6, 4], [12, 4], [6, 8], [12, 8]]) c.fill(x, WALK, z, x, WALK + 4, z, B.blackstoneBricks);
  for (let x = 5; x <= 13; x++) for (let z = 4; z <= 8; z++) c.set(x, WALK + 5, z, (x === 7 || x === 11) && (z === 5 || z === 7) ? B.sea : c.V.frame);
  for (let x = 7; x <= 11; x++) { c.set(x, WALK - 1, 4, B.white); c.set(x, WALK - 1, 8, B.white); }
  // inspection mirror trolley and search mat
  c.set(8, WALK, 6, c.P("minecraft:light_gray_carpet"));
  // boom barrier: striped arm raised beside the lane, post on the east verge
  c.fill(13, WALK, 10, 13, WALK + 1, 10, B.blackstoneBricks);
  for (let y = WALK + 2; y <= WALK + 6; y++) c.set(13, y, 10, y % 2 ? B.red : B.white);
  // two sangars, one each side of the road, doors facing away from the threat (south)
  sangar(c, 0, 3, 4, 9, "south");
  sangar(c, 14, 3, 18, 9, "south");
  // wire obstacle along both verges (north half), with a gap at each sangar door
  for (const x of [1, 3, 15, 17]) for (let z = 0; z <= 1; z++) { c.set(x, WALK, z, B.bars); c.set(x, WALK + 1, z, c.P("minecraft:chain")); }
  // lit warning board on the approach (light set into the sign)
  for (const x of [2, 16]) {
    c.fill(x, WALK, 12, x, WALK + 1, 12, B.blackstoneBricks);
    c.fill(x - 1, WALK + 2, 12, x + 1, WALK + 3, 12, B.red);
    c.set(x, WALK + 3, 12, B.sea);
  }
}

// ---------------------------------------------------------------------------
// Army Perimeter Wall (v1.11) — 21-long section, 4 thick with a hidden obsidian
// core, a 3-wide walkway on top behind a crenellated parapet, and a 2-wide stair
// up from the ground on the inside. Local z 0 = outside, z 8 = inside.
// ---------------------------------------------------------------------------
const DECK = WALK + 5; // walkway floor block; you stand at DECK + 1

/** Wall body across local x range x1..x2 (shared by the section and the tower stubs). */
function wallRun(c, x1, x2) {
  const B = c.B;
  for (let x = x1; x <= x2; x++) {
    const joint = x % 4 === 0;
    c.set(x, WALK - 1, 0, c.P("minecraft:gravel"));
    // outer face (z1) and inner face (z4) of precast panels; obsidian core (z2..3) hidden inside
    for (let y = WALK - 1; y < DECK; y++) {
      c.set(x, y, 1, joint ? B.tile : c.V.wall);
      c.set(x, y, 2, B.obsidian); c.set(x, y, 3, B.obsidian);
      c.set(x, y, 4, joint ? B.tile : c.V.wall);
    }
    // walkway deck z2..4 plus a ledge at z5, inner guard rail on the ledge
    for (let z = 1; z <= 5; z++) c.set(x, DECK, z, z === 1 ? B.blackstoneBricks : c.V.floor);
    c.set(x, DECK + 1, 5, B.rail);
    // crenellated parapet on the outer face with floodlights set into it every 8 blocks
    c.set(x, DECK + 1, 1, x % 8 === 4 ? B.sea : B.blackstoneBricks);
    c.set(x, DECK + 2, 1, x % 2 === 0 ? B.blackstoneBricks : B.air);
    // buttress fins under the ledge on the inside every 4 blocks
    if (x % 4 === 2) c.fill(x, WALK, 5, x, DECK - 1, 5, B.tile);
  }
}

export function buildArmyPerimeterWall(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("army_perimeter_wall", dimension, origin, rotation, variantId);
  const B = c.B;
  c.fill(0, WALK - 2, 0, size.x - 1, WALK - 2, size.z - 1, B.concrete);
  c.fill(0, WALK - 1, 5, size.x - 1, WALK - 1, size.z - 1, B.smooth);
  wallRun(c, 0, size.x - 1);
  // 2-wide stair up from the ground on the inside (z 6..7), climbing east to a landing at x 8..9
  for (let i = 0; i < 6; i++) {
    for (const z of [6, 7]) {
      c.fill(2 + i, WALK - 1, z, 2 + i, WALK + i - 1, z, B.concrete);
      c.set(2 + i, WALK + i, z, c.stairs("minecraft:polished_deepslate_stairs", "east"));
      c.clear(2 + i, WALK + i + 1, z, 2 + i, WALK + i + 3, z);
    }
    c.set(2 + i, WALK + i + 1, 8, B.rail); // outer handrail
  }
  c.fill(8, WALK - 1, 5, 9, DECK, 7, B.concrete);
  c.fill(8, DECK, 5, 9, DECK, 7, c.V.floor);
  for (const x of [8, 9]) c.set(x, DECK + 1, 5, B.air); // gap in the rail onto the walkway
  for (let z = 6; z <= 8; z++) c.set(10, DECK + 1, z, B.rail);
  c.set(8, DECK + 1, 8, B.rail); c.set(9, DECK + 1, 8, B.rail);
  c.set(1, WALK - 1, 6, B.sea); c.set(1, WALK - 1, 7, B.sea); // step-off lights flush in the ground
  // CCTV on a bracket at the centre of the parapet
  c.set(14, DECK + 2, 1, B.blackstone);
  c.set(14, DECK + 3, 1, c.P("minecraft:black_stained_glass_pane"));
}

/**
 * Corner watch tower: 11×11, 2-thick walls (face + obsidian), 2-wide stairs from the ground to
 * the walkway level and on up to a lookout roof. Walkway doors on the west (incoming wall),
 * south (right turn) and north (left turn) faces.
 */
export function buildArmyPerimeterCornerTower(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("army_perimeter_corner_tower", dimension, origin, rotation, variantId);
  const B = c.B;
  const TOP = DECK + 6; // lookout roof floor block
  c.fill(0, WALK - 2, 0, 10, WALK - 2, 10, B.concrete);
  // shell: outer face ring, obsidian ring inside it
  c.walls(0, WALK - 1, 0, 10, TOP, 10, c.V.wall);
  c.walls(1, WALK - 1, 1, 9, TOP, 9, B.obsidian);
  for (const [x, z] of [[0, 0], [10, 0], [0, 10], [10, 10]]) c.fill(x, WALK - 1, z, x, TOP + 1, z, B.blackstoneBricks);
  c.fill(2, WALK - 1, 2, 8, WALK - 1, 8, c.V.floor);
  c.clear(2, WALK, 2, 8, TOP - 1, 8);
  // walkway-level floor and lookout roof
  c.fill(2, DECK, 2, 8, DECK, 8, c.V.floor);
  c.fill(0, TOP, 0, 10, TOP, 10, c.V.floor);
  // ground door from inside the base (south face, west half) straight onto flight 1
  c.clear(2, WALK, 9, 3, WALK + 2, 10);
  c.set(1, WALK + 2, 10, B.sea); c.set(4, WALK + 2, 10, B.sea);
  // flight 1: ground -> walkway, 2 wide (x 2..3) climbing north, landing at z 2
  for (let i = 0; i < 6; i++) for (const x of [2, 3]) {
    c.set(x, WALK + i, 8 - i, c.stairs("minecraft:polished_deepslate_stairs", "north"));
    c.clear(x, WALK + i + 1, 8 - i, x, WALK + i + 3, 8 - i);
  }
  for (let z = 4; z <= 6; z++) c.set(4, DECK + 1, z, B.rail); // guard the stairwell opening
  // ground-floor store beside the stairs
  for (let z = 3; z <= 7; z += 2) { c.set(8, WALK, z, c.barrel("west")); c.set(8, WALK + 1, z, c.barrel("west")); }
  // flight 2: walkway -> roof, 2 wide (x 7..8) climbing south, landing at z 8 on the roof
  for (let i = 0; i < 6; i++) for (const x of [7, 8]) {
    c.set(x, DECK + 1 + i, 2 + i, c.stairs("minecraft:polished_deepslate_stairs", "south"));
    c.clear(x, DECK + 2 + i, 2 + i, x, DECK + 4 + i, 2 + i);
  }
  c.fill(7, TOP, 8, 8, TOP, 8, c.V.floor);
  for (let z = 2; z <= 7; z++) c.set(6, TOP + 1, z, B.rail);
  // walkway doors (3 wide, 3 tall) through both wall layers
  c.clear(0, DECK + 1, 2, 1, DECK + 3, 4);   // west: incoming wall
  c.clear(6, DECK + 1, 9, 8, DECK + 3, 10);  // south: right turn
  c.clear(2, DECK + 1, 0, 4, DECK + 3, 1);   // north: left turn
  for (const [x1, z1, x2, z2] of [[0, 2, 1, 4], [6, 9, 8, 10], [2, 0, 4, 1]]) c.fill(x1, DECK, z1, x2, DECK, z2, c.V.floor);
  // firing slits at walkway level on the two outer faces
  for (const k of [6, 8]) { c.set(k, DECK + 2, 0, B.air); c.set(10, DECK + 2, k - 4, B.air); }
  // lights set into the ceilings
  for (const [x, z] of [[5, 5], [5, 3], [5, 7]]) { c.set(x, DECK, z, B.sea); c.set(x, TOP, z, B.sea); }
  c.set(5, WALK - 1, 5, B.sea);
  // lookout: crenellated parapet, searchlights in the corners, warning light on a short mast
  for (let i = 0; i <= 10; i++) for (const [x, z] of [[i, 0], [i, 10], [0, i], [10, i]]) {
    c.set(x, TOP + 1, z, B.blackstoneBricks);
    c.set(x, TOP + 2, z, i % 2 === 0 ? B.blackstoneBricks : B.air);
  }
  for (const [x, z] of [[1, 1], [9, 1], [1, 9], [9, 9]]) c.set(x, TOP + 1, z, B.sea);
  c.fill(9, TOP + 1, 9, 9, TOP + 3, 9, B.bars);
  c.warnLight(9, TOP + 4, 9);
  // short wall stubs so the walkways meet the tower faces cleanly
  void size;
}

// ---------------------------------------------------------------------------
// Heavy Vehicle Maintenance Hangar — three drive-through bays with pits,
// gantry crane, workshop and parts store
// ---------------------------------------------------------------------------
export function buildHeavyVehicleMaintenanceHangar(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("heavy_vehicle_maintenance_hangar", dimension, origin, rotation, variantId);
  const B = c.B;
  const X1 = 1, X2 = 33, Z1 = 0, Z2 = 24, H = 10;
  c.fill(0, WALK - 2, 0, size.x - 1, WALK - 2, size.z - 1, B.concrete);
  c.fill(0, WALK - 1, 0, size.x - 1, WALK - 1, size.z - 1, B.andesite);
  c.fill(X1, WALK - 1, Z1, X2, WALK - 1, Z2, B.smooth);
  // walls with columns and high window band
  c.walls(X1, WALK, Z1, X2, WALK + H - 1, Z2, c.V.wall);
  for (let x = X1; x <= X2; x += 4) for (const z of [Z1, Z2]) c.fill(x, WALK, z, x, WALK + H - 1, z, c.V.frame);
  for (let z = Z1; z <= Z2; z += 4) for (const x of [X1, X2]) c.fill(x, WALK, z, x, WALK + H - 1, z, c.V.frame);
  c.clear(X1 + 1, WALK, Z1 + 1, X2 - 1, WALK + H - 1, Z2 - 1);
  for (let z = Z1 + 1; z < Z2; z++) if (z % 4) for (const x of [X1, X2]) { c.set(x, WALK + 7, z, B.glass); c.set(x, WALK + 8, z, B.glass); }
  // flat roof with rooflight strips and recessed high-bay lights between them
  for (let x = X1; x <= X2; x++) for (let z = Z1; z <= Z2; z++) {
    const roofLight = (x === 7 || x === 17 || x === 27) && z % 3 === 1 && z > Z1 && z < Z2;
    const skylight = (x === 12 || x === 22) && z > Z1 + 1 && z < Z2 - 1;
    c.set(x, WALK + H, z, roofLight ? B.sea : skylight ? B.glass : B.tile);
  }
  for (let x = X1; x <= X2; x++) { c.set(x, WALK + H + 1, Z1, c.V.frame); c.set(x, WALK + H + 1, Z2, c.V.frame); }
  // drive-through doors at both ends of each lane, headers striped, jamb lights in the wall
  for (const [lx1, lx2] of HV_LANES) {
    for (const z of [Z1, Z2]) {
      c.clear(lx1 + 1, WALK, z, lx2 - 1, WALK + 6, z);
      for (let x = lx1 + 1; x <= lx2 - 1; x++) c.set(x, WALK + 7, z, x % 2 ? B.yellow : B.black);
      c.set(lx1, WALK + 5, z, B.sea); c.set(lx2, WALK + 5, z, B.sea);
    }
    // lane markings and flush floor lights along each lane
    for (let z = Z1; z <= Z2; z++) { c.set(lx1 + 1, WALK - 1, z, B.yellow); c.set(lx2 - 1, WALK - 1, z, B.yellow); }
    for (let z = Z1 + 3; z < Z2; z += 5) c.set(Math.floor((lx1 + lx2) / 2) - 3, WALK - 1, z, B.sea);
  }
  // inspection pits (lanes 1 and 2) with steps down and lights set into the pit walls
  for (const [lx1, lx2] of HV_LANES.slice(0, 2)) {
    const mx = Math.floor((lx1 + lx2) / 2);
    c.clear(mx - 1, WALK - 3, 6, mx + 1, WALK - 1, 18);
    c.fill(mx - 1, WALK - 4, 6, mx + 1, WALK - 4, 18, B.concrete);
    for (const x of [mx - 2, mx + 2]) for (let z = 6; z <= 18; z++) { c.fill(x, WALK - 3, z, x, WALK - 2, z, z % 4 === 0 ? B.sea : B.concrete); c.set(x, WALK - 1, z, B.yellow); }
    for (const z of [5, 19]) for (let x = mx - 2; x <= mx + 2; x++) c.fill(x, WALK - 3, z, x, WALK - 1, z, B.concrete);
    c.clear(mx, WALK - 3, 17, mx, WALK - 1, 19);
    c.fill(mx, WALK - 4, 17, mx, WALK - 4, 19, B.concrete);
    for (let k = 0; k < 3; k++) { c.set(mx, WALK - 3 + k, 17 + k, c.stairs("minecraft:polished_deepslate_stairs", "south")); }
    for (let x = mx - 1; x <= mx + 1; x++) c.set(x, WALK - 1, 6, B.yellow);
  }
  // lane 3: wash bay — flat floor with flush drain channels (no trapdoors: vehicles roll straight over)
  for (let z = 4; z <= 20; z += 4) for (let x = 24; x <= 30; x++) c.set(x, WALK - 1, z, B.grey);
  // overhead gantry crane across the hall on rails along the side walls (well above vehicle height)
  for (let z = Z1 + 1; z < Z2; z++) { c.set(X1 + 1, WALK + 8, z, B.yellow); c.set(X2 - 1, WALK + 8, z, B.yellow); }
  for (let x = X1 + 1; x <= X2 - 1; x++) c.set(x, WALK + 8, 12, B.yellow);
  c.fill(16, WALK + 7, 12, 18, WALK + 7, 12, B.blackstone);
  // between-lane service strips: tool benches and parts racks (outside the lanes)
  for (const x of [12, 22]) for (let z = 3; z <= 21; z++) {
    const item = z % 6 === 0 ? B.anvil : z % 6 === 2 ? B.crafting : z % 6 === 4 ? B.smithing : c.barrel("north");
    c.set(x, WALK, z, (z % 2 === 1) ? c.slabTop("minecraft:polished_blackstone_slab") : item);
  }
  // corner parts store and office (outside the lanes, along the east and west walls)
  for (const x of [2, 32]) for (let z = 2; z <= 22; z += 4) { c.set(x, WALK, z, c.barrel(x === 2 ? "east" : "west")); c.set(x, WALK + 1, z, c.barrel(x === 2 ? "east" : "west")); }
  hazardBorder(c, X1 + 1, WALK - 1, Z1 + 1, X2 - 1, Z1 + 1);
  // forecourt
  for (let z = Z2 + 1; z < size.z; z++) for (const [lx1, lx2] of HV_LANES) for (let x = lx1 + 1; x <= lx2 - 1; x++) c.set(x, WALK - 1, z, B.black);
}
