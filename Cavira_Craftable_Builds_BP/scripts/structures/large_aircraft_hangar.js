import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";

const SIZE = { x: 31, y: 13, z: 25 };

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

export function buildLargeAircraftHangar(dimension, origin, rotation, variantId) {
  const p = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(p)) B[key] = BlockPermutation.resolve(id);

  // Full slab / apron.
  fill(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 30, y: 0, z: 24 }, B.floor);

  // Side and rear walls.
  for (let y = 1; y <= 9; y++) {
    for (let z = 0; z <= 24; z++) {
      setLocal(dimension, origin, rotation, 0, y, z, (z % 6 === 0 && y >= 3 && y <= 5) ? B.glass : B.wall);
      setLocal(dimension, origin, rotation, 30, y, z, (z % 6 === 0 && y >= 3 && y <= 5) ? B.glass : B.wall);
    }
    for (let x = 1; x < 30; x++) {
      setLocal(dimension, origin, rotation, x, y, 0, (x % 5 !== 0 && y >= 4 && y <= 6) ? B.glass : B.wall);
    }
  }

  // Front facade with very wide open hangar door.
  for (let y = 1; y <= 10; y++) {
    for (let x = 0; x <= 30; x++) {
      const openDoor = x >= 4 && x <= 26 && y <= 8;
      const edge = x <= 3 || x >= 27;
      setLocal(dimension, origin, rotation, x, y, 24, openDoor ? B.air : edge ? B.frame : B.accent);
    }
  }

  // Heavy structural ribs.
  for (const x of [0, 5, 10, 15, 20, 25, 30]) {
    for (let y = 1; y <= 10; y++) {
      setLocal(dimension, origin, rotation, x, y, 0, B.frame);
      setLocal(dimension, origin, rotation, x, y, 24, B.frame);
    }
  }
  for (const z of [0, 6, 12, 18, 24]) {
    fill(dimension, origin, rotation, { x: 0, y: 1, z }, { x: 0, y: 10, z }, B.frame);
    fill(dimension, origin, rotation, { x: 30, y: 1, z }, { x: 30, y: 10, z }, B.frame);
  }

  // Stepped shallow roof, giving the hangar a broad military-industrial silhouette.
  fill(dimension, origin, rotation, { x: 0, y: 10, z: 0 }, { x: 30, y: 10, z: 24 }, B.accent);
  fill(dimension, origin, rotation, { x: 3, y: 11, z: 1 }, { x: 27, y: 11, z: 23 }, B.accent);
  fill(dimension, origin, rotation, { x: 8, y: 12, z: 2 }, { x: 22, y: 12, z: 22 }, B.camoB);

  // Interior maintenance lanes and centreline.
  for (let z = 2; z <= 22; z++) {
    setLocal(dimension, origin, rotation, 15, 0, z, B.camoA);
    if (z % 4 === 0) {
      setLocal(dimension, origin, rotation, 7, 0, z, B.camoA);
      setLocal(dimension, origin, rotation, 23, 0, z, B.camoA);
    }
  }

  // Ceiling lights beneath the main roof level.
  for (const x of [6, 12, 18, 24]) {
    for (const z of [5, 11, 17]) setLocal(dimension, origin, rotation, x, 9, z, B.light);
  }

  // Rear service bays / equipment blocks.
  fill(dimension, origin, rotation, { x: 2, y: 1, z: 2 }, { x: 6, y: 3, z: 5 }, B.camoB);
  fill(dimension, origin, rotation, { x: 24, y: 1, z: 2 }, { x: 28, y: 3, z: 5 }, B.camoB);
}
