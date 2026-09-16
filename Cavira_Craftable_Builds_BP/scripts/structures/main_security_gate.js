import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";

const SIZE = { x: 15, y: 7, z: 5 };

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

  // Road/foundation strip.
  fill(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 14, y: 0, z: 4 }, B.floor);

  // Twin checkpoint buildings.
  for (const [x0, x1] of [[0, 3], [11, 14]]) {
    fill(dimension, origin, rotation, { x: x0, y: 1, z: 0 }, { x: x1, y: 4, z: 4 }, B.wall);
    fill(dimension, origin, rotation, { x: x0, y: 5, z: 0 }, { x: x1, y: 5, z: 4 }, B.accent);
    for (let x = x0 + 1; x <= x1 - 1; x++) {
      setLocal(dimension, origin, rotation, x, 2, 4, B.glass);
      setLocal(dimension, origin, rotation, x, 3, 4, B.glass);
    }
  }

  // Gate pillars and overhead beam.
  fill(dimension, origin, rotation, { x: 4, y: 1, z: 1 }, { x: 5, y: 5, z: 3 }, B.frame);
  fill(dimension, origin, rotation, { x: 9, y: 1, z: 1 }, { x: 10, y: 5, z: 3 }, B.frame);
  fill(dimension, origin, rotation, { x: 4, y: 5, z: 1 }, { x: 10, y: 6, z: 3 }, B.accent);

  // Open vehicle lane with warning stripes/lighting.
  for (const x of [6, 8]) {
    for (let z = 0; z <= 4; z++) setLocal(dimension, origin, rotation, x, 0, z, B.camoA);
  }
  setLocal(dimension, origin, rotation, 5, 5, 2, B.light);
  setLocal(dimension, origin, rotation, 9, 5, 2, B.light);

  // Barriers at the front edge.
  for (const x of [5, 9]) setLocal(dimension, origin, rotation, x, 1, 4, B.bars);
}
