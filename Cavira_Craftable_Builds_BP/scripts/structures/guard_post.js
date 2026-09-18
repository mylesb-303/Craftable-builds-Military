import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";

const SIZE = { x: 8, y: 9, z: 8 };
const FLOOR_Y = 1;

function getBlocks(variantId) {
  const palette = getPalette(variantId);
  const resolved = {};
  for (const [key, blockId] of Object.entries(palette)) resolved[key] = BlockPermutation.resolve(blockId);
  resolved.barrel = BlockPermutation.resolve("minecraft:barrel");
  resolved.bookshelf = BlockPermutation.resolve("minecraft:bookshelf");
  resolved.desk = BlockPermutation.resolve("minecraft:smooth_stone");
  resolved.monitor = BlockPermutation.resolve("minecraft:black_concrete");
  return resolved;
}

function camoBlock(blocks, x, y, z) {
  const hash = Math.abs((x * 31 + y * 17 + z * 13) % 11);
  if (hash === 0 || hash === 5) return blocks.camoA;
  if (hash === 8) return blocks.camoB;
  return blocks.wall;
}

function setLocal(dimension, origin, rotation, x, y, z, permutation) {
  const location = toWorldLocation(origin, { x, y, z }, SIZE, rotation);
  dimension.getBlock(location)?.setPermutation(permutation);
}

function fillLocal(dimension, origin, rotation, from, to, permutation) {
  for (let x = from.x; x <= to.x; x++) {
    for (let y = from.y; y <= to.y; y++) {
      for (let z = from.z; z <= to.z; z++) setLocal(dimension, origin, rotation, x, y, z, permutation);
    }
  }
}

export function buildGuardPost(dimension, origin, rotation, variantId = "standard") {
  const B = getBlocks(variantId);

  // Buried foundation and finished floor.
  fillLocal(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 7, y: 0, z: 7 }, B.frame);
  fillLocal(dimension, origin, rotation, { x: 0, y: FLOOR_Y, z: 0 }, { x: 7, y: FLOOR_Y, z: 7 }, B.floor);

  // Structural shell.
  for (const [x, z] of [[0,0],[7,0],[0,7],[7,7]]) {
    fillLocal(dimension, origin, rotation, { x, y: 2, z }, { x, y: 6, z }, B.frame);
  }

  for (let y = 2; y <= 5; y++) {
    for (let x = 1; x <= 6; x++) {
      const rearWindow = y === 3 || y === 4;
      setLocal(dimension, origin, rotation, x, y, 0, rearWindow ? B.glass : camoBlock(B, x, y, 0));
    }
    for (let z = 1; z <= 6; z++) {
      const sideWindow = y === 3 || y === 4;
      setLocal(dimension, origin, rotation, 0, y, z, sideWindow ? B.glass : camoBlock(B, 0, y, z));
      setLocal(dimension, origin, rotation, 7, y, z, sideWindow ? B.glass : camoBlock(B, 7, y, z));
    }
    for (let x = 1; x <= 6; x++) {
      const doorway = (x === 3 || x === 4) && (y === 2 || y === 3);
      const frontWindow = y === 4 && x >= 2 && x <= 5;
      setLocal(dimension, origin, rotation, x, y, 7, doorway ? B.air : frontWindow ? B.glass : camoBlock(B, x, y, 7));
    }
  }

  // Roof and communications detail.
  fillLocal(dimension, origin, rotation, { x: 0, y: 6, z: 0 }, { x: 7, y: 6, z: 7 }, B.accent);
  fillLocal(dimension, origin, rotation, { x: 3, y: 7, z: 3 }, { x: 4, y: 7, z: 4 }, B.frame);
  setLocal(dimension, origin, rotation, 3, 8, 3, B.bars);
  setLocal(dimension, origin, rotation, 4, 8, 4, B.bars);

  // Furnished duty interior: counter, monitors, storage and reference shelf.
  fillLocal(dimension, origin, rotation, { x: 2, y: 2, z: 2 }, { x: 5, y: 2, z: 2 }, B.desk);
  setLocal(dimension, origin, rotation, 2, 3, 2, B.monitor);
  setLocal(dimension, origin, rotation, 5, 3, 2, B.monitor);
  setLocal(dimension, origin, rotation, 1, 2, 5, B.barrel);
  setLocal(dimension, origin, rotation, 6, 2, 5, B.barrel);
  setLocal(dimension, origin, rotation, 1, 2, 1, B.bookshelf);
  setLocal(dimension, origin, rotation, 6, 2, 1, B.bookshelf);

  // Ceiling lighting.
  for (const [x, z] of [[2,2],[5,2],[2,5],[5,5]]) setLocal(dimension, origin, rotation, x, 5, z, B.light);
}
