import { kit } from "../kit.js";

// ---------------------------------------------------------------------------
// Runways & Airfield v2 (v1.6.0) — rebuilt in the style of the user's own base:
//   * dark speckled asphalt (black + grey concrete), lighter shoulders,
//     white edge lines, flush redstone-lamp edge lights
//   * white centreline dashes with embedded sea-lantern lights
//   * threshold: blast pad with yellow chevrons + approach lights, green
//     threshold light bar, piano keys, chosen runway designator (e.g. 38R)
//   * touchdown-zone bars and aiming-point blocks
//   * yellow taxiway centrelines with embedded lights, curved lead-off lines,
//     holding-position markings and red stop bars
// All modules share one cross-section so they snap end to end.
// Local layout: surface at y = 1, foundation y = 0, cleared y = 2..4.
// ---------------------------------------------------------------------------

const SY = 1; // surface level
export const RUNWAY_W = 55; // 5 shoulder + 45 runway + 5 shoulder
const RC = 27; // runway centreline x
export const TAXI_W = 25;
const TC = 12; // taxiway centreline offset

export const AIRFIELD_SIZES = {
  runway_straight: { x: RUNWAY_W, y: 6, z: 64 },
  runway_touchdown_zone: { x: RUNWAY_W, y: 6, z: 64 },
  runway_threshold: { x: RUNWAY_W, y: 6, z: 112 },
  runway_taxiway_junction: { x: RUNWAY_W + 32, y: 6, z: 64 },
  taxiway_straight: { x: TAXI_W, y: 6, z: 32 },
  taxiway_holding_point: { x: TAXI_W, y: 6, z: 32 },
  taxiway_corner: { x: 45, y: 6, z: 45 },
  aircraft_apron: { x: 81, y: 6, z: 72 }
};

/** Snap connectors (local): in = joins the previous piece, out = continues. */
export const AIRFIELD_SNAP = {
  runway_straight: { in: { x: RC, z: 63, dir: "south" }, out: { x: RC, z: 0, dir: "north" } },
  runway_touchdown_zone: { in: { x: RC, z: 63, dir: "south" }, out: { x: RC, z: 0, dir: "north" } },
  runway_threshold: { in: { x: RC, z: 0, dir: "north" }, out: { x: RC, z: 0, dir: "north" } },
  runway_taxiway_junction: { in: { x: RC, z: 63, dir: "south" }, out: { x: RC, z: 0, dir: "north" }, branch: { x: RUNWAY_W + 31, z: 32, dir: "east" } },
  taxiway_straight: { in: { x: TC, z: 31, dir: "south" }, out: { x: TC, z: 0, dir: "north" } },
  taxiway_holding_point: { in: { x: TC, z: 31, dir: "south" }, out: { x: TC, z: 0, dir: "north" } },
  taxiway_corner: { in: { x: TC, z: 44, dir: "south" }, out: { x: 44, z: TC, dir: "east" } },
  aircraft_apron: { in: { x: 40, z: 71, dir: "south" }, out: { x: 40, z: 71, dir: "south" } }
};

export function hash(x, z) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Speckled asphalt like the reference: mostly black with grey blobs and flecks. */
export function asphalt(c, x, z) {
  const blob = hash(x >> 1, z >> 1);
  const n = hash(x, z);
  if (blob < 0.16 && n < 0.7) return c.B.grey;
  if (n < 0.06) return c.B.grey;
  if (n > 0.995) return c.B.lightGrey;
  return c.B.black;
}
export function shoulder(c, x, z) {
  return hash(x + 911, z) < 0.35 ? c.B.andesite : c.B.lightGrey;
}
export function blastPad(c, x, z) {
  return hash(x, z + 77) < 0.3 ? c.B.andesite : c.B.lightGrey;
}

function ctx(id, dimension, origin, rotation, variantId) {
  const size = AIRFIELD_SIZES[id];
  const c = kit(dimension, origin, rotation, size, variantId);
  return { c, size };
}

/** Runway cross-section for rows z1..z2. */
function runwayRows(c, z1, z2, opts = {}) {
  for (let z = z1; z <= z2; z++) {
    for (let x = 0; x < RUNWAY_W; x++) {
      c.set(x, SY - 1, z, c.B.concrete);
      let b;
      if (x <= 4 || x >= 50) b = shoulder(c, x, z);
      else if (x === 5 || x === 49) b = c.B.white;
      else b = opts.pad ? blastPad(c, x, z) : asphalt(c, x, z);
      c.set(x, SY, z, b);
    }
    if (z % 8 === 4 && !opts.noLamps) {
      c.set(2, SY, z, c.B.lamp);
      c.set(RUNWAY_W - 3, SY, z, c.B.lamp);
    }
  }
}

function centreline(c, z1, z2) {
  for (let z = z1; z <= z2; z++) {
    const m = ((z % 16) + 16) % 16;
    if (m < 9) c.set(RC, SY, z, c.B.white);
    if (m === 12 || m === 4) c.set(RC, SY, z, c.B.sea);
  }
}

function bar(c, x, z1, z2, b) {
  for (let z = z1; z <= z2; z++) c.set(x, SY, z, b);
}

/** Mirrored marking about the centreline. dx = offset from centre to the inner edge. */
function mirroredBars(c, offsets, z1, z2, width = 1) {
  for (const dx of offsets) for (let w = 0; w < width; w++) {
    bar(c, RC - dx - w, z1, z2, c.B.white);
    bar(c, RC + dx + w, z1, z2, c.B.white);
  }
}

// ---- pixel font (5 × 7) for runway designators -----------------------------
export const FONT = {
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  6: ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"]
};
const SX = 2; // across the runway
const SZ = 3; // along the runway (elongated, like real markings)

/**
 * Draws text centred on the runway, readable by a pilot approaching from +z
 * (row 0 of each glyph is the far edge, at zTop).
 */
function drawText(c, text, zTop) {
  const glyphW = 5 * SX;
  const gap = 2;
  const total = text.length * glyphW + (text.length - 1) * gap;
  let x0 = RC - Math.floor(total / 2) + 1;
  for (const ch of text) {
    const g = FONT[ch];
    if (g) {
      for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
        if (g[r][col] !== "1") continue;
        for (let a = 0; a < SX; a++) for (let b = 0; b < SZ; b++) c.set(x0 + col * SX + a, SY, zTop + r * SZ + b, c.B.white);
      }
    }
    x0 += glyphW + gap;
  }
}

/** Validates and normalises a designator: "9" → "09", "38r" → "38R". */
export function normaliseDesignator(input) {
  const m = String(input ?? "").trim().toUpperCase().match(/^(\d{1,2})([LCR]?)$/);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  if (n < 1 || n > 99) return undefined;
  return { number: String(n).padStart(2, "0"), side: m[2] };
}

// ---------------------------------------------------------------------------
// Runway modules
// ---------------------------------------------------------------------------

export function buildRunwayStraightV2(dimension, origin, rotation, variantId) {
  const { c } = ctx("runway_straight", dimension, origin, rotation, variantId);
  runwayRows(c, 0, 63);
  centreline(c, 0, 63);
}

export function buildRunwayTouchdownZone(dimension, origin, rotation, variantId) {
  const { c } = ctx("runway_touchdown_zone", dimension, origin, rotation, variantId);
  runwayRows(c, 0, 63);
  centreline(c, 0, 63);
  // near the threshold (high z) three-bar groups, then the aiming point, then two-bar groups
  mirroredBars(c, [9, 12, 15], 50, 60, 2);
  mirroredBars(c, [7], 22, 39, 6);
  mirroredBars(c, [10, 13], 4, 13, 2);
}

export function buildRunwayThresholdV2(dimension, origin, rotation, variantId, options = {}) {
  const { c } = ctx("runway_threshold", dimension, origin, rotation, variantId);
  const des = normaliseDesignator(options.designator) ?? { number: "09", side: "" };
  // blast pad / stopway (z 84..111)
  runwayRows(c, 84, 111, { pad: true });
  for (let k = 0; k < 3; k++) {
    const apex = 86 + k * 9;
    for (let x = 6; x <= 48; x++) {
      const zc = apex + 0.6 * Math.abs(x - RC);
      for (let z = Math.round(zc); z <= Math.round(zc) + 1; z++) if (z >= 84 && z <= 111) c.set(x, SY, z, c.B.yellow);
    }
  }
  for (let z = 86; z <= 110; z += 3) c.set(RC, SY, z, c.B.sea);
  for (const zr of [95, 104]) for (let x = RC - 10; x <= RC + 10; x += 2) if (x !== RC) c.set(x, SY + 1, zr, c.P("minecraft:redstone_torch"));
  for (const x of [RC - 4, RC + 4]) for (let z = 88; z <= 110; z += 2) c.set(x, SY + 1, z, c.P("minecraft:redstone_torch"));
  // threshold light bar (green) across the full width
  for (let x = 0; x < RUNWAY_W; x++) { c.set(x, SY - 1, 83, c.B.concrete); c.set(x, SY, 83, x % 2 ? c.P("minecraft:verdant_froglight") : c.B.white); }
  // runway proper (z 0..82)
  runwayRows(c, 0, 82);
  // piano keys (z 60..81): 4 stripes each side
  for (const x0 of [6, 11, 16, 21, 31, 36, 41, 46]) for (let x = x0; x < x0 + 3; x++) bar(c, x, 60, 81, c.B.white);
  // designator: letter nearest the threshold, number beyond it
  if (des.side) {
    drawText(c, des.side, 36);
    drawText(c, des.number, 13);
  } else {
    drawText(c, des.number, 36);
  }
  // first touchdown bars + centreline beyond the numbers
  mirroredBars(c, [9, 12, 15], 1, 9, 2);
  centreline(c, 0, 11);
}

export function buildRunwayTaxiwayJunction(dimension, origin, rotation, variantId) {
  const { c } = ctx("runway_taxiway_junction", dimension, origin, rotation, variantId);
  runwayRows(c, 0, 63);
  centreline(c, 0, 63);
  const xEnd = RUNWAY_W + 31;
  // taxiway stub heading east, with a widening fillet into the runway shoulder
  for (let x = 50; x <= xEnd; x++) {
    const e = x <= 66 ? Math.round((66 - x) * 0.75) : 0;
    for (let z = 20 - e; z <= 44 + e; z++) {
      if (z < 0 || z > 63) continue;
      const u = z - 20;
      let b;
      if (u === -e || u === 24 + e) b = shoulder(c, x, z);
      else if (u === 1 - e || u === 23 + e) b = c.B.white;
      else b = asphalt(c, x, z);
      c.set(x, SY - 1, z, c.B.concrete);
      c.set(x, SY, z, b);
    }
  }
  // lead-off arcs (both directions) from the runway centreline onto the taxiway centreline
  const R = 26;
  for (const [ox, oz, zLo, zHi] of [[RC + R, 32 + R, 32, 32 + R], [RC + R, 32 - R, 32 - R, 32]]) {
    let n = 0;
    for (let x = RC; x <= ox; x++) for (let z = zLo; z <= zHi; z++) {
      const d = Math.hypot(x - ox, z - oz);
      if (Math.abs(d - R) < 0.62) c.set(x, SY, z, (n++ % 9 === 4) ? c.B.sea : c.B.yellow);
    }
  }
  for (let x = RC + R; x <= xEnd; x++) c.set(x, SY, 32, (x % 10 === 5) ? c.B.sea : c.B.yellow);
  // holding position markings (dashed on the runway side, solid on the taxiway side)
  for (let z = 22; z <= 42; z++) {
    c.set(67, SY, z, z % 2 ? c.B.yellow : asphalt(c, 67, z));
    c.set(68, SY, z, z % 2 ? c.B.yellow : asphalt(c, 68, z));
    c.set(70, SY, z, c.B.yellow);
    c.set(71, SY, z, c.B.yellow);
  }
  // taxiway sign board beside the hold point
  c.fill(73, SY + 1, 18, 73, SY + 2, 18, c.B.blackstoneBricks);
  c.fill(72, SY + 3, 18, 74, SY + 4, 18, c.B.yellow);
  c.set(73, SY + 3, 18, c.B.black);
}

// ---------------------------------------------------------------------------
// Taxiway modules
// ---------------------------------------------------------------------------

function taxiCell(c, x, z, u) {
  let b;
  if (u === 0 || u === TAXI_W - 1) b = shoulder(c, x, z);
  else if (u === 1 || u === TAXI_W - 2) b = c.B.white;
  else b = asphalt(c, x, z);
  c.set(x, SY - 1, z, c.B.concrete);
  c.set(x, SY, z, b);
}

function taxiRows(c, z1, z2) {
  for (let z = z1; z <= z2; z++) {
    for (let x = 0; x < TAXI_W; x++) taxiCell(c, x, z, x);
    c.set(TC, SY, z, z % 10 === 5 ? c.B.sea : c.B.yellow);
  }
}

export function buildTaxiwayStraightV2(dimension, origin, rotation, variantId) {
  const { c } = ctx("taxiway_straight", dimension, origin, rotation, variantId);
  taxiRows(c, 0, 31);
}

export function buildTaxiwayHoldingPoint(dimension, origin, rotation, variantId) {
  const { c } = ctx("taxiway_holding_point", dimension, origin, rotation, variantId);
  taxiRows(c, 0, 31);
  for (let x = 2; x <= 22; x++) {
    // runway side (out / low z) dashed, taxiway side solid
    if (x % 2) { c.set(x, SY, 12, c.B.yellow); c.set(x, SY, 13, c.B.yellow); }
    c.set(x, SY, 15, c.B.yellow);
    c.set(x, SY, 16, c.B.yellow);
    // red stop bar
    c.set(x, SY, 19, x % 2 ? c.P("minecraft:redstone_block") : c.B.red);
  }
  // sign board on the shoulder
  c.fill(0, SY + 1, 18, 0, SY + 2, 18, c.B.blackstoneBricks);
  c.fill(0, SY + 3, 17, 0, SY + 4, 19, c.B.yellow);
  c.set(0, SY + 3, 18, c.B.black);
}

export function buildTaxiwayCornerV2(dimension, origin, rotation, variantId) {
  const { c } = ctx("taxiway_corner", dimension, origin, rotation, variantId);
  // quarter-ring centred on the far corner (45,45): entry at the south edge
  // (x 0..24), exit at the east edge (z 0..24); u = 44.5 - r matches the straight.
  let n = 0;
  for (let x = 0; x < 45; x++) for (let z = 0; z < 45; z++) {
    const r = Math.hypot(45 - (x + 0.5), 45 - (z + 0.5));
    const u = Math.round(44.5 - r);
    if (u < 0 || u > TAXI_W - 1) continue;
    taxiCell(c, x, z, u);
  }
  for (let x = 0; x < 45; x++) for (let z = 0; z < 45; z++) {
    const r = Math.hypot(45 - (x + 0.5), 45 - (z + 0.5));
    if (Math.abs(r - (44.5 - TC)) < 0.55) c.set(x, SY, z, (n++ % 10 === 5) ? c.B.sea : c.B.yellow);
  }
}

// ---------------------------------------------------------------------------
// Apron
// ---------------------------------------------------------------------------

export function buildAircraftApronV2(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("aircraft_apron", dimension, origin, rotation, variantId);
  for (let x = 0; x < size.x; x++) for (let z = 0; z < size.z; z++) {
    c.set(x, SY - 1, z, c.B.concrete);
    const edge = x === 0 || x === size.x - 1 || z === 0;
    c.set(x, SY, z, edge ? c.B.white : asphalt(c, x, z));
  }
  // taxilane across the front with lights, plus the entry stub to the south edge
  for (let x = 0; x < size.x; x++) c.set(x, SY, 60, x % 10 === 5 ? c.B.sea : c.B.yellow);
  for (let z = 60; z < size.z; z++) c.set(40, SY, z, z % 10 === 5 ? c.B.sea : c.B.yellow);
  // three stands with curved lead-in lines, stop bars and dashed safety boxes
  for (const cx of [14, 40, 66]) {
    const R = 12;
    for (let x = cx - R; x <= cx; x++) for (let z = 60 - R; z <= 60; z++) {
      if (Math.abs(Math.hypot(x - (cx - R), z - (60 - R)) - R) < 0.6) c.set(x, SY, z, c.B.yellow);
    }
    for (let z = 8; z <= 60 - R; z++) c.set(cx, SY, z, z % 10 === 0 ? c.B.sea : c.B.yellow);
    for (let x = cx - 3; x <= cx + 3; x++) c.set(x, SY, 7, c.B.white);
    for (let x = cx - 12; x <= cx + 12; x++) if (x % 2 === 0) { c.set(x, SY, 3, c.B.white); c.set(x, SY, 52, c.B.white); }
    for (let z = 3; z <= 52; z++) if (z % 2 === 0) { c.set(cx - 12, SY, z, c.B.white); c.set(cx + 12, SY, z, c.B.white); }
    // fishbone guide marks near the stop bar
    for (let k = 0; k < 3; k++) for (const s of [-1, 1]) for (let i = 1; i <= 3; i++) c.set(cx + s * i, SY, 12 + k * 4 + i, c.B.white);
    // stand floodlight mast
    c.fill(cx, SY + 1, 1, cx, SY + 3, 1, c.B.blackstoneBricks);
    c.set(cx, SY + 4, 1, c.B.sea);
  }
}
