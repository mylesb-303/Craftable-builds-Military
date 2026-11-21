import { kit, hazardBorder } from "../kit.js";
import { furnishRoom } from "../interiors.js";

// ---------------------------------------------------------------------------
// Super-Heavy Aircraft Hangar (v1.5.0) — strategic bomber hangar.
// 81 wide × 101 deep × 37 high (plus a 12-block apron), sized from the
// reference sheet. At 1 block = 1 m it clears a B-52 (56.4 m span, 48.5 m
// long, 12.4 m tall) or a B-2 (52.4 m span) with room to tow around it.
//   * elliptical arched roof with yellow internal trusses and roof lights
//   * 65-wide × 24-tall door opening with retracted door-leaf pockets
//   * two-storey maintenance bays down both sides with railed mezzanines
//   * rear workshop / raised glazed control room / storage block
//   * floor markings: centreline, aircraft clearance box, parking guides
// ---------------------------------------------------------------------------

export const SUPER_HANGAR_SIZE = { x: 81, y: 40, z: 113 };
const WALK = 2;
const LEN = 101; // hangar body z = 0..100, apron z = 101..112
const CX = 40;
const WALL_H = 14;
const APEX = 36;
const DOOR_X1 = 8;
const DOOR_X2 = 72;
const DOOR_TOP = WALK + 23;
// Aircraft envelope: nothing may stand inside this box (v1.8). 61 wide between
// the bay fronts, full door height, from the rear equipment line to the door.
export const SUPER_HANGAR_ENVELOPE = { x1: 10, x2: 70, y1: WALK, y2: DOOR_TOP - 1, z1: 22, z2: LEN - 1 };

function roofY(x) {
  const t = (x - CX) / 40.5;
  return WALK + WALL_H + Math.round((APEX - WALL_H) * Math.sqrt(Math.max(0, 1 - t * t)));
}

export function buildSuperHeavyAircraftHangar(dimension, origin, rotation, variantId) {
  const size = SUPER_HANGAR_SIZE;
  const c = kit(dimension, origin, rotation, size, variantId);
  const B = c.B;
  const V = c.V;
  const frontZ = LEN - 1;

  // --- floor & foundation ----------------------------------------------------
  c.fill(0, WALK - 2, 0, 80, WALK - 2, frontZ, B.concrete);
  c.fill(0, WALK - 1, 0, 80, WALK - 1, frontZ, B.smooth);

  // --- arched shell ------------------------------------------------------------
  for (let x = 0; x <= 80; x++) {
    const y = roofY(x);
    const yl = x > 0 ? roofY(x - 1) : y;
    const yr = x < 80 ? roofY(x + 1) : y;
    const yMin = Math.min(y, yl, yr);
    for (let z = 0; z <= frontZ; z++) {
      const panel = (Math.floor(z / 8) + Math.floor(x / 6)) % 2 ? V.wall : B.lightGrey;
      const rib = z % 8 === 0;
      for (let yy = yMin; yy <= y; yy++) c.set(x, yy, z, rib ? B.tile : panel);
      // roof skylight strip along the crown
      if (Math.abs(x - CX) <= 1 && z % 4 === 2 && z > 2 && z < frontZ - 2) c.set(x, y, z, B.sea);
      // yellow internal truss under each rib, with high-bay lights built into it
      if (rib && x > 1 && x < 79) c.set(x, y - 1, z, x % 10 === 0 ? B.sea : B.yellow);
    }
  }
  // side walls with stepped buttress shoulders and ribbon windows
  for (const x of [0, 80]) {
    const out = x === 0 ? -1 : 1;
    for (let z = 0; z <= frontZ; z++) {
      for (let y = WALK; y < roofY(x); y++) {
        const win = y >= WALK + 9 && y <= WALK + 10 && z % 8 >= 2 && z % 8 <= 6;
        c.set(x, y, z, win ? B.tinted : (z % 8 === 0 ? B.tile : V.wall));
      }
      if (z % 8 === 0) {
        // buttress pier stepping outward is kept inside the footprint (x 1 / 79)
        for (let y = WALK; y < WALK + WALL_H; y++) c.set(x - out, y, z, B.tile);
      }
    }
  }
  // back wall
  for (let x = 1; x < 80; x++) for (let y = WALK; y < roofY(x); y++) c.set(x, y, 0, (x % 8 === 0) ? B.tile : V.wall);
  // front gable above the door
  for (let x = 1; x < 80; x++) {
    const inDoor = x >= DOOR_X1 && x <= DOOR_X2;
    for (let y = WALK; y < roofY(x); y++) {
      if (inDoor && y < DOOR_TOP) continue;
      // header beam: yellow band with flush floodlights built into its soffit
      const header = y === DOOR_TOP ? (inDoor && (x - DOOR_X1) % 4 === 2 ? B.sea : B.yellow) : y === DOOR_TOP + 1 ? B.black : V.wall;
      c.set(x, y, frontZ, header);
    }
  }
  // retracted door-leaf pockets: stacked leaves either side of the opening
  for (const [xa, xb] of [[2, 7], [73, 78]]) {
    for (let z = frontZ - 4; z <= frontZ; z++) for (let x = xa; x <= xb; x++) for (let y = WALK; y < DOOR_TOP; y++) {
      const stripe = (y + x) % 6 < 3;
      c.set(x, y, z, z === frontZ - 4 || z === frontZ ? B.tile : stripe ? B.yellow : B.black);
    }
  }

  // --- side maintenance bays (two storeys) -------------------------------
  const bayTypes = ["workshop", "storage", "armoury", "workshop", "supplies", "office", "storage", "workshop", "supplies"];
  for (const side of ["west", "east"]) {
    const xa = side === "west" ? 2 : 72;
    const xb = side === "west" ? 8 : 78;
    const openX = side === "west" ? 9 : 71; // bay fronts: the edge of the aircraft envelope
    const galleryX = side === "west" ? 8 : 72; // upper walkway runs inside the bays
    for (let i = 0; i < 9; i++) {
      const z1 = 14 + i * 9;
      const z2 = z1 + 7;
      if (z2 >= frontZ - 6) break;
      for (let level = 0; level < 2; level++) {
        const w = WALK + level * 6;
        c.fill(xa, w - 1, z1 - 1, xb, w - 1, z2 + 1, level === 0 ? B.smooth : B.andesite);
        c.fill(xa, w + 5, z1 - 1, xb, w + 5, z2 + 1, B.andesite);
        for (const z of [z1 - 1, z2 + 1]) c.fill(xa, w, z, xb, w + 4, z, B.lightGrey);
        c.clear(xa, w, z1, xb, w + 4, z2);
        // open front with frame posts; the upper floor's edge carries a lit fascia
        for (const z of [z1 - 1, z2 + 1]) c.fill(openX, w - 1, z, openX, w + 5, z, B.tile);
        if (level === 0) for (let z = z1; z <= z2; z++) c.set(openX, w + 5, z, (z - z1) % 4 === 1 ? B.sea : B.yellow);
        if (level === 1) {
          // gallery: doorways through the partitions keep the upper walkway continuous
          for (const z of [z1 - 1, z2 + 1]) c.clear(galleryX, w, z, galleryX, w + 1, z);
          for (let z = z1 - 1; z <= z2 + 1; z++) c.set(openX, w, z, z % 6 === 0 ? B.yellow : B.rail);
        }
        furnishRoom(c, {
          x1: xa, z1, x2: xb, z2, walk: w, h: 5,
          type: bayTypes[(i + level * 4) % bayTypes.length],
          door: side === "west" ? "east" : "west",
          doorU: 3
        });
      }
    }
    // stair up to the gallery at the rear of each bay row (behind the aircraft parking box)
    const sx = side === "west" ? 10 : 70;
    for (let k = 0; k < 6; k++) {
      c.set(sx, WALK + k, 18 - k, c.stairs("minecraft:polished_deepslate_stairs", "north"));
      c.fill(sx, WALK - 1, 18 - k, sx, WALK + k - 1, 18 - k, B.concrete);
    }
    // landing that joins the stair to the first upper bay's gallery
    c.fill(Math.min(sx, galleryX), WALK + 5, 11, Math.max(sx, galleryX), WALK + 5, 12, B.andesite);
    c.fill(sx, WALK + 5, 11, sx, WALK + 5, 13, B.andesite);
    c.clear(galleryX, WALK + 6, 12, galleryX, WALK + 7, 13);
    c.set(side === "west" ? 11 : 69, WALK + 6, 11, B.rail);
    c.set(side === "west" ? 11 : 69, WALK + 6, 12, B.rail);
    // personnel door in the side wall near the rear corner, with lights set into the wall
    const wallX = side === "west" ? 0 : 80;
    c.clear(wallX, WALK, 3, wallX, WALK + 2, 4);
    c.set(wallX, WALK + 3, 3, B.sea);
    c.set(wallX, WALK + 3, 4, B.sea);
    // continuous light band built into the side wall above the bays
    for (let z = 2; z < frontZ - 2; z++) if (z % 8 !== 0) c.set(wallX, WALK + 12, z, z % 4 === 2 ? B.sea : B.tile);
  }

  // --- rear block: workshop / control / storage ------------------------
  const rear = [
    { x1: 14, x2: 31, type: "workshop" },
    { x1: 49, x2: 66, type: "storage" }
  ];
  for (const r of rear) {
    c.fill(r.x1 - 1, WALK - 1, 1, r.x2 + 1, WALK - 1, 11, B.smooth);
    c.walls(r.x1 - 1, WALK, 1, r.x2 + 1, WALK + 5, 11, B.lightGrey);
    c.fill(r.x1 - 1, WALK + 6, 1, r.x2 + 1, WALK + 6, 11, B.tile);
    c.clear(r.x1, WALK, 2, r.x2, WALK + 5, 10);
    const mid = Math.floor((r.x1 + r.x2) / 2);
    c.clear(mid - 2, WALK, 11, mid + 2, WALK + 3, 11);
    for (let x = r.x1; x <= r.x2; x++) if (Math.abs(x - mid) > 3) { c.set(x, WALK + 2, 11, B.glass); c.set(x, WALK + 3, 11, B.glass); }
    furnishRoom(c, { x1: r.x1, z1: 2, x2: r.x2, z2: 10, walk: WALK, h: 5, type: r.type, door: "south", doorU: mid - r.x1 - 1 });
  }
  // raised control room (two levels, glazed toward the hangar)
  c.fill(34, WALK - 1, 1, 46, WALK - 1, 12, B.smooth);
  c.walls(33, WALK, 1, 47, WALK + 11, 13, B.tile);
  c.fill(33, WALK + 5, 1, 47, WALK + 5, 13, B.andesite);
  c.fill(33, WALK + 12, 1, 47, WALK + 12, 13, B.tile);
  c.clear(34, WALK, 2, 46, WALK + 4, 12);
  c.clear(34, WALK + 6, 2, 46, WALK + 11, 12);
  for (let x = 34; x <= 46; x++) for (let y = WALK + 7; y <= WALK + 10; y++) c.set(x, y, 13, B.lightBlueGlass);
  c.clear(39, WALK, 13, 41, WALK + 2, 13);
  furnishRoom(c, { x1: 34, z1: 2, x2: 46, z2: 12, walk: WALK, h: 4, type: "briefing", door: "south", doorU: 5 });
  furnishRoom(c, { x1: 34, z1: 2, x2: 46, z2: 12, walk: WALK + 6, h: 5, type: "command", door: "south", doorU: 5 });
  // stair up to the control room (inside, along the east wall)
  for (let k = 0; k < 6; k++) {
    c.set(46, WALK + k, 11 - k, c.stairs("minecraft:polished_deepslate_stairs", "north"));
    c.clear(46, WALK + k + 1, 11 - k, 46, WALK + k + 3, 11 - k);
  }
  c.clear(46, WALK + 5, 6, 46, WALK + 5, 11);
  // control-room sign band
  for (let x = 36; x <= 44; x++) c.set(x, WALK + 11, 13, x % 2 ? B.green : B.black);

  // --- floor markings ---------------------------------------------------------
  for (let z = 14; z <= frontZ; z++) if (z % 4 !== 3) c.set(CX, WALK - 1, z, B.yellow);
  // aircraft envelope outline (light blue): 61 wide between the bay fronts
  const E = SUPER_HANGAR_ENVELOPE;
  for (let x = E.x1; x <= E.x2; x++) { c.set(x, WALK - 1, E.z1, B.lightBlue); }
  for (let z = E.z1; z <= frontZ - 1; z++) { c.set(E.x1, WALK - 1, z, B.lightBlue); c.set(E.x2, WALK - 1, z, B.lightBlue); }
  // nose-wheel stop bar and parking chevrons
  for (let x = CX - 3; x <= CX + 3; x++) c.set(x, WALK - 1, 30, B.white);
  for (let k = 0; k < 6; k++) for (const s of [-1, 1]) for (let i = 0; i < 4; i++) c.set(CX + s * (4 + i), WALK - 1, 40 + k * 8 + i, B.white);
  // lighting is built into the floor: a flush grid of lights across the whole bay
  for (let z = 20; z <= 96; z += 6) for (const x of [12, 17, 23, 29, 35, 45, 51, 57, 63, 68]) c.set(x, WALK - 1, z, B.sea);

  // --- ground equipment, parked in the marked zone behind the aircraft ------
  hazardBorder(c, 11, WALK - 1, 14, 69, 20);
  // tow tractor
  c.fill(16, WALK, 16, 19, WALK, 18, B.yellow);
  c.fill(17, WALK + 1, 16, 18, WALK + 1, 17, B.black);
  c.set(19, WALK + 1, 18, B.sea);
  // fuel bowser (parked across the zone)
  c.fill(54, WALK, 16, 62, WALK + 2, 18, B.white);
  c.fill(63, WALK, 16, 64, WALK + 1, 18, B.red);
  c.fill(55, WALK + 3, 17, 61, WALK + 3, 17, B.lightGrey);
  // weapons loader trolleys
  for (const x of [24, 28, 50]) { c.fill(x, WALK, 16, x + 1, WALK, 18, B.yellow); c.set(x, WALK + 1, 17, B.greenTerracotta); }

  // --- apron --------------------------------------------------------------
  c.fill(0, WALK - 1, LEN, 80, WALK - 1, size.z - 1, B.black);
  for (let z = LEN; z < size.z; z++) {
    if (z % 4 !== 3) c.set(CX, WALK - 1, z, B.yellow);
    c.set(4, WALK - 1, z, B.white);
    c.set(76, WALK - 1, z, B.white);
  }
  for (let x = 4; x <= 76; x += 6) { c.set(x, WALK - 1, LEN + 1, B.sea); c.set(x, WALK - 1, size.z - 2, B.sea); }
  for (let x = DOOR_X1; x <= DOOR_X2; x++) c.set(x, WALK - 1, frontZ, x % 2 ? B.yellow : B.black);
}
