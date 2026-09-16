import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";

const SIZE = { x: 21, y: 10, z: 17 };

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

  // Foundation and floor.
  fill(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 20, y: 0, z: 16 }, B.floor);

  // Main two-storey shell.
  for (let y = 1; y <= 7; y++) {
    for (let x = 0; x <= 20; x++) {
      for (const z of [0, 16]) {
        const frontDoor = z === 16 && (x === 9 || x === 10 || x === 11) && y <= 3;
        const window = y >= 2 && y <= 3 && x % 4 !== 0;
        setLocal(dimension, origin, rotation, x, y, z, frontDoor ? B.air : window ? B.glass : B.wall);
      }
    }
    for (let z = 1; z <= 15; z++) {
      for (const x of [0, 20]) {
        const window = y >= 2 && y <= 3 && z % 4 !== 0;
        setLocal(dimension, origin, rotation, x, y, z, window ? B.glass : B.wall);
      }
    }
  }

  // Structural corners and central facade accents.
  for (const [x, z] of [[0,0],[20,0],[0,16],[20,16]]) {
    fill(dimension, origin, rotation, { x, y: 1, z }, { x, y: 8, z }, B.frame);
  }
  fill(dimension, origin, rotation, { x: 8, y: 1, z: 16 }, { x: 12, y: 1, z: 16 }, B.frame);

  // Second floor slab and roof.
  fill(dimension, origin, rotation, { x: 1, y: 4, z: 1 }, { x: 19, y: 4, z: 15 }, B.floor);
  fill(dimension, origin, rotation, { x: 0, y: 8, z: 0 }, { x: 20, y: 8, z: 16 }, B.accent);

  // Central operations room / command core.
  fill(dimension, origin, rotation, { x: 7, y: 1, z: 5 }, { x: 13, y: 3, z: 10 }, B.camoB);
  fill(dimension, origin, rotation, { x: 8, y: 1, z: 6 }, { x: 12, y: 3, z: 9 }, B.air);
  for (const [x,z] of [[8,6],[12,6],[8,9],[12,9]]) setLocal(dimension, origin, rotation, x, 3, z, B.light);

  // Reception desk and corridor markers.
  fill(dimension, origin, rotation, { x: 8, y: 1, z: 12 }, { x: 12, y: 1, z: 12 }, B.frame);
  for (const x of [4,16]) {
    fill(dimension, origin, rotation, { x, y: 1, z: 3 }, { x, y: 3, z: 13 }, B.camoA);
  }

  // Roof communications mast.
  fill(dimension, origin, rotation, { x: 9, y: 9, z: 7 }, { x: 11, y: 9, z: 9 }, B.frame);
  setLocal(dimension, origin, rotation, 10, 9, 8, B.bars);
}
