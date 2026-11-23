import { kit } from "../kit.js";
import { asphalt } from "./airfield.js";

// ---------------------------------------------------------------------------
// Parking aprons (v1.11) — three sizes, each with an extension piece.
//
// Layout (local): a central taxilane runs along z with nose-in stands on BOTH
// sides. Aircraft enter from the south edge (snaps onto a Taxiway piece), where
// a cross taxilane with smooth curved links to the left and right runs along
// the apron front. Each stand has a curved lead-in line from the taxilane, a
// stand centreline with embedded lights, a stop bar, wingtip clearance box and
// a floodlight mast set on the outer border (never inside a stand).
//
// Extension pieces carry the same stands and taxilane but no front cross lane
// and no end border, so they snap onto the far end of an apron (or another
// extension) and continue it in a straight line.
//
// Stand sizes come from the Cavira Airforce aircraft (1 block = 1 m):
//   fighter — F-22, F-35, F/A-18, Typhoon, A-10, MQ-9 (span ≤ 17.5, length ≤ 19)
//   medium  — C-130/AC-130, KC-135, A400M, B-1B, KC-46, V-22 (span ≤ 48, length ≤ 51)
//   heavy   — C-17, C-5M, B-52H, B-2 (span ≤ 68, length ≤ 76)
// Surface at y = 1 (foundation y = 0), same as the runway and taxiway pieces.
// ---------------------------------------------------------------------------

const SY = 1;

export const APRON_SPECS = {
  fighter: { standW: 22, standD: 32, lane: 25, perSide: 4, mastEvery: 1, label: "Fighter" },
  medium: { standW: 52, standD: 54, lane: 31, perSide: 2, mastEvery: 1, label: "Tactical & Transport" },
  heavy: { standW: 74, standD: 80, lane: 35, perSide: 2, mastEvery: 1, label: "Strategic Heavy" }
};

/** Geometry for apron type `t`; `ext` = extension piece. */
export function apronLayout(t, ext) {
  const s = APRON_SPECS[t];
  const sizeX = 2 + 2 * s.standD + s.lane;
  const laneX1 = 1 + s.standD, laneX2 = laneX1 + s.lane - 1;
  const laneC = laneX1 + (s.lane - 1) / 2;
  const entry = ext ? 0 : s.lane + 2; // front cross-lane band (south)
  const standsZ = s.perSide * s.standW;
  const sizeZ = standsZ + entry + (ext ? 0 : 1); // full aprons get a north border row
  return { s, sizeX, sizeZ, laneX1, laneX2, laneC, entry, standsZ, z0: ext ? 0 : 1, size: { x: sizeX, y: 9, z: sizeZ } };
}

const IDS = {
  aircraft_apron: ["fighter", false],
  aircraft_apron_extension: ["fighter", true],
  apron_medium: ["medium", false],
  apron_medium_extension: ["medium", true],
  apron_heavy: ["heavy", false],
  apron_heavy_extension: ["heavy", true]
};

export const APRON_SIZES = Object.fromEntries(Object.entries(IDS).map(([id, [t, ext]]) => [id, apronLayout(t, ext).size]));

/** Snap: in at the south edge on the taxilane, out at the north edge (extensions continue from it). */
export const APRON_SNAP = Object.fromEntries(Object.entries(IDS).map(([id, [t, ext]]) => {
  const L = apronLayout(t, ext);
  return [id, { in: { x: L.laneC, z: L.sizeZ - 1, dir: "south" }, out: { x: L.laneC, z: 0, dir: "north" } }];
}));

/** Cubic Bézier into a cell polyline. */
function curve(p0, p1, p2, p3, n = 40) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([Math.round(u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]), Math.round(u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1])]);
  }
  return pts;
}

export function buildApron(id, dimension, origin, rotation, variantId) {
  const [t, ext] = IDS[id];
  const L = apronLayout(t, ext);
  const { s, sizeX, sizeZ, laneX1, laneX2, laneC, entry, z0 } = L;
  const c = kit(dimension, origin, rotation, L.size, variantId);
  const B = c.B;
  const laneX = Math.round(laneC);
  const zFront = sizeZ - 1 - entry; // last stand row (south side of the stand block)
  const seen = new Set();
  let n = 0;
  const line = (x, z, every = 10) => {
    const k = `${x},${z}`;
    if (seen.has(k) || x < 0 || z < 0 || x >= sizeX || z >= sizeZ) return;
    seen.add(k);
    c.set(x, SY, z, n++ % every === Math.floor(every / 2) ? B.sea : B.yellow);
  };
  const path = (pts, every) => { for (const [x, z] of pts) line(x, z, every); };

  // ---- surface: asphalt with a white border (no border on the joining ends of an extension)
  for (let x = 0; x < sizeX; x++) for (let z = 0; z < sizeZ; z++) {
    c.set(x, SY - 1, z, B.concrete);
    const side = x === 0 || x === sizeX - 1;
    const endN = !ext && z === 0;
    c.set(x, SY, z, side || endN ? B.white : asphalt(c, x, z));
  }

  // ---- central taxilane (solid yellow, lights embedded)
  for (let z = 0; z < sizeZ; z++) line(laneX, z);
  for (let z = 0; z < sizeZ; z++) if (z % 2 === 0) { c.set(laneX1 - 1, SY, z, B.white); c.set(laneX2 + 1, SY, z, B.white); } // taxilane edge (dashed)

  // ---- front cross taxilane with smooth links both ways (full aprons only)
  if (!ext) {
    const zc = sizeZ - 1 - Math.floor(entry / 2);
    const R = Math.floor(entry / 2) + 4;
    for (let x = 1; x < sizeX - 1; x++) if (Math.abs(x - laneX) > R) line(x, zc);
    for (const sgn of [-1, 1]) {
      // from the cross lane (heading toward the centre) curving onto the taxilane heading north
      path(curve([laneX + sgn * (R + 1), zc], [laneX + sgn * R * 0.45, zc], [laneX, zc - R * 0.55], [laneX, zc - R]));
      // and from the entry (heading north) curving out onto the cross lane both ways
      path(curve([laneX, zc + R], [laneX, zc + R * 0.45], [laneX + sgn * R * 0.45, zc], [laneX + sgn * (R + 1), zc]));
    }
    // apron edge marking between the stands and the cross lane
    for (let x = 1; x < sizeX - 1; x++) if (x < laneX1 - 1 || x > laneX2 + 1) if (x % 2) c.set(x, SY, zFront + 1, B.white);
  }

  // ---- stands, nose-in on both sides
  for (let k = 0; k < s.perSide; k++) {
    const zA = z0 + k * s.standW, zB = zA + s.standW - 1; // stand edges along the lane
    const zc = Math.round((zA + zB) / 2);
    for (const sgn of [-1, 1]) {
      const edgeX = sgn < 0 ? laneX1 - 1 : laneX2 + 1; // stand boundary on the lane side
      const backX = sgn < 0 ? 1 : sizeX - 2;           // stand back (outer border)
      const R = Math.min(Math.floor(s.lane / 2) + 2, Math.floor(s.standW / 2) - 1);
      // curved lead-in: taxilane heading north -> turning into the stand
      path(curve([laneX, zc + R], [laneX, zc + R * 0.45], [laneX + sgn * R * 0.45, zc], [laneX + sgn * R, zc]), 8);
      // stand centreline to the stop bar
      const stopX = backX - sgn * 4;
      for (let x = laneX + sgn * R; sgn < 0 ? x >= stopX : x <= stopX; x += sgn) line(x, zc, 8);
      // stop bar and nose-wheel marks
      for (let dz = -3; dz <= 3; dz++) c.set(stopX - sgn, SY, zc + dz, B.white);
      // wingtip clearance box (dashed white) — the stand outline
      for (let z = zA; z <= zB; z++) if (z % 2 === 0) c.set(backX - sgn * 1, SY, z, B.white);
      for (let x = Math.min(edgeX, backX); x <= Math.max(edgeX, backX); x++) if (x % 2 === 0) { c.set(x, SY, zA, B.white); c.set(x, SY, zB, B.white); }
      // flush stand lights at the corners of the box
      c.set(backX - sgn * 3, SY, zA + 2, B.sea); c.set(backX - sgn * 3, SY, zB - 2, B.sea);
      // floodlight mast on the outer border, between stands (outside every stand box)
      if (k === 0 || k % s.mastEvery === 0) {
        const mx = sgn < 0 ? 0 : sizeX - 1;
        c.fill(mx, SY + 1, zA, mx, SY + 5, zA, B.blackstoneBricks);
        c.set(mx, SY + 6, zA, B.sea);
      }
    }
  }
}

export const buildAircraftApron = (d, o, r, v) => buildApron("aircraft_apron", d, o, r, v);
export const buildAircraftApronExtension = (d, o, r, v) => buildApron("aircraft_apron_extension", d, o, r, v);
export const buildApronMedium = (d, o, r, v) => buildApron("apron_medium", d, o, r, v);
export const buildApronMediumExtension = (d, o, r, v) => buildApron("apron_medium_extension", d, o, r, v);
export const buildApronHeavy = (d, o, r, v) => buildApron("apron_heavy", d, o, r, v);
export const buildApronHeavyExtension = (d, o, r, v) => buildApron("apron_heavy_extension", d, o, r, v);

// ---------------------------------------------------------------------------
// Four-pad heliport (v1.11): 2 × 2 FAA-style pads (TLOF with "H", aiming circle,
// FATO edge, green perimeter lights) around a lit taxi cross, sized for the
// Chinook (D ≈ 30 m: TLOF 25 m, FATO 37 m). Shared windsock and fuel point.
// ---------------------------------------------------------------------------
export const HELIPORT_QUAD_SIZE = { x: 89, y: 8, z: 89 };

function heliPad(c, ox, oz) {
  const B = c.B;
  const cx = ox + 19, cz = oz + 19;
  for (let x = ox; x <= ox + 38; x++) for (let z = oz; z <= oz + 38; z++) {
    const fato = x >= ox + 1 && x <= ox + 37 && z >= oz + 1 && z <= oz + 37;
    const tlof = x >= ox + 7 && x <= ox + 31 && z >= oz + 7 && z <= oz + 31;
    let p = fato ? B.smooth : asphalt(c, x, z);
    if (tlof) p = B.grey;
    if (tlof && (x === ox + 7 || x === ox + 31 || z === oz + 7 || z === oz + 31)) p = B.white;
    if (fato && !tlof && (x === ox + 1 || x === ox + 37 || z === oz + 1 || z === oz + 37) && (x + z) % 4 < 2) p = B.white;
    if (tlof && Math.abs(Math.hypot(x - cx, z - cz) - 8) < 0.6) p = B.yellow;
    c.set(x, SY, z, p);
  }
  for (let z = cz - 5; z <= cz + 5; z++) for (const x of [cx - 4, cx - 3, cx + 3, cx + 4]) c.set(x, SY, z, B.white);
  for (let x = cx - 2; x <= cx + 2; x++) for (const z of [cz - 1, cz, cz + 1]) c.set(x, SY, z, B.white);
  for (let i = ox + 7; i <= ox + 31; i += 4) for (const [x, z] of [[i, oz + 6], [i, oz + 32], [ox + 6, i], [ox + 32, i]]) c.set(x, SY, z, c.P("minecraft:verdant_froglight"));
}

export function buildHeliportQuad(dimension, origin, rotation, variantId) {
  const c = kit(dimension, origin, rotation, HELIPORT_QUAD_SIZE, variantId);
  const B = c.B;
  const S = HELIPORT_QUAD_SIZE.x;
  for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) { c.set(x, SY - 1, z, B.concrete); c.set(x, SY, z, asphalt(c, x, z)); }
  for (const ox of [2, 48]) for (const oz of [2, 48]) heliPad(c, ox, oz);
  // lit taxi cross between the pads, with links into each pad
  const mid = 44;
  for (let i = 0; i < S; i++) { c.set(mid, SY, i, i % 8 === 4 ? B.sea : B.yellow); c.set(i, SY, mid, i % 8 === 4 ? B.sea : B.yellow); }
  for (const p of [21, 67]) for (let i = 41; i <= 47; i++) { c.set(p, SY, i, B.yellow); c.set(i, SY, p, B.yellow); }
  // border
  for (let i = 0; i < S; i++) for (const [x, z] of [[i, 0], [i, S - 1], [0, i], [S - 1, i]]) c.set(x, SY, z, B.white);
  // windsock and fuel point at the outer corners (on the border, clear of every pad)
  c.fill(S - 1, SY + 1, 0, S - 1, SY + 5, 0, B.bars);
  c.set(S - 1, SY + 6, 0, c.P("minecraft:orange_wool")); c.set(S - 2, SY + 6, 0, B.white); c.set(S - 3, SY + 6, 0, c.P("minecraft:orange_wool"));
  for (let x = 40; x <= 48; x++) for (let z = S - 1; z >= S - 1; z--) c.set(x, SY, z, B.yellow);
  c.set(41, SY + 1, S - 1, c.barrel("north")); c.set(47, SY + 1, S - 1, c.barrel("north"));
  // floodlights flush with the surface around the cross
  for (const [x, z] of [[mid - 3, mid - 3], [mid + 3, mid - 3], [mid - 3, mid + 3], [mid + 3, mid + 3]]) c.set(x, SY, z, B.sea);
}
