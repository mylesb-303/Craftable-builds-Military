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
      // yellow internal truss under each rib
      if (rib && x > 1 && x < 79) c.set(x, y - 1, z, B.yellow);
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
      c.set(x, y, frontZ, y === DOOR_TOP ? B.yellow : y === DOOR_TOP + 1 ? B.black : V.wall);
    }
  }
  // door header lights
  for (let x = DOOR_X1; x <= DOOR_X2; x += 4) c.set(x, DOOR_TOP - 1, frontZ, B.sea);
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
    const xa = side === "west" ? 2 : 70;
    const xb = side === "west" ? 10 : 78;
    const openX = side === "west" ? 11 : 69; // face toward the hangar floor
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
        // open front with frame posts; mezzanine rail on the upper level
        for (const z of [z1 - 1, z2 + 1]) c.fill(openX, w - 1, z, openX, w + 5, z, B.tile);
        if (level === 1) for (let z = z1; z <= z2; z++) c.set(openX, w, z, B.bars);
        else c.fill(openX, w + 5, z1, openX, w + 5, z2, B.yellow);
        furnishRoom(c, {
          x1: xa, z1, x2: xb, z2, walk: w, h: 5,
          type: bayTypes[(i + level * 4) % bayTypes.length],
          door: side === "west" ? "east" : "west",
          doorU: 3
        });
      }
    }
    // stair to the mezzanine at the front of each bay row
    const sx = side === "west" ? 12 : 68;
    for (let k = 0; k < 6; k++) {
      c.set(sx, WALK + k, 13 - k, c.stairs("minecraft:polished_deepslate_stairs", "north"));
      c.fill(sx, WALK - 1, 13 - k, sx, WALK + k - 1, 13 - k, B.concrete);
    }
    c.fill(side === "west" ? 11 : 69, WALK + 5, 6, side === "west" ? 12 : 69, WALK + 5, 13, B.andesite);
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
  // aircraft clearance box (light blue outline) sized for a 56-span bomber
  for (let x = 11; x <= 69; x++) { c.set(x, WALK - 1, 22, B.lightBlue); c.set(x, WALK - 1, 92, B.lightBlue); }
  for (let z = 22; z <= 92; z++) { c.set(11, WALK - 1, z, B.lightBlue); c.set(69, WALK - 1, z, B.lightBlue); }
  // nose-wheel stop bar and parking chevrons
  for (let x = CX - 3; x <= CX + 3; x++) c.set(x, WALK - 1, 30, B.white);
  for (let k = 0; k < 6; k++) for (const s of [-1, 1]) for (let i = 0; i < 4; i++) c.set(CX + s * (4 + i), WALK - 1, 40 + k * 8 + i, B.white);
  // flush floor lights along the clearance box
  for (let z = 26; z <= 90; z += 8) { c.set(13, WALK - 1, z, B.sea); c.set(67, WALK - 1, z, B.sea); }
  // hanging lights from every second truss
  for (let z = 8; z < frontZ; z += 16) for (const x of [20, 30, 40, 50, 60]) {
    const y = roofY(x) - 2;
    c.set(x, y, z, B.sea);
  }

  // --- ground equipment ----------------------------------------------------
  // tow tractor
  c.fill(18, WALK, 70, 21, WALK, 72, B.yellow);
  c.fill(19, WALK + 1, 70, 20, WALK + 1, 71, B.black);
  c.set(21, WALK + 1, 72, B.sea);
  // fuel bowser
  c.fill(58, WALK, 66, 60, WALK + 2, 72, B.white);
  c.fill(58, WALK, 73, 60, WALK + 1, 74, B.red);
  c.fill(59, WALK + 3, 67, 59, WALK + 3, 71, B.lightGrey);
  // weapons loader trolleys and crates along the bays
  for (const [x, z] of [[15, 34], [15, 52], [65, 40], [65, 58]]) { c.fill(x, WALK, z, x + 1, WALK, z + 2, B.yellow); c.set(x, WALK + 1, z + 1, B.greenTerracotta); }
  hazardBorder(c, 13, WALK - 1, 16, 67, 20);

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
