import { DIRS, OPPOSITE } from "./kit.js";
import { furnishRoom } from "./interiors.js";

// ---------------------------------------------------------------------------
// Shared above-ground building components (v1.5.0)
// ---------------------------------------------------------------------------

/** Straight internal stair flight rising from `walk` by `rise`, climbing toward `up`. */
export function stairFlight(c, x, z, up, walk, rise, stairId = "minecraft:polished_deepslate_stairs") {
  const d = DIRS[up];
  for (let i = 0; i < rise; i++) {
    const sx = x + d.x * i;
    const sz = z + d.z * i;
    c.set(sx, walk + i, sz, c.stairs(stairId, up));
    c.clear(sx, walk + i + 1, sz, sx, walk + i + 3, sz);
  }
  // landing beyond the last step
  return { x: x + d.x * rise, z: z + d.z * rise };
}

/**
 * Multi-storey operations building with windows, a lit entrance, internal
 * stairs and furnished floors.
 * o = { x1, z1, x2, z2, walk, floors:[type|[{u1,u2,type}]], floorH, door:'south', roofDeck, wall, frame, glass }
 */
export function opsBuilding(c, o) {
  const { x1, z1, x2, z2, walk } = o;
  const fh = o.floorH ?? 6;
  const n = o.floors.length;
  const wall = o.wall ?? c.V.wall;
  const frame = o.frame ?? c.V.frame;
  const glass = o.glass ?? c.B.tinted;
  const top = walk + fh * n;
  c.fill(x1, walk - 1, z1, x2, walk - 1, z2, c.V.floor);
  for (let k = 0; k < n; k++) {
    const w = walk + fh * k;
    c.walls(x1, w, z1, x2, w + fh - 2, z2, wall);
    c.fill(x1, w + fh - 1, z1, x2, w + fh - 1, z2, k === n - 1 ? c.V.accent : c.V.floor);
    c.clear(x1 + 1, w, z1 + 1, x2 - 1, w + fh - 2, z2 - 1);
    // ribbon windows
    for (let x = x1 + 2; x <= x2 - 2; x++) if ((x - x1) % 4 !== 0) for (const z of [z1, z2]) { c.set(x, w + 1, z, glass); c.set(x, w + 2, z, glass); }
    for (let z = z1 + 2; z <= z2 - 2; z++) if ((z - z1) % 4 !== 0) for (const x of [x1, x2]) { c.set(x, w + 1, z, glass); c.set(x, w + 2, z, glass); }
    // dark band between storeys + accent lights
    for (let x = x1; x <= x2; x++) { c.set(x, w + fh - 1, z1, frame); c.set(x, w + fh - 1, z2, frame); }
    for (let x = x1 + 2; x <= x2 - 2; x += 6) c.set(x, w + fh - 2, z2, c.B.sea);
  }
  for (const [px, pz] of [[x1, z1], [x2, z1], [x1, z2], [x2, z2]]) c.fill(px, walk - 1, pz, px, top, pz, frame);
  // entrance (south / z2 by default): 3 wide, 3 tall, canopy and lights
  const doorX = o.doorX ?? Math.floor((x1 + x2) / 2);
  c.clear(doorX - 1, walk, z2, doorX + 1, walk + 2, z2);
  c.fill(doorX - 2, walk + 3, z2 + 1, doorX + 2, walk + 3, z2 + 2, frame);
  c.set(doorX - 2, walk + 2, z2 + 1, c.B.sea);
  c.set(doorX + 2, walk + 2, z2 + 1, c.B.sea);
  c.fill(doorX - 1, walk - 1, z2 + 1, doorX + 1, walk - 1, z2 + 2, c.B.andesite);
  // internal stairs along the west wall rising north
  const sx = x1 + 1;
  for (let k = 0; k < n - 1 + (o.roofDeck ? 1 : 0); k++) {
    const w = walk + fh * k;
    const startZ = z2 - 2;
    stairFlight(c, sx, startZ, "north", w, fh);
    c.clear(sx, w + fh - 1, startZ - fh + 1, sx, w + fh - 1, startZ);
    for (let z = startZ - fh + 1; z <= startZ; z++) c.set(sx + 1, w + fh, z, c.B.bars);
  }
  // furnish
  for (let k = 0; k < n; k++) {
    const w = walk + fh * k;
    const spec = o.floors[k];
    const rooms = Array.isArray(spec) ? spec : [{ u1: x1 + 3, u2: x2 - 1, type: spec }];
    for (const r of rooms) {
      if (!r.type || r.type === "none") continue;
      furnishRoom(c, { x1: r.u1, z1: z1 + 1, x2: r.u2, z2: z2 - 2, walk: w, h: fh - 1, type: r.type, door: "south", doorU: Math.floor((r.u2 - r.u1) / 2) });
    }
  }
  if (o.roofDeck) {
    for (let x = x1; x <= x2; x++) for (const z of [z1, z2]) c.set(x, top, z, c.B.rail);
    for (let z = z1; z <= z2; z++) for (const x of [x1, x2]) c.set(x, top, z, c.B.rail);
  }
  return { top, doorX };
}

/** Thick fortified compound wall with buttress pillars, lamps and a gate. */
export function compoundWall(c, o) {
  const { x1, z1, x2, z2, walk } = o;
  const h = o.height ?? 4;
  const wall = o.wall ?? c.B.tile;
  const cap = o.cap ?? c.B.blackstoneBricks;
  c.walls(x1, walk - 1, z1, x2, walk + h - 1, z2, wall);
  c.walls(x1, walk + h, z1, x2, walk + h, z2, cap);
  const step = o.step ?? 6;
  const pillar = (x, z) => { c.fill(x, walk - 1, z, x, walk + h + 1, z, cap); c.set(x, walk + h + 2, z, c.B.froglight); };
  for (let x = x1; x <= x2; x += step) { pillar(x, z1); pillar(x, z2); }
  for (let z = z1; z <= z2; z += step) { pillar(x1, z); pillar(x2, z); }
  for (const g of o.gates ?? []) {
    c.clear(g.x1, walk, g.z1, g.x2, walk + h + 2, g.z2);
    c.fill(g.x1, walk - 1, g.z1, g.x2, walk - 1, g.z2, c.B.andesite);
  }
  if (o.towers) {
    for (const [tx, tz] of [[x1, z1], [x2 - 2, z1], [x1, z2 - 2], [x2 - 2, z2 - 2]]) {
      c.fill(tx, walk - 1, tz, tx + 2, walk + h + 3, tz + 2, cap);
      c.set(tx + 1, walk + h + 4, tz + 1, c.B.froglight);
      for (const [dx, dz] of [[0, 0], [2, 0], [0, 2], [2, 2]]) c.set(tx + dx, walk + h + 4, tz + dz, cap);
    }
  }
}

/** Lamp post with cyan lantern on a hazard-yellow base. */
export function lampPost(c, x, z, walk, h = 3) {
  c.set(x, walk, z, c.B.yellow);
  c.fill(x, walk + 1, z, x, walk + h, z, c.B.blackstoneBricks);
  c.set(x, walk + h + 1, z, c.B.sea);
}

/** Circular stepped plinth (tiers of decreasing radius). */
export function tieredPlinth(c, cx, cz, walk, tiers) {
  let y = walk - 1;
  for (const t of tiers) {
    for (let i = 0; i < t.h; i++) c.cyl(cx, cz, y + 1 + i, y + 1 + i, t.r, t.block ?? c.B.andesite);
    y += t.h;
    if (t.rim) c.disc(cx, cz, y, t.r, t.rim, 1);
    if (t.lights) {
      const n = t.lights;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        c.set(Math.round(cx + Math.cos(a) * t.r), y, Math.round(cz + Math.sin(a) * t.r), c.B.sea);
      }
    }
    if (t.rail) {
      const r = t.railR ?? t.r;
      for (let k = 0; k < 64; k++) {
        const a = (k / 64) * Math.PI * 2;
        c.set(Math.round(cx + Math.cos(a) * r), y + 1, Math.round(cz + Math.sin(a) * r), t.railBlock ?? c.B.rail);
      }
    }
  }
  return y; // top block level
}

/** Outer staircase climbing a plinth along a straight line (gap in rails). */
export function externalStairs(c, x, z, up, walk, rise, width = 2, stairId = "minecraft:polished_deepslate_stairs") {
  const d = DIRS[up];
  const side = DIRS[{ north: "east", south: "west", east: "south", west: "north" }[up]];
  for (let i = 0; i < rise; i++) {
    for (let k = 0; k < width; k++) {
      const sx = x + d.x * i + side.x * k;
      const sz = z + d.z * i + side.z * k;
      c.set(sx, walk + i, sz, c.stairs(stairId, up));
      c.clear(sx, walk + i + 1, sz, sx, walk + i + 3, sz);
      for (let yy = walk - 1; yy < walk + i; yy++) c.set(sx, yy, sz, c.B.tile);
    }
    // yellow handrails
    c.set(x + d.x * i - side.x, walk + i + 1, z + d.z * i - side.z, c.B.rail);
    c.set(x + d.x * i + side.x * width, walk + i + 1, z + d.z * i + side.z * width, c.B.rail);
  }
  return { x: x + d.x * rise, z: z + d.z * rise };
}

export { OPPOSITE };
