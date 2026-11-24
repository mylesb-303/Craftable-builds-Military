import { kit, latticeMast } from "../kit.js";
import { furnishRoom } from "../interiors.js";
import { asphalt, shoulder, blastPad, runwayRows, centreline, taxiCell, TAXI_W, RUNWAY_W } from "./airfield.js";

// ---------------------------------------------------------------------------
// Airfield expansion (v1.12):
//   taxiway pieces   — left-hand 90° corner, long straight (3×), T-junction
//   runway pieces    — arresting gear (cable) section, runway-end overrun
//   landing aids     — ILS localiser array, ILS glideslope mast, VOR/DME beacon
//   aircraft support — bomb-loading revetments, B-52 tail dock, MQ-9 shelter + GCS
// Snap conventions match airfield.js: surface y = 1, "in" joins the previous
// piece, "out"/"branch" continue. Everything near a runway or taxiway is flush
// with the surface (nothing for a wingtip to hit).
// ---------------------------------------------------------------------------

const SY = 1;
const TC = 12; // taxiway centreline offset (matches the straight)
const RC = 27; // runway centreline x
const WALK = 2; // building floor level (foundation depth 2)

export const EXTRA_SIZES = {
  taxiway_corner_left: { x: 45, y: 6, z: 45 },
  taxiway_straight_long: { x: TAXI_W, y: 6, z: 96 },
  taxiway_t_junction: { x: 69, y: 6, z: 45 },
  runway_arresting_gear: { x: RUNWAY_W, y: 6, z: 32 },
  runway_overrun: { x: RUNWAY_W, y: 6, z: 48 },
  ils_localiser: { x: 33, y: 9, z: 11 },
  ils_glideslope: { x: 11, y: 20, z: 11 },
  vor_beacon: { x: 25, y: 12, z: 25 },
  bomb_loading_revetments: { x: 69, y: 10, z: 44 },
  b52_tail_dock: { x: 41, y: 22, z: 32 },
  mq9_drone_shelter: { x: 41, y: 12, z: 26 }
};

export const EXTRA_SNAP = {
  taxiway_corner_left: { in: { x: 32, z: 44, dir: "south" }, out: { x: 0, z: TC, dir: "west" } },
  taxiway_straight_long: { in: { x: TC, z: 95, dir: "south" }, out: { x: TC, z: 0, dir: "north" } },
  taxiway_t_junction: { in: { x: 34, z: 44, dir: "south" }, out: { x: 68, z: TC, dir: "east" }, branch: { x: 0, z: TC, dir: "west" }, labels: { out: "Right Exit", branch: "Left Exit" } },
  runway_arresting_gear: { in: { x: RC, z: 31, dir: "south" }, out: { x: RC, z: 0, dir: "north" } },
  runway_overrun: { in: { x: RC, z: 47, dir: "south" } }
};

/** Aircraft clearance boxes (must stay empty) for the hangar-style builds. */
export const EXTRA_ENVELOPES = {
  bomb_loading_revetments: [
    { x1: 4, x2: 31, y1: WALK, y2: WALK + 5, z1: 5, z2: 43 },
    { x1: 37, x2: 64, y1: WALK, y2: WALK + 5, z1: 5, z2: 43 }
  ],
  b52_tail_dock: [
    { x1: 10, x2: 30, y1: WALK, y2: WALK + 6, z1: 7, z2: 31 },  // horizontal stabiliser + fuselage
    { x1: 17, x2: 23, y1: WALK, y2: WALK + 13, z1: 7, z2: 31 }  // fin
  ],
  mq9_drone_shelter: [{ x1: 2, x2: 24, y1: WALK, y2: WALK + 4, z1: 2, z2: 25 }]
};

const ctx = (id, d, o, r, v) => ({ c: kit(d, o, r, EXTRA_SIZES[id], v), size: EXTRA_SIZES[id] });

/** Paint a sampled polyline as a lit yellow line (deduplicated). */
function painter(c) {
  const seen = new Set();
  let n = 0;
  return (pts, every = 10) => {
    for (const [fx, fz] of pts) {
      const x = Math.round(fx), z = Math.round(fz), k = `${x},${z}`;
      if (seen.has(k)) continue;
      seen.add(k);
      c.set(x, SY, z, n++ % every === Math.floor(every / 2) ? c.B.sea : c.B.yellow);
    }
  };
}
const arcPts = (cx, cz, r, a0, a1) => {
  const out = [], steps = Math.ceil(Math.abs(a1 - a0) * r * 3);
  for (let i = 0; i <= steps; i++) { const a = a0 + ((a1 - a0) * i) / steps; out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
  return out;
};

// ---------------------------------------------------------------------------
// Taxiway: left-hand 90° corner (mirror of the right-hand corner)
// Entry at the south edge (x 20..44), exit at the west edge (z 0..24).
// ---------------------------------------------------------------------------
export function buildTaxiwayCornerLeft(dimension, origin, rotation, variantId) {
  const { c } = ctx("taxiway_corner_left", dimension, origin, rotation, variantId);
  for (let x = 0; x < 45; x++) for (let z = 0; z < 45; z++) {
    const r = Math.hypot(x + 0.5, 45 - (z + 0.5));
    const u = Math.round(44.5 - r);
    if (u < 0 || u > TAXI_W - 1) continue;
    taxiCell(c, x, z, u);
  }
  let n = 0;
  for (let x = 0; x < 45; x++) for (let z = 0; z < 45; z++) {
    const r = Math.hypot(x + 0.5, 45 - (z + 0.5));
    if (Math.abs(r - (44.5 - TC)) < 0.55) c.set(x, SY, z, (n++ % 10 === 5) ? c.B.sea : c.B.yellow);
  }
}

// ---------------------------------------------------------------------------
// Taxiway: long straight (3 × the standard 32-block piece)
// ---------------------------------------------------------------------------
export function buildTaxiwayStraightLong(dimension, origin, rotation, variantId) {
  const { c } = ctx("taxiway_straight_long", dimension, origin, rotation, variantId);
  for (let z = 0; z < 96; z++) {
    for (let x = 0; x < TAXI_W; x++) taxiCell(c, x, z, x);
    c.set(TC, SY, z, z % 10 === 5 ? c.B.sea : c.B.yellow);
  }
}

// ---------------------------------------------------------------------------
// Taxiway: T-junction. Stem enters from the south (x 22..46); the crossing
// taxiway runs along z 0..24 and leaves both west and east. Rounded fillets
// and smooth curved centrelines turn both ways; the crossing line runs straight.
// ---------------------------------------------------------------------------
export function buildTaxiwayTJunction(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("taxiway_t_junction", dimension, origin, rotation, variantId);
  const W = size.x, D = size.z, SX1 = 22, SX2 = 46, SC = 34, F = 12; // F = fillet radius
  // pavement: crossing band, stem band, and the two rounded fillets between them
  const pave = (x, z) => {
    if (x < 0 || x >= W || z < 0 || z >= D) {
      // openings continue the pavement beyond the piece edge
      if (z >= D && x >= SX1 && x <= SX2) return true;
      if ((x < 0 || x >= W) && z >= 0 && z <= 24) return true;
      return false;
    }
    if (z <= 24) return true;
    if (x >= SX1 && x <= SX2) return true;
    for (const [fx, sgn] of [[SX1 - F, -1], [SX2 + F, 1]]) {
      // fillet square beside the stem, minus a quarter circle centred away from it
      const inSq = sgn < 0 ? x >= SX1 - F && x < SX1 : x > SX2 && x <= SX2 + F;
      if (inSq && z <= 24 + F && Math.hypot(x + 0.5 - (fx + (sgn < 0 ? 0 : 1)), z + 0.5 - (25 + F)) > F) return true;
    }
    return false;
  };
  // edge distance (0 = shoulder, 1 = white edge line, 2+ = asphalt)
  const dist = (x, z) => {
    for (let d = 0; d <= 1; d++) for (let dx = -d - 1; dx <= d + 1; dx++) for (let dz = -d - 1; dz <= d + 1; dz++) {
      if (Math.abs(dx) + Math.abs(dz) !== d + 1) continue;
      if (!pave(x + dx, z + dz)) return d;
    }
    return 2;
  };
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    if (!pave(x, z)) continue;
    const d = dist(x, z);
    c.set(x, SY - 1, z, c.B.concrete);
    c.set(x, SY, z, d === 0 ? shoulder(c, x, z) : d === 1 ? c.B.white : asphalt(c, x, z));
  }
  const paint = painter(c);
  // crossing taxiway centreline straight through, stem centreline up to the crossing
  paint(Array.from({ length: W }, (_, x) => [x, TC]));
  const R = 22;
  paint(Array.from({ length: D - (TC + R) }, (_, i) => [SC, D - 1 - i]));
  // smooth curves from the stem onto the crossing, both directions
  paint(arcPts(SC + R, TC + R, R, Math.PI, Math.PI * 1.5));   // right turn
  paint(arcPts(SC - R, TC + R, R, 0, -Math.PI / 2));          // left turn
  // stem-to-crossing straight join (taxiing straight across)
  paint(Array.from({ length: R + 1 }, (_, i) => [SC, TC + R - i]));
}

// ---------------------------------------------------------------------------
// Runway: arresting gear section (BAK-12 style). Flush cable across the runway
// on rubber support discs, yellow arresting-gear discs painted either side,
// cable sheave pits flush in the shoulders. Snaps like a straight runway piece.
// ---------------------------------------------------------------------------
export function buildRunwayArrestingGear(dimension, origin, rotation, variantId) {
  const { c } = ctx("runway_arresting_gear", dimension, origin, rotation, variantId);
  runwayRows(c, 0, 31);
  centreline(c, 0, 31);
  const CZ = 16;
  // the pendant cable: a dark line across the whole runway, with support discs every 3 blocks
  for (let x = 0; x < RUNWAY_W; x++) c.set(x, SY, CZ, x % 3 === 0 ? c.B.grey : c.B.blackstone);
  // yellow arresting-gear markers (discs) painted either side of the cable, both sides of the runway
  for (const mx of [12, 42]) for (const mz of [CZ - 5, CZ + 5]) {
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (dx * dx + dz * dz <= 5) c.set(mx + dx, SY, mz + dz, c.B.yellow);
  }
  // sheave / tape pits flush in both shoulders, with flush amber marker lights
  for (const x0 of [0, RUNWAY_W - 4]) {
    for (let x = x0; x < x0 + 4; x++) for (let z = CZ - 2; z <= CZ + 2; z++) c.set(x, SY, z, (x + z) % 2 ? c.B.black : c.B.yellow);
    c.set(x0 + 1, SY, CZ - 3, c.B.froglight); c.set(x0 + 2, SY, CZ + 3, c.B.froglight);
    c.set(x0 + 1, SY - 1, CZ, c.B.iron); // anchor block under the pit
  }
}

// ---------------------------------------------------------------------------
// Runway end overrun: last 9 blocks of runway, a red runway-end light bar, then a
// paved overrun with yellow chevrons pointing to the end and flush approach lights.
// "in" joins the far end of a runway section (it ends the runway).
// ---------------------------------------------------------------------------
export function buildRunwayOverrun(dimension, origin, rotation, variantId) {
  const { c } = ctx("runway_overrun", dimension, origin, rotation, variantId);
  runwayRows(c, 39, 47);
  centreline(c, 39, 47);
  // runway end lights: red across the full width (lamps kept lit from below)
  for (let x = 0; x < RUNWAY_W; x++) {
    c.set(x, SY - 1, 38, x % 3 === 1 ? c.P("minecraft:redstone_block") : c.B.concrete);
    c.set(x, SY, 38, x % 3 === 1 ? c.B.lamp : c.B.red);
  }
  // overrun / stopway surface with chevrons pointing toward the end (low z)
  runwayRows(c, 0, 37, { pad: true, noLamps: true });
  for (let k = 0; k < 4; k++) {
    const apex = 3 + k * 9;
    for (let x = 6; x <= 48; x++) {
      const zc = apex + 9 - 0.6 * Math.abs(x - RC); // chevrons point back toward the runway
      for (let z = Math.round(zc); z <= Math.round(zc) + 1; z++) if (z >= 1 && z <= 37) c.set(x, SY, z, c.B.yellow);
    }
  }
  // flush red side lights along the overrun edges and a white end line
  for (let z = 2; z <= 36; z += 4) { c.set(2, SY, z, c.B.red); c.set(RUNWAY_W - 3, SY, z, c.B.red); }
  for (let x = 0; x < RUNWAY_W; x++) c.set(x, SY, 0, c.B.white);
}

// ---------------------------------------------------------------------------
// Landing aids
// ---------------------------------------------------------------------------

/** Small equipment shelter with a door on the south side and a warning light. */
function shelter(c, x1, z1, x2, z2, h = 3) {
  const B = c.B;
  c.room(x1, WALK - 1, z1, x2, WALK + h, z2, c.V.wall, c.V.floor, B.tile);
  c.clear(Math.floor((x1 + x2) / 2), WALK, z2, Math.floor((x1 + x2) / 2), WALK + 1, z2);
  furnishRoom(c, { x1: x1 + 1, z1: z1 + 1, x2: x2 - 1, z2: z2 - 1, walk: WALK, h, type: "servers", door: "south", doorU: Math.floor((x2 - x1) / 2) - 1, wallLights: false });
}

/**
 * ILS localiser array: 14 antenna elements on a long concrete pad, placed on the
 * extended centreline beyond the far runway end, with its equipment shelter behind.
 */
export function buildIlsLocaliser(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("ils_localiser", dimension, origin, rotation, variantId);
  const B = c.B;
  c.fill(0, WALK - 2, 0, size.x - 1, WALK - 2, size.z - 1, B.concrete);
  c.fill(1, WALK - 1, 5, size.x - 2, WALK - 1, 7, B.smooth);
  // elements: twin dipoles on posts, every 2 blocks
  for (let x = 3; x <= 29; x += 2) {
    c.fill(x, WALK, 6, x, WALK + 2, 6, B.bars);
    c.set(x, WALK + 3, 6, c.P("minecraft:end_rod"));
    c.set(x, WALK + 2, 5, B.bars); c.set(x, WALK + 2, 7, B.bars);
  }
  for (let x = 2; x <= 30; x++) c.set(x, WALK, 7, B.grey); // feeder cable duct
  for (const x of [1, 31]) c.warnLight(x, WALK, 6);
  shelter(c, 13, 0, 19, 4, 3);
  for (let x = 3; x <= 29; x += 4) c.set(x, WALK - 1, 9, B.froglight); // flush pad lights
}

/** ILS glideslope mast: lattice mast with three antennas, beside the touchdown zone. */
export function buildIlsGlideslope(dimension, origin, rotation, variantId) {
  const { c } = ctx("ils_glideslope", dimension, origin, rotation, variantId);
  const B = c.B;
  c.fill(0, WALK - 2, 0, 10, WALK - 2, 10, B.concrete);
  c.fill(0, WALK - 1, 0, 10, WALK - 1, 10, B.smooth);
  latticeMast(c, { x: 1, z: 1, y1: WALK, y2: WALK + 15, width: 3 });
  // three antennas stacked on the runway-facing (east) side of the mast
  for (const y of [WALK + 4, WALK + 8, WALK + 12]) {
    c.set(4, y, 2, B.iron); c.set(5, y, 2, c.P("minecraft:end_rod"));
    c.set(4, y + 1, 2, c.slabTop("minecraft:smooth_stone_slab"));
  }
  shelter(c, 5, 5, 10, 10, 3);
}

/**
 * VOR/DME beacon: white cone-roofed equipment house in the middle of a raised
 * circular counterpoise disc on posts, with the antenna ring on top.
 */
export function buildVorBeacon(dimension, origin, rotation, variantId) {
  const { c } = ctx("vor_beacon", dimension, origin, rotation, variantId);
  const B = c.B;
  const cx = 12, cz = 12, DISC = WALK + 4;
  c.fill(0, WALK - 2, 0, 24, WALK - 2, 24, B.concrete);
  c.fill(0, WALK - 1, 0, 24, WALK - 1, 24, B.grass);
  // counterpoise disc on a ring of posts, with an access stair
  for (let x = 0; x <= 24; x++) for (let z = 0; z <= 24; z++) {
    const d = Math.hypot(x - cx, z - cz);
    if (d <= 11.5) c.set(x, DISC, z, d > 10.5 ? B.iron : c.P("minecraft:smooth_stone_slab"));
    if (d <= 11.5 && d > 10.5 && (x + z) % 4 === 0) c.fill(x, WALK, z, x, DISC - 1, z, B.blackstoneBricks);
  }
  // 2-wide stair from the ground up onto the disc (top step at disc level)
  for (let i = 0; i <= 4; i++) for (const x of [11, 12]) {
    c.set(x, WALK + i, 24 - i, c.stairs("minecraft:polished_deepslate_stairs", "north"));
    c.clear(x, WALK + i + 1, 24 - i, x, WALK + i + 3, 24 - i);
  }
  // equipment house under the disc (shelter) and the white cone house on top
  shelter(c, 9, 9, 15, 15, 3);
  for (let y = DISC + 1; y <= DISC + 4; y++) {
    const r = 3.5 - (y - DISC - 1) * 0.8;
    for (let x = cx - 4; x <= cx + 4; x++) for (let z = cz - 4; z <= cz + 4; z++) if (Math.hypot(x - cx, z - cz) <= r) c.set(x, y, z, B.white);
  }
  // antenna ring (alford loops) around the cone and the DME aerial on top
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    c.set(Math.round(cx + Math.cos(a) * 5), DISC + 1, Math.round(cz + Math.sin(a) * 5), B.bars);
  }
  c.fill(cx, DISC + 5, cz, cx, DISC + 6, cz, B.bars);
  c.warnLight(cx, DISC + 7, cz);
}

// ---------------------------------------------------------------------------
// Bomb-loading revetments: two U-shaped blast-wall bays, open to the front,
// each 29 wide inside (A-10 / F-15E span with clearance). Munitions trailers
// and bomb racks sit behind the blast wall of each bay, a loading crew shelter
// between the bays, solid lit lead-in lines, flat floors.
// ---------------------------------------------------------------------------
export function buildBombLoadingRevetments(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("bomb_loading_revetments", dimension, origin, rotation, variantId);
  const B = c.B, V = c.V;
  c.fill(0, WALK - 2, 0, size.x - 1, WALK - 2, size.z - 1, B.concrete);
  c.fill(0, WALK - 1, 0, size.x - 1, WALK - 1, size.z - 1, B.smooth);
  const H = 7; // blast walls 7 high
  // walls: 3 thick (face, earth-filled core, face) — west, middle, east, and the back
  const wall = (x1, z1, x2, z2) => {
    for (let x = x1; x <= x2; x++) for (let z = z1; z <= z2; z++) for (let y = WALK; y < WALK + H; y++) {
      const face = x === x1 || x === x2 || z === z1 || z === z2;
      c.set(x, y, z, face ? (y % 3 === 0 ? B.tile : V.wall) : B.dirt);
    }
    for (let x = x1; x <= x2; x++) for (let z = z1; z <= z2; z++) c.set(x, WALK + H, z, B.blackstoneBricks);
  };
  wall(0, 0, 68, 2);      // back
  wall(0, 3, 2, 37);      // west
  wall(33, 3, 35, 37);    // middle
  wall(66, 3, 68, 37);    // east
  for (const x0 of [3, 36]) {
    const cx = x0 + 14;
    // solid lit lead-in line, stop bar and wheel chocks marks
    for (let z = 6; z < size.z; z++) c.set(cx, WALK - 1, z, z % 8 === 4 ? B.sea : B.yellow);
    for (let x = cx - 3; x <= cx + 3; x++) c.set(x, WALK - 1, 6, B.white);
    // weapons staging box (red/white hatched) along the back wall
    for (let x = x0 + 1; x <= x0 + 27; x++) for (const z of [3, 4]) c.set(x, WALK - 1, z, (x + z) % 2 ? B.red : B.white);
    // flush floor lights
    for (let z = 10; z <= 34; z += 8) for (const dx of [-9, 9]) c.set(cx + dx, WALK - 1, z, B.sea);
    // munitions trailers (bombs on racks) parked against the back wall, below the wing line
    for (const tx of [x0 + 3, x0 + 23]) {
      c.fill(tx, WALK, 3, tx + 2, WALK, 3, c.slabTop("minecraft:smooth_stone_slab"));
      c.set(tx, WALK + 1, 3, B.grey); c.set(tx + 1, WALK + 1, 3, B.grey); c.set(tx + 2, WALK + 1, 3, c.P("minecraft:gray_concrete_powder"));
    }
    // floodlights set into the top of the walls, facing into the bay
    for (let z = 8; z <= 32; z += 8) { c.set(x0 - 1, WALK + H - 1, z, B.sea); c.set(x0 + 30, WALK + H - 1, z, B.sea); }
    c.warnLight(cx, WALK + H + 1, 1);
  }
  // the apron in front is flat for towing
  for (let x = 0; x < size.x; x++) for (let z = 38; z < size.z; z++) if (x % 33 !== 17) c.set(x, WALK - 1, z, asphalt(c, x, z));
}

// ---------------------------------------------------------------------------
// B-52 tail maintenance dock. The bomber backs in tail-first through a 23-wide,
// 15-tall door; the wings stay outside. Inside: two-level work platforms either
// side of the fin (clear of the tail), 2-wide stairs, rear workshop and stores,
// overhead gantry, lights in the roof. Aircraft space is kept empty.
// ---------------------------------------------------------------------------
export function buildB52TailDock(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("b52_tail_dock", dimension, origin, rotation, variantId);
  const B = c.B, V = c.V;
  const X2 = size.x - 1, FRONT = size.z - 1, H = 18;
  c.fill(0, WALK - 2, 0, X2, WALK - 2, FRONT, B.concrete);
  c.fill(0, WALK - 1, 0, X2, WALK - 1, FRONT, B.smooth);
  c.walls(0, WALK, 0, X2, WALK + H - 1, FRONT, V.wall);
  for (let z = 0; z <= FRONT; z += 5) for (const x of [0, X2]) c.fill(x, WALK, z, x, WALK + H - 1, z, V.frame);
  for (let x = 0; x <= X2; x += 5) c.fill(x, WALK, 0, x, WALK + H - 1, 0, V.frame);
  c.clear(1, WALK, 1, X2 - 1, WALK + H - 1, FRONT - 1);
  // roof with recessed lights and an overhead gantry rail
  for (let x = 0; x <= X2; x++) for (let z = 0; z <= FRONT; z++) c.set(x, WALK + H, z, x % 6 === 3 && z % 5 === 2 && x > 0 && x < X2 ? B.sea : B.tile);
  for (const x of [8, 32]) for (let z = 1; z < FRONT; z++) c.set(x, WALK + H - 1, z, B.blackstone);
  for (let x = 9; x <= 31; x++) c.set(x, WALK + H - 1, 18, B.yellow); // gantry beam
  // tail door: 23 wide x 15 tall, hazard frame, retracted leaf pockets
  c.clear(9, WALK, FRONT, 31, WALK + 14, FRONT);
  for (let x = 8; x <= 32; x++) c.set(x, WALK + 15, FRONT, x % 2 ? B.yellow : B.black);
  for (const x of [8, 32]) for (let y = WALK; y <= WALK + 14; y++) c.set(x, y, FRONT, (y % 2) ? B.yellow : B.black);
  // clerestory windows on the side walls
  for (let z = 2; z < FRONT; z++) if (z % 5) for (const x of [0, X2]) { c.set(x, WALK + 12, z, B.glass); c.set(x, WALK + 13, z, B.glass); }
  // rear block: workshop + stores (z 1..5), roof at WALK+5 doubles as a viewing deck
  c.fill(1, WALK, 6, X2 - 1, WALK + 4, 6, V.wall);
  c.fill(20, WALK, 1, 20, WALK + 4, 5, V.wall);
  for (const [x1, x2, type] of [[1, 19, "workshop"], [21, 39, "storage"]]) {
    const mid = Math.floor((x1 + x2) / 2);
    c.clear(mid, WALK, 6, mid + 1, WALK + 2, 6);
    furnishRoom(c, { x1, z1: 1, x2, z2: 5, walk: WALK, h: 4, type, door: "south", doorU: mid - x1 });
  }
  c.fill(1, WALK + 5, 1, X2 - 1, WALK + 5, 6, B.andesite);
  // work platforms at WALK+7 either side of the fin (x 2..16 and 24..38, z 7..22), above the
  // tailplane and clear of the fin; each reached by a 2-wide stair along the side wall
  const PY = WALK + 7, PZ2 = 22;
  for (const [x1, x2, railX, sx] of [[2, 16, 16, 3], [24, 38, 24, 36]]) {
    c.fill(x1, PY, 7, x2, PY, PZ2, c.P("minecraft:iron_block"));
    for (let z = 7; z <= PZ2; z++) c.set(railX, PY + 1, z, B.rail);
    for (let x = x1; x <= x2; x++) if (x !== sx && x !== sx + 1) c.set(x, PY + 1, PZ2, B.rail);
    const wallX = x1 === 2 ? 2 : 38;
    for (const z of [8, 15]) c.fill(wallX, WALK, z, wallX, PY - 1, z, B.blackstoneBricks);
    for (let z = 9; z <= 21; z += 4) c.set(x1 === 2 ? 6 : 34, PY, z, B.sea);
    // stair: 8 steps from the floor at z30 up to the platform edge at z23
    for (let i = 0; i <= 7; i++) for (const x of [sx, sx + 1]) {
      const z = 30 - i;
      c.set(x, WALK + i, z, c.stairs("minecraft:polished_deepslate_stairs", "north"));
      if (i > 0) c.fill(x, WALK, z, x, WALK + i - 1, z, B.concrete);
      c.clear(x, WALK + i + 1, z, x, WALK + i + 3, z);
    }
    for (let i = 1; i <= 7; i++) { const z = 30 - i, ox = sx === 3 ? 5 : 35; c.set(ox, WALK + i + 1, z, B.rail); }
  }
  // floor: solid lit lead-in centreline, tail stop bar, flush lights
  for (let z = 7; z <= FRONT; z++) c.set(20, WALK - 1, z, z % 8 === 4 ? B.sea : B.yellow);
  for (let x = 16; x <= 24; x++) c.set(x, WALK - 1, 7, B.white);
  for (let z = 10; z <= 28; z += 6) for (const x of [6, 34]) c.set(x, WALK - 1, z, B.sea);
  c.warnLight(20, WALK + H + 1, 0);
}

// ---------------------------------------------------------------------------
// MQ-9 drone shelter + ground control station. Open-fronted sun shelter sized
// for an MQ-9 (20 m span) and a GCS cabin beside it with two pilot/sensor
// consoles facing a wall of screens, satellite dish and antenna mast on the roof.
// ---------------------------------------------------------------------------
export function buildMq9DroneShelter(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("mq9_drone_shelter", dimension, origin, rotation, variantId);
  const B = c.B, V = c.V;
  c.fill(0, WALK - 2, 0, size.x - 1, WALK - 2, size.z - 1, B.concrete);
  c.fill(0, WALK - 1, 0, size.x - 1, WALK - 1, size.z - 1, B.smooth);
  // shelter: x 0..26, z 0..20, open front (south); low curved roof
  c.walls(0, WALK, 0, 26, WALK + 6, 20, V.wall);
  c.clear(1, WALK, 1, 25, WALK + 6, 19);
  c.clear(1, WALK, 20, 25, WALK + 5, 20); // open front
  for (let x = 0; x <= 26; x++) {
    const lift = Math.round(2 * Math.sin((x / 26) * Math.PI));
    for (let z = 0; z <= 20; z++) c.set(x, WALK + 6 + lift, z, z % 5 === 2 && x % 6 === 3 ? B.sea : V.camoA);
    for (let y = WALK + 6; y < WALK + 6 + lift; y++) { c.set(x, y, 0, V.wall); c.set(x, y, 20, V.wall); }
  }
  for (let x = 0; x <= 26; x++) c.set(x, WALK + 6, 20, x % 2 ? B.yellow : B.black);
  // floor: solid lit centreline, stop bar, tie-downs
  for (let z = 4; z < size.z; z++) c.set(13, WALK - 1, z, z % 8 === 4 ? B.sea : B.yellow);
  for (let x = 10; x <= 16; x++) c.set(x, WALK - 1, 4, B.white);
  for (const [x, z] of [[5, 8], [21, 8], [5, 16], [21, 16]]) c.set(x, WALK - 1, z, B.sea);
  // ground control station cabin x 29..40, z 2..14
  c.room(29, WALK - 1, 2, 40, WALK + 4, 14, V.wall, V.floor, B.tile);
  c.clear(34, WALK, 14, 35, WALK + 2, 14);
  for (const z of [5, 6, 9, 10]) { c.set(40, WALK + 2, z, B.tinted); c.set(29, WALK + 2, z, B.tinted); }
  // wall of screens on the back wall, two pilot/sensor-operator stations facing it
  for (let x = 30; x <= 39; x++) for (let y = WALK + 1; y <= WALK + 3; y++) c.set(x, y, 3, (x + y) % 3 ? B.blackGlass : B.cyanGlass);
  for (const x of [31, 32, 37, 38]) { c.set(x, WALK, 5, c.P("minecraft:polished_deepslate_slab", { "minecraft:vertical_half": "top" })); c.set(x, WALK + 1, 5, c.P("minecraft:black_stained_glass_pane")); }
  c.chair(31, WALK, 6, "north"); c.chair(32, WALK, 6, "north"); c.chair(37, WALK, 6, "north"); c.chair(38, WALK, 6, "north");
  c.set(30, WALK, 13, c.barrel("north")); c.set(39, WALK, 13, c.facing("minecraft:chest", "north"));
  for (let x = 31; x <= 38; x += 3) c.set(x, WALK + 4, 9, B.sea);
  // roof: satellite dish (simple) and antenna mast with warning light
  c.fill(31, WALK + 5, 8, 33, WALK + 5, 10, B.iron);
  c.set(32, WALK + 6, 9, B.blackstone);
  for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1], [0, 0]]) c.set(32 + dx, WALK + 7, 9 + dz, B.white);
  c.set(32, WALK + 8, 9, c.P("minecraft:end_rod"));
  c.fill(38, WALK + 5, 12, 38, WALK + 9, 12, B.bars);
  c.warnLight(38, WALK + 10, 12);
  // generator and fuel bowser bay
  c.fill(30, WALK, 17, 33, WALK + 1, 19, B.grey); c.set(31, WALK + 2, 18, B.blackstone);
  c.fill(36, WALK, 17, 39, WALK, 19, c.P("minecraft:green_concrete"));
}
