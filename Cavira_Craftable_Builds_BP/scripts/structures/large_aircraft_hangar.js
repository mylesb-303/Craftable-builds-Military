import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";

const SIZE = { x: 31, y: 18, z: 25 };
const FLOOR_Y = 1;
const CENTER_X = 15;
const ROOF_RADIUS = 15;
const WALL_TOP = 9;
const ROOF_RISE = 7;

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

function roofHeight(x) {
  const dx = Math.abs(x - CENTER_X);
  const curve = Math.sqrt(Math.max(0, 1 - (dx * dx) / (ROOF_RADIUS * ROOF_RADIUS)));
  return WALL_TOP + Math.round(curve * ROOF_RISE);
}

export function buildLargeAircraftHangar(dimension, origin, rotation, variantId) {
  const p = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(p)) B[key] = BlockPermutation.resolve(id);
  B.desk = BlockPermutation.resolve("minecraft:smooth_stone");
  B.monitor = BlockPermutation.resolve("minecraft:black_concrete");
  B.barrel = BlockPermutation.resolve("minecraft:barrel");
  B.workbench = BlockPermutation.resolve("minecraft:crafting_table");
  B.tool = BlockPermutation.resolve("minecraft:iron_block");

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

  // Curved roof shell. The front remains completely unobstructed below the arch.
  for (let x = 0; x <= 30; x++) {
    const y = roofHeight(x);
    for (let z = 0; z <= 24; z++) {
      setLocal(dimension, origin, rotation, x, y, z, x === 0 || x === 30 ? B.frame : B.accent);
    }
    // Second layer at the crown/shoulders for a heavier military roof profile.
    if (x >= 3 && x <= 27) {
      for (let z = 1; z <= 23; z++) setLocal(dimension, origin, rotation, x, y + 1, z, B.camoB);
    }
  }

  // Front-edge side jambs only — no columns across the aircraft opening.
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

  // Rear left workshop.
  fill(dimension, origin, rotation, { x: 2, y: 2, z: 2 }, { x: 6, y: 2, z: 4 }, B.desk);
  for (const z of [2,4,6]) {
    setLocal(dimension, origin, rotation, 2, 2, z, B.workbench);
    setLocal(dimension, origin, rotation, 4, 2, z, B.barrel);
    setLocal(dimension, origin, rotation, 6, 2, z, B.tool);
  }

  // Rear right flightline office / stores.
  fill(dimension, origin, rotation, { x: 24, y: 2, z: 2 }, { x: 28, y: 2, z: 3 }, B.desk);
  setLocal(dimension, origin, rotation, 25, 3, 2, B.monitor);
  setLocal(dimension, origin, rotation, 27, 3, 2, B.monitor);
  for (const z of [4,6]) {
    setLocal(dimension, origin, rotation, 25, 2, z, B.barrel);
    setLocal(dimension, origin, rotation, 28, 2, z, B.barrel);
  }

  // Tool islands kept close to the side walls so the centre aircraft path stays clear.
  for (const z of [9,14,19]) {
    setLocal(dimension, origin, rotation, 3, 2, z, B.tool);
    setLocal(dimension, origin, rotation, 27, 2, z, B.tool);
  }

  // Suspended lighting follows the curved roof and keeps the entire hangar usable at night.
  for (const x of [5,10,15,20,25]) {
    const lightY = Math.max(WALL_TOP, roofHeight(x) - 2);
    for (const z of [5,11,17,22]) setLocal(dimension, origin, rotation, x, lightY, z, B.light);
  }
}
