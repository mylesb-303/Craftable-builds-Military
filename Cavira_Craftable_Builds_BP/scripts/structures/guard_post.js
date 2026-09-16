import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";

const SIZE = { x: 8, y: 8, z: 8 };

function getBlocks(variantId) {
  const palette = getPalette(variantId);
  const resolved = {};
  for (const [key, blockId] of Object.entries(palette)) {
    resolved[key] = BlockPermutation.resolve(blockId);
  }
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
      for (let z = from.z; z <= to.z; z++) {
        setLocal(dimension, origin, rotation, x, y, z, permutation);
      }
    }
  }
}

export function buildGuardPost(dimension, origin, rotation, variantId = "standard") {
  const BLOCKS = getBlocks(variantId);

  fillLocal(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 7, y: 0, z: 7 }, BLOCKS.floor);

  const corners = [[0, 0], [7, 0], [0, 7], [7, 7]];
  for (const [x, z] of corners) {
    fillLocal(dimension, origin, rotation, { x, y: 1, z }, { x, y: 5, z }, BLOCKS.frame);
  }

  for (let y = 1; y <= 4; y++) {
    for (let x = 1; x <= 6; x++) {
      const block = y === 2 || y === 3 ? BLOCKS.glass : camoBlock(BLOCKS, x, y, 0);
      setLocal(dimension, origin, rotation, x, y, 0, block);
    }

    for (let z = 1; z <= 6; z++) {
      const sideBlockA = y === 2 || y === 3 ? BLOCKS.glass : camoBlock(BLOCKS, 0, y, z);
      const sideBlockB = y === 2 || y === 3 ? BLOCKS.glass : camoBlock(BLOCKS, 7, y, z);
      setLocal(dimension, origin, rotation, 0, y, z, sideBlockA);
      setLocal(dimension, origin, rotation, 7, y, z, sideBlockB);
    }
  }

  for (let y = 1; y <= 4; y++) {
    for (let x = 1; x <= 6; x++) {
      const doorway = (x === 3 || x === 4) && (y === 1 || y === 2);
      const upperGlass = y === 3 && x >= 2 && x <= 5;
      setLocal(
        dimension,
        origin,
        rotation,
        x,
        y,
        7,
        doorway ? BLOCKS.air : upperGlass ? BLOCKS.glass : camoBlock(BLOCKS, x, y, 7)
      );
    }
  }

  fillLocal(dimension, origin, rotation, { x: 0, y: 5, z: 0 }, { x: 7, y: 5, z: 7 }, BLOCKS.accent);

  for (let x = 2; x <= 5; x++) {
    setLocal(dimension, origin, rotation, x, 1, 3, BLOCKS.frame);
  }

  for (const [x, z] of [[2, 2], [5, 2], [2, 5], [5, 5]]) {
    setLocal(dimension, origin, rotation, x, 4, z, BLOCKS.light);
  }

  fillLocal(dimension, origin, rotation, { x: 3, y: 6, z: 3 }, { x: 4, y: 6, z: 4 }, BLOCKS.frame);
  setLocal(dimension, origin, rotation, 3, 7, 3, BLOCKS.bars);
  setLocal(dimension, origin, rotation, 4, 7, 4, BLOCKS.bars);
}
