import { kit } from "../kit.js";
import { furnishRoom } from "../interiors.js";
import { flagpole } from "./facilities.js";

// ---------------------------------------------------------------------------
// Operations Map Room (v1.10.0) — a military planning and briefing room built
// around a large relief map table. The map is an original, designed theatre
// (coast, river, mountain ridge, forests, roads, town and an airbase) with
// unit markers, not a copy of any real place or existing work.
// Ground walk level y = 2; entrance faces local south. Lights are recessed.
// ---------------------------------------------------------------------------

const WALK = 2;
export const MAP_ROOM_SIZE = { x: 31, y: 9, z: 25 };
// table rim in local coordinates; the map surface is the 19 × 7 area inside it
// (v1.11: 2-wide walkways all the way round the table)
export const MAP_TABLE = { TX1: 5, TX2: 25, TZ1: 6, TZ2: 14 };
export const MAP_SCALE = 6; // blocks of real land per table cell

// 15 × 7 map, north at the top (row 0 = far side of the table from the door).
//  ~ sea   s beach   g open land   f forest   M mountain   b river   r road
//  R runway   T town   B bridge
const MAP = [
  "~~~~~ssggffMMMf",
  "~~~~ssgggfMMMMg",
  "~~~ssgRRRRgbMgf",
  "~~ssggrrrrrBrrr",
  "~ssgTTggggbgggf",
  "~sgTTgggbbgggff",
  "~ssgggbbgggffgg"
];
// unit markers on the table: friendly (blue) and opposing (red) candles
const MARKERS = [ // (v1.10 table markers; kept for reference)
  [7, 2, "blue"], [4, 4, "blue"], [9, 3, "blue"], [3, 1, "blue"],
  [12, 0, "red"], [13, 2, "red"], [14, 4, "red"], [12, 5, "red"]
];

/** Deterministic hash for the wall chart pattern. */
const hash = (x, z) => {
  let h = (x * 374761393 + z * 668265263) ^ 0x5bd1e995;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export function buildOperationsMapRoom(dimension, origin, rotation, variantId, options = {}) {
  const size = MAP_ROOM_SIZE;
  const c = kit(dimension, origin, rotation, size, variantId);
  const B = c.B, V = c.V;
  const P = (id, states) => c.P(id, states);
  const X1 = 1, X2 = 29, Z1 = 1, Z2 = 21, H = 6;

  // --- site and shell ---------------------------------------------------------
  c.fill(0, WALK - 2, 0, size.x - 1, WALK - 2, size.z - 1, B.concrete);
  c.fill(0, WALK - 1, 0, size.x - 1, WALK - 1, size.z - 1, B.andesite);
  c.fill(X1, WALK - 1, Z1, X2, WALK - 1, Z2, V.floor);
  c.walls(X1, WALK, Z1, X2, WALK + H - 1, Z2, V.wall);
  for (let x = X1; x <= X2; x += 4) for (const z of [Z1, Z2]) c.fill(x, WALK, z, x, WALK + H - 1, z, V.frame);
  for (let z = Z1; z <= Z2; z += 4) for (const x of [X1, X2]) c.fill(x, WALK, z, x, WALK + H - 1, z, V.frame);
  c.clear(X1 + 1, WALK, Z1 + 1, X2 - 1, WALK + H - 1, Z2 - 1);
  // high clerestory band (keeps wall space free for charts)
  for (let x = X1 + 1; x < X2; x++) if (x % 4) { c.set(x, WALK + 4, Z2, B.tinted); }
  for (let z = Z1 + 1; z < Z2; z++) if (z % 4) { c.set(X1, WALK + 4, z, B.tinted); c.set(X2, WALK + 4, z, B.tinted); }
  // flat roof with recessed lights on a 4-block grid, parapet with a sign band
  for (let x = X1; x <= X2; x++) for (let z = Z1; z <= Z2; z++) {
    const light = x > X1 && x < X2 && z > Z1 && z < Z2 && (x - 3) % 4 === 0 && (z - 3) % 4 === 0;
    c.set(x, WALK + H, z, light ? B.sea : B.tile);
  }
  for (let x = X1; x <= X2; x++) { c.set(x, WALK + H + 1, Z1, V.frame); c.set(x, WALK + H + 1, Z2, x % 2 ? B.blue : B.white); }
  for (let z = Z1; z <= Z2; z++) { c.set(X1, WALK + H + 1, z, V.frame); c.set(X2, WALK + H + 1, z, V.frame); }

  // --- front block: vestibule, comms room (west), map archive (east) ----------
  c.fill(X1 + 1, WALK, 17, X2 - 1, WALK + H - 1, 17, V.wall);
  c.fill(12, WALK, 18, 12, WALK + H - 1, Z2 - 1, V.wall);
  c.fill(18, WALK, 18, 18, WALK + H - 1, Z2 - 1, V.wall);
  // entrance: double doors, lit canopy outside, inner doors into the hall
  c.clear(14, WALK, Z2, 16, WALK + 2, Z2);
  c.clear(14, WALK, 17, 16, WALK + 2, 17);
  c.fill(13, WALK + 3, Z2 + 1, 17, WALK + 3, Z2 + 2, V.frame);
  c.set(15, WALK + 3, Z2 + 2, B.sea);
  for (const x of [13, 17]) c.fill(x, WALK, Z2 + 2, x, WALK + 2, Z2 + 2, B.blackstoneBricks);
  for (let x = 13; x <= 17; x++) for (let z = Z2 + 1; z < size.z; z++) c.set(x, WALK - 1, z, B.smooth);
  c.set(13, WALK, 19, c.barrel("east")); c.set(17, WALK, 19, P("minecraft:flower_pot"));
  // side rooms open off the vestibule
  c.clear(12, WALK, 19, 12, WALK + 2, 19);
  c.clear(18, WALK, 19, 18, WALK + 2, 19);
  furnishRoom(c, { x1: X1 + 1, z1: 18, x2: 11, z2: Z2 - 1, walk: WALK, h: H, type: "comms", door: "east", doorU: 1 });
  // map archive: chart drawers (barrels), bookcases and a reading desk
  for (let x = 19; x <= X2 - 1; x++) {
    c.set(x, WALK, Z2 - 1, x % 3 === 0 ? B.bookshelf : c.barrel("north"));
    c.set(x, WALK + 1, Z2 - 1, x % 3 === 0 ? B.bookshelf : c.barrel("north"));
    c.set(x, WALK + 2, Z2 - 1, B.bookshelf);
  }
  c.set(23, WALK, 18, c.slabTop("minecraft:dark_oak_slab"));
  c.set(24, WALK, 18, c.slabTop("minecraft:dark_oak_slab"));
  c.set(23, WALK + 1, 18, c.facing("minecraft:lectern", "south"));
  c.chair(25, WALK, 18, "west");

  // --- the map table ------------------------------------------------------------
  // Main table: a raised miniature of the real land around the room (options.terrain,
  // scanned when the build is placed). Any cell that could not be scanned (unloaded
  // chunk) shows the designed theatre map instead, so the table is always complete.
  const { TX1, TX2, TZ1, TZ2 } = MAP_TABLE;
  const TW = TX2 - TX1 - 1, TD = TZ2 - TZ1 - 1;
  const terrain = options.terrain;
  const SURF = {
    water: P("minecraft:blue_concrete"), sand: P("minecraft:sand"), grass: P("minecraft:lime_terracotta"),
    forest: P("minecraft:green_concrete"), stone: P("minecraft:stone"), snow: P("minecraft:white_concrete"),
    built: P("minecraft:light_gray_concrete"), soil: P("minecraft:brown_terracotta")
  };
  const DESIGN = {
    "~": P("minecraft:blue_concrete"), s: P("minecraft:sand"), g: P("minecraft:lime_terracotta"),
    f: P("minecraft:green_concrete"), M: P("minecraft:stone"), b: P("minecraft:light_blue_concrete"),
    r: P("minecraft:gray_concrete"), R: P("minecraft:light_gray_concrete"), T: P("minecraft:white_concrete"),
    B: P("minecraft:dark_oak_planks")
  };
  // v1.11: the table top is a flat coloured map (live land where scanned, the designed theatre
  // elsewhere) covered by up-facing item frames — drop your own maps in to tile a big map.
  for (let x = TX1; x <= TX2; x++) for (let z = TZ1; z <= TZ2; z++) {
    if (x === TX1 || x === TX2 || z === TZ1 || z === TZ2) { c.set(x, WALK, z, c.slabTop("minecraft:dark_oak_slab")); continue; }
    const u = x - TX1 - 1, v = z - TZ1 - 1;
    const live = terrain?.cells?.[v * TW + u];
    if (live && live.kind !== "unknown") c.set(x, WALK, z, SURF[live.kind] ?? SURF.grass);
    else {
      const ch = MAP[Math.floor((v * MAP.length) / TD)]?.[Math.floor((u * MAP[0].length) / TW)] ?? "g";
      c.set(x, WALK, z, DESIGN[ch]);
    }
    c.set(x, WALK + 1, z, c.itemFrame("up"));
  }
  // "you are here" and unit markers move to the rim so the frames stay clear
  if (terrain?.scanned) c.set(TX1, WALK + 1, Math.floor((TZ1 + TZ2) / 2), P("minecraft:red_candle", { candles: 3, lit: false }));
  else {
    c.set(TX1, WALK + 1, TZ1 + 2, P("minecraft:blue_candle", { candles: 2, lit: false }));
    c.set(TX2, WALK + 1, TZ1 + 2, P("minecraft:red_candle", { candles: 2, lit: false }));
  }
  // north arrow on the far rim. No stools: the 2-wide walkways round the table stay clear.
  c.set(Math.floor((TX1 + TX2) / 2), WALK + 1, TZ1, P("minecraft:lightning_rod"));

  // --- wall chart (north wall): an invented strategic chart in a frame ---------
  const WX1 = 5, WX2 = 25, WY1 = WALK + 1, WY2 = WALK + 4;
  for (let x = WX1; x <= WX2; x++) for (let y = WY1; y <= WY2; y++) {
    const frame = x === WX1 || x === WX2 || y === WY1 || y === WY2;
    let b;
    if (frame) b = P("minecraft:dark_oak_planks");
    else {
      const n = hash(Math.floor(x / 2), y) * 0.6 + hash(x, y * 3) * 0.4;
      const land = n > 0.55;
      b = land ? (n > 0.85 ? P("minecraft:yellow_terracotta") : P("minecraft:lime_terracotta")) : P("minecraft:cyan_terracotta");
      if ((x - WX1) % 5 === 0) b = P("minecraft:light_gray_terracotta"); // grid lines
    }
    c.set(x, y, Z1, b);
  }
  // briefing lectern facing the table, and a raised dais
  c.fill(12, WALK - 1, 2, 18, WALK - 1, 3, B.blackstoneBricks);
  c.set(15, WALK, 3, c.facing("minecraft:lectern", "south"));

  // --- plotting boards (east and west walls) ------------------------------------
  for (const x of [X1, X2]) for (let z = 5; z <= 15; z++) for (let y = WALK + 1; y <= WALK + 3; y++) {
    const frame = z === 5 || z === 15 || y === WALK + 1 || y === WALK + 3;
    let b = frame ? P("minecraft:dark_oak_planks") : B.black;
    if (!frame && hash(z, y + x) > 0.78) b = hash(z * 7, y) > 0.5 ? P("minecraft:red_concrete") : P("minecraft:blue_concrete");
    c.set(x, y, z, b);
  }
  // counters under the boards: chart chests and a radio set
  for (const [x, face] of [[X1 + 1, "east"], [X2 - 1, "west"]]) {
    for (let z = 6; z <= 14; z += 2) c.set(x, WALK, z, c.slabTop("minecraft:dark_oak_slab"));
    c.set(x, WALK, 10, c.facing("minecraft:chest", face));
    c.set(x, WALK + 1, 8, B.jukebox);
  }

  // --- exterior: flagpole and planters ------------------------------------------
  flagpole(c, 3, 23, 6, [B.blue, B.white]);
  for (const x of [10, 20]) { c.set(x, WALK, 22, B.moss); c.set(x, WALK + 1, 22, P("minecraft:flowering_azalea")); }
}
