import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";
import { getInteriorBlocks } from "../interior_blocks.js";

const SIZE = { x: 31, y: 18, z: 25 };
const FLOOR_Y = 1;
const CENTER_X = 15;
const ROOF_RADIUS = 15;
const WALL_TOP = 10;
const ROOF_RISE = 6;

function setLocal(dimension, origin, rotation, x, y, z, permutation) {
  const loc = toWorldLocation(origin, { x, y, z }, SIZE, rotation);
  dimension.getBlock(loc)?.setPermutation(permutation);
}

function fill(dimension, origin, rotation, from, to, permutation) {
  for (let x = from.x; x <= to.x; x++) {
    for (let y = from.y; y <= to.y; y++) {
      for (let z = from.z; z <= to.z; z++) setLocal(dimension, origin, rotation, x, y, z, permutation);
    }
  }
}


function rotateDirection(localDirection, rotation) {
  const vectors = {
    north: { x: 0, z: -1 },
    south: { x: 0, z: 1 },
    east: { x: 1, z: 0 },
    west: { x: -1, z: 0 }
  };
  const v = vectors[localDirection];
  let out = v;
  if (rotation === "west") out = { x: -v.z, z: v.x };
  else if (rotation === "north") out = { x: -v.x, z: -v.z };
  else if (rotation === "east") out = { x: v.z, z: -v.x };

  if (out.x === 1) return "east";
  if (out.x === -1) return "west";
  if (out.z === 1) return "south";
  return "north";
}

function stairPermutation(rotation, localDirection = "north") {
  const direction = rotateDirection(localDirection, rotation);
  const values = { east: 0, west: 1, south: 2, north: 3 };
  return BlockPermutation.resolve("minecraft:polished_andesite_stairs", {
    upside_down_bit: false,
    weirdo_direction: values[direction]
  });
}

function roofHeight(x) {
  const dx = Math.abs(x - CENTER_X);
  const curve = Math.sqrt(Math.max(0, 1 - (dx * dx) / (ROOF_RADIUS * ROOF_RADIUS)));
  return WALL_TOP + Math.round(curve * ROOF_RISE);
}

export function buildLargeAircraftHangar(dimension, origin, rotation, variantId) {
  const p = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(p)) B[key] = BlockPermutation.resolve(id);
  const I = getInteriorBlocks();
  const STAIR = stairPermutation(rotation, "north");

  // Integrated foundation and aircraft-rated floor.
  fill(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 30, y: 0, z: 24 }, B.frame);
  fill(dimension, origin, rotation, { x: 0, y: FLOOR_Y, z: 0 }, { x: 30, y: FLOOR_Y, z: 24 }, B.floor);

  // Side walls with structural bays and windows.
  for (let y = 2; y <= WALL_TOP; y++) {
    for (let z = 0; z <= 24; z++) {
      const windowBand = y >= 5 && y <= 7 && z % 6 >= 1 && z % 6 <= 4;
      setLocal(dimension, origin, rotation, 0, y, z, windowBand ? B.glass : (z % 6 === 0 ? B.frame : B.wall));
      setLocal(dimension, origin, rotation, 30, y, z, windowBand ? B.glass : (z % 6 === 0 ? B.frame : B.wall));
    }
  }

  // Rear wall with high glazing and structural ribs.
  for (let y = 2; y <= WALL_TOP; y++) {
    for (let x = 1; x < 30; x++) {
      const windowBand = y >= 5 && y <= 7 && x % 5 !== 0;
      setLocal(dimension, origin, rotation, x, y, 0, windowBand ? B.glass : (x % 5 === 0 ? B.frame : B.wall));
    }
  }

  // Curved roof shell connected cleanly into side and rear walls.
  for (let x = 0; x <= 30; x++) {
    const y = roofHeight(x);
    for (let z = 0; z <= 24; z++) {
      setLocal(dimension, origin, rotation, x, y, z, x === 0 || x === 30 ? B.frame : B.accent);
    }
    if (x >= 1 && x <= 29) {
      for (let z = 0; z <= 24; z++) setLocal(dimension, origin, rotation, x, y + 1, z, B.camoB);
    }
    for (let fillY = WALL_TOP + 1; fillY < y; fillY++) {
      setLocal(dimension, origin, rotation, x, fillY, 0, x % 5 === 0 ? B.frame : B.wall);
    }
    setLocal(dimension, origin, rotation, x, y, 24, x === 0 || x === 30 ? B.frame : B.accent);
    if (x >= 1 && x <= 29) setLocal(dimension, origin, rotation, x, y + 1, 24, B.camoB);
  }
  for (let z = 0; z <= 24; z++) {
    setLocal(dimension, origin, rotation, 0, WALL_TOP + 1, z, B.frame);
    setLocal(dimension, origin, rotation, 30, WALL_TOP + 1, z, B.frame);
  }

  // Front-edge side jambs only — the aircraft opening stays completely clear.
  fill(dimension, origin, rotation, { x: 0, y: 2, z: 24 }, { x: 0, y: WALL_TOP, z: 24 }, B.frame);
  fill(dimension, origin, rotation, { x: 30, y: 2, z: 24 }, { x: 30, y: WALL_TOP, z: 24 }, B.frame);

  // Flightline centreline and maintenance lane markings.
  for (let z = 2; z <= 24; z++) {
    setLocal(dimension, origin, rotation, 15, FLOOR_Y, z, B.camoA);
    if (z % 4 === 0) {
      setLocal(dimension, origin, rotation, 7, FLOOR_Y, z, B.camoA);
      setLocal(dimension, origin, rotation, 23, FLOOR_Y, z, B.camoA);
    }
  }

  // Rear-left maintenance zone: equipment is pushed against the wall, keeping aircraft space clear.
  for (const z of [2, 4, 6, 8]) {
    setLocal(dimension, origin, rotation, 2, 2, z, I.workbench);
    setLocal(dimension, origin, rotation, 3, 2, z, I.storage);
    setLocal(dimension, origin, rotation, 4, 2, z, z % 4 === 0 ? I.machine : I.equipment);
  }
  fill(dimension, origin, rotation, { x: 5, y: 2, z: 2 }, { x: 7, y: 2, z: 2 }, I.counter);
  setLocal(dimension, origin, rotation, 6, 3, 2, I.keyboard);
  setLocal(dimension, origin, rotation, 6, 3, 1, I.monitor);

  // Rear-right enclosed maintenance/control room.
  fill(dimension, origin, rotation, { x: 23, y: 2, z: 1 }, { x: 29, y: 5, z: 1 }, B.wall);
  fill(dimension, origin, rotation, { x: 29, y: 2, z: 1 }, { x: 29, y: 5, z: 8 }, B.wall);
  fill(dimension, origin, rotation, { x: 23, y: 2, z: 8 }, { x: 29, y: 5, z: 8 }, B.wall);
  for (let y = 2; y <= 5; y++) {
    for (let z = 2; z <= 7; z++) {
      const doorway = z === 7 && (y === 2 || y === 3);
      const window = z >= 2 && z <= 5 && (y === 3 || y === 4);
      setLocal(dimension, origin, rotation, 23, y, z, doorway ? B.air : window ? B.glass : B.wall);
    }
  }

  // Keep a completely clear two-block-high approach into the control room.
  fill(dimension, origin, rotation, { x: 22, y: 2, z: 7 }, { x: 23, y: 4, z: 7 }, B.air);

  // Control-room furniture.
  fill(dimension, origin, rotation, { x: 25, y: 2, z: 3 }, { x: 28, y: 2, z: 3 }, I.counter);
  for (const x of [25, 27]) {
    setLocal(dimension, origin, rotation, x, 3, 3, I.keyboard);
    setLocal(dimension, origin, rotation, x, 3, 2, I.monitor);
  }
  setLocal(dimension, origin, rotation, 28, 2, 6, I.filing);
  setLocal(dimension, origin, rotation, 26, 2, 6, I.storage);
  setLocal(dimension, origin, rotation, 24, 5, 4, B.light);
  setLocal(dimension, origin, rotation, 28, 5, 4, B.light);

  // Room roof doubles as an observation terrace over the aircraft bay.
  fill(dimension, origin, rotation, { x: 23, y: 6, z: 1 }, { x: 29, y: 6, z: 8 }, B.floor);
  for (let z = 1; z <= 8; z++) {
    setLocal(dimension, origin, rotation, 23, 7, z, I.rail);
    setLocal(dimension, origin, rotation, 29, 7, z, I.rail);
  }
  for (let x = 24; x <= 28; x++) {
    setLocal(dimension, origin, rotation, x, 7, 1, I.rail);
    // Leave a two-block opening on the front-right terrace edge.
    if (x < 27) setLocal(dimension, origin, rotation, x, 7, 8, I.rail);
  }

  // Complete wall-side stair run. Two consecutive vanilla stair treads per block
  // of rise create a continuous slope while keeping the aircraft bay open.
  const stairRun = [
    { y: 2, z: 16 }, { y: 2, z: 15 },
    { y: 3, z: 14 }, { y: 3, z: 13 },
    { y: 4, z: 12 }, { y: 4, z: 11 },
    { y: 5, z: 10 }, { y: 5, z: 9 },
    { y: 6, z: 8 },  { y: 6, z: 7 }
  ];
  for (const step of stairRun) {
    for (let x = 28; x <= 29; x++) {
      for (let sy = 2; sy < step.y; sy++) setLocal(dimension, origin, rotation, x, sy, step.z, B.frame);
      setLocal(dimension, origin, rotation, x, step.y, step.z, STAIR);
    }
  }

  // Small landing directly into the terrace opening.
  fill(dimension, origin, rotation, { x: 27, y: 6, z: 6 }, { x: 29, y: 6, z: 8 }, B.floor);

  // Clear continuous headroom above the full wall-side run.
  fill(dimension, origin, rotation, { x: 28, y: 3, z: 15 }, { x: 29, y: 7, z: 16 }, B.air);
  fill(dimension, origin, rotation, { x: 28, y: 4, z: 13 }, { x: 29, y: 7, z: 14 }, B.air);
  fill(dimension, origin, rotation, { x: 28, y: 5, z: 11 }, { x: 29, y: 8, z: 12 }, B.air);
  fill(dimension, origin, rotation, { x: 28, y: 6, z: 9 }, { x: 29, y: 8, z: 10 }, B.air);

  // Rail only the exposed bay-side edge; the wall itself protects the outside edge.
  for (const step of stairRun) {
    setLocal(dimension, origin, rotation, 27, step.y + 1, step.z, I.rail);
  }

  // Recessed roof lighting — flush with the curved ceiling.
  for (const x of [5, 10, 15, 20, 25]) {
    const lightY = roofHeight(x);
    for (const z of [5, 11, 17, 22]) setLocal(dimension, origin, rotation, x, lightY, z, B.light);
  }

  // Floor-level service lighting keeps the bay bright in Night Ops and other dark palettes.
  for (const x of [6, 12, 18, 24]) {
    for (const z of [6, 12, 18, 22]) {
      if (x >= 23 && z <= 8) continue;
      setLocal(dimension, origin, rotation, x, FLOOR_Y, z, B.light);
    }
  }
}
