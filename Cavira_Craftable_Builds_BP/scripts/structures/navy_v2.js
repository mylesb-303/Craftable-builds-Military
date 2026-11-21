import { kit, hazardBorder } from "../kit.js";
import { furnishRoom } from "../interiors.js";
import { stairFlight } from "../buildings.js";
import { berm } from "./facilities.js";

// ---------------------------------------------------------------------------
// Waterfront builds, redesigned in v1.8.0. Footprints, deck levels and water
// channels are unchanged so existing layouts still join up.
// References: UFC 4-152-01 Piers and Wharves and MIL-HDBK-1025/1 (fender
// piles and rubber fenders on the berthing face, bollards and double bitts,
// utility trenches with flush covers, shore-power and water pedestals, crane
// rails, deck lighting, brows/gangways, camels), dockside fuelling manifolds
// with loading arms, graving-dock walls with stepped altars, caisson gates,
// rail-mounted portal cranes and casemated coastal batteries.
// Marine pieces place only their own blocks; the water around them is kept.
// Deck: structure y 3, surface y 4, walk level y 5. Piles y 0..2.
// ---------------------------------------------------------------------------

const DECK = 4;
const WALK = 5;

export const NAVY_SIZES = {
  pier_straight: { x: 15, y: 7, z: 31 },
  pier_corner: { x: 21, y: 7, z: 21 },
  pier_t_junction: { x: 31, y: 7, z: 21 },
  heavy_ship_berth: { x: 21, y: 8, z: 41 },
  submarine_service_berth: { x: 31, y: 8, z: 41 },
  naval_fueling_pier: { x: 17, y: 9, z: 31 },
  dry_dock_side: { x: 11, y: 12, z: 41 },
  dry_dock_gate_end: { x: 31, y: 12, z: 13 },
  nuclear_submarine_pen: { x: 39, y: 24, z: 45 },
  dockside_loading_crane: { x: 15, y: 26, z: 17 },
  coastal_defence_bunker: { x: 25, y: 10, z: 19 },
  seawall_module: { x: 21, y: 9, z: 7 }
};

const ctx = (id, d, o, r, v) => ({ c: kit(d, o, r, NAVY_SIZES[id], v), size: NAVY_SIZES[id] });

/** Flush trench cover / hatch (closed iron trapdoor in the upper half of the deck block). */
const cover = (c) => c.P("minecraft:iron_trapdoor", { upside_down_bit: true, open_bit: false, direction: 0 }, "minecraft:iron_trapdoor");

/** Pile-supported deck over the given rectangles. */
function deck(c, areas) {
  const B = c.B;
  for (const a of areas) {
    c.fill(a.x1, DECK - 1, a.z1, a.x2, DECK - 1, a.z2, B.concrete);
    for (let x = a.x1; x <= a.x2; x++) for (let z = a.z1; z <= a.z2; z++) c.set(x, DECK, z, (x + z) % 7 === 0 ? B.andesite : c.V.floor);
    // pile caps and piles on a 4 × 6 grid
    for (let x = a.x1 + 1; x <= a.x2 - 1; x += Math.max(1, Math.min(4, a.x2 - a.x1 - 1))) for (let z = a.z1 + 1; z <= a.z2; z += 6) c.fill(x, 0, z, x, DECK - 2, z, B.blackstoneBricks);
  }
}

/** Berthing face along x = xf between z1..z2 (outward direction dir = ±1): fender piles, rubber fenders, kerb, bollards. */
function berthingFace(c, xf, z1, z2, dir, opts = {}) {
  const B = c.B;
  for (let z = z1; z <= z2; z++) {
    // timber fender piles every 3, rubber fenders between them on the face
    if ((z - z1) % 3 === 0) c.fill(xf, 0, z, xf, DECK, z, c.P("minecraft:spruce_log"));
    else c.set(xf, DECK - 1, z, B.black);
    c.set(xf, DECK, z, (z - z1) % 3 === 0 ? c.P("minecraft:spruce_log") : B.yellow); // painted kerb line
  }
  // bollards and double bitts set back from the edge
  const xb = xf - dir;
  for (let z = z1 + 2; z <= z2 - 1; z += opts.bollardStep ?? 7) {
    c.set(xb, WALK, z, c.P("minecraft:polished_blackstone_wall"));
    if (opts.bitts) c.set(xb, WALK, z + 1, c.P("minecraft:polished_blackstone_wall"));
  }
  // deck lights set flush into the surface, two in from the edge
  for (let z = z1 + 4; z <= z2 - 1; z += 8) c.set(xf - 2 * dir, DECK, z, B.sea);
}

/** Utility trench with flush covers running along z at column x, plus service pedestals. */
function utilities(c, x, z1, z2, step = 10) {
  for (let z = z1; z <= z2; z++) c.set(x, DECK, z, z % 2 ? cover(c) : c.B.smooth);
  for (let z = z1 + 3; z <= z2 - 1; z += step) {
    c.set(x + 1, WALK, z, c.P("minecraft:iron_block")); // shore power / water pedestal
    c.set(x + 1, WALK + 1, z, c.P("minecraft:polished_blackstone_slab"));
  }
}

/** Crane rails flush in the deck along z at the given x columns. */
function craneRails(c, xs, z1, z2) {
  for (const x of xs) for (let z = z1; z <= z2; z++) c.set(x, DECK, z, c.P("minecraft:iron_block"));
}

// ---------------------------------------------------------------------------
// Piers
// ---------------------------------------------------------------------------
export function buildPierStraight(dimension, origin, rotation, variantId) {
  const { c } = ctx("pier_straight", dimension, origin, rotation, variantId);
  deck(c, [{ x1: 0, z1: 0, x2: 14, z2: 30 }]);
  berthingFace(c, 0, 0, 30, -1, { bitts: true });
  berthingFace(c, 14, 0, 30, 1, { bitts: true });
  utilities(c, 7, 0, 30);
  craneRails(c, [3, 11], 0, 30);
}

export function buildPierCorner(dimension, origin, rotation, variantId) {
  const { c } = ctx("pier_corner", dimension, origin, rotation, variantId);
  const B = c.B;
  deck(c, [{ x1: 0, z1: 0, x2: 8, z2: 20 }, { x1: 9, z1: 12, x2: 20, z2: 20 }]);
  berthingFace(c, 0, 0, 20, -1);
  // outer face of the turn (south edge) and inner corner faces
  for (let x = 1; x <= 20; x++) { c.set(x, DECK, 20, (x % 3 === 0) ? c.P("minecraft:spruce_log") : B.yellow); if (x % 3 === 0) c.fill(x, 0, 20, x, DECK - 1, 20, c.P("minecraft:spruce_log")); }
  for (let z = 0; z <= 11; z++) c.set(8, DECK, z, z % 3 === 0 ? c.P("minecraft:spruce_log") : B.yellow);
  for (let x = 9; x <= 20; x++) c.set(x, DECK, 12, x % 3 === 0 ? c.P("minecraft:spruce_log") : B.yellow);
  for (const [x, z] of [[1, 3], [1, 10], [1, 17], [6, 19], [13, 19], [19, 19], [7, 4], [15, 13]]) c.set(x, WALK, z, c.P("minecraft:polished_blackstone_wall"));
  utilities(c, 4, 0, 16);
  for (let x = 5; x <= 20; x++) c.set(x, DECK, 16, x % 2 ? cover(c) : B.smooth);
  for (const [x, z] of [[2, 6], [2, 14], [10, 18], [17, 18]]) c.set(x, DECK, z, B.sea);
}

export function buildPierTJunction(dimension, origin, rotation, variantId) {
  const { c } = ctx("pier_t_junction", dimension, origin, rotation, variantId);
  const B = c.B;
  deck(c, [{ x1: 10, z1: 0, x2: 20, z2: 20 }, { x1: 0, z1: 12, x2: 30, z2: 20 }]);
  berthingFace(c, 10, 0, 11, -1);
  berthingFace(c, 20, 0, 11, 1);
  for (let x = 0; x <= 30; x++) { c.set(x, DECK, 20, x % 3 === 0 ? c.P("minecraft:spruce_log") : B.yellow); if (x % 3 === 0) c.fill(x, 0, 20, x, DECK - 1, 20, c.P("minecraft:spruce_log")); }
  for (const x of [0, 30]) for (let z = 12; z <= 20; z++) c.set(x, DECK, z, B.yellow);
  for (const [x, z] of [[2, 19], [8, 19], [15, 19], [22, 19], [28, 19], [11, 5], [19, 5]]) c.set(x, WALK, z, c.P("minecraft:polished_blackstone_wall"));
  utilities(c, 15, 0, 15);
  for (let x = 0; x <= 30; x++) c.set(x, DECK, 16, x % 2 ? cover(c) : B.smooth);
  for (const [x, z] of [[12, 4], [18, 10], [4, 18], [26, 18], [15, 18]]) c.set(x, DECK, z, B.sea);
}

// ---------------------------------------------------------------------------
// Heavy Ship Berth — twin wharves with a head pier, brow tower, cargo rails
// ---------------------------------------------------------------------------
export function buildHeavyShipBerth(dimension, origin, rotation, variantId) {
  const { c } = ctx("heavy_ship_berth", dimension, origin, rotation, variantId);
  const B = c.B;
  deck(c, [{ x1: 0, z1: 0, x2: 5, z2: 40 }, { x1: 15, z1: 0, x2: 20, z2: 40 }, { x1: 6, z1: 34, x2: 14, z2: 40 }]);
  berthingFace(c, 5, 0, 33, 1, { bitts: true, bollardStep: 6 });
  berthingFace(c, 15, 0, 33, -1, { bitts: true, bollardStep: 6 });
  // floating camels (log fenders) keeping the hull off the piles
  for (const x of [6, 14]) for (let z = 2; z <= 32; z += 10) c.fill(x, DECK - 2, z, x, DECK - 2, z + 5, c.P("minecraft:spruce_log", { pillar_axis: "z" }));
  for (const x of [2, 18]) utilities(c, x, 0, 40, 8);
  // brow tower with stair to a gangway landing (west wharf)
  c.fill(1, WALK, 20, 4, WALK + 4, 23, c.P("minecraft:iron_bars"));
  c.clear(2, WALK, 21, 3, WALK + 4, 22);
  stairFlight(c, 2, 23, "north", WALK, 4, "minecraft:polished_deepslate_stairs");
  c.fill(2, WALK + 3, 19, 3, WALK + 3, 20, B.andesite);
  for (let x = 4; x <= 6; x++) c.set(x, WALK + 3, 20, c.slabTop("minecraft:spruce_slab")); // brow
  c.set(1, WALK + 4, 19, B.rail); c.set(4, WALK + 4, 19, B.rail);
  // head pier: shore crane rails and a lit utility vault
  for (let x = 6; x <= 14; x++) c.set(x, DECK, 37, c.P("minecraft:iron_block"));
  for (const x of [8, 12]) c.set(x, DECK, 39, B.sea);
  c.set(10, WALK, 38, c.P("minecraft:iron_block")); c.set(10, WALK + 1, 38, c.P("minecraft:polished_blackstone_slab"));
}

// ---------------------------------------------------------------------------
// Submarine Service Berth — 19-wide channel, submarine fender line, shore power,
// security boom and guard booth
// ---------------------------------------------------------------------------
export function buildSubmarineServiceBerth(dimension, origin, rotation, variantId) {
  const { c } = ctx("submarine_service_berth", dimension, origin, rotation, variantId);
  const B = c.B;
  deck(c, [{ x1: 0, z1: 0, x2: 5, z2: 40 }, { x1: 25, z1: 0, x2: 30, z2: 40 }, { x1: 6, z1: 35, x2: 24, z2: 40 }]);
  berthingFace(c, 5, 0, 34, 1, { bitts: true, bollardStep: 8 });
  berthingFace(c, 25, 0, 34, -1, { bitts: true, bollardStep: 8 });
  // submarine fenders: low floating camels just above the waterline
  for (const x of [6, 24]) for (let z = 3; z <= 31; z += 7) c.fill(x, DECK - 2, z, x, DECK - 2, z + 3, B.black);
  for (const x of [2, 28]) utilities(c, x, 0, 40, 7);
  // shore power cable trays from pedestals to the edge
  for (const [x, dir] of [[3, 1], [27, -1]]) for (let z = 6; z <= 30; z += 8) c.set(x + dir, DECK, z, cover(c));
  // security boom across the entrance (floating barrier line) with buoy lights
  for (let x = 6; x <= 24; x++) c.set(x, DECK - 2, 0, x % 4 === 2 ? B.red : B.yellow);
  // guard booth at the head of the berth, with glazing and recessed light
  c.walls(10, WALK, 36, 14, WALK + 3, 39, c.V.wall);
  c.clear(11, WALK, 37, 13, WALK + 3, 38);
  for (let x = 11; x <= 13; x++) c.set(x, WALK + 2, 36, B.tinted);
  c.clear(12, WALK, 39, 12, WALK + 2, 39);
  c.fill(10, WALK + 4, 36, 14, WALK + 4, 39, c.V.accent);
  c.set(12, WALK + 4, 37, B.sea);
  c.set(11, WALK, 37, c.slabTop("minecraft:dark_oak_slab")); c.chair(12, WALK, 37, "north");
  // head-pier lights
  for (const x of [8, 17, 22]) c.set(x, DECK, 37, B.sea);
}

// ---------------------------------------------------------------------------
// Naval Fuelling Pier — pipe rack, manifold platforms with loading arms,
// hose reels, fire monitors and spill kit
// ---------------------------------------------------------------------------
export function buildNavalFuelingPier(dimension, origin, rotation, variantId) {
  const { c } = ctx("naval_fueling_pier", dimension, origin, rotation, variantId);
  const B = c.B;
  deck(c, [{ x1: 0, z1: 0, x2: 16, z2: 30 }]);
  berthingFace(c, 0, 0, 30, -1, { bitts: true });
  berthingFace(c, 16, 0, 30, 1, { bitts: true });
  // central pipe rack on supports (pipes at walk + 1, clear walkway either side)
  for (let z = 0; z <= 30; z++) {
    if (z % 5 === 0) for (const x of [7, 9]) c.set(x, WALK, z, B.blackstoneBricks);
    for (const x of [7, 8, 9]) c.set(x, WALK + 1, z, x === 8 ? c.P("minecraft:iron_block") : (z % 5 === 0 ? B.blackstoneBricks : c.P("minecraft:iron_block")));
  }
  // manifold platforms with marine loading arms on both berths
  for (const [x, dir] of [[3, -1], [13, 1]]) for (const z of [7, 18]) {
    c.fill(x - 1, WALK, z, x + 1, WALK, z + 3, B.yellow);
    c.fill(x, WALK + 1, z + 1, x, WALK + 3, z + 1, c.P("minecraft:iron_block"));
    for (let k = 1; k <= 2; k++) c.set(x + dir * k, WALK + 3, z + 1, c.P("minecraft:iron_block"));
    c.set(x + dir * 2, WALK + 2, z + 1, c.P("minecraft:chain"));
    c.set(x - dir, WALK + 1, z + 2, c.barrel(dir > 0 ? "west" : "east")); // hose reel
    c.set(x, WALK + 1, z, c.P("minecraft:lever", undefined, "minecraft:stone_button"));
  }
  // fire monitors and spill kit
  for (const [x, z] of [[2, 2], [14, 2], [2, 28], [14, 28]]) c.fill(x, WALK, z, x, WALK + 1, z, B.red);
  c.set(8, WALK, 29, c.barrel("north"));
  hazardBorder(c, 6, DECK, 0, 10, 30);
}

// ---------------------------------------------------------------------------
// Graving dock pieces
// ---------------------------------------------------------------------------
export function buildDryDockSide(dimension, origin, rotation, variantId) {
  const { c } = ctx("dry_dock_side", dimension, origin, rotation, variantId);
  const B = c.B;
  // dock wall (x 0..3) with stepped altars down to the floor on the dock side (x 4..10)
  c.fill(0, 0, 0, 3, 8, 40, B.concrete);
  for (let k = 0; k < 4; k++) c.fill(4 + k, 0, 0, 4 + k, 6 - 2 * k, 40, B.concrete);
  c.fill(4, 0, 0, 10, 0, 40, B.concrete);
  // keel blocks on the dock floor
  for (let z = 2; z <= 38; z += 4) c.fill(9, 1, z, 10, 1, z + 1, B.blackstoneBricks);
  // coping: crane rail, bollards, capstans; safety rail on the dock edge
  for (let z = 0; z <= 40; z++) {
    c.set(1, 8, z, c.P("minecraft:iron_block"));
    c.set(3, 9, z, z % 6 === 0 ? B.yellow : B.rail);
  }
  for (let z = 3; z <= 39; z += 9) c.set(2, 9, z, c.P("minecraft:polished_blackstone_wall"));
  // ladders down the dock wall through notches in the altars, lights set into each altar riser
  for (const z of [10, 30]) {
    c.clear(4, 1, z, 7, 8, z);
    c.clear(3, 9, z, 3, 10, z);
    for (let y = 1; y <= 8; y++) c.set(4, y, z, c.ladder("east"));
  }
  for (let k = 0; k < 4; k++) for (let z = 4; z <= 36; z += 8) c.set(4 + k, 6 - 2 * k, z, B.sea);
  // drainage culvert grating along the floor
  for (let z = 0; z <= 40; z += 2) c.set(8, 0, z, cover(c));
}

export function buildDryDockGateEnd(dimension, origin, rotation, variantId) {
  const { c } = ctx("dry_dock_gate_end", dimension, origin, rotation, variantId);
  const B = c.B;
  // gate abutments
  c.fill(0, 0, 0, 5, 8, 12, B.concrete);
  c.fill(25, 0, 0, 30, 8, 12, B.concrete);
  // caisson gate: steel box with stiffener ribs, sits in its sill (z 8..12)
  for (let x = 6; x <= 24; x++) for (let y = 0; y <= 7; y++) for (let z = 8; z <= 12; z++) {
    const shell = z === 8 || z === 12 || y === 0 || y === 7;
    c.set(x, y, z, shell ? ((x % 3 === 0 && (z === 8 || z === 12)) ? B.tile : c.P("minecraft:gray_concrete")) : B.concrete);
  }
  // walkway across the top with railings and lights set into the deck
  for (let x = 0; x <= 30; x++) { c.set(x, 8, 9, x % 4 === 2 ? B.sea : c.V.floor); c.set(x, 8, 10, c.V.floor); c.set(x, 8, 11, c.V.floor); c.set(x, 9, 8, B.rail); c.set(x, 9, 12, B.rail); }
  // pump house on the west abutment
  c.walls(0, 9, 1, 5, 11, 6, c.V.wall);
  c.clear(1, 9, 2, 4, 11, 5);
  c.clear(3, 9, 6, 3, 10, 6);
  c.fill(0, 11, 1, 5, 11, 6, c.V.accent);
  c.set(2, 11, 3, B.sea);
  for (let x = 1; x <= 4; x++) c.set(x, 9, 2, x % 2 ? c.facing("minecraft:blast_furnace", "south") : c.P("minecraft:iron_block"));
  // capstans and bollards on both abutments
  for (const x of [2, 28]) c.set(x, 9, 11, c.P("minecraft:polished_blackstone_wall"));
  c.set(28, 9, 3, c.P("minecraft:polished_blackstone_wall"));
}

// ---------------------------------------------------------------------------
// Nuclear Submarine Pen — reinforced bunker over a 23-wide channel
// ---------------------------------------------------------------------------
export function buildNuclearSubmarinePen(dimension, origin, rotation, variantId) {
  const { c } = ctx("nuclear_submarine_pen", dimension, origin, rotation, variantId);
  const B = c.B, V = c.V;
  deck(c, [{ x1: 0, z1: 0, x2: 7, z2: 44 }, { x1: 31, z1: 0, x2: 38, z2: 44 }, { x1: 8, z1: 0, x2: 30, z2: 6 }]);
  // thick walls rising to a heavy flat roof (burster slab) over the whole pen
  for (let z = 0; z <= 44; z++) for (let y = WALK; y <= 18; y++) {
    for (const x of [0, 1, 37, 38]) c.set(x, y, z, z % 6 === 0 ? B.tile : B.concrete);
  }
  for (let x = 0; x <= 38; x++) for (let z = 0; z <= 44; z++) {
    c.set(x, 19, z, B.concrete);
    c.set(x, 20, z, B.concrete);
    c.set(x, 21, z, (x % 6 === 3 && z % 6 === 3) ? B.tile : B.concrete);
    // lights built into the soffit over the channel and galleries
    if (z % 6 === 3 && (x === 5 || x === 33 || x === 13 || x === 19 || x === 25)) c.set(x, 19, z, B.sea);
  }
  for (let x = 0; x <= 38; x++) for (let z = 0; z <= 44; z++) c.set(x, 22, z, (x + z) % 2 ? B.concrete : B.tile);
  // rear wall (z 0) closing the back of the pen
  for (let x = 2; x <= 36; x++) for (let y = WALK; y <= 18; y++) c.set(x, y, 0, B.concrete);
  // service galleries: berthing faces, utilities, workshops along the walls
  berthingFace(c, 7, 7, 44, 1, { bitts: true, bollardStep: 8 });
  berthingFace(c, 31, 7, 44, -1, { bitts: true, bollardStep: 8 });
  for (const x of [4, 34]) utilities(c, x, 1, 44, 8);
  // overhead travelling crane rails along the gallery edges (well above the sail)
  for (let z = 1; z <= 44; z++) { c.set(8, 16, z, B.yellow); c.set(30, 16, z, B.yellow); }
  for (let x = 8; x <= 30; x++) c.set(x, 16, 22, B.yellow);
  c.fill(18, 15, 22, 20, 15, 22, B.blackstone);
  // workshops and stores built into the rear deck
  for (const [x1, x2, type] of [[2, 7, "workshop"], [31, 36, "storage"]]) {
    c.walls(x1, WALK, 1, x2, WALK + 4, 6, V.wall);
    c.clear(x1 + 1, WALK, 2, x2 - 1, WALK + 4, 5);
    c.clear(Math.floor((x1 + x2) / 2), WALK, 6, Math.floor((x1 + x2) / 2), WALK + 2, 6);
    c.fill(x1, WALK + 5, 1, x2, WALK + 5, 6, V.accent);
    furnishRoom(c, { x1: x1 + 1, z1: 2, x2: x2 - 1, z2: 5, walk: WALK, h: 4, type, door: "south", doorU: Math.floor((x2 - x1) / 2) - 1 });
  }
  // rear catwalk across the channel head with railings
  for (let x = 8; x <= 30; x++) { c.set(x, WALK + 4, 6, B.rail); }
  // entrance blast-door pockets at the seaward end
  for (const x of [2, 3, 35, 36]) for (let y = WALK; y <= 18; y++) c.set(x, y, 44, (x + y) % 6 < 3 ? B.yellow : B.black);
}

// ---------------------------------------------------------------------------
// Dockside Loading Crane — rail-mounted portal crane with cab, jib and counterweight
// ---------------------------------------------------------------------------
export function buildDocksideLoadingCrane(dimension, origin, rotation, variantId) {
  const { c } = ctx("dockside_loading_crane", dimension, origin, rotation, variantId);
  const B = c.B;
  const W = 2;
  c.fill(0, W - 2, 0, 14, W - 2, 16, B.concrete);
  c.fill(0, W - 1, 0, 14, W - 1, 16, B.andesite);
  // rails along z under each leg pair
  for (const x of [2, 12]) for (let z = 0; z <= 16; z++) c.set(x, W - 1, z, c.P("minecraft:iron_block"));
  // portal legs with bogies, braced
  for (const x of [2, 12]) for (const z of [4, 12]) {
    c.fill(x, W, z - 1, x, W, z + 1, B.blackstoneBricks); // bogie
    c.fill(x, W + 1, z, x, W + 14, z, B.yellow);
  }
  for (const x of [2, 12]) { c.line(x, W + 2, 4, x, W + 10, 12, B.yellow); c.line(x, W + 2, 12, x, W + 10, 4, B.yellow); }
  // portal beam and slewing platform
  c.fill(2, W + 15, 4, 12, W + 15, 12, B.yellow);
  c.cyl(7, 8, W + 16, W + 16, 3, B.blackstoneBricks);
  // machinery house with recessed lights, cab with glazing (seaward = north)
  c.walls(5, W + 17, 7, 9, W + 19, 12, B.yellow);
  c.fill(5, W + 20, 7, 9, W + 20, 12, B.tile);
  c.clear(6, W + 17, 8, 8, W + 19, 11);
  c.set(7, W + 20, 9, B.sea);
  c.walls(6, W + 17, 4, 8, W + 19, 6, B.yellow);
  c.clear(7, W + 17, 5, 7, W + 19, 6);
  for (const y of [W + 18, W + 19]) { c.set(7, y, 4, B.lightBlueGlass); c.set(6, y, 5, B.lightBlueGlass); c.set(8, y, 5, B.lightBlueGlass); }
  c.chair(7, W + 17, 6, "north");
  // jib reaching seaward with hoist and hook, counterweight at the rear
  c.line(7, W + 20, 6, 7, W + 23, 0, B.yellow);
  c.fill(7, W + 21, 0, 7, W + 23, 0, B.yellow);
  c.fill(7, W + 15, 1, 7, W + 20, 1, c.P("minecraft:chain"));
  c.set(7, W + 14, 1, B.blackstone);
  c.fill(6, W + 17, 13, 8, W + 19, 15, B.concrete);
  c.set(7, W + 21, 13, B.red); // aviation warning light on the A-frame
  c.fill(7, W + 20, 12, 7, W + 20, 13, B.yellow);
  // access ladder up the south-east leg
  for (let y = W + 1; y <= W + 16; y++) c.set(12, y, 13, c.ladder("south"));
}

// ---------------------------------------------------------------------------
// Coastal Defence Bunker — earth-covered casemate with gun embrasures,
// observation post, magazine and crew room
// ---------------------------------------------------------------------------
export function buildCoastalDefenceBunker(dimension, origin, rotation, variantId) {
  const { c } = ctx("coastal_defence_bunker", dimension, origin, rotation, variantId);
  const B = c.B, V = c.V;
  const W = 2;
  c.fill(0, W - 2, 0, 24, W - 2, 18, B.concrete);
  c.fill(0, W - 1, 0, 24, W - 1, 18, c.P("minecraft:gravel"));
  // casemate x 3..21, z 2..13 facing north (the sea)
  c.fill(3, W - 1, 2, 21, W - 1, 13, V.floor);
  c.walls(3, W, 2, 21, W + 4, 13, B.concrete);
  c.fill(3, W + 5, 1, 21, W + 5, 14, B.concrete);
  c.clear(4, W, 3, 20, W + 4, 12);
  // two gun embrasures (stepped splay) and a long observation slit between
  for (const gx of [7, 17]) {
    c.clear(gx - 1, W + 1, 2, gx + 1, W + 2, 2);
    c.clear(gx - 2, W + 1, 1, gx + 2, W + 2, 1);
    c.cyl(gx, 6, W, W, 2, B.blackstoneBricks);
    c.set(gx, W + 1, 6, B.blackstone);
    c.fill(gx, W + 1, 3, gx, W + 1, 5, c.P("minecraft:iron_block")); // barrel
  }
  for (let x = 11; x <= 13; x++) c.set(x, W + 2, 2, B.air);
  c.set(12, W, 3, c.slabTop("minecraft:dark_oak_slab")); c.set(12, W + 1, 3, B.daylight); c.chair(12, W, 4, "north");
  // internal wall: magazine (west) and crew room (east) behind the gun room
  c.fill(4, W, 9, 20, W + 4, 9, B.concrete);
  c.fill(12, W, 10, 12, W + 4, 12, B.concrete);
  c.clear(8, W, 9, 8, W + 2, 9); c.clear(16, W, 9, 16, W + 2, 9);
  furnishRoom(c, { x1: 4, z1: 10, x2: 11, z2: 12, walk: W, h: 4, type: "armoury", door: "north", doorU: 4 });
  furnishRoom(c, { x1: 13, z1: 10, x2: 20, z2: 12, walk: W, h: 4, type: "bunks", door: "north", doorU: 4 });
  // recessed ceiling lights
  for (const [x, z] of [[7, 5], [12, 6], [17, 5], [7, 11], [16, 11]]) c.set(x, W + 5, z, B.sea);
  // rear entrance with a stair-down access trench and blast baffle
  c.clear(8, W, 13, 8, W + 2, 13);
  c.fill(6, W, 15, 10, W + 2, 15, B.concrete);
  c.set(6, W + 1, 15, B.sea);
  // earth cover over the casemate and flanks
  berm(c, 3, 2, 21, 13, W, 3, ["east", "west", "south"]);
  c.clear(8, W, 14, 8, W + 2, 18);
  c.fill(8, W - 1, 14, 8, W - 1, 18, B.andesite);
  for (let x = 3; x <= 21; x++) for (let z = 1; z <= 14; z++) c.set(x, W + 6, z, B.grass);
}

// ---------------------------------------------------------------------------
// Seawall Module — stepped seawall with wave-return lip, promenade, railings,
// bollard lights and steps down to the water (modular: place end to end)
// ---------------------------------------------------------------------------
export function buildSeawallModule(dimension, origin, rotation, variantId) {
  const { c } = ctx("seawall_module", dimension, origin, rotation, variantId);
  const B = c.B;
  // z 0 = sea side, z 6 = land side
  for (let x = 0; x <= 20; x++) {
    // stepped revetment toe rising to the wall
    c.fill(x, 0, 0, x, 1, 0, B.concrete);
    c.fill(x, 0, 1, x, 3, 1, B.concrete);
    c.fill(x, 0, 2, x, 5, 3, B.concrete);
    c.set(x, 6, 2, c.stairs("minecraft:polished_deepslate_stairs", "north", true)); // curved wave-return lip
    c.set(x, 6, 3, B.concrete);
    // promenade
    c.fill(x, 4, 4, x, 4, 6, B.concrete);
    c.fill(x, 5, 4, x, 5, 6, x % 2 ? c.V.floor : B.andesite);
    c.set(x, 7, 3, x % 6 === 0 ? B.blackstoneBricks : B.rail);
  }
  // lights set into the top of the wall facing the promenade, and bench seating
  for (let x = 3; x <= 20; x += 6) { c.set(x, 6, 3, B.sea); }
  for (const x of [6, 15]) c.bench(x, 6, 6, "north");
  // access ladder down the sea face at the centre, through a gap in the railing
  c.clear(10, 6, 2, 10, 7, 3);
  for (let y = 2; y <= 6; y++) c.set(10, y, 1, c.ladder("north"));
  c.set(9, 7, 3, B.blackstoneBricks); c.set(11, 7, 3, B.blackstoneBricks);
}
