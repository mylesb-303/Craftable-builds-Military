import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";

const SIZE = { x: 15, y: 8, z: 5 };
const FLOOR_Y = 1;

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

export function buildMainSecurityGate(dimension, origin, rotation, variantId) {
  const p = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(p)) B[key] = BlockPermutation.resolve(id);
  B.barrel = BlockPermutation.resolve("minecraft:barrel");
  B.desk = BlockPermutation.resolve("minecraft:smooth_stone");
  B.monitor = BlockPermutation.resolve("minecraft:black_concrete");

  // Buried strip foundation and finished roadway/floor.
  fill(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 14, y: 0, z: 4 }, B.frame);
  fill(dimension, origin, rotation, { x: 0, y: FLOOR_Y, z: 0 }, { x: 14, y: FLOOR_Y, z: 4 }, B.floor);

  // Twin checkpoint buildings with open interiors.
  for (const [x0, x1] of [[0, 3], [11, 14]]) {
    for (let y = 2; y <= 5; y++) {
      for (let x = x0; x <= x1; x++) {
        setLocal(dimension, origin, rotation, x, y, 0, y >= 3 && y <= 4 && x > x0 && x < x1 ? B.glass : B.wall);
        setLocal(dimension, origin, rotation, x, y, 4, y >= 3 && y <= 4 && x > x0 && x < x1 ? B.glass : B.wall);
      }
      for (let z = 1; z <= 3; z++) {
        setLocal(dimension, origin, rotation, x0, y, z, y >= 3 && y <= 4 ? B.glass : B.wall);
        setLocal(dimension, origin, rotation, x1, y, z, y >= 3 && y <= 4 ? B.glass : B.wall);
      }
    }
    fill(dimension, origin, rotation, { x: x0, y: 6, z: 0 }, { x: x1, y: 6, z: 4 }, B.accent);

    // Staffed booth interior.
    const innerX = x0 === 0 ? 2 : 12;
    fill(dimension, origin, rotation, { x: innerX, y: 2, z: 1 }, { x: innerX, y: 2, z: 2 }, B.desk);
    setLocal(dimension, origin, rotation, innerX, 3, 1, B.monitor);
    setLocal(dimension, origin, rotation, x0 === 0 ? 1 : 13, 2, 3, B.barrel);
    setLocal(dimension, origin, rotation, x0 === 0 ? 1 : 13, 5, 2, B.light);
  }

  // Gate pillars and overhead gantry.
  fill(dimension, origin, rotation, { x: 4, y: 2, z: 1 }, { x: 5, y: 6, z: 3 }, B.frame);
  fill(dimension, origin, rotation, { x: 9, y: 2, z: 1 }, { x: 10, y: 6, z: 3 }, B.frame);
  fill(dimension, origin, rotation, { x: 4, y: 6, z: 1 }, { x: 10, y: 7, z: 3 }, B.accent);

  // Open vehicle lane markings and illumination.
  for (const x of [6, 8]) {
    for (let z = 0; z <= 4; z++) setLocal(dimension, origin, rotation, x, FLOOR_Y, z, B.camoA);
  }
  for (const x of [5, 9]) {
    setLocal(dimension, origin, rotation, x, 6, 2, B.light);
    setLocal(dimension, origin, rotation, x, 2, 4, B.bars);
  }
}
