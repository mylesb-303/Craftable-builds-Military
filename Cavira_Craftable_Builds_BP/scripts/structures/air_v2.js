import { kit, hazardBorder, spiralStairwell, radarArray, latticeMast, securityFence } from "../kit.js";
import { furnishRoom } from "../interiors.js";
import { stairFlight, externalStairs } from "../buildings.js";
import { FONT } from "./airfield.js";

// ---------------------------------------------------------------------------
// Air Force builds, redesigned in v1.8.0.
// Sized from the Cavira Airforce models (1 block = 1 m) and real-world
// references: AFMAN 141182 hardened aircraft shelters (steel-lined concrete
// arch, one fighter each), USAF hangar clearances (3 m from wingtip to doors
// and walls), FAA/ICAO heliport markings (TLOF with "H", FATO edge, green
// perimeter lights), aboveground fuel storage (min. two tanks, bunded dike,
// pump house, truck fill stand), and radome-on-equipment-building radar sites.
// Every hangar declares an aircraft envelope that must stay completely clear.
// ---------------------------------------------------------------------------

const WALK = 2;

export const AIR_SIZES = {
  large_aircraft_hangar: { x: 51, y: 22, z: 62 },
  watch_tower: { x: 23, y: 64, z: 23 },
  helicopter_apron: { x: 41, y: 8, z: 41 },
  helicopter_hangar: { x: 41, y: 14, z: 41 },
  hardened_fighter_shelter: { x: 25, y: 13, z: 27 },
  fighter_shelter_row: { x: 59, y: 13, z: 27 },
  radar_radome_facility: { x: 33, y: 22, z: 33 },
  fuel_tank_farm: { x: 29, y: 14, z: 23 }
};

// --- envelopes (local boxes that must stay empty) ---------------------------
const HAS_W = 25;
const hasEnvelope = (x0) => [
  { x1: x0 + 3, x2: x0 + 21, y1: WALK, y2: WALK + 2, z1: 2, z2: 26 },  // wings
  { x1: x0 + 8, x2: x0 + 16, y1: WALK, y2: WALK + 6, z1: 2, z2: 26 }   // fuselage and fin
];
export const AIR_ENVELOPES = {
  large_aircraft_hangar: [{ x1: 3, x2: 47, y1: WALK, y2: WALK + 15, z1: 10, z2: 61 }],
  helicopter_hangar: [{ x1: 2, x2: 38, y1: WALK, y2: WALK + 7, z1: 7, z2: 40 }],
  hardened_fighter_shelter: hasEnvelope(0),
  fighter_shelter_row: [...hasEnvelope(0), ...hasEnvelope(34)]
};

const ctx = (id, d, o, r, v) => ({ c: kit(d, o, r, AIR_SIZES[id], v), size: AIR_SIZES[id] });

/** Big hangar door: clear opening, striped header with floodlights set into its soffit, leaf pockets. */
function hangarDoor(c, x1, x2, z, top, pocketDepth = 3) {
  const B = c.B;
  c.clear(x1, WALK, z, x2, top - 1, z);
  for (let x = x1; x <= x2; x++) c.set(x, top, z, (x - x1) % 5 === 2 ? B.sea : x % 2 ? B.yellow : B.black);
  // retracted door-leaf pockets either side (inside the walls, outside the opening)
  for (const [xa, xb] of [[x1 - pocketDepth, x1 - 1], [x2 + 1, x2 + pocketDepth]]) for (let x = xa; x <= xb; x++) for (let y = WALK; y < top; y++) c.set(x, y, z, (x + y) % 6 < 3 ? B.yellow : B.black);
}

// ---------------------------------------------------------------------------
// Large Aircraft Hangar — clear-span transport/tanker hangar
// (C-130J, KC-135, A400M: up to 42.4 m span, 14.7 m tall) with rear support wing
// ---------------------------------------------------------------------------
export function buildLargeAircraftHangar(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("large_aircraft_hangar", dimension, origin, rotation, variantId);
  const B = c.B, V = c.V;
  const BODY = 55; // hangar body z 0..54, apron z 55..61
  const front = BODY - 1;
  const roof = (x) => WALK + 17 + Math.round(2 * Math.sqrt(Math.max(0, 1 - ((x - 25) / 25.5) ** 2)));
  c.fill(0, WALK - 2, 0, 50, WALK - 2, size.z - 1, B.concrete);
  c.fill(0, WALK - 1, 0, 50, WALK - 1, front, B.smooth);
  // walls, columns, high glazing
  for (let x = 0; x <= 50; x++) for (let z = 0; z <= front; z++) {
    const edge = x === 0 || x === 50 || z === 0 || z === front;
    if (!edge) continue;
    for (let y = WALK; y < roof(x); y++) {
      const col = (z % 6 === 0 && (x === 0 || x === 50)) || (x % 6 === 1 && (z === 0 || z === front));
      const glaze = (x === 0 || x === 50) && y >= WALK + 12 && y <= WALK + 14 && !col;
      c.set(x, y, z, col ? V.frame : glaze ? B.glass : V.wall);
    }
  }
  // shallow-arched roof with structural ribs; lights built into each rib
  for (let x = 0; x <= 50; x++) for (let z = 0; z <= front; z++) {
    const y = roof(x);
    const rib = z % 6 === 0;
    c.set(x, y, z, rib ? B.tile : V.accent);
    if (rib && x > 0 && x < 50) c.set(x, y - 1, z, x % 6 === 4 ? B.sea : B.yellow);
  }
  // door: full-width opening (45 clear) to 16 m
  hangarDoor(c, 3, 47, front, WALK + 16, 2);
  for (let x = 1; x <= 49; x++) for (let y = WALK + 17; y < roof(x); y++) c.set(x, y, front, V.wall);
  // rear support wing (z 1..8): workshops and stores under a mezzanine office strip
  c.fill(1, WALK + 5, 1, 49, WALK + 5, 8, B.andesite);
  c.fill(1, WALK, 9, 49, WALK + 4, 9, V.wall);
  for (const x of [8, 17, 33, 42]) c.fill(x, WALK, 1, x, WALK + 4, 8, V.wall);
  for (let x = 2; x <= 48; x++) if (x % 3) { c.set(x, WALK + 2, 9, B.glass); c.set(x, WALK + 3, 9, B.glass); }
  const bays = [[2, 7, "storage"], [9, 16, "workshop"], [18, 32, "lobby"], [34, 41, "workshop"], [43, 48, "supplies"]];
  for (const [x1, x2, type] of bays) {
    c.clear(Math.floor((x1 + x2) / 2), WALK, 9, Math.floor((x1 + x2) / 2) + 1, WALK + 2, 9);
    furnishRoom(c, { x1, z1: 1, x2, z2: 8, walk: WALK, h: 4, type, door: "south", doorU: Math.floor((x2 - x1) / 2) });
  }
  // mezzanine: crew room + flight planning, glazed toward the hangar floor, stair at the west end
  c.fill(1, WALK + 6, 9, 49, WALK + 9, 9, V.wall);
  for (let x = 2; x <= 48; x++) if (x % 4) for (const y of [WALK + 7, WALK + 8]) c.set(x, y, 9, B.lightBlueGlass);
  c.fill(1, WALK + 10, 1, 49, WALK + 10, 9, B.tile);
  c.clear(2, WALK + 6, 1, 48, WALK + 9, 8);
  furnishRoom(c, { x1: 2, z1: 1, x2: 24, z2: 8, walk: WALK + 6, h: 4, type: "briefing", door: "south", doorU: 10 });
  furnishRoom(c, { x1: 26, z1: 1, x2: 48, z2: 8, walk: WALK + 6, h: 4, type: "office", door: "south", doorU: 10 });
  c.fill(25, WALK + 6, 1, 25, WALK + 9, 8, V.wall);
  c.clear(25, WALK + 6, 4, 25, WALK + 7, 5);
  // stair from the hangar floor (west corner, outside the envelope) up to the mezzanine
  for (let k = 0; k < 6; k++) c.set(1 + 0, WALK + k, 15 - k, c.stairs("minecraft:polished_deepslate_stairs", "north"));
  for (let k = 0; k < 6; k++) c.fill(1, WALK - 1, 15 - k, 1, WALK + k - 1, 15 - k, B.concrete);
  c.clear(1, WALK + 6, 9, 1, WALK + 7, 9);
  c.set(2, WALK + 6, 10, B.rail);
  // floor: envelope outline, centreline, nose stop, tie-downs, flush floor lights
  const E = AIR_ENVELOPES.large_aircraft_hangar[0];
  for (let z = E.z1; z <= front; z++) { c.set(E.x1, WALK - 1, z, B.lightBlue); c.set(E.x2, WALK - 1, z, B.lightBlue); if (z % 4 !== 3) c.set(25, WALK - 1, z, B.yellow); }
  for (let x = E.x1; x <= E.x2; x++) c.set(x, WALK - 1, E.z1, B.lightBlue);
  for (let x = 22; x <= 28; x++) c.set(x, WALK - 1, 14, B.white);
  for (let z = 14; z <= 52; z += 6) for (let x = 6; x <= 44; x += 6) c.set(x, WALK - 1, z, B.sea);
  // apron
  c.fill(0, WALK - 1, BODY, 50, WALK - 1, size.z - 1, B.black);
  for (let z = BODY; z < size.z; z++) if (z % 4 !== 3) c.set(25, WALK - 1, z, B.yellow);
  for (let x = 3; x <= 47; x += 4) c.set(x, WALK - 1, size.z - 2, B.sea);
}

// ---------------------------------------------------------------------------
// Watch Tower — airfield observation tower: concrete shaft with spiral stair,
// cantilevered glazed cab, balcony, beacon and antenna
// ---------------------------------------------------------------------------
export function buildWatchTower(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("watch_tower", dimension, origin, rotation, variantId);
  const B = c.B, V = c.V;
  const cx = 11, cz = 11;
  const CAB = WALK + 48; // cab floor walk level
  c.fill(0, WALK - 2, 0, 22, WALK - 2, 22, B.concrete);
  c.fill(0, WALK - 1, 0, 22, WALK - 1, 22, B.andesite);
  // base block: guard room and lobby around the shaft
  c.walls(4, WALK, 4, 18, WALK + 4, 18, V.wall);
  c.fill(4, WALK + 5, 4, 18, WALK + 5, 18, V.accent);
  c.clear(5, WALK, 5, 17, WALK + 4, 17);
  for (let i = 6; i <= 16; i++) if (i % 3) for (const y of [WALK + 1, WALK + 2]) { c.set(i, y, 4, B.tinted); c.set(i, y, 18, B.tinted); c.set(4, y, i, B.tinted); c.set(18, y, i, B.tinted); }
  c.clear(10, WALK, 18, 12, WALK + 2, 18);
  for (const x of [9, 13]) c.set(x, WALK + 3, 18, B.sea);
  furnishRoom(c, { x1: 5, z1: 5, x2: 17, z2: 7, walk: WALK, h: 4, type: "office", door: "south", doorU: 6 });
  furnishRoom(c, { x1: 14, z1: 8, x2: 17, z2: 17, walk: WALK, h: 4, type: "bunks", door: "west", doorU: 4 });
  // shaft with spiral stair (x 9..12, z 9..12 interior, walls ±1)
  // shaft reinforcing fins with lights set in at intervals
  for (let y = WALK + 6; y < CAB - 1; y++) for (const [x, z] of [[cx, 7], [cx, 15], [7, cz], [15, cz]]) c.set(x, y, z, y % 8 === 0 ? B.sea : V.frame);
  // cab: 15×15 floor cantilevered on a stepped corbel, glazed all round, roof with beacon
  for (let k = 0; k < 3; k++) c.walls(7 - k, CAB - 3 + k, 7 - k, 15 + k, CAB - 3 + k, 15 + k, V.frame);
  c.fill(4, CAB - 1, 4, 18, CAB - 1, 18, V.floor);
  c.walls(5, CAB, 5, 17, CAB + 4, 17, V.wall);
  c.clear(6, CAB, 6, 16, CAB + 4, 16);
  for (let i = 6; i <= 16; i++) for (const y of [CAB + 1, CAB + 2, CAB + 3]) { c.set(i, y, 5, B.lightBlueGlass); c.set(i, y, 17, B.lightBlueGlass); c.set(5, y, i, B.lightBlueGlass); c.set(17, y, i, B.lightBlueGlass); }
  c.clear(11, CAB, 17, 11, CAB + 2, 17); // door to the balcony
  // balcony walkway with railing around the cab
  for (let x = 4; x <= 18; x++) for (const z of [4, 18]) c.set(x, CAB, z, B.rail);
  for (let z = 4; z <= 18; z++) for (const x of [4, 18]) c.set(x, CAB, z, B.rail);
  // cab roof with recessed lights and rotating-beacon housing
  for (let x = 5; x <= 17; x++) for (let z = 5; z <= 17; z++) c.set(x, CAB + 5, z, (x - 5) % 4 === 2 && (z - 5) % 4 === 2 ? B.sea : V.accent);
  c.fill(10, CAB + 6, 10, 12, CAB + 6, 12, V.frame);
  c.set(11, CAB + 7, 11, c.P("minecraft:redstone_lamp"));
  c.set(11, CAB + 6, 11, c.P("minecraft:lit_redstone_lamp", undefined, "minecraft:redstone_lamp"));
  c.fill(16, CAB + 6, 16, 16, CAB + 10, 16, B.bars);
  c.set(16, CAB + 11, 16, c.P("minecraft:lightning_rod"));
  // the stair shaft is built last so the cab floor never caps it
  spiralStairwell(c, { x0: 9, z0: 9, bottomWalk: WALK, topWalk: CAB, corner: "se", exits: [{ walk: WALK, side: "south" }, { walk: CAB, side: "south" }], wall: V.wall });
  // cab console ring facing outward
  for (let i = 7; i <= 15; i++) {
    if (Math.abs(i - 11) <= 2) continue;
    for (const [x, z, face] of [[i, 6, "north"], [6, i, "west"], [16, i, "east"]]) {
      c.set(x, CAB, z, B.blackstone);
      c.set(x, CAB + 1, z, c.P("minecraft:black_stained_glass_pane"));
      c.chair(x + (face === "west" ? 1 : face === "east" ? -1 : 0), CAB, z + (face === "north" ? 1 : 0), face);
    }
  }
}

// ---------------------------------------------------------------------------
// Helicopter Apron — FAA-style heliport: FATO, TLOF with "H", aiming circle,
// green perimeter lights, floodlights set into the pavement, windsock, fuel point
// ---------------------------------------------------------------------------
export function buildHelicopterApron(dimension, origin, rotation, variantId) {
  const { c } = ctx("helicopter_apron", dimension, origin, rotation, variantId);
  const B = c.B;
  const cx = 20, cz = 20;
  for (let x = 0; x <= 40; x++) for (let z = 0; z <= 40; z++) {
    c.set(x, WALK - 2, z, B.concrete);
    const fato = x >= 3 && x <= 37 && z >= 3 && z <= 37;
    const tlof = x >= 9 && x <= 31 && z >= 9 && z <= 31;
    let p = fato ? B.smooth : B.grass;
    if (tlof) p = B.grey;
    if (tlof && (x === 9 || x === 31 || z === 9 || z === 31)) p = B.white;
    if (fato && !tlof && (x === 3 || x === 37 || z === 3 || z === 37) && (x + z) % 4 < 2) p = B.white;
    const d = Math.hypot(x - cx, z - cz);
    if (tlof && Math.abs(d - 8) < 0.6) p = B.yellow; // touchdown/positioning circle
    c.set(x, WALK - 1, z, p);
  }
  // "H" (3 m strokes) and the "H" bar
  for (let z = 15; z <= 25; z++) for (const x of [16, 17, 23, 24]) c.set(x, WALK - 1, z, B.white);
  for (let x = 18; x <= 22; x++) for (const z of [19, 20, 21]) c.set(x, WALK - 1, z, B.white);
  // green TLOF perimeter lights and white FATO corner lights, flush with the surface
  for (let i = 9; i <= 31; i += 4) for (const [x, z] of [[i, 8], [i, 32], [8, i], [32, i]]) c.set(x, WALK - 1, z, c.P("minecraft:verdant_froglight"));
  for (const [x, z] of [[3, 3], [37, 3], [3, 37], [37, 37], [20, 3], [20, 37], [3, 20], [37, 20]]) c.set(x, WALK - 1, z, B.sea);
  // windsock on the north-east corner
  c.fill(39, WALK, 1, 39, WALK + 4, 1, B.bars);
  c.set(39, WALK + 5, 1, c.P("minecraft:orange_wool"));
  c.set(38, WALK + 5, 1, B.white);
  c.set(37, WALK + 5, 1, c.P("minecraft:orange_wool"));
  // refuelling point (south-west) with spill pad, fuel cabinet and fire extinguisher stand
  for (let x = 0; x <= 2; x++) for (let z = 37; z <= 40; z++) c.set(x, WALK - 1, z, B.yellow);
  c.set(1, WALK, 39, c.barrel("north"));
  c.set(0, WALK, 39, B.red);
  c.set(2, WALK, 39, c.slabTop("minecraft:smooth_stone_slab"));
}

// ---------------------------------------------------------------------------
// Helicopter Hangar — 37 m clear door for Chinook / Apache / Osprey, rear support wing
// ---------------------------------------------------------------------------
export function buildHelicopterHangar(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("helicopter_hangar", dimension, origin, rotation, variantId);
  const B = c.B, V = c.V;
  const BODY = 35, front = BODY - 1, H = 11;
  c.fill(0, WALK - 2, 0, 40, WALK - 2, size.z - 1, B.concrete);
  c.fill(0, WALK - 1, 0, 40, WALK - 1, front, B.smooth);
  c.walls(0, WALK, 0, 40, WALK + H - 1, front, V.wall);
  for (let z = 0; z <= front; z += 5) for (const x of [0, 40]) c.fill(x, WALK, z, x, WALK + H - 1, z, V.frame);
  c.clear(1, WALK, 1, 39, WALK + H - 1, front - 1);
  for (let z = 2; z < front; z++) if (z % 5) for (const x of [0, 40]) { c.set(x, WALK + 8, z, B.glass); c.set(x, WALK + 9, z, B.glass); }
  // roof: low-pitch with roof lights built into the purlins
  for (let x = 0; x <= 40; x++) for (let z = 0; z <= front; z++) {
    c.set(x, WALK + H, z, (x % 8 === 4 && z % 5 === 2 && z > 1 && z < front - 1) ? B.sea : B.tile);
    if (x === 0 || x === 40 || z === 0 || z === front) c.set(x, WALK + H + 1, z, V.frame);
  }
  hangarDoor(c, 2, 38, front, WALK + 8, 1);
  for (let x = 1; x <= 39; x++) for (let y = WALK + 9; y < WALK + H; y++) c.set(x, y, front, V.wall);
  // rear support wing z 1..6: workshop, avionics, crew room; mezzanine stores above
  c.fill(1, WALK, 6, 39, WALK + 4, 6, V.wall);
  for (const x of [13, 27]) c.fill(x, WALK, 1, x, WALK + 4, 5, V.wall);
  for (let x = 2; x <= 38; x++) if (x % 4) { c.set(x, WALK + 2, 6, B.glass); c.set(x, WALK + 3, 6, B.glass); }
  c.fill(1, WALK + 5, 1, 39, WALK + 5, 6, B.andesite);
  for (const [x1, x2, type] of [[1, 12, "workshop"], [14, 26, "servers"], [28, 39, "mess"]]) {
    const mid = Math.floor((x1 + x2) / 2);
    c.clear(mid, WALK, 6, mid + 1, WALK + 2, 6);
    furnishRoom(c, { x1, z1: 1, x2, z2: 5, walk: WALK, h: 4, type, door: "south", doorU: mid - x1 });
  }
  // mezzanine stores reached by a stair along the west wall
  for (let x = 2; x <= 38; x++) c.set(x, WALK + 6, 6, x % 5 === 0 ? B.yellow : B.rail);
  for (let k = 0; k < 6; k++) { c.set(1, WALK + k, 12 - k, c.stairs("minecraft:polished_deepslate_stairs", "north")); c.fill(1, WALK - 1, 12 - k, 1, WALK + k - 1, 12 - k, B.concrete); }
  c.clear(1, WALK + 6, 6, 1, WALK + 7, 6);
  for (let x = 3; x <= 37; x += 3) { c.set(x, WALK + 6, 1, c.barrel("south")); c.set(x, WALK + 6, 2, c.barrel("south")); }
  // floor: two parking spots with "H" marks, centrelines, flush lights
  const E = AIR_ENVELOPES.helicopter_hangar[0];
  for (let z = E.z1; z <= front; z++) { c.set(E.x1, WALK - 1, z, B.lightBlue); c.set(E.x2, WALK - 1, z, B.lightBlue); }
  for (const hx of [11, 29]) {
    for (let z = 15; z <= 21; z++) { c.set(hx - 2, WALK - 1, z, B.white); c.set(hx + 2, WALK - 1, z, B.white); }
    for (let x = hx - 1; x <= hx + 1; x++) c.set(x, WALK - 1, 18, B.white);
    for (let z = 23; z <= front; z++) if (z % 3) c.set(hx, WALK - 1, z, B.yellow);
  }
  for (let z = 10; z <= 32; z += 5) for (const x of [5, 15, 20, 25, 35]) c.set(x, WALK - 1, z, B.sea);
  // apron with dolly tracks
  c.fill(0, WALK - 1, BODY, 40, WALK - 1, size.z - 1, B.black);
  for (const hx of [11, 29]) for (let z = BODY; z < size.z; z++) if (z % 3) c.set(hx, WALK - 1, z, B.yellow);
}

// ---------------------------------------------------------------------------
// Hardened Aircraft Shelter (TAB-VEE style) — steel-lined concrete arch for
// one fighter, retracted door leaves, rear exhaust port, in-shelter services
// ---------------------------------------------------------------------------
function hasShelter(c, x0, depth = 23) {
  const B = c.B, V = c.V;
  const cx = x0 + 12, rx = 11.5, ry = 10;
  const outer = (x) => WALK + Math.round(ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)));
  c.fill(x0, WALK - 1, 0, x0 + HAS_W - 1, WALK - 1, depth - 1, B.smooth);
  for (let x = x0; x < x0 + HAS_W; x++) {
    const top = outer(x);
    for (let z = 0; z < depth; z++) {
      for (let y = Math.max(WALK, top - 1); y <= top; y++) c.set(x, y, z, y === top ? V.camoA : (z % 4 === 0 ? B.tile : c.P("minecraft:iron_block")));
      // ribs of recessed lights in the steel liner
      if (z % 4 === 2 && z > 1 && z < depth - 2 && Math.abs(x - cx) % 6 === 3 && top - 2 >= WALK + 3) c.set(x, top - 1, z, B.sea);
    }
    // thick headwall around the opening, rear wall with exhaust deflector port
    for (let y = WALK; y < top - 1; y++) {
      c.set(x, y, 0, Math.abs(x - cx) <= 1 && y >= WALK + 2 && y <= WALK + 4 ? B.bars : B.concrete);
    }
  }
  // front portal frame and retracted door-leaf pockets (striped) at the sides
  for (let x = x0; x < x0 + HAS_W; x++) c.set(x, outer(x), depth - 1, c.V.frame);
  for (const xx of [x0, x0 + HAS_W - 1]) for (let y = WALK; y <= WALK + 3; y++) for (let z = depth - 3; z < depth; z++) c.set(xx, y, z, (y + z) % 4 < 2 ? B.yellow : B.black);
  // floor: centreline, nose stop, tie-down rings, in-floor refuelling pit and lights
  for (let z = 3; z < depth + 4; z++) if (z % 3) c.set(cx, WALK - 1, z, B.yellow);
  for (let x = cx - 2; x <= cx + 2; x++) c.set(x, WALK - 1, 5, B.white);
  c.set(cx + 4, WALK - 1, 10, B.ironTrapdoor);
  for (let z = 4; z < depth; z += 5) for (const dx of [-7, -3, 3, 7]) c.set(cx + dx, WALK - 1, z, B.sea);
  // apron in front
  for (let x = x0; x < x0 + HAS_W; x++) for (let z = depth; z < depth + 4; z++) c.set(x, WALK - 1, z, B.black);
}

export function buildHardenedFighterShelter(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("hardened_fighter_shelter", dimension, origin, rotation, variantId);
  c.fill(0, WALK - 2, 0, size.x - 1, WALK - 2, size.z - 1, c.B.concrete);
  hasShelter(c, 0);
}

export function buildFighterShelterRow(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("fighter_shelter_row", dimension, origin, rotation, variantId);
  const B = c.B, V = c.V;
  c.fill(0, WALK - 2, 0, size.x - 1, WALK - 2, size.z - 1, B.concrete);
  c.fill(0, WALK - 1, 0, size.x - 1, WALK - 1, size.z - 1, B.andesite);
  hasShelter(c, 0);
  hasShelter(c, 34);
  // hardened ready room between the shelters (x 25..33), earth-covered
  c.walls(25, WALK, 2, 33, WALK + 4, 20, B.concrete);
  c.fill(25, WALK + 5, 2, 33, WALK + 5, 20, B.concrete);
  c.fill(25, WALK + 6, 2, 33, WALK + 6, 20, B.grass);
  c.clear(26, WALK, 3, 32, WALK + 4, 19);
  furnishRoom(c, { x1: 26, z1: 3, x2: 32, z2: 10, walk: WALK, h: 4, type: "briefing", door: "south", doorU: 3 });
  furnishRoom(c, { x1: 26, z1: 12, x2: 32, z2: 19, walk: WALK, h: 4, type: "bunks", door: "north", doorU: 3 });
  c.fill(26, WALK, 11, 32, WALK + 4, 11, B.concrete);
  c.clear(29, WALK, 11, 29, WALK + 2, 11);
  c.clear(29, WALK, 20, 29, WALK + 2, 20);
  for (let x = 26; x <= 32; x += 3) for (let z = 4; z <= 18; z += 4) c.set(x, WALK + 5, z, B.sea);
  // blast-proof entry with a baffle wall and lights set into it
  c.fill(27, WALK, 22, 31, WALK + 3, 22, B.concrete);
  c.set(27, WALK + 2, 22, B.sea); c.set(31, WALK + 2, 22, B.sea);
}

// ---------------------------------------------------------------------------
// Radar Radome Facility — geodesic radome on a two-storey equipment building
// ---------------------------------------------------------------------------
export function buildRadarRadomeFacility(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("radar_radome_facility", dimension, origin, rotation, variantId);
  const B = c.B, V = c.V;
  const cx = 16, cz = 16;
  c.fill(0, WALK - 2, 0, 32, WALK - 2, 32, B.concrete);
  c.fill(0, WALK - 1, 0, 32, WALK - 1, 32, c.P("minecraft:gravel"));
  securityFence(c, { x1: 0, z1: 0, x2: 32, z2: 32, walk: WALK, post: 6, gates: [{ x1: 15, z1: 32, x2: 17, z2: 32 }] });
  for (let z = 27; z <= 32; z++) for (let x = 15; x <= 17; x++) c.set(x, WALK - 1, z, B.andesite);
  // equipment building x 6..26, z 6..26, two floors (5 high)
  const X1 = 6, X2 = 26, Z1 = 6, Z2 = 26, FH = 5;
  c.fill(X1, WALK - 1, Z1, X2, WALK - 1, Z2, V.floor);
  for (let f = 0; f < 2; f++) {
    const w = WALK + f * FH;
    c.walls(X1, w, Z1, X2, w + FH - 2, Z2, V.wall);
    c.fill(X1, w + FH - 1, Z1, X2, w + FH - 1, Z2, f ? B.tile : V.floor);
    c.clear(X1 + 1, w, Z1 + 1, X2 - 1, w + FH - 2, Z2 - 1);
    for (let i = X1 + 2; i <= X2 - 2; i++) if (i % 4) { c.set(i, w + 2, Z1, B.tinted); c.set(i, w + 2, Z2, B.tinted); }
  }
  for (const [x, z] of [[X1, Z1], [X2, Z1], [X1, Z2], [X2, Z2]]) c.fill(x, WALK - 1, z, x, WALK + 2 * FH, z, V.frame);
  c.clear(15, WALK, Z2, 17, WALK + 2, Z2);
  c.set(14, WALK + 3, Z2, B.sea); c.set(18, WALK + 3, Z2, B.sea);
  // ground floor: generators (west) and comms (east) either side of a central hall with the stair
  c.fill(13, WALK, Z1 + 1, 13, WALK + 3, Z2 - 1, V.wall); c.fill(19, WALK, Z1 + 1, 19, WALK + 3, Z2 - 1, V.wall);
  c.clear(13, WALK, 20, 13, WALK + 2, 21); c.clear(19, WALK, 20, 19, WALK + 2, 21);
  furnishRoom(c, { x1: X1 + 1, z1: Z1 + 1, x2: 12, z2: Z2 - 1, walk: WALK, h: 4, type: "generator", door: "east", doorU: 5 });
  furnishRoom(c, { x1: 20, z1: Z1 + 1, x2: X2 - 1, z2: Z2 - 1, walk: WALK, h: 4, type: "comms", door: "west", doorU: 14 });
  // stair up through the central hall (climbing north), and again to the roof
  stairFlight(c, 16, 22, "north", WALK, FH);
  c.clear(15, WALK + FH, 13, 17, WALK + FH + 2, 17);
  stairFlight(c, 15, 13, "south", WALK + FH, FH);
  c.clear(15, WALK + 2 * FH - 1, 14, 15, WALK + 2 * FH + 1, 18);
  // upper floor: radar processing (servers) and operations room
  furnishRoom(c, { x1: X1 + 1, z1: Z1 + 1, x2: 13, z2: Z2 - 1, walk: WALK + FH, h: 4, type: "servers", door: "east", doorU: 7 });
  furnishRoom(c, { x1: 18, z1: Z1 + 1, x2: X2 - 1, z2: Z2 - 1, walk: WALK + FH, h: 4, type: "command", door: "west", doorU: 12 });
  // roof deck with railing; geodesic radome (r 8) sitting on a ring wall
  const R = WALK + 2 * FH;
  for (let i = X1; i <= X2; i++) { c.set(i, R, Z1, B.rail); c.set(i, R, Z2, B.rail); c.set(X1, R, i, B.rail); c.set(X2, R, i, B.rail); }
  for (let x = cx - 8; x <= cx + 8; x++) for (let z = cz - 8; z <= cz + 8; z++) for (let y = R; y <= R + 8; y++) {
    const d = Math.hypot(x - cx, (y - R) * 1.0, z - cz);
    if (d > 8.5 || d < 7.5 || y > size.y - 1) continue;
    const seam = (Math.abs(x - cx) + Math.abs(z - cz) + (y - R)) % 4 === 0;
    c.set(x, y, z, seam ? B.lightGrey : B.white);
  }
  // radar array inside the dome and an access hatch from the roof
  radarArray(c, { center: { x: cx, y: R + 4, z: cz }, width: 7, height: 4, tilt: 20 });
  c.fill(cx, R, cz, cx, R + 2, cz, B.blackstoneBricks);
  c.clear(cx, R, cz + 8, cx, R + 1, cz + 8);
  // aircraft warning lights set into the dome crown
  c.set(cx, R + 8, cz, B.red);
}

// ---------------------------------------------------------------------------
// Fuel Tank Farm — two bunded aboveground tanks, pump house, truck fill stand
// ---------------------------------------------------------------------------
export function buildFuelTankFarm(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("fuel_tank_farm", dimension, origin, rotation, variantId);
  const B = c.B, V = c.V;
  c.fill(0, WALK - 2, 0, 28, WALK - 2, 22, B.concrete);
  c.fill(0, WALK - 1, 0, 28, WALK - 1, 22, c.P("minecraft:gravel"));
  // bund (containment dike) x 0..18, z 0..21
  c.fill(1, WALK - 1, 1, 17, WALK - 1, 20, B.smooth);
  c.walls(0, WALK, 0, 18, WALK + 1, 21, B.concrete);
  // stile steps over the bund wall (south)
  c.set(9, WALK, 22, c.stairs("minecraft:polished_deepslate_stairs", "north"));
  c.set(9, WALK + 1, 21, c.slabTop("minecraft:polished_deepslate_slab"));
  c.set(9, WALK, 20, c.stairs("minecraft:polished_deepslate_stairs", "south"));
  // two vertical tanks r 4 with a contrasting band, gauge and roof railing
  for (const [tx, tz] of [[9, 6], [9, 15]]) {
    for (let y = WALK; y <= WALK + 8; y++) c.cyl(tx, tz, y, y, 4, y === WALK + 5 ? B.red : B.white, 1);
    c.disc(tx, tz, WALK + 9, 4, B.lightGrey);
    c.cyl(tx, tz, WALK + 10, WALK + 10, 4, B.rail, 1);
    c.fill(tx + 5, WALK, tz, tx + 5, WALK + 1, tz, c.P("minecraft:iron_block")); // outlet valve
    c.set(tx, WALK + 3, tz - 4, c.P("minecraft:black_stained_glass")); // level gauge
    // external ladder up the west side to the roof, with a gap in the roof railing
    for (let y = WALK; y <= WALK + 9; y++) c.set(tx - 5, y, tz, c.ladder("west"));
    c.clear(tx - 4, WALK + 10, tz, tx - 4, WALK + 11, tz);
  }
  // pipe rack from both tanks to the pump house
  for (let x = 14; x <= 19; x++) for (const z of [6, 15]) c.set(x, WALK + 1, z, c.P("minecraft:iron_block"));
  for (let z = 6; z <= 15; z++) c.set(19, WALK + 1, z, c.P("minecraft:iron_block"));
  for (const z of [8, 13]) c.set(19, WALK, z, B.blackstoneBricks);
  // pump house x 20..27, z 2..9
  c.walls(20, WALK, 2, 27, WALK + 4, 9, V.wall);
  c.fill(20, WALK + 5, 2, 27, WALK + 5, 9, V.accent);
  c.clear(21, WALK, 3, 26, WALK + 4, 8);
  c.clear(23, WALK, 9, 24, WALK + 2, 9);
  furnishRoom(c, { x1: 21, z1: 3, x2: 26, z2: 8, walk: WALK, h: 4, type: "water", door: "south", doorU: 2 });
  // truck fill stand with a canopy (lights in the soffit) and loading arms
  for (const [x, z] of [[20, 12], [27, 12], [20, 20], [27, 20]]) c.fill(x, WALK, z, x, WALK + 4, z, B.blackstoneBricks);
  for (let x = 19; x <= 28; x++) for (let z = 11; z <= 21; z++) c.set(x, WALK + 5, z, (x === 22 || x === 25) && (z === 14 || z === 18) ? B.sea : V.frame);
  for (let z = 12; z <= 20; z++) c.set(23, WALK - 1, z, B.yellow), c.set(24, WALK - 1, z, B.yellow);
  c.fill(21, WALK, 16, 21, WALK + 2, 16, c.P("minecraft:iron_block"));
  c.set(22, WALK + 2, 16, c.P("minecraft:chain")); c.set(22, WALK + 1, 16, B.bars);
  // foam fire monitor and emergency shut-off
  c.fill(26, WALK, 11, 26, WALK + 1, 11, B.red);
  c.set(28, WALK, 10, B.red);
}
