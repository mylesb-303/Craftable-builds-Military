import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";

const SIZE = { x: 21, y: 11, z: 17 };
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

export function buildBaseHeadquarters(dimension, origin, rotation, variantId) {
  const p = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(p)) B[key] = BlockPermutation.resolve(id);
  B.desk = BlockPermutation.resolve("minecraft:smooth_stone");
  B.monitor = BlockPermutation.resolve("minecraft:black_concrete");
  B.bookshelf = BlockPermutation.resolve("minecraft:bookshelf");
  B.barrel = BlockPermutation.resolve("minecraft:barrel");
  B.server = BlockPermutation.resolve("minecraft:iron_block");

  // Two-block-deep integrated foundation with finished ground floor.
  fill(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 20, y: 0, z: 16 }, B.frame);
  fill(dimension, origin, rotation, { x: 0, y: FLOOR_Y, z: 0 }, { x: 20, y: FLOOR_Y, z: 16 }, B.floor);

  // Exterior shell.
  for (let y = 2; y <= 8; y++) {
    for (let x = 0; x <= 20; x++) {
      for (const z of [0, 16]) {
        const frontDoor = z === 16 && x >= 9 && x <= 11 && y <= 4;
        const window = ((y >= 3 && y <= 4) || (y >= 6 && y <= 7)) && x % 4 !== 0;
        setLocal(dimension, origin, rotation, x, y, z, frontDoor ? B.air : window ? B.glass : B.wall);
      }
    }
    for (let z = 1; z <= 15; z++) {
      for (const x of [0, 20]) {
        const window = ((y >= 3 && y <= 4) || (y >= 6 && y <= 7)) && z % 4 !== 0;
        setLocal(dimension, origin, rotation, x, y, z, window ? B.glass : B.wall);
      }
    }
  }

  for (const [x, z] of [[0,0],[20,0],[0,16],[20,16]]) {
    fill(dimension, origin, rotation, { x, y: 2, z }, { x, y: 9, z }, B.frame);
  }

  // Second floor and roof.
  fill(dimension, origin, rotation, { x: 1, y: 5, z: 1 }, { x: 19, y: 5, z: 15 }, B.floor);
  fill(dimension, origin, rotation, { x: 0, y: 9, z: 0 }, { x: 20, y: 9, z: 16 }, B.accent);

  // Ground-floor corridor spine.
  for (let z = 2; z <= 14; z++) {
    setLocal(dimension, origin, rotation, 9, 2, z, B.camoA);
    setLocal(dimension, origin, rotation, 11, 2, z, B.camoA);
  }

  // Reception area at entrance.
  fill(dimension, origin, rotation, { x: 7, y: 2, z: 12 }, { x: 13, y: 2, z: 12 }, B.desk);
  setLocal(dimension, origin, rotation, 9, 3, 12, B.monitor);
  setLocal(dimension, origin, rotation, 11, 3, 12, B.monitor);

  // Briefing room, left front.
  fill(dimension, origin, rotation, { x: 2, y: 2, z: 9 }, { x: 6, y: 2, z: 9 }, B.desk);
  fill(dimension, origin, rotation, { x: 2, y: 2, z: 11 }, { x: 6, y: 2, z: 11 }, B.desk);
  setLocal(dimension, origin, rotation, 4, 3, 8, B.monitor);

  // Operations room / situation centre.
  fill(dimension, origin, rotation, { x: 6, y: 2, z: 4 }, { x: 14, y: 2, z: 4 }, B.desk);
  fill(dimension, origin, rotation, { x: 7, y: 2, z: 6 }, { x: 13, y: 2, z: 6 }, B.desk);
  for (const x of [7,10,13]) setLocal(dimension, origin, rotation, x, 3, 3, B.monitor);

  // Communications/server room, rear right.
  for (const x of [15,17,19]) {
    for (const z of [2,4,6]) setLocal(dimension, origin, rotation, x, 2, z, B.server);
  }

  // Stores/reference room, rear left.
  for (const z of [2,4,6]) {
    setLocal(dimension, origin, rotation, 2, 2, z, B.bookshelf);
    setLocal(dimension, origin, rotation, 4, 2, z, B.barrel);
  }

  // Upper-floor office banks and command office.
  for (const x of [3,7,13,17]) {
    fill(dimension, origin, rotation, { x, y: 6, z: 3 }, { x: x + 1, y: 6, z: 5 }, B.desk);
    setLocal(dimension, origin, rotation, x, 7, 3, B.monitor);
  }
  fill(dimension, origin, rotation, { x: 8, y: 6, z: 11 }, { x: 12, y: 6, z: 12 }, B.desk);
  setLocal(dimension, origin, rotation, 10, 7, 11, B.monitor);

  // Lighting grid on both levels.
  for (const y of [4,8]) {
    for (const x of [3,7,10,13,17]) {
      for (const z of [3,8,13]) setLocal(dimension, origin, rotation, x, y, z, B.light);
    }
  }

  // Rooftop communications mast.
  fill(dimension, origin, rotation, { x: 9, y: 10, z: 7 }, { x: 11, y: 10, z: 9 }, B.frame);
  setLocal(dimension, origin, rotation, 10, 10, 8, B.bars);
}
