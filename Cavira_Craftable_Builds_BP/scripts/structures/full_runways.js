import { kit } from "../kit.js";
import { asphalt, shoulder, blastPad, FONT, normaliseDesignator, TAXI_W } from "./airfield.js";

// ---------------------------------------------------------------------------
// Full Runways (v1.8.0) — complete, ready-to-fly runways in one placement.
// Each one includes: blast pads with chevrons and approach lights at both ends,
// green threshold bars, piano keys, reciprocal designators (e.g. 09 / 27),
// touchdown-zone and aiming-point markings, PAPI blocks, a lit centreline,
// edge lamps, a full-length parallel taxiway, entry connectors with holding
// points and red stop bars at both ends, rapid-exit taxiways for each landing
// direction, holding bays beside each runway end and an apron link stub that
// the Taxiway / Apron modules snap onto.
//
// Sized from the Cavira Airforce add-on's own geometry (1 block = 1 m):
//   short  — fighters, A-10, MQ-9, helicopters      (largest span ≈ 17)
//   medium — + KC-135, C-130/AC-130, A400M, B-1B    (largest span ≈ 42)
//   long   — every aircraft incl. C-5M, B-52H, C-17, B-2 (C-5M span ≈ 66.5)
// Taxiway separation keeps wingtips clear of an aircraft on the runway.
//
// Local layout: runway along z, surface y = 1 (foundation y = 0); the runway's
// south end (local z = size.z - 1) faces the player when it is placed.
// ---------------------------------------------------------------------------

const SY = 1;
const X0 = 7; // west margin (room for the PAPI and windsock)
const HALF_T = (TAXI_W - 1) / 2; // 12

export const FULL_RUNWAY_SPECS = {
  runway_full_short: {
    name: "Fighter Runway (Short)", paved: 31, shoulder: 4, sep: 45, len: 289, pad: 20,
    keys: 3, keyLen: 18, aim: 60, aimLen: 12, tdz: [96], bayW: 24, bayLen: 30
  },
  runway_full_medium: {
    name: "Tactical & Transport Runway (Medium)", paved: 45, shoulder: 5, sep: 60, len: 449, pad: 28,
    keys: 4, keyLen: 22, aim: 90, aimLen: 16, tdz: [30, 130, 170], bayW: 30, bayLen: 40
  },
  runway_full_long: {
    name: "Strategic Heavy Runway (Long)", paved: 61, shoulder: 7, sep: 85, len: 641, pad: 32,
    keys: 6, keyLen: 28, aim: 120, aimLen: 22, tdz: [36, 170, 220, 270], bayW: 34, bayLen: 52
  }
};

/** Derived geometry shared by the builder, registry and snap connectors. */
export function fullRunwayLayout(id) {
  const s = FULL_RUNWAY_SPECS[id];
  const RW = s.paved + 2 * s.shoulder;
  const RC = X0 + (RW - 1) / 2;
  const TCX = RC + s.sep;
  const sizeX = TCX + HALF_T + 1 + s.bayW + 3;
  const thrN = s.pad;
  const thrS = s.len - 1 - s.pad;
  const zN = thrN + HALF_T + 4;
  const zS = thrS - HALF_T - 4;
  const zMid = Math.round((thrN + thrS) / 2);
  return { s, RW, RC, TCX, sizeX, thrN, thrS, zN, zS, zMid, size: { x: sizeX, y: 8, z: s.len } };
}

export const FULL_RUNWAY_SIZES = Object.fromEntries(Object.keys(FULL_RUNWAY_SPECS).map((id) => [id, fullRunwayLayout(id).size]));

/** The apron-link stub on the east side: Taxiway and Apron modules snap on here. */
export const FULL_RUNWAY_SNAP = Object.fromEntries(Object.keys(FULL_RUNWAY_SPECS).map((id) => {
  const L = fullRunwayLayout(id);
  const link = { x: L.sizeX - 1, z: L.zMid, dir: "east" };
  return [id, { in: link, out: link, branch: link }];
}));

/** "09" → "27", "27L" → "09R", "36C" → "18C". */
export function reciprocalDesignator(des) {
  const n = parseInt(des.number, 10);
  const r = n > 18 ? n - 18 : n + 18;
  const side = des.side === "L" ? "R" : des.side === "R" ? "L" : des.side;
  return { number: String(r).padStart(2, "0"), side };
}

// ---- distance helpers -----------------------------------------------------
function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2)) : 0;
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}
function rectDist(px, pz, x1, z1, x2, z2) {
  const dx = Math.max(x1 - px, 0, px - x2);
  const dz = Math.max(z1 - pz, 0, pz - z2);
  return Math.hypot(dx, dz);
}
/** Polynomial smooth minimum — gives taxiway junctions rounded fillets. */
function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
}

export function buildFullRunway(id, dimension, origin, rotation, variantId, options = {}) {
  const L = fullRunwayLayout(id);
  const { s, RW, RC, TCX, thrN, thrS, zN, zS, zMid, size } = L;
  const c = kit(dimension, origin, rotation, size, variantId);
  const rwX1 = X0, rwX2 = X0 + RW - 1;
  const edgeW = X0 + s.shoulder, edgeE = rwX2 - s.shoulder; // white edge lines
  const half = (s.paved - 1) / 2; // paved half-width from the centreline
  const runLen = thrS - thrN;
  const dz = Math.round(s.sep * Math.sqrt(3)); // 30° rapid exits

  // ---- taxiway network (centreline segments) ------------------------------
  const segs = [
    [TCX, zN, TCX, zS],             // parallel taxiway
    [RC, zN, TCX, zN],              // north entry connector
    [RC, zS, TCX, zS],              // south entry connector
    [TCX, zMid, size.x - 1, zMid]   // apron link stub
  ];
  const nStart = Math.round(thrN + runLen * 0.45);
  const sStart = Math.round(thrN + runLen * 0.55);
  const rets = [
    [RC, sStart, TCX, sStart + dz], // landing southbound (from the north end)
    [RC, nStart, TCX, nStart - dz]  // landing northbound (from the south end)
  ];
  const bayX1 = TCX, bayX2 = TCX + HALF_T + s.bayW;
  const bays = [
    [bayX1, zN - HALF_T, bayX2, zN + s.bayLen],
    [bayX1, zS - s.bayLen, bayX2, zS + HALF_T]
  ];
  const taxiDist = (x, z) => {
    let d = Infinity;
    for (const g of segs) d = smin(d, segDist(x, z, ...g), 6);
    for (const g of rets) d = smin(d, segDist(x, z, ...g), 5);
    for (const b of bays) d = smin(d, rectDist(x, z, ...b) + HALF_T - 2, 4);
    return d;
  };

  // ---- base surface --------------------------------------------------------
  for (let x = 0; x < size.x; x++) for (let z = 0; z < size.z; z++) {
    if (x >= rwX1 && x <= rwX2) {
      c.set(x, SY - 1, z, c.B.concrete);
      let b;
      const pad = z < thrN || z > thrS;
      if (x < edgeW || x > edgeE) b = shoulder(c, x, z);
      else if (x === edgeW || x === edgeE) b = pad ? blastPad(c, x, z) : c.B.white;
      else b = pad ? blastPad(c, x, z) : asphalt(c, x, z);
      c.set(x, SY, z, b);
      continue;
    }
    const d = taxiDist(x + 0.5, z + 0.5);
    if (d <= HALF_T + 0.5) {
      c.set(x, SY - 1, z, c.B.concrete);
      let b;
      if (d > HALF_T - 0.5) b = shoulder(c, x, z);
      else if (d > HALF_T - 1.5) b = c.B.white;
      else b = asphalt(c, x, z);
      c.set(x, SY, z, b);
    } else {
      c.set(x, SY - 1, z, c.B.dirt);
      c.set(x, SY, z, c.B.grass);
    }
  }

  // ---- runway lights & centreline (centreline starts beyond the numbers) ----
  const des = normaliseDesignator(options.designator) ?? { number: "09", side: "" };
  const designators = [des, reciprocalDesignator(des)];
  const dText = 2 + s.keyLen + 5;
  const textEnd = dText + (des.side ? 45 : 21);
  const aim = Math.max(s.aim, textEnd + 8);
  for (let z = thrN + 1; z < thrS; z++) {
    if (z % 8 === 4) { c.set(X0 + 1, SY, z, c.B.lamp); c.set(rwX2 - 1, SY, z, c.B.lamp); }
    if (z < thrN + textEnd + 4 || z > thrS - textEnd - 4) continue;
    const m = (((z - thrN) % 16) + 16) % 16;
    if (m >= 4 && m < 13) c.set(RC, SY, z, c.B.white);
    if (m === 0 || m === 8) c.set(RC, SY, z, c.B.sea);
  }

  // ---- per-end markings (a = metres to the pilot's right, d = metres in from the threshold)
  const ends = [
    { thr: thrS, sign: -1, flip: 1 },  // south end: pilots land heading north
    { thr: thrN, sign: 1, flip: -1 }   // north end: pilots land heading south
  ];
  const put = (end, a, d, b) => c.set(RC + end.flip * a, SY, end.thr + end.sign * d, b);
  const drawText = (end, text, dNear) => {
    const SX = 2, SZ = 3, glyphW = 5 * SX, gap = 2;
    const total = text.length * glyphW + (text.length - 1) * gap;
    let a0 = -Math.floor(total / 2);
    for (const ch of text) {
      const g = FONT[ch];
      if (g) for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
        if (g[r][col] !== "1") continue;
        for (let i = 0; i < SX; i++) for (let j = 0; j < SZ; j++) put(end, a0 + col * SX + i, dNear + (6 - r) * SZ + j, c.B.white);
      }
      a0 += glyphW + gap;
    }
  };

  ends.forEach((end, i) => {
    // blast pad: chevrons, centre lights and approach-light crossbars
    for (let k = 0; k < 3; k++) {
      const apex = 3 + k * Math.floor((s.pad - 6) / 3);
      for (let a = -half; a <= half; a++) {
        const dd = Math.round(apex + 0.6 * Math.abs(a));
        for (const d of [dd, dd + 1]) if (d >= 2 && d < s.pad) put(end, a, -d, c.B.yellow);
      }
    }
    for (let d = 3; d < s.pad; d += 3) put(end, 0, -d, c.B.sea);
    for (const d of [Math.round(s.pad * 0.4), Math.round(s.pad * 0.8)]) {
      for (let a = -10; a <= 10; a += 2) if (a) c.set(RC + end.flip * a, SY + 1, end.thr + end.sign * -d, c.P("minecraft:redstone_torch"));
    }
    // threshold light bar across the full paved width
    for (let x = rwX1; x <= rwX2; x++) c.set(x, SY, end.thr, x % 2 ? c.P("minecraft:verdant_froglight") : c.B.white);
    // piano keys
    for (let k = 0; k < s.keys; k++) {
      const aIn = 3 + k * 5;
      for (let w = 0; w < 3; w++) for (let d = 2; d < 2 + s.keyLen; d++) { put(end, aIn + w, d, c.B.white); put(end, -(aIn + w), d, c.B.white); }
    }
    // designator: side letter nearest the threshold, number beyond it
    const ds = designators[i];
    if (ds.side) { drawText(end, ds.side, dText); drawText(end, ds.number, dText + 24); } else drawText(end, ds.number, dText);
    // touchdown-zone bar pairs and the aiming point
    for (const d0 of s.tdz) {
      if (Math.abs(d0 - aim) < s.aimLen + 6 || d0 < textEnd + 4) continue;
      for (const off of [Math.round(half * 0.45), Math.round(half * 0.45) + 3]) for (let w = 0; w < 2; w++) for (let d = d0; d < d0 + 10; d++) {
        put(end, off + w, d, c.B.white); put(end, -(off + w), d, c.B.white);
      }
    }
    const aimIn = Math.max(5, Math.round(half * 0.3));
    for (let w = 0; w < Math.max(4, Math.round(half * 0.2)); w++) for (let d = aim; d < aim + s.aimLen; d++) {
      put(end, aimIn + w, d, c.B.white); put(end, -(aimIn + w), d, c.B.white);
    }
    // PAPI: four flush lights on the left-hand grass beside the aiming point
    for (let k = 0; k < 4; k++) {
      const x = RC + end.flip * -(half + s.shoulder + 2 + k);
      const z = end.thr + end.sign * aim;
      c.set(x, SY - 1, z, c.B.concrete);
      c.set(x, SY, z, k < 2 ? c.B.white : c.B.red);
      c.set(x, SY + 1, z, c.P("minecraft:redstone_torch"));
    }
  });

  // ---- taxiway centrelines (yellow with embedded lights) -------------------
  const paintLine = (ax, az, bx, bz, lightBlock, every = 10, onRunway = false) => {
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) * 2);
    let last = "";
    let step = 0;
    for (let i = 0; i <= n; i++) {
      const x = Math.round(ax + ((bx - ax) * i) / n);
      const z = Math.round(az + ((bz - az) * i) / n);
      const key = `${x},${z}`;
      if (key === last) continue;
      last = key;
      const inRunway = x >= rwX1 && x <= rwX2;
      if (inRunway && !onRunway) continue;
      c.set(x, SY, z, step++ % every === Math.floor(every / 2) ? lightBlock : c.B.yellow);
    }
  };
  paintLine(TCX, zN, TCX, zS, c.B.sea);
  paintLine(TCX, zMid, size.x - 1, zMid, c.B.sea);
  for (const z of [zN, zS]) paintLine(RC, z, TCX, z, c.B.sea, 10, true);
  // rapid-exit lead-off lines start on the runway centreline with green lights
  for (const g of rets) paintLine(...g, c.P("minecraft:verdant_froglight"), 6, true);
  // holding-bay lead-in loops
  const bayC = Math.round((TCX + HALF_T + 1 + bayX2) / 2);
  paintLine(TCX, zN + s.bayLen + 6, bayC, zN + s.bayLen - 6, c.B.sea);
  paintLine(bayC, zN + s.bayLen - 6, bayC, zN + 4, c.B.sea);
  paintLine(TCX, zS - s.bayLen - 6, bayC, zS - s.bayLen + 6, c.B.sea);
  paintLine(bayC, zS - s.bayLen + 6, bayC, zS - 4, c.B.sea);
  for (const [z1, z2] of [[zN + 2, zN + s.bayLen - 4], [zS - s.bayLen + 4, zS - 2]]) {
    for (let z = z1; z <= z2; z += 3) { c.set(bayX2 - 2, SY, z, c.B.white); c.set(bayC + 6, SY, z, c.B.white); }
  }

  // ---- holding points on both entry connectors -----------------------------
  const holdX = rwX2 + 8;
  for (const zc of [zN, zS]) {
    for (let z = zc - HALF_T + 2; z <= zc + HALF_T - 2; z++) {
      if (z % 2) { c.set(holdX, SY, z, c.B.yellow); c.set(holdX + 1, SY, z, c.B.yellow); }
      c.set(holdX + 3, SY, z, c.B.yellow);
      c.set(holdX + 4, SY, z, c.B.yellow);
      c.set(holdX + 7, SY, z, z % 2 ? c.P("minecraft:redstone_block") : c.B.red);
    }
    // mandatory sign: red board with a white bar, on the shoulder outside the connector
    for (const zSign of [zc - HALF_T - 2, zc + HALF_T + 2]) {
      c.fill(holdX + 4, SY + 1, zSign, holdX + 4, SY + 2, zSign, c.B.blackstoneBricks);
      c.fill(holdX + 3, SY + 3, zSign, holdX + 5, SY + 4, zSign, c.B.red);
      c.set(holdX + 4, SY + 3, zSign, c.B.white);
    }
  }
  // ILS-critical-area style marking where the taxiway joins the apron link
  for (let z = zMid - HALF_T + 2; z <= zMid + HALF_T - 2; z++) if (z % 2) c.set(size.x - 4, SY, z, c.B.yellow);

  // ---- windsocks beside both thresholds ------------------------------------
  for (const end of ends) {
    const x = 0;
    const z = end.thr + end.sign * 40;
    c.fill(x, SY + 1, z, x, SY + 5, z, c.B.bars);
    c.set(x, SY + 6, z, c.P("minecraft:orange_wool"));
    c.set(x, SY + 6, z + end.sign, c.B.white);
    c.set(x, SY + 6, z + 2 * end.sign, c.P("minecraft:orange_wool"));
  }
}

export const buildRunwayFullShort = (d, o, r, v, opts) => buildFullRunway("runway_full_short", d, o, r, v, opts);
export const buildRunwayFullMedium = (d, o, r, v, opts) => buildFullRunway("runway_full_medium", d, o, r, v, opts);
export const buildRunwayFullLong = (d, o, r, v, opts) => buildFullRunway("runway_full_long", d, o, r, v, opts);
