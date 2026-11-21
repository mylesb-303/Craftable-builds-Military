import { kit } from "../kit.js";
import { furnishRoom } from "../interiors.js";
import { opsBuilding, stairFlight } from "../buildings.js";
import { flagpole } from "./facilities.js";

// ---------------------------------------------------------------------------
// Core base builds, redesigned in v1.8.0.
// References: UFC 4-022-01 Entry Control Facilities / Access Control Points
// (gatehouse island between lanes, canopy, active vehicle barriers, overwatch,
// pedestrian entry) and typical HQ / parade-ground layouts.
// Ground walk level y = 2 (foundationDepth 2); entrances face local south.
// All lights are set into floors, walls, soffits or ceilings.
// ---------------------------------------------------------------------------

const WALK = 2;

export const CORE_SIZES = {
  guard_post: { x: 8, y: 9, z: 8 },
  main_security_gate: { x: 25, y: 10, z: 9 },
  base_headquarters: { x: 21, y: 11, z: 17 },
  hq_command_rotunda: { x: 25, y: 14, z: 25 },
  ceremonial_fountain_plaza: { x: 31, y: 6, z: 31 }
};

const ctx = (id, d, o, r, v) => ({ c: kit(d, o, r, CORE_SIZES[id], v), size: CORE_SIZES[id] });

/** Desk run: slab tops with chairs behind, screens on the desk. */
function desk(c, x1, x2, z, chairSide) {
  for (let x = x1; x <= x2; x++) {
    c.set(x, WALK, z, c.slabTop("minecraft:dark_oak_slab"));
    c.set(x, WALK + 1, z, x % 2 ? c.P("minecraft:black_stained_glass_pane") : c.P("minecraft:flower_pot"));
    c.chair(x, WALK, z + (chairSide === "south" ? 1 : -1), chairSide === "south" ? "north" : "south");
  }
}

// ---------------------------------------------------------------------------
// Guard Post — hardened sentry booth with all-round bullet-resistant glazing
// ---------------------------------------------------------------------------
export function buildGuardPost(dimension, origin, rotation, variantId) {
  const { c } = ctx("guard_post", dimension, origin, rotation, variantId);
  const B = c.B;
  // raised plinth and kerb
  c.fill(0, WALK - 2, 0, 7, WALK - 2, 7, B.concrete);
  c.fill(0, WALK - 1, 0, 7, WALK - 1, 7, B.andesite);
  for (let i = 0; i < 8; i++) for (const [x, z] of [[i, 0], [i, 7], [0, i], [7, i]]) c.set(x, WALK - 1, z, (i % 2) ? B.yellow : B.black);
  // booth shell x1..6, z1..6
  c.walls(1, WALK, 1, 6, WALK + 3, 6, c.V.wall);
  for (const [x, z] of [[1, 1], [6, 1], [1, 6], [6, 6]]) c.fill(x, WALK, z, x, WALK + 3, z, c.V.frame);
  c.clear(2, WALK, 2, 5, WALK + 3, 5);
  // continuous ballistic glazing on all four sides
  for (let i = 2; i <= 5; i++) for (const y of [WALK + 1, WALK + 2]) {
    c.set(i, y, 1, B.tinted); c.set(i, y, 6, B.tinted); c.set(1, y, i, B.tinted); c.set(6, y, i, B.tinted);
  }
  // door (south) and transaction window (east)
  c.clear(3, WALK, 6, 3, WALK + 2, 6);
  c.set(6, WALK + 1, 3, B.air);
  c.set(7, WALK, 3, c.slabTop("minecraft:smooth_stone_slab")); // drawer shelf
  // roof canopy overhang with flush soffit lights at each corner
  c.fill(0, WALK + 4, 0, 7, WALK + 4, 7, c.V.accent);
  for (const [x, z] of [[0, 0], [7, 0], [0, 7], [7, 7]]) c.set(x, WALK + 4, z, B.sea);
  c.set(3, WALK + 4, 3, B.sea); c.set(4, WALK + 4, 4, B.sea); // recessed ceiling lights
  for (let i = 0; i < 8; i++) for (const [x, z] of [[i, 0], [i, 7], [0, i], [7, i]]) c.set(x, WALK + 5, z, c.V.frame);
  // interior: console desk under the front glass, stool, log book, locker
  for (let x = 2; x <= 5; x++) c.set(x, WALK, 2, c.slabTop("minecraft:dark_oak_slab"));
  c.set(2, WALK + 1, 2, c.P("minecraft:black_stained_glass_pane"));
  c.set(5, WALK + 1, 2, c.P("minecraft:black_stained_glass_pane"));
  c.chair(3, WALK, 3, "north");
  c.set(5, WALK, 5, c.facing("minecraft:lectern", "west"));
  c.set(2, WALK, 5, c.barrel("east"));
  c.set(2, WALK + 1, 5, c.barrel("east"));
  // roof: CCTV and antenna
  c.set(6, WALK + 6, 1, B.blackstone); c.set(6, WALK + 6, 2, c.P("minecraft:black_stained_glass_pane"));
  c.fill(1, WALK + 6, 6, 1, WALK + 7, 6, B.bars);
  c.set(1, WALK + 8, 6, c.P("minecraft:lightning_rod"));
}

// ---------------------------------------------------------------------------
// Main Security Gate — two-lane entry control point with gatehouse island,
// canopy, active barriers, overwatch and pedestrian entry
// ---------------------------------------------------------------------------
export function buildMainSecurityGate(dimension, origin, rotation, variantId) {
  const { c } = ctx("main_security_gate", dimension, origin, rotation, variantId);
  const B = c.B;
  c.fill(0, WALK - 2, 0, 24, WALK - 2, 8, B.concrete);
  // roads: outbound x 2..9, inbound x 15..22; island x 10..14
  c.fill(0, WALK - 1, 0, 24, WALK - 1, 8, B.andesite);
  for (const [x1, x2] of [[2, 9], [15, 22]]) {
    c.fill(x1, WALK - 1, 0, x2, WALK - 1, 8, B.black);
    for (let z = 0; z <= 8; z++) { c.set(x1, WALK - 1, z, B.white); c.set(x2, WALK - 1, z, B.white); }
    for (let x = x1 + 1; x < x2; x++) c.set(x, WALK - 1, 6, B.white); // stop line
    // flush wedge barriers (active vehicle barriers, shown lowered)
    for (let x = x1 + 1; x < x2; x++) c.set(x, WALK - 1, 2, x % 2 ? B.yellow : B.black);
    // speed table
    for (let x = x1 + 1; x < x2; x++) c.set(x, WALK, 8, c.P("minecraft:smooth_stone_slab"));
  }
  // lane arrows
  for (const [x, dir] of [[6, -1], [18, 1]]) for (let k = 0; k < 3; k++) c.set(x, WALK - 1, 4 + dir * k, B.white);
  // gatehouse island x 10..14 z 1..7
  c.fill(10, WALK - 1, 0, 14, WALK - 1, 8, B.yellow);
  c.walls(10, WALK, 1, 14, WALK + 3, 7, c.V.wall);
  for (const [x, z] of [[10, 1], [14, 1], [10, 7], [14, 7]]) c.fill(x, WALK, z, x, WALK + 3, z, c.V.frame);
  c.clear(11, WALK, 2, 13, WALK + 3, 6);
  for (let z = 2; z <= 6; z++) for (const y of [WALK + 1, WALK + 2]) { c.set(10, y, z, B.tinted); c.set(14, y, z, B.tinted); }
  c.set(10, WALK + 1, 4, B.air); c.set(14, WALK + 1, 4, B.air); // ID windows on both lanes
  c.set(9, WALK, 4, c.slabTop("minecraft:smooth_stone_slab")); c.set(15, WALK, 4, c.slabTop("minecraft:smooth_stone_slab"));
  c.clear(12, WALK, 7, 12, WALK + 2, 7); // door facing into the base (south)
  c.fill(10, WALK + 4, 1, 14, WALK + 4, 7, c.V.accent);
  // gatehouse interior: console both sides, chairs, radio, ladder to the overwatch
  c.set(11, WALK, 3, c.slabTop("minecraft:dark_oak_slab")); c.set(13, WALK, 3, c.slabTop("minecraft:dark_oak_slab"));
  c.set(11, WALK + 1, 3, c.P("minecraft:black_stained_glass_pane")); c.set(13, WALK + 1, 3, c.P("minecraft:black_stained_glass_pane"));
  c.chair(11, WALK, 4, "west"); c.chair(13, WALK, 4, "east");
  c.set(11, WALK, 6, c.barrel("north")); c.set(13, WALK, 6, B.jukebox);
  for (let y = WALK; y <= WALK + 4; y++) c.set(12, y, 2, c.ladder("south"));
  c.set(12, WALK + 3, 1, B.sea); // wall light behind the ladder
  c.set(12, WALK + 4, 4, B.sea); // recessed ceiling light
  // overwatch on the roof: sandbag parapet with firing slots
  for (let x = 10; x <= 14; x++) for (const z of [1, 7]) c.set(x, WALK + 5, z, B.mudBricks);
  for (let z = 1; z <= 7; z++) for (const x of [10, 14]) c.set(x, WALK + 5, z, (z === 4) ? B.air : B.mudBricks);
  // canopy over both lanes on columns, lights set into its soffit, sign fascia
  for (const x of [1, 10, 14, 23]) for (const z of [1, 7]) c.fill(x, WALK, z, x, WALK + 6, z, B.blackstoneBricks);
  for (let x = 1; x <= 23; x++) for (let z = 0; z <= 8; z++) {
    const soffitLight = (x % 4 === 0) && (z === 2 || z === 6) && (x < 10 || x > 14);
    c.set(x, WALK + 7, z, soffitLight ? B.sea : c.V.frame);
  }
  for (let x = 1; x <= 23; x++) c.set(x, WALK + 6, 0, x % 2 ? B.red : B.white);
  // perimeter fence stubs with pedestrian turnstile (west) and visitor booth door (east)
  for (const x of [0, 24]) for (let z = 0; z <= 8; z++) { c.set(x, WALK - 1, z, B.stoneBrick); c.fill(x, WALK, z, x, WALK + 2, z, z % 4 === 0 ? B.blackstoneBricks : B.bars); }
  c.clear(0, WALK, 4, 0, WALK + 1, 4); c.set(1, WALK, 3, B.bars); c.set(1, WALK, 5, B.bars);
  // bollards protecting the island noses
  for (const z of [0, 8]) for (const x of [10, 14]) c.set(x, WALK, z, c.P("minecraft:polished_blackstone_wall"));
}

// ---------------------------------------------------------------------------
// Base Headquarters — two-storey administrative HQ with portico and flags
// ---------------------------------------------------------------------------
export function buildBaseHeadquarters(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("base_headquarters", dimension, origin, rotation, variantId);
  const B = c.B;
  c.fill(0, WALK - 1, 0, size.x - 1, WALK - 1, size.z - 1, B.andesite);
  // forecourt path
  for (let z = 13; z < size.z; z++) for (let x = 8; x <= 12; x++) c.set(x, WALK - 1, z, (x === 8 || x === 12) ? B.smooth : c.V.floor);
  const b = opsBuilding(c, {
    x1: 1, z1: 1, x2: 19, z2: 12, walk: WALK, floorH: 4, doorX: 10,
    floors: [
      [{ u1: 4, u2: 9, type: "lobby" }, { u1: 11, u2: 18, type: "office" }],
      [{ u1: 4, u2: 10, type: "conference" }, { u1: 12, u2: 18, type: "command" }]
    ],
    roofDeck: false
  });
  // classical portico: four columns and a pediment band, lights set into the soffit
  for (const x of [7, 9, 11, 13]) c.fill(x, WALK, 14, x, WALK + 3, 14, c.P("minecraft:quartz_pillar"));
  c.fill(6, WALK + 4, 12, 14, WALK + 4, 15, c.P("minecraft:quartz_block"));
  c.set(8, WALK + 4, 15, B.sea); c.set(12, WALK + 4, 15, B.sea);
  for (let x = 6; x <= 14; x++) c.set(x, WALK + 5, 15, c.stairs("minecraft:quartz_stairs", "north"));
  c.fill(7, WALK + 5, 13, 13, WALK + 5, 14, c.P("minecraft:quartz_block"));
  for (let x = 7; x <= 13; x++) c.set(x, WALK - 1, 13, B.smooth), c.set(x, WALK - 1, 14, B.smooth);
  // roof parapet with flush lights
  for (let x = 1; x <= 19; x++) for (const z of [1, 12]) c.set(x, b.top, z, x % 6 === 4 ? B.sea : c.V.frame);
  for (let z = 1; z <= 12; z++) for (const x of [1, 19]) c.set(x, b.top, z, c.V.frame);
  // three flagpoles on the forecourt
  flagpole(c, 3, 15, 7, [B.blue, B.white, B.red]);
  flagpole(c, 15, 15, 7, [B.green, B.yellow]);
  // planters either side of the steps
  for (const x of [5, 15]) { c.set(x, WALK, 13, B.moss); c.set(x, WALK + 1, 13, c.P("minecraft:flowering_azalea", undefined, "minecraft:azalea_leaves")); }
}

// ---------------------------------------------------------------------------
// HQ Command Rotunda — circular command centre with domed roof
// ---------------------------------------------------------------------------
export function buildHQCommandRotunda(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("hq_command_rotunda", dimension, origin, rotation, variantId);
  const B = c.B;
  const cx = 12, cz = 12, R = 10, H = 7;
  const dist = (x, z) => Math.hypot(x - cx, z - cz);
  c.fill(0, WALK - 1, 0, size.x - 1, WALK - 1, size.z - 1, B.andesite);
  // foundation and floor
  for (let x = 0; x < size.x; x++) for (let z = 0; z < size.z; z++) {
    const d = dist(x, z);
    if (d <= R + 0.5) c.set(x, WALK - 1, z, d < 2.5 ? B.blackstone : ((x + z) % 2 ? c.V.floor : B.smooth));
  }
  // outer wall with tall windows, inner wall at r 6 with four doorways
  for (let x = 0; x < size.x; x++) for (let z = 0; z < size.z; z++) {
    const d = dist(x, z);
    for (let y = WALK; y < WALK + H; y++) {
      if (d > R - 0.5 && d <= R + 0.5) {
        const ang = Math.atan2(z - cz, x - cx);
        const pier = Math.round(((ang + Math.PI) / (2 * Math.PI)) * 24) % 2 === 0;
        c.set(x, y, z, pier ? c.V.frame : (y >= WALK + 1 && y <= WALK + 4 ? B.tinted : c.V.wall));
      } else if (d > 5.5 && d <= 6.5) {
        const door = (Math.abs(x - cx) <= 1 || Math.abs(z - cz) <= 1) && y <= WALK + 2;
        c.set(x, y, z, door ? B.air : c.V.wall);
      } else if (d <= R - 0.5) c.set(x, y, z, B.air);
    }
  }
  // entrance on the south with a portico
  c.clear(11, WALK, cz + R - 1, 13, WALK + 3, cz + R + 1);
  for (const x of [10, 14]) c.fill(x, WALK, cz + R + 1, x, WALK + 4, cz + R + 2, c.P("minecraft:quartz_pillar"));
  c.fill(9, WALK + 5, cz + R, 15, WALK + 5, cz + R + 2, c.P("minecraft:quartz_block"));
  c.set(12, WALK + 5, cz + R + 2, B.sea);
  // ceiling slab with a ring of recessed lights; dome above with an oculus
  for (let x = 0; x < size.x; x++) for (let z = 0; z < size.z; z++) {
    const d = dist(x, z);
    if (d > R + 0.5) continue;
    const ringLight = (Math.abs(d - 8) < 0.5 || Math.abs(d - 3.5) < 0.5) && (x + z) % 3 === 0;
    c.set(x, WALK + H, z, ringLight ? B.sea : B.tile);
    const domeH = Math.round(4 * Math.sqrt(Math.max(0, 1 - (d / (R + 0.5)) ** 2)));
    for (let y = WALK + H + 1; y <= WALK + H + domeH; y++) c.set(x, y, z, y === WALK + H + domeH ? (d < 1.5 ? B.glass : c.V.accent) : B.tile);
  }
  // situation room: central plot table (lit glass top) ringed by consoles facing it
  c.cyl(cx, cz, WALK, WALK, 1, B.blackstone);
  c.set(cx, WALK - 1, cz, B.sea);
  for (let x = cx - 1; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) c.set(x, WALK, z, c.P("minecraft:cyan_stained_glass"));
  for (const [x, z, face] of [[cx, cz - 4, "south"], [cx, cz + 4, "north"], [cx - 4, cz, "east"], [cx + 4, cz, "west"], [cx - 3, cz - 3, "south"], [cx + 3, cz - 3, "south"], [cx - 3, cz + 3, "north"], [cx + 3, cz + 3, "north"]]) {
    if ((x === cx || z === cz) && Math.abs(x - cx) + Math.abs(z - cz) === 4) {
      // doorway axes stay clear: consoles sit beside them
      const off = x === cx ? [1, 0] : [0, 1];
      for (const s of [-1, 1]) {
        const xx = x + off[0] * s * 2, zz = z + off[1] * s * 2;
        c.set(xx, WALK, zz, B.blackstone);
        c.set(xx, WALK + 1, zz, c.P("minecraft:black_stained_glass_pane"));
      }
      continue;
    }
    c.set(x, WALK, z, B.blackstone);
    c.set(x, WALK + 1, z, B.daylight);
    const d = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0] }[face];
    c.chair(x - d[0], WALK, z - d[1], face);
  }
  // screens on the inner face of the situation-room wall
  for (let x = 0; x < size.x; x++) for (let z = 0; z < size.z; z++) {
    const d = dist(x, z);
    if (d > 5.5 && d <= 6.5 && !(Math.abs(x - cx) <= 1 || Math.abs(z - cz) <= 1)) for (const y of [WALK + 2, WALK + 3]) c.set(x, y, z, (x + y) % 3 ? B.cyanGlass : B.black);
  }
  // ring offices: desks against the outer wall with chairs, bookcases between windows
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 + Math.PI / 16;
    const x = Math.round(cx + Math.cos(a) * 8.6), z = Math.round(cz + Math.sin(a) * 8.6);
    if (Math.abs(x - cx) <= 2 && z > cz) continue; // keep the entrance hall clear
    c.set(x, WALK, z, k % 4 === 0 ? B.bookshelf : c.slabTop("minecraft:dark_oak_slab"));
    if (k % 4) {
      c.set(x, WALK + 1, z, c.P("minecraft:flower_pot"));
      const ix = Math.round(cx + Math.cos(a) * 7.5), iz = Math.round(cz + Math.sin(a) * 7.5);
      c.chair(ix, WALK, iz, Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? "east" : "west") : (Math.sin(a) > 0 ? "south" : "north"));
    }
  }
}

// ---------------------------------------------------------------------------
// Ceremonial Fountain Plaza — parade plaza with fountain, flag circle and seating
// ---------------------------------------------------------------------------
export function buildCeremonialFountainPlaza(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("ceremonial_fountain_plaza", dimension, origin, rotation, variantId);
  const B = c.B;
  const cx = 15, cz = 15;
  const dist = (x, z) => Math.hypot(x - cx, z - cz);
  // radial paving with a compass-rose ring
  for (let x = 0; x < size.x; x++) for (let z = 0; z < size.z; z++) {
    const d = dist(x, z);
    c.set(x, WALK - 2, z, B.concrete);
    let p = B.smooth;
    if (d > 13.5) p = B.grass;
    else if (Math.abs(d - 11) < 0.6) p = B.blackstoneBricks;
    else if (Math.abs(d - 9) < 0.6) p = c.V.floor;
    else if ((Math.round(Math.atan2(z - cz, x - cx) / (Math.PI / 8)) + Math.floor(d / 2)) % 2) p = B.andesite;
    c.set(x, WALK - 1, z, p);
  }
  // four paths through the lawn
  for (let i = 0; i < size.x; i++) for (let w = -2; w <= 2; w++) { if (dist(i, cz + w) > 13.5) c.set(i, WALK - 1, cz + w, B.andesite); if (dist(cx + w, i) > 13.5) c.set(cx + w, WALK - 1, i, B.andesite); }
  // fountain: sunken outer basin r 6, raised inner basin r 3, central jet column
  for (let x = 0; x < size.x; x++) for (let z = 0; z < size.z; z++) {
    const d = dist(x, z);
    if (d <= 6.5 && d > 5.5) { c.set(x, WALK, z, c.P("minecraft:quartz_block")); c.set(x, WALK + 1, z, c.slabTop("minecraft:quartz_slab")); }
    else if (d <= 5.5) {
      c.set(x, WALK - 1, z, c.P("minecraft:prismarine_bricks"));
      if (d > 3.5) c.set(x, WALK, z, c.P("minecraft:water"));
      else if (d > 2.5) { c.set(x, WALK, z, c.P("minecraft:quartz_block")); c.set(x, WALK + 1, z, c.P("minecraft:quartz_block")); }
      else { c.set(x, WALK, z, c.P("minecraft:quartz_block")); c.set(x, WALK + 1, z, c.P("minecraft:water")); }
    }
    // underwater lights set into the basin floor
    if (Math.abs(d - 4.5) < 0.5 && (x + z) % 3 === 0) c.set(x, WALK - 1, z, B.sea);
  }
  c.fill(cx, WALK + 1, cz, cx, WALK + 2, cz, c.P("minecraft:quartz_pillar"));
  c.set(cx, WALK + 3, cz, c.P("minecraft:water"));
  // flag circle on the north side
  for (const [x, z] of [[cx - 4, 2], [cx, 1], [cx + 4, 2]]) flagpole(c, x, z, 3, [B.blue, B.white]);
  // benches facing the fountain at r 9 between the paths
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 + Math.PI / 16;
    if (k % 4 === 0 || k % 4 === 3) continue;
    const x = Math.round(cx + Math.cos(a) * 9), z = Math.round(cz + Math.sin(a) * 9);
    const face = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? "west" : "east") : (Math.sin(a) > 0 ? "north" : "south");
    c.bench(x, WALK, z, face);
  }
  // bollard lights around the ring: light set into the top of a stone bollard under a slab cap
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const x = Math.round(cx + Math.cos(a) * 11), z = Math.round(cz + Math.sin(a) * 11);
    if (Math.abs(x - cx) <= 2 || Math.abs(z - cz) <= 2) continue;
    c.set(x, WALK, z, B.sea);
    c.set(x, WALK + 1, z, c.P("minecraft:polished_blackstone_slab"));
  }
  // hedged corners with planted trees and memorial plinth (south-east)
  for (const [qx, qz] of [[0, 0], [24, 0], [0, 24], [24, 24]]) {
    for (let x = qx; x < qx + 7; x++) for (let z = qz; z < qz + 7; z++) if (dist(x, z) > 14.5) {
      const edge = x === qx || z === qz || x === qx + 6 || z === qz + 6;
      if (edge) c.set(x, WALK, z, c.P("minecraft:azalea_leaves", { persistent_bit: true }));
    }
    const tx = qx + 3, tz = qz + 3;
    if (dist(tx, tz) > 14.5) { c.fill(tx, WALK, tz, tx, WALK + 2, tz, c.P("minecraft:spruce_log")); c.cyl(tx, tz, WALK + 3, WALK + 4, 1, c.P("minecraft:spruce_leaves", { persistent_bit: true })); }
  }
  c.fill(cx + 7, WALK, cz + 7, cx + 8, WALK, cz + 8, B.blackstoneBricks);
  c.set(cx + 7, WALK + 1, cz + 7, c.facing("minecraft:lectern", "north"));
}
