import { BlockPermutation } from "@minecraft/server";
import { rotateXZ, toWorldLocation } from "./placement.js";
import { getPalette } from "./variants.js";

// ---------------------------------------------------------------------------
// CAVIRA Build Kit (v1.5.0)
// Shared, rotation-aware building toolkit used by the v1.5 structures:
//   geometry  — fill / walls / shell / cylinders / discs / lines / planes
//   blocks    — safe permutation resolver + rotation-correct stairs & ladders
//   access    — spiral stairwell, scaffolding lift, ladder escape shaft, huts
//   strategic — parabolic dish, rotating radar array, lattice mast
//   interiors — furnished rooms by type (command, bunks, medical, …)
// Everything uses vanilla blocks only.
// ---------------------------------------------------------------------------

const CACHE = new Map();
const WARNED = new Set();

/** Safe permutation resolver: falls back to defaults / fallback id instead of throwing. */
export function P(id, states, fallback = "minecraft:stone") {
  const key = states ? `${id}|${JSON.stringify(states)}` : id;
  let p = CACHE.get(key);
  if (p) return p;
  try {
    p = states ? BlockPermutation.resolve(id, states) : BlockPermutation.resolve(id);
  } catch {
    try {
      p = BlockPermutation.resolve(id);
    } catch {
      if (!WARNED.has(id)) {
        WARNED.add(id);
        console.warn(`[CAVIRA] Block ${id} unavailable — using ${fallback}.`);
      }
      p = BlockPermutation.resolve(fallback);
    }
  }
  CACHE.set(key, p);
  return p;
}

const DIRS = { north: { x: 0, z: -1 }, south: { x: 0, z: 1 }, east: { x: 1, z: 0 }, west: { x: -1, z: 0 } };
const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };
const LEFT = { north: "west", west: "south", south: "east", east: "north" };

/** Converts a local direction to the world direction for a structure rotation. */
export function worldDir(local, rotation) {
  const v = DIRS[local];
  const a = rotateXZ(1, 1, 3, 3, rotation);
  const b = rotateXZ(1 + v.x, 1 + v.z, 3, 3, rotation);
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  if (dx === 1) return "east";
  if (dx === -1) return "west";
  if (dz === 1) return "south";
  return "north";
}

export { OPPOSITE, LEFT, DIRS };

// Commonly used vanilla blocks (resolved lazily so module load never throws).
const ID = {
  air: "minecraft:air",
  obsidian: "minecraft:obsidian",
  cryingObsidian: "minecraft:crying_obsidian",
  concrete: "minecraft:polished_deepslate",
  tile: "minecraft:deepslate_tiles",
  brick: "minecraft:deepslate_bricks",
  andesite: "minecraft:polished_andesite",
  smooth: "minecraft:smooth_stone",
  stoneBrick: "minecraft:stone_bricks",
  lightGrey: "minecraft:light_gray_concrete",
  grey: "minecraft:gray_concrete",
  black: "minecraft:black_concrete",
  white: "minecraft:white_concrete",
  whiteWool: "minecraft:white_wool",
  greenWool: "minecraft:green_wool",
  grayWool: "minecraft:gray_wool",
  yellow: "minecraft:yellow_concrete",
  orange: "minecraft:orange_concrete",
  red: "minecraft:red_concrete",
  green: "minecraft:green_concrete",
  lightBlue: "minecraft:light_blue_concrete",
  blue: "minecraft:blue_concrete",
  quartz: "minecraft:quartz_block",
  iron: "minecraft:iron_block",
  bars: "minecraft:iron_bars",
  glass: "minecraft:glass",
  glassPane: "minecraft:glass_pane",
  tinted: "minecraft:tinted_glass",
  cyanGlass: "minecraft:cyan_stained_glass",
  lightBlueGlass: "minecraft:light_blue_stained_glass",
  blueGlass: "minecraft:blue_stained_glass",
  blackGlass: "minecraft:black_stained_glass",
  sea: "minecraft:sea_lantern",
  shroom: "minecraft:shroomlight",
  froglight: "minecraft:ochre_froglight",
  lamp: "minecraft:redstone_lamp",
  lantern: "minecraft:lantern",
  scaffolding: "minecraft:scaffolding",
  barrel: "minecraft:barrel",
  greenTerracotta: "minecraft:green_terracotta",
  orangeTerracotta: "minecraft:orange_terracotta",
  brownTerracotta: "minecraft:brown_terracotta",
  spruce: "minecraft:spruce_planks",
  darkOak: "minecraft:dark_oak_planks",
  blackstone: "minecraft:polished_blackstone",
  blackstoneBricks: "minecraft:polished_blackstone_bricks",
  basalt: "minecraft:polished_basalt",
  furnace: "minecraft:furnace",
  blast: "minecraft:blast_furnace",
  smoker: "minecraft:smoker",
  cauldron: "minecraft:cauldron",
  brewing: "minecraft:brewing_stand",
  anvil: "minecraft:anvil",
  smithing: "minecraft:smithing_table",
  grindstone: "minecraft:grindstone",
  loom: "minecraft:loom",
  cartography: "minecraft:cartography_table",
  crafting: "minecraft:crafting_table",
  bookshelf: "minecraft:bookshelf",
  chiseledBookshelf: "minecraft:chiseled_bookshelf",
  lectern: "minecraft:lectern",
  daylight: "minecraft:daylight_detector",
  hopper: "minecraft:hopper",
  ironTrapdoor: "minecraft:iron_trapdoor",
  fence: "minecraft:nether_brick_fence",
  plate: "minecraft:heavy_weighted_pressure_plate",
  lightPlate: "minecraft:light_weighted_pressure_plate",
  moss: "minecraft:moss_block",
  pottedFern: "minecraft:azalea_leaves",
  cobbledDeepslate: "minecraft:cobbled_deepslate",
  calcite: "minecraft:calcite",
  diorite: "minecraft:polished_diorite",
  mudBricks: "minecraft:mud_bricks",
  observer: "minecraft:observer",
  dispenser: "minecraft:dispenser",
  target: "minecraft:target",
  jukebox: "minecraft:jukebox",
  noteblock: "minecraft:noteblock",
  dirt: "minecraft:dirt",
  grass: "minecraft:grass_block",
  stone: "minecraft:stone",
  gravelPath: "minecraft:gravel",
  water: "minecraft:water"
};

/**
 * Creates a build context bound to one structure placement.
 */
export function kit(dimension, origin, rotation, size, variantId) {
  const pal = getPalette(variantId);
  const c = { dimension, origin, rotation, size, variantId };
  const fast = dimension.isRecorder ? dimension.write : undefined;

  c.B = new Proxy({}, { get: (_, k) => P(ID[k] ?? k) });
  c.V = new Proxy({}, { get: (_, k) => P(pal[k] ?? ID[k] ?? "minecraft:stone") });
  c.P = P;

  c.set = (x, y, z, p) => {
    const w = toWorldLocation(origin, { x, y, z }, size, rotation);
    if (fast) fast(w.x, w.y, w.z, p);
    else dimension.getBlock(w)?.setPermutation(p);
  };
  c.fill = (x1, y1, z1, x2, y2, z2, p) => {
    const ax = Math.min(x1, x2), bx = Math.max(x1, x2);
    const ay = Math.min(y1, y2), by = Math.max(y1, y2);
    const az = Math.min(z1, z2), bz = Math.max(z1, z2);
    for (let y = ay; y <= by; y++) for (let z = az; z <= bz; z++) for (let x = ax; x <= bx; x++) c.set(x, y, z, p);
  };
  c.clear = (x1, y1, z1, x2, y2, z2) => c.fill(x1, y1, z1, x2, y2, z2, c.B.air);
  c.walls = (x1, y1, z1, x2, y2, z2, p) => {
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) { c.set(x, y, z1, p); c.set(x, y, z2, p); }
      for (let z = z1 + 1; z < z2; z++) { c.set(x1, y, z, p); c.set(x2, y, z, p); }
    }
  };
  c.shell = (x1, y1, z1, x2, y2, z2, p) => {
    c.fill(x1, y1, z1, x2, y1, z2, p);
    c.fill(x1, y2, z1, x2, y2, z2, p);
    c.walls(x1, y1 + 1, z1, x2, y2 - 1, z2, p);
  };
  c.room = (x1, y1, z1, x2, y2, z2, wall, floor = wall, ceiling = wall) => {
    c.fill(x1, y1, z1, x2, y1, z2, floor);
    c.fill(x1, y2, z1, x2, y2, z2, ceiling);
    c.walls(x1, y1 + 1, z1, x2, y2 - 1, z2, wall);
    c.clear(x1 + 1, y1 + 1, z1 + 1, x2 - 1, y2 - 1, z2 - 1);
  };
  /** Solid (or hollow-ring) vertical cylinder. */
  c.cyl = (cx, cz, y1, y2, r, p, ring = 0) => {
    const R = r + 0.5;
    for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
      for (let dz = -Math.ceil(r); dz <= Math.ceil(r); dz++) {
        const d = Math.hypot(dx, dz);
        if (d > R) continue;
        if (ring && d < R - ring) continue;
        for (let y = y1; y <= y2; y++) c.set(cx + dx, y, cz + dz, p);
      }
    }
  };
  c.disc = (cx, cz, y, r, p, ring = 0) => c.cyl(cx, cz, y, y, r, p, ring);
  /** 3D line between two points (inclusive). */
  c.line = (x1, y1, z1, x2, y2, z2, p) => {
    const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), Math.abs(z2 - z1), 1);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      c.set(Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), Math.round(z1 + (z2 - z1) * t), p);
    }
  };

  // --- rotation-aware directional blocks -----------------------------------
  /** Stairs ascending toward `up` (local direction). */
  c.stairs = (id, up, upside = false) => {
    const values = { east: 0, west: 1, south: 2, north: 3 };
    return P(id, { weirdo_direction: values[worldDir(up, rotation)], upside_down_bit: upside }, id);
  };
  /** Ladder facing `face` (local direction pointing away from its supporting wall). */
  c.ladder = (face) => {
    const values = { north: 2, south: 3, west: 4, east: 5 };
    return P("minecraft:ladder", { facing_direction: values[worldDir(face, rotation)] }, "minecraft:ladder");
  };
  c.chair = (x, y, z, facing) => c.set(x, y, z, c.stairs("minecraft:polished_blackstone_stairs", OPPOSITE[facing]));
  c.bench = (x, y, z, facing) => c.set(x, y, z, c.stairs("minecraft:spruce_stairs", OPPOSITE[facing]));

  return c;
}

// ---------------------------------------------------------------------------
// Access systems
// ---------------------------------------------------------------------------

// Clockwise 4×4 ring (local offsets): corners at 0,3,6,9.
const RING = [
  [0, 0, "c", null], [1, 0, "s", "east"], [2, 0, "s", "east"],
  [3, 0, "c", null], [3, 1, "s", "south"], [3, 2, "s", "south"],
  [3, 3, "c", null], [2, 3, "s", "west"], [1, 3, "s", "west"],
  [0, 3, "c", null], [0, 2, "s", "north"], [0, 1, "s", "north"]
];
const CORNER_START = { nw: 0, ne: 3, se: 6, sw: 9 };
const CORNER_EXITS = { nw: ["north", "west"], ne: ["north", "east"], se: ["south", "east"], sw: ["south", "west"] };

/**
 * Spiral stairwell. Ring interior occupies x0..x0+3, z0..z0+3, walls at ±1.
 * Rises exactly 8 blocks per revolution, so every multiple of 8 above
 * `bottomWalk` has a landing at the `corner`, with doorways on `exitSide`.
 * @param {object} c kit context
 * @param {object} o { x0, z0, bottomWalk, topWalk, corner:'ne'|..., exits:[{walk, side}], wall, stair, core }
 */
export function spiralStairwell(c, o) {
  const { x0, z0, bottomWalk, topWalk } = o;
  const wall = o.wall ?? c.B.tile;
  const stairId = o.stair ?? "minecraft:polished_deepslate_stairs";
  const step = o.step ?? c.B.concrete;
  // shell + clear
  const wallTop = o.openTop ? topWalk - 1 : topWalk + 3;
  c.walls(x0 - 1, bottomWalk - 1, z0 - 1, x0 + 4, wallTop, z0 + 4, wall);
  c.fill(x0, bottomWalk - 1, z0, x0 + 3, bottomWalk - 1, z0 + 3, step);
  c.clear(x0, bottomWalk, z0, x0 + 3, topWalk + 3, z0 + 3);
  // core with lights
  c.fill(x0 + 1, bottomWalk - 1, z0 + 1, x0 + 2, topWalk + 3, z0 + 2, o.core ?? c.B.blackstoneBricks);
  for (let y = bottomWalk + 2; y <= topWalk + 2; y += 4) {
    c.set(x0 + 1, y, z0 + 1, c.B.sea);
    c.set(x0 + 2, y, z0 + 2, c.B.sea);
  }
  const start = CORNER_START[o.corner ?? "ne"];
  let blockY = bottomWalk - 1; // y of the block under the walker
  let i = 0;
  while (true) {
    const [dx, dz, kind, dir] = RING[(start + i) % 12];
    if (kind === "s") {
      blockY += 1;
      if (blockY >= topWalk) break;
      c.set(x0 + dx, blockY, z0 + dz, c.stairs(stairId, dir));
    } else {
      c.set(x0 + dx, blockY, z0 + dz, step);
      if (blockY + 1 >= topWalk) break;
    }
    i++;
    if (i > 2000) break;
  }
  // Exits: doorway (1 wide × 3 tall) beside the landing corner at each walk level.
  const [cdx, cdz] = RING[start];
  for (const exit of o.exits ?? []) {
    const d = DIRS[exit.side];
    const ex = x0 + cdx + d.x;
    const ez = z0 + cdz + d.z;
    c.clear(ex, exit.walk, ez, ex, exit.walk + 2, ez);
    c.set(ex, exit.walk - 1, ez, step);
  }
  if (o.openTop) {
    // Guard rail around the stair opening on the surface floor, leaving the top exit open.
    const top = (o.exits ?? []).find((e) => e.walk === topWalk);
    const d = top ? DIRS[top.side] : { x: 0, z: 0 };
    const gx = x0 + cdx + d.x;
    const gz = z0 + cdz + d.z;
    for (let x = x0 - 1; x <= x0 + 4; x++) for (let z = z0 - 1; z <= z0 + 4; z++) {
      const edge = x === x0 - 1 || x === x0 + 4 || z === z0 - 1 || z === z0 + 4;
      if (!edge || (x === gx && z === gz)) continue;
      c.set(x, topWalk, z, c.B.bars);
    }
  }
  return { landing: { x: x0 + cdx, z: z0 + cdz } };
}

/**
 * Scaffolding "lift" shaft (works on touch, controller and keyboard:
 * jump to climb, sneak to descend). 1×1 interior at (x,z) with glass walls.
 */
export function liftShaft(c, o) {
  const { x, z, bottomWalk, topWalk } = o;
  for (let y = bottomWalk - 1; y <= topWalk + 3; y++) {
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.set(x + dx, y, z + dz, c.B.blackstoneBricks);
    for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) c.set(x + dx, y, z + dz, (y - bottomWalk) % 4 === 3 ? c.B.sea : c.B.lightBlueGlass);
  }
  c.set(x, bottomWalk - 1, z, c.B.concrete);
  c.fill(x, bottomWalk, z, x, topWalk - 1, z, c.B.scaffolding);
  c.clear(x, topWalk, z, x, topWalk + 2, z);
  for (const exit of o.exits ?? []) {
    const d = DIRS[exit.side];
    c.clear(x + d.x, exit.walk, z + d.z, x + d.x, exit.walk + 1, z + d.z);
    c.set(x + d.x, exit.walk - 1, z + d.z, c.B.yellow);
  }
}

/** Ladder escape shaft. Ladder hangs on `wallSide`. 1×1 interior. */
export function ladderShaft(c, o) {
  const { x, z, bottomWalk, topWalk } = o;
  const wall = o.wall ?? c.B.tile;
  for (let y = bottomWalk - 1; y <= topWalk + 2; y++) {
    for (const [dx, dz] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) c.set(x + dx, y, z + dz, wall);
  }
  c.set(x, bottomWalk - 1, z, c.B.concrete);
  c.clear(x, bottomWalk, z, x, topWalk + 2, z);
  const ladder = c.ladder(OPPOSITE[o.wallSide]);
  c.fill(x, bottomWalk, z, x, topWalk, z, ladder);
  for (let y = bottomWalk + 3; y <= topWalk; y += 5) {
    const d = DIRS[LEFT[o.wallSide]];
    c.set(x + d.x, y, z + d.z, c.B.sea);
  }
  for (const exit of o.exits ?? []) {
    const d = DIRS[exit.side];
    c.clear(x + d.x, exit.walk, z + d.z, x + d.x, exit.walk + 1, z + d.z);
    c.set(x + d.x, exit.walk - 1, z + d.z, c.B.concrete);
  }
}

/** Small surface access hut centred on (x,z) with a doorway on `door` side. */
export function accessHut(c, o) {
  const { x, z, walk } = o;
  const r = o.radius ?? 2;
  const h = o.height ?? 4;
  const wall = o.wall ?? c.V.wall;
  c.fill(x - r, walk - 1, z - r, x + r, walk - 1, z + r, c.V.floor);
  c.walls(x - r, walk, z - r, x + r, walk + h - 1, z + r, wall);
  for (const [dx, dz] of [[-r, -r], [r, -r], [-r, r], [r, r]]) c.fill(x + dx, walk - 1, z + dz, x + dx, walk + h, z + dz, c.V.frame);
  c.fill(x - r, walk + h, z - r, x + r, walk + h, z + r, c.V.accent);
  c.clear(x - r + 1, walk, z - r + 1, x + r - 1, walk + h - 1, z + r - 1);
  if (o.keep) for (const k of o.keep) c.set(k.x, k.y, k.z, k.p);
  const d = DIRS[o.door];
  const ex = x + d.x * r;
  const ez = z + d.z * r;
  const side = DIRS[LEFT[o.door]];
  const w = o.doorWidth ?? 1;
  for (let i = -Math.floor((w - 1) / 2); i <= Math.ceil((w - 1) / 2); i++) c.clear(ex + side.x * i, walk, ez + side.z * i, ex + side.x * i, walk + 2, ez + side.z * i);
  c.set(ex + side.x * (Math.ceil((w - 1) / 2) + 1), walk + 2, ez + side.z * (Math.ceil((w - 1) / 2) + 1), c.B.sea);
  c.set(ex - side.x * (Math.floor((w - 1) / 2) + 1), walk + 2, ez - side.z * (Math.floor((w - 1) / 2) + 1), c.B.sea);
  c.set(x, walk + h - 1, z, c.B.sea);
  if (o.mast) {
    c.fill(x + r, walk + h + 1, z - r, x + r, walk + h + 4, z - r, c.B.bars);
    c.set(x + r, walk + h + 5, z - r, c.B.red);
  }
}

// ---------------------------------------------------------------------------
// Strategic geometry
// ---------------------------------------------------------------------------

function norm(v) {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}
function cross(a, b) {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** Axis pointing up, tilted `elevationFromVertical` degrees toward local `toward` direction. */
export function aimAxis(elevationFromVertical, toward = "south", yawOffsetDeg = 0) {
  const t = (elevationFromVertical * Math.PI) / 180;
  const base = DIRS[toward];
  const yaw = (yawOffsetDeg * Math.PI) / 180;
  const hx = base.x * Math.cos(yaw) - base.z * Math.sin(yaw);
  const hz = base.x * Math.sin(yaw) + base.z * Math.cos(yaw);
  return norm({ x: hx * Math.sin(t), y: Math.cos(t), z: hz * Math.sin(t) });
}

/**
 * Parabolic dish. Vertex at v (the dish's deepest point), opening along axis n.
 * Places reflector surface, dark rim, panel seams, tripod feed horn and a
 * back-frame toward the mount. Returns the vertex and focal points.
 */
export function parabolicDish(c, o) {
  const { v, n, R } = o;
  const depth = o.depth ?? R * 0.3;
  const f = (R * R) / (4 * depth);
  const thick = o.thickness ?? 0.75;
  const surface = o.surface ?? c.B.white;
  const seam = o.seam ?? c.B.lightGrey;
  const rim = o.rim ?? c.B.tile;
  const rimLight = o.rimLight ?? c.B.yellow;
  // orthonormal frame
  const ref = Math.abs(n.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const e1 = norm(cross(n, ref));
  const e2 = cross(n, e1);
  const ext = Math.ceil(R + 2);
  for (let dx = -ext; dx <= ext; dx++) {
    for (let dy = -ext; dy <= ext + Math.ceil(depth) + 1; dy++) {
      for (let dz = -ext; dz <= ext; dz++) {
        const p = { x: dx, y: dy, z: dz };
        const u = dot(p, n);
        if (u < -1.5 || u > depth + 1.5) continue;
        const a = dot(p, e1);
        const b = dot(p, e2);
        const r = Math.hypot(a, b);
        if (r > R + 0.6) continue;
        const target = (r * r) / (4 * f);
        const off = u - target;
        let block;
        if (r > R - 0.9 && off > -1.4 && off < 1.0) block = (Math.round(Math.atan2(b, a) * 8 / Math.PI) % 2 === 0) ? rimLight : rim;
        else if (r <= R - 0.9 && Math.abs(off) <= thick) {
          const ang = Math.atan2(b, a);
          const seamRadial = Math.abs(Math.sin(ang * 4)) < 0.12 && r > 2;
          const ring = Math.abs(r - R * 0.55) < 0.5;
          block = seamRadial || ring ? seam : surface;
        } else if (o.back && off < -thick && off > -thick - 1.1 && r < R * 0.45) block = o.back;
        if (block) c.set(Math.round(v.x + dx), Math.round(v.y + dy), Math.round(v.z + dz), block);
      }
    }
  }
  // Feed horn on a three-legged tripod.
  const focus = { x: v.x + n.x * f * 0.85, y: v.y + n.y * f * 0.85, z: v.z + n.z * f * 0.85 };
  const strut = o.strut ?? c.B.blackstone;
  for (let k = 0; k < 3; k++) {
    const ang = (k * 2 * Math.PI) / 3 + 0.4;
    const rr = R * 0.82;
    const pa = rr * Math.cos(ang);
    const pb = rr * Math.sin(ang);
    const base = {
      x: v.x + e1.x * pa + e2.x * pb + n.x * ((rr * rr) / (4 * f) + 0.6),
      y: v.y + e1.y * pa + e2.y * pb + n.y * ((rr * rr) / (4 * f) + 0.6),
      z: v.z + e1.z * pa + e2.z * pb + n.z * ((rr * rr) / (4 * f) + 0.6)
    };
    c.line(Math.round(base.x), Math.round(base.y), Math.round(base.z), Math.round(focus.x), Math.round(focus.y), Math.round(focus.z), strut);
  }
  const fx = Math.round(focus.x), fy = Math.round(focus.y), fz = Math.round(focus.z);
  c.fill(fx - 1, fy - 1, fz - 1, fx + 1, fy + 1, fz + 1, c.B.tile);
  c.set(fx, fy, fz, c.B.sea);
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]) c.set(fx + dx, fy + dy, fz + dz, c.B.sea);
  c.set(fx, fy + 1, fz, c.B.bars);
  c.set(fx, fy + 2, fz, c.B.red);
  return { vertex: v, focus };
}

/**
 * Flat rectangular phased-array radar face, centred at `center`, width along
 * local x, tilted back by `tilt` degrees (face looks toward local +z / south).
 */
export function radarArray(c, o) {
  const { center, width, height } = o;
  const tilt = ((o.tilt ?? 15) * Math.PI) / 180;
  const frame = o.frame ?? c.B.blackstoneBricks;
  const cell = o.cell ?? c.B.black;
  const grid = o.grid ?? c.B.tile;
  const accent = o.accent ?? c.B.sea;
  const hw = width / 2;
  const hh = height / 2;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  for (let ix = -Math.ceil(hw); ix <= Math.ceil(hw); ix++) {
    for (let iv = -Math.ceil(hh); iv <= Math.ceil(hh); iv++) {
      const dy = Math.round(iv * cos);
      const dz = Math.round(-iv * sin);
      const edgeX = Math.abs(ix) >= Math.ceil(hw);
      const edgeV = Math.abs(iv) >= Math.ceil(hh);
      let b;
      if (edgeX && (iv % 3 === 0)) b = accent;
      else if (edgeX || edgeV) b = frame;
      else if (ix % 3 === 0 || iv % 3 === 0) b = grid;
      else b = cell;
      c.set(center.x + ix, center.y + dy, center.z + dz, b);
      // lattice backing
      if (!edgeX && !edgeV && (ix % 3 === 0 || iv % 3 === 0)) c.set(center.x + ix, center.y + dy, center.z + dz - 1, o.back ?? c.B.bars);
    }
  }
  // warning beacons on top corners
  const topY = center.y + Math.round(Math.ceil(hh) * cos) + 1;
  const topZ = center.z - Math.round(Math.ceil(hh) * sin);
  c.set(center.x - Math.ceil(hw), topY, topZ, c.B.red);
  c.set(center.x + Math.ceil(hw), topY, topZ, c.B.red);
}

/** Square lattice mast with X bracing. Footprint (x..x+w-1, z..z+w-1). */
export function latticeMast(c, o) {
  const { x, z, y1, y2 } = o;
  const w = o.width ?? 3;
  const post = o.post ?? c.B.blackstoneBricks;
  const brace = o.brace ?? c.B.bars;
  const x2 = x + w - 1;
  const z2 = z + w - 1;
  for (const [px, pz] of [[x, z], [x2, z], [x, z2], [x2, z2]]) c.fill(px, y1, pz, px, y2, pz, post);
  const seg = Math.max(2, w - 1);
  for (let y = y1; y + seg <= y2; y += seg) {
    c.line(x, y, z, x2, y + seg, z, brace); c.line(x2, y, z, x, y + seg, z, brace);
    c.line(x, y, z2, x2, y + seg, z2, brace); c.line(x2, y, z2, x, y + seg, z2, brace);
    c.line(x, y, z, x, y + seg, z2, brace); c.line(x, y, z2, x, y + seg, z, brace);
    c.line(x2, y, z, x2, y + seg, z2, brace); c.line(x2, y, z2, x2, y + seg, z, brace);
    c.walls(x, y + seg, z, x2, y + seg, z2, post);
  }
  if (o.beacon !== false) {
    c.fill(x + Math.floor(w / 2), y2 + 1, z + Math.floor(w / 2), x + Math.floor(w / 2), y2 + 3, z + Math.floor(w / 2), c.B.bars);
    c.set(x + Math.floor(w / 2), y2 + 4, z + Math.floor(w / 2), c.B.red);
  }
}

/** Perimeter security fence with lit posts. */
export function securityFence(c, o) {
  const { x1, z1, x2, z2, walk } = o;
  const h = o.height ?? 2;
  c.walls(x1, walk - 1, z1, x2, walk - 1, z2, o.kerb ?? c.B.stoneBrick);
  c.walls(x1, walk, z1, x2, walk + h - 1, z2, o.mesh ?? c.B.bars);
  const step = o.post ?? 5;
  for (let x = x1; x <= x2; x += step) for (const z of [z1, z2]) { c.fill(x, walk, z, x, walk + h, z, c.B.blackstoneBricks); c.set(x, walk + h + 1, z, c.B.sea); }
  for (let z = z1; z <= z2; z += step) for (const x of [x1, x2]) { c.fill(x, walk, z, x, walk + h, z, c.B.blackstoneBricks); c.set(x, walk + h + 1, z, c.B.sea); }
  for (const g of o.gates ?? []) c.clear(g.x1, walk, g.z1, g.x2, walk + h + 1, g.z2);
}

/** Yellow/black hazard border on a floor rectangle (y = floor block level). */
export function hazardBorder(c, x1, y, z1, x2, z2) {
  let i = 0;
  for (let x = x1; x <= x2; x++) { c.set(x, y, z1, i % 2 ? c.B.black : c.B.yellow); c.set(x, y, z2, i++ % 2 ? c.B.black : c.B.yellow); }
  for (let z = z1 + 1; z < z2; z++) { c.set(x1, y, z, i % 2 ? c.B.black : c.B.yellow); c.set(x2, y, z, i++ % 2 ? c.B.black : c.B.yellow); }
}
