import { kit, parabolicDish, radarArray, latticeMast, aimAxis, securityFence, hazardBorder } from "../kit.js";
import { opsBuilding, compoundWall, lampPost, tieredPlinth, externalStairs } from "../buildings.js";

// ---------------------------------------------------------------------------
// Strategic radars & satellite dishes v2 (v1.5.0)
// Rebuilt from the reference images: real tilted parabolic dishes with feed
// tripods and tiered mounts, and rectangular phased-array radar faces on
// pedestals and lattice towers (the v1.4 versions used flat upward discs).
// Ground: walk level y = 2 (foundationDepth 2).
// ---------------------------------------------------------------------------

const WALK = 2;

export const STRATEGIC_SIZES = {
  small_tactical_radar_post: { x: 23, y: 24, z: 23 },
  medium_radar_station: { x: 37, y: 34, z: 33 },
  large_early_warning_radar_complex: { x: 51, y: 46, z: 47 },
  small_communications_dish_station: { x: 21, y: 28, z: 21 },
  medium_satellite_dish_station: { x: 35, y: 42, z: 35 },
  large_strategic_satellite_array: { x: 57, y: 58, z: 57 },
  standalone_small_satellite_dish: { x: 17, y: 25, z: 17 },
  standalone_medium_satellite_dish: { x: 29, y: 36, z: 29 },
  standalone_large_satellite_dish: { x: 39, y: 48, z: 39 }
};

function ctx(id, dimension, origin, rotation, variantId) {
  const size = STRATEGIC_SIZES[id];
  return { c: kit(dimension, origin, rotation, size, variantId), size };
}

function pad(c, size, block) {
  c.fill(0, WALK - 1, 0, size.x - 1, WALK - 1, size.z - 1, block ?? c.B.smooth);
  hazardBorder(c, 0, WALK - 1, 0, size.x - 1, size.z - 1);
}

/** Dish on a column/yoke mount. Returns the top of the mount. */
function dishOnMount(c, o) {
  const { cx, cz, baseY, R } = o;
  const tilt = o.tilt ?? 40;
  const n = aimAxis(tilt, o.toward ?? "south", o.yaw ?? 0);
  const lift = Math.ceil(R * Math.sin((tilt * Math.PI) / 180)) + 2 + (o.extraLift ?? Math.round(R / 4));
  const v = { x: cx, y: baseY + lift, z: cz };
  // yoke column and turntable
  c.cyl(cx, cz, baseY, baseY, Math.max(2, Math.round(R / 4)), c.B.tile);
  c.fill(cx - 1, baseY, cz - 1, cx + 1, v.y - 2, cz + 1, c.B.blackstoneBricks);
  c.set(cx, v.y - 3, cz + 1, c.B.sea);
  // elevation bearing housings either side
  c.fill(cx - 2, v.y - 3, cz - 1, cx - 2, v.y - 1, cz + 1, c.B.concrete);
  c.fill(cx + 2, v.y - 3, cz - 1, cx + 2, v.y - 1, cz + 1, c.B.concrete);
  c.set(cx - 2, v.y - 2, cz, c.B.yellow);
  c.set(cx + 2, v.y - 2, cz, c.B.yellow);
  parabolicDish(c, { v, n, R, depth: o.depth ?? R * 0.32, back: c.B.tile, rimLight: o.rimLight ?? c.B.tile, rim: o.rim ?? c.B.concrete });
  return v;
}

/** Rotating phased-array radar on a turntable pedestal. */
function arrayOnPedestal(c, o) {
  const { cx, cz, baseY, width, height } = o;
  const pedH = o.pedestalH ?? 3;
  c.cyl(cx, cz, baseY, baseY, Math.max(2, Math.floor(width / 5)), c.B.tile);
  c.fill(cx - 1, baseY + 1, cz - 1, cx + 1, baseY + pedH, cz + 1, c.B.blackstoneBricks);
  c.set(cx, baseY + 1, cz + 2, c.B.sea);
  // support arms
  const cy = baseY + pedH + Math.ceil(height / 2) + 1;
  c.line(cx - Math.floor(width / 3), cy - 1, cz - 1, cx - 1, baseY + pedH, cz, c.B.blackstone);
  c.line(cx + Math.floor(width / 3), cy - 1, cz - 1, cx + 1, baseY + pedH, cz, c.B.blackstone);
  radarArray(c, { center: { x: cx, y: cy, z: cz }, width, height, tilt: o.tilt ?? 15 });
  return cy + Math.ceil(height / 2);
}

// ---------------------------------------------------------------------------
// Radars
// ---------------------------------------------------------------------------

export function buildSmallTacticalRadarPost(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("small_tactical_radar_post", dimension, origin, rotation, variantId);
  pad(c, size);
  securityFence(c, { x1: 1, z1: 1, x2: size.x - 2, z2: size.z - 2, walk: WALK, post: 4, gates: [{ x1: 9, z1: size.z - 2, x2: 13, z2: size.z - 2 }] });
  for (const [x, z] of [[2, 2], [size.x - 3, 2], [2, size.z - 3], [size.x - 3, size.z - 3]]) lampPost(c, x, z, WALK, 2);
  const b = opsBuilding(c, { x1: 5, z1: 5, x2: 17, z2: 16, walk: WALK, floors: ["command"], floorH: 6 });
  // roof plant & radar
  c.fill(7, b.top, 6, 9, b.top + 1, 8, c.B.lightGrey);
  c.set(8, b.top + 1, 6, c.B.bars);
  arrayOnPedestal(c, { cx: 11, cz: 10, baseY: b.top + 1, width: 13, height: 5, pedestalH: 3 });
  latticeMast(c, { x: 15, z: 6, y1: b.top + 1, y2: b.top + 7, width: 1, beacon: true });
  // equipment shelter
  c.fill(18, WALK, 7, 20, WALK + 2, 10, c.B.concrete);
  c.set(19, WALK + 1, 10, c.B.bars);
  c.set(19, WALK + 3, 8, c.B.yellow);
}

export function buildMediumRadarStation(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("medium_radar_station", dimension, origin, rotation, variantId);
  pad(c, size, c.B.andesite);
  compoundWall(c, { x1: 0, z1: 0, x2: size.x - 1, z2: size.z - 1, walk: WALK, height: 3, step: 6, gates: [{ x1: 16, z1: size.z - 1, x2: 20, z2: size.z - 1 }] });
  // road markings
  for (let z = 22; z < size.z - 1; z++) { c.set(18, WALK - 1, z, z % 2 ? c.B.yellow : c.B.andesite); }
  const b = opsBuilding(c, {
    x1: 9, z1: 6, x2: 29, z2: 20, walk: WALK, floorH: 6,
    floors: [[{ u1: 12, u2: 19, type: "servers" }, { u1: 21, u2: 28, type: "storage" }], [{ u1: 12, u2: 28, type: "command" }]], roofDeck: true
  });
  // lattice tower on the roof with the T-array
  latticeMast(c, { x: 17, z: 11, y1: b.top + 1, y2: b.top + 9, width: 5, beacon: false });
  c.fill(17, b.top + 10, 11, 21, b.top + 10, 15, c.B.tile);
  arrayOnPedestal(c, { cx: 19, cz: 13, baseY: b.top + 10, width: 21, height: 7, pedestalH: 2 });
  // secondary antennas and floodlights
  latticeMast(c, { x: 25, z: 8, y1: b.top + 1, y2: b.top + 6, width: 1 });
  latticeMast(c, { x: 11, z: 8, y1: b.top + 1, y2: b.top + 5, width: 1 });
  for (const [x, z] of [[3, 3], [size.x - 4, 3], [3, size.z - 4], [size.x - 4, size.z - 4]]) {
    c.fill(x, WALK, z, x, WALK + 6, z, c.B.blackstoneBricks);
    c.fill(x - 1, WALK + 7, z, x + 1, WALK + 7, z, c.B.sea);
  }
  // generator yard
  c.fill(3, WALK, 8, 6, WALK + 2, 14, c.B.concrete);
  c.fill(4, WALK + 1, 8, 5, WALK + 1, 8, c.B.froglight);
  hazardBorder(c, 2, WALK - 1, 7, 7, 15);
  // cable trench
  for (let x = 30; x < size.x - 2; x++) c.set(x, WALK - 1, 22, c.B.ironTrapdoor);
}

export function buildLargeEarlyWarningRadarComplex(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("large_early_warning_radar_complex", dimension, origin, rotation, variantId);
  pad(c, size, c.B.stoneBrick);
  compoundWall(c, { x1: 0, z1: 0, x2: size.x - 1, z2: size.z - 1, walk: WALK, height: 5, step: 5, towers: true, gates: [{ x1: 22, z1: size.z - 1, x2: 28, z2: size.z - 1 }] });
  // inner rail line
  securityFence(c, { x1: 4, z1: 4, x2: size.x - 5, z2: size.z - 5, walk: WALK, height: 1, post: 6, kerb: c.B.andesite, gates: [{ x1: 22, z1: size.z - 5, x2: 28, z2: size.z - 5 }] });
  const b = opsBuilding(c, {
    x1: 10, z1: 9, x2: 40, z2: 33, walk: WALK, floorH: 7,
    floors: [
      [{ u1: 13, u2: 22, type: "generator" }, { u1: 24, u2: 31, type: "servers" }, { u1: 33, u2: 39, type: "storage" }],
      [{ u1: 13, u2: 30, type: "command" }, { u1: 32, u2: 39, type: "conference" }]
    ],
    roofDeck: true
  });
  // stepped pyramid pedestal
  let y = b.top + 1;
  for (const [r, h] of [[7, 2], [5, 2], [3, 3]]) {
    c.fill(25 - r, y, 21 - r, 25 + r, y + h - 1, 21 + r, h === 3 ? c.B.blackstoneBricks : c.B.tile);
    for (let k = -r; k <= r; k += 3) { c.set(25 + k, y + h - 1, 21 + r, c.B.froglight); }
    y += h;
  }
  // diagonal braces from pedestal to the array frame
  arrayOnPedestal(c, { cx: 25, cz: 21, baseY: y, width: 33, height: 11, pedestalH: 3, tilt: 12 });
  // twin lattice antenna towers
  latticeMast(c, { x: 12, z: 11, y1: b.top + 1, y2: b.top + 14, width: 3 });
  latticeMast(c, { x: 36, z: 11, y1: b.top + 1, y2: b.top + 14, width: 3 });
  // perimeter equipment
  for (const x of [8, 14, 36, 42]) { c.fill(x, WALK, size.z - 9, x + 2, WALK + 1, size.z - 7, c.B.concrete); c.set(x + 1, WALK + 2, size.z - 8, c.B.froglight); }
}

// ---------------------------------------------------------------------------
// Dish stations
// ---------------------------------------------------------------------------

export function buildSmallCommunicationsDishStation(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("small_communications_dish_station", dimension, origin, rotation, variantId);
  pad(c, size);
  securityFence(c, { x1: 1, z1: 1, x2: size.x - 2, z2: size.z - 2, walk: WALK, height: 1, post: 4, gates: [{ x1: 9, z1: size.z - 2, x2: 11, z2: size.z - 2 }] });
  for (const [x, z] of [[1, 1], [size.x - 2, 1], [1, size.z - 2], [size.x - 2, size.z - 2]]) lampPost(c, x, z, WALK, 2);
  const b = opsBuilding(c, { x1: 4, z1: 4, x2: 16, z2: 15, walk: WALK, floors: ["comms"], floorH: 6 });
  // roof drum with railing
  c.fill(7, b.top + 1, 6, 13, b.top + 2, 12, c.B.concrete);
  for (let x = 4; x <= 16; x++) for (const z of [4, 15]) c.set(x, b.top + 1, z, c.B.bars);
  for (let z = 4; z <= 15; z++) for (const x of [4, 16]) c.set(x, b.top + 1, z, c.B.bars);
  // cable riser
  c.fill(16, WALK, 9, 16, b.top + 2, 9, c.B.basalt);
  dishOnMount(c, { cx: 10, cz: 9, baseY: b.top + 3, R: 7, tilt: 42, toward: "south", yaw: 35 });
}

export function buildMediumSatelliteDishStation(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("medium_satellite_dish_station", dimension, origin, rotation, variantId);
  pad(c, size);
  securityFence(c, { x1: 1, z1: 1, x2: size.x - 2, z2: size.z - 2, walk: WALK, height: 2, post: 4, gates: [{ x1: 15, z1: size.z - 2, x2: 19, z2: size.z - 2 }] });
  for (const [x, z] of [[2, 2], [size.x - 3, 2], [2, size.z - 3], [size.x - 3, size.z - 3]]) lampPost(c, x, z, WALK, 2);
  const b = opsBuilding(c, {
    x1: 6, z1: 6, x2: 28, z2: 25, walk: WALK, floorH: 6,
    floors: [[{ u1: 9, u2: 18, type: "comms" }, { u1: 20, u2: 27, type: "servers" }], [{ u1: 9, u2: 27, type: "command" }]],
    roofDeck: true
  });
  // rooftop drum with yellow walkway ring and access stair
  const top = tieredPlinth(c, 17, 15, b.top + 1, [{ r: 6, h: 2, block: c.B.concrete, rail: true, railR: 6 }, { r: 4, h: 2, block: c.B.tile, lights: 8 }]);
  for (let k = 0; k < 64; k++) { const a = (k / 64) * Math.PI * 2; c.set(Math.round(17 + Math.cos(a) * 6), b.top + 2, Math.round(15 + Math.sin(a) * 6), c.B.yellow); }
  c.fill(23, b.top + 1, 15, 24, b.top + 2, 15, c.B.concrete);
  dishOnMount(c, { cx: 17, cz: 15, baseY: top + 1, R: 11, tilt: 45, toward: "south", yaw: -30, rimLight: c.B.yellow });
  // ground plant
  c.fill(30, WALK, 8, 32, WALK + 2, 12, c.B.lightGrey);
  c.set(31, WALK + 1, 12, c.B.bars);
}

export function buildLargeStrategicSatelliteArray(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("large_strategic_satellite_array", dimension, origin, rotation, variantId);
  pad(c, size, c.B.stoneBrick);
  compoundWall(c, { x1: 0, z1: 0, x2: size.x - 1, z2: size.z - 1, walk: WALK, height: 6, step: 5, towers: true, gates: [{ x1: 25, z1: size.z - 1, x2: 31, z2: size.z - 1 }] });
  // gatehouse towers
  for (const x of [22, 32]) { c.fill(x, WALK - 1, size.z - 4, x + 2, WALK + 9, size.z - 1, c.B.blackstoneBricks); c.set(x + 1, WALK + 10, size.z - 3, c.B.froglight); c.fill(x + 1, WALK + 3, size.z - 1, x + 1, WALK + 7, size.z - 1, c.B.sea); }
  // central ops keep
  const b = opsBuilding(c, {
    x1: 16, z1: 14, x2: 40, z2: 40, walk: WALK, floorH: 7,
    floors: [
      [{ u1: 19, u2: 28, type: "servers" }, { u1: 30, u2: 39, type: "generator" }],
      [{ u1: 19, u2: 39, type: "command" }],
      [{ u1: 19, u2: 28, type: "comms" }, { u1: 30, u2: 39, type: "servers" }]
    ],
    roofDeck: true
  });
  // main dish on a tall plinth
  const mainTop = tieredPlinth(c, 28, 27, b.top + 1, [{ r: 8, h: 2, block: c.B.tile, rail: true, railR: 8, lights: 12 }, { r: 5, h: 3, block: c.B.blackstoneBricks, lights: 8 }]);
  dishOnMount(c, { cx: 28, cz: 27, baseY: mainTop + 1, R: 15, tilt: 38, toward: "south", rimLight: c.B.froglight });
  // two auxiliary dish towers
  for (const [tx, yaw] of [[8, 35], [48, -35]]) {
    c.fill(tx - 3, WALK - 1, 22, tx + 3, WALK + 13, 28, c.B.tile);
    c.clear(tx - 2, WALK, 23, tx + 2, WALK + 12, 27);
    c.fill(tx - 2, WALK - 1, 23, tx + 2, WALK - 1, 27, c.B.smooth);
    c.clear(tx, WALK, 28, tx, WALK + 2, 28);
    c.fill(tx - 1, WALK, 23, tx + 1, WALK, 23, c.B.blackstone);
    c.set(tx, WALK + 1, 23, c.B.daylight);
    for (let y = WALK + 3; y <= WALK + 12; y += 3) c.set(tx - 3, y, 25, c.B.sea);
    c.fill(tx - 3, WALK + 13, 22, tx + 3, WALK + 13, 28, c.B.blackstoneBricks);
    dishOnMount(c, { cx: tx, cz: 25, baseY: WALK + 14, R: 7, tilt: 40, toward: "south", yaw });
  }
  // fuel / water cylinders
  for (const [x, z] of [[8, 9], [48, 9], [8, 44], [48, 44]]) { c.cyl(x, z, WALK, WALK + 5, 2, c.B.lightGrey); c.disc(x, z, WALK + 6, 2, c.B.tile); c.set(x, WALK + 7, z, c.B.froglight); }
}

// ---------------------------------------------------------------------------
// Standalone dishes
// ---------------------------------------------------------------------------

export function buildStandaloneSmallSatelliteDish(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("standalone_small_satellite_dish", dimension, origin, rotation, variantId);
  c.fill(1, WALK - 1, 1, size.x - 2, WALK - 1, size.z - 2, c.B.smooth);
  c.walls(1, WALK - 1, 1, size.x - 2, WALK - 1, size.z - 2, c.B.andesite);
  for (const [x, z] of [[2, 2], [size.x - 3, 2], [2, size.z - 3], [size.x - 3, size.z - 3]]) { c.set(x, WALK, z, c.B.blackstoneBricks); c.set(x, WALK + 1, z, c.B.sea); }
  hazardBorder(c, 4, WALK - 1, 4, size.x - 5, size.z - 5);
  // stepped dark pedestal with pipes
  c.fill(5, WALK, 5, 11, WALK + 1, 11, c.B.andesite);
  c.fill(6, WALK + 2, 6, 10, WALK + 4, 10, c.B.tile);
  c.fill(7, WALK + 5, 7, 9, WALK + 7, 9, c.B.blackstoneBricks);
  for (const [x, z] of [[6, 11], [10, 11]]) c.fill(x, WALK, z + 1, x, WALK + 4, z + 1, c.B.basalt);
  // maintenance ladder & railed platform
  c.fill(11, WALK + 5, 7, 13, WALK + 5, 9, c.B.andesite);
  for (const [x, z] of [[13, 7], [13, 8], [13, 9], [12, 7], [12, 9]]) c.set(x, WALK + 6, z, c.B.bars);
  for (let y = WALK; y <= WALK + 5; y++) c.set(12, y, 10, c.ladder("south"));
  c.fill(12, WALK, 11, 12, WALK + 5, 11, c.B.tile);
  dishOnMount(c, { cx: 8, cz: 8, baseY: WALK + 8, R: 6, tilt: 40, toward: "south", yaw: 30 });
}

export function buildStandaloneMediumSatelliteDish(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("standalone_medium_satellite_dish", dimension, origin, rotation, variantId);
  const cx = 14, cz = 14;
  c.disc(cx, cz, WALK - 1, 13, c.B.andesite);
  const top = tieredPlinth(c, cx, cz, WALK, [
    { r: 11, h: 1, block: c.B.stoneBrick },
    { r: 9, h: 4, block: c.B.lightGrey, lights: 10 },
    { r: 9, h: 1, block: c.B.tile, rail: true, railR: 9 }
  ]);
  // yellow handrail tops
  for (let k = 0; k < 64; k++) { const a = (k / 64) * Math.PI * 2; c.set(Math.round(cx + Math.cos(a) * 9), top + 2, Math.round(cz + Math.sin(a) * 9), c.B.yellow); }
  externalStairs(c, cx + 3, cz + 11, "north", WALK, top - WALK + 1, 2);
  c.clear(cx + 3, top + 1, cz + 9, cx + 4, top + 2, cz + 9);
  // access door into the plinth
  c.clear(cx - 1, WALK, cz + 9, cx + 1, WALK + 2, cz + 9);
  c.clear(cx - 1, WALK, cz + 5, cx + 1, WALK + 2, cz + 8);
  c.set(cx, WALK, cz + 5, c.B.blackstone); c.set(cx, WALK + 1, cz + 5, c.B.daylight);
  // central tapered column
  c.fill(cx - 2, top + 1, cz - 2, cx + 2, top + 3, cz + 2, c.B.tile);
  dishOnMount(c, { cx, cz, baseY: top + 4, R: 11, tilt: 42, toward: "south", yaw: 30, rimLight: c.B.tile });
}

export function buildStandaloneLargeSatelliteDish(dimension, origin, rotation, variantId) {
  const { c, size } = ctx("standalone_large_satellite_dish", dimension, origin, rotation, variantId);
  const cx = 19, cz = 19;
  c.disc(cx, cz, WALK - 1, 18, c.B.andesite);
  const top = tieredPlinth(c, cx, cz, WALK, [
    { r: 16, h: 2, block: c.B.stoneBrick, lights: 16 },
    { r: 14, h: 4, block: c.B.lightGrey, rail: true, railR: 15, lights: 12 },
    { r: 10, h: 4, block: c.B.tile, rail: true, railR: 11, lights: 10 },
    { r: 6, h: 3, block: c.B.blackstoneBricks }
  ]);
  externalStairs(c, cx + 5, cz + 17, "north", WALK, 6, 3);
  externalStairs(c, cx - 7, cz + 13, "north", WALK + 6, 4, 2);
  // amber rim lights and A-frame legs
  for (const dx of [-5, 5]) c.line(cx + dx, top, cz + 3, cx + Math.sign(dx), top + 9, cz, c.B.blackstoneBricks);
  dishOnMount(c, { cx, cz, baseY: top + 1, R: 17, tilt: 36, toward: "south", yaw: -20, rimLight: c.B.froglight });
}
