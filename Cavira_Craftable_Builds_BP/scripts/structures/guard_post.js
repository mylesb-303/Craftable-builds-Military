import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";

const SIZE = { x: 8, y: 8, z: 8 };

function getBlocks() {
  return {
    floor: BlockPermutation.resolve("minecraft:smooth_stone"),
    frame: BlockPermutation.resolve("minecraft:polished_andesite"),
    wall: BlockPermutation.resolve("minecraft:light_gray_concrete"),
    accent: BlockPermutation.resolve("minecraft:gray_concrete"),
    glass: BlockPermutation.resolve("minecraft:tinted_glass"),
    light: BlockPermutation.resolve("minecraft:sea_lantern"),
    bars: BlockPermutation.resolve("minecraft:iron_bars"),
    air: BlockPermutation.resolve("minecraft:air")
  };
}

function setLocal(dimension, origin, rotation, x, y, z, permutation) {
  const location = toWorldLocation(
    origin,
    { x, y, z },
    SIZE,
    rotation
  );
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

export function buildGuardPost(dimension, origin, rotation) {
  // Block permutations are resolved only when the player actually confirms a build.
  // Native BlockPermutation functions cannot be called during module early execution.
  const BLOCKS = getBlocks();

  // Foundation.
  fillLocal(
    dimension,
    origin,
    rotation,
    { x: 0, y: 0, z: 0 },
    { x: 7, y: 0, z: 7 },
    BLOCKS.floor
  );

  // Corner frame.
  const corners = [
    [0, 0], [7, 0], [0, 7], [7, 7]
  ];
  for (const [x, z] of corners) {
    fillLocal(
      dimension,
      origin,
      rotation,
      { x, y: 1, z },
      { x, y: 5, z },
      BLOCKS.frame
    );
  }

  // Side and rear walls.
  for (let y = 1; y <= 4; y++) {
    for (let x = 1; x <= 6; x++) {
      setLocal(dimension, origin, rotation, x, y, 0, y === 2 || y === 3 ? BLOCKS.glass : BLOCKS.wall);
    }

    for (let z = 1; z <= 6; z++) {
      setLocal(dimension, origin, rotation, 0, y, z, y === 2 || y === 3 ? BLOCKS.glass : BLOCKS.wall);
      setLocal(dimension, origin, rotation, 7, y, z, y === 2 || y === 3 ? BLOCKS.glass : BLOCKS.wall);
    }
  }

  // Front wall with a two-block-wide entrance facing local south.
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
        doorway ? BLOCKS.air : upperGlass ? BLOCKS.glass : BLOCKS.wall
      );
    }
  }

  // Roof and darker fascia.
  fillLocal(
    dimension,
    origin,
    rotation,
    { x: 0, y: 5, z: 0 },
    { x: 7, y: 5, z: 7 },
    BLOCKS.accent
  );

  // Interior desk / equipment counter.
  for (let x = 2; x <= 5; x++) {
    setLocal(dimension, origin, rotation, x, 1, 3, BLOCKS.frame);
  }

  // Ceiling lighting.
  for (const [x, z] of [[2, 2], [5, 2], [2, 5], [5, 5]]) {
    setLocal(dimension, origin, rotation, x, 4, z, BLOCKS.light);
  }

  // Roof antenna / observation detail.
  fillLocal(
    dimension,
    origin,
    rotation,
    { x: 3, y: 6, z: 3 },
    { x: 4, y: 6, z: 4 },
    BLOCKS.frame
  );
  setLocal(dimension, origin, rotation, 3, 7, 3, BLOCKS.bars);
  setLocal(dimension, origin, rotation, 4, 7, 4, BLOCKS.bars);
}
