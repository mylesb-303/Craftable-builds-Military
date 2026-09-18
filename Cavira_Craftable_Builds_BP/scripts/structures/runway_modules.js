import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";

function perms(variantId) {
  const p = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(p)) B[key] = BlockPermutation.resolve(id);
  B.black = BlockPermutation.resolve("minecraft:black_concrete");
  B.white = BlockPermutation.resolve("minecraft:white_concrete");
  B.yellow = BlockPermutation.resolve("minecraft:yellow_concrete");
  B.light = BlockPermutation.resolve("minecraft:sea_lantern");
  return B;
}

function setLocal(dimension, origin, rotation, size, x, y, z, permutation) {
  const loc = toWorldLocation(origin, { x, y, z }, size, rotation);
  dimension.getBlock(loc)?.setPermutation(permutation);
}

function fill(dimension, origin, rotation, size, from, to, permutation) {
  for (let x = from.x; x <= to.x; x++) {
    for (let y = from.y; y <= to.y; y++) {
      for (let z = from.z; z <= to.z; z++) setLocal(dimension, origin, rotation, size, x, y, z, permutation);
    }
  }
}

export function buildRunwayStraight(dimension, origin, rotation, variantId) {
  const size = { x: 21, y: 3, z: 41 }, B = perms(variantId);
  fill(dimension, origin, rotation, size, { x: 0, y: 0, z: 0 }, { x: 20, y: 0, z: 40 }, B.frame);
  fill(dimension, origin, rotation, size, { x: 0, y: 1, z: 0 }, { x: 20, y: 1, z: 40 }, B.black);
  for (let z = 1; z < 40; z++) {
    if (z % 6 <= 2) for (let x = 9; x <= 11; x++) setLocal(dimension, origin, rotation, size, x, 1, z, B.white);
    if (z % 5 === 0) {
      setLocal(dimension, origin, rotation, size, 0, 1, z, B.light);
      setLocal(dimension, origin, rotation, size, 20, 1, z, B.light);
    }
  }
}

export function buildRunwayThreshold(dimension, origin, rotation, variantId) {
  const size = { x: 21, y: 3, z: 21 }, B = perms(variantId);
  fill(dimension, origin, rotation, size, { x: 0, y: 0, z: 0 }, { x: 20, y: 0, z: 20 }, B.frame);
  fill(dimension, origin, rotation, size, { x: 0, y: 1, z: 0 }, { x: 20, y: 1, z: 20 }, B.black);
  for (const x of [2,5,8,12,15,18]) fill(dimension, origin, rotation, size, { x, y: 1, z: 2 }, { x, y: 1, z: 8 }, B.white);
  for (let z = 10; z <= 20; z++) if (z % 5 <= 2) for (let x = 9; x <= 11; x++) setLocal(dimension, origin, rotation, size, x, 1, z, B.white);
  for (let z = 2; z <= 18; z += 4) {
    setLocal(dimension, origin, rotation, size, 0, 1, z, B.light);
    setLocal(dimension, origin, rotation, size, 20, 1, z, B.light);
  }
}

export function buildTaxiwayStraight(dimension, origin, rotation, variantId) {
  const size = { x: 13, y: 3, z: 31 }, B = perms(variantId);
  fill(dimension, origin, rotation, size, { x: 0, y: 0, z: 0 }, { x: 12, y: 0, z: 30 }, B.frame);
  fill(dimension, origin, rotation, size, { x: 0, y: 1, z: 0 }, { x: 12, y: 1, z: 30 }, B.black);
  for (let z = 0; z <= 30; z++) setLocal(dimension, origin, rotation, size, 6, 1, z, B.yellow);
  for (let z = 2; z <= 28; z += 5) {
    setLocal(dimension, origin, rotation, size, 0, 1, z, B.light);
    setLocal(dimension, origin, rotation, size, 12, 1, z, B.light);
  }
}

export function buildTaxiwayCorner(dimension, origin, rotation, variantId) {
  const size = { x: 21, y: 3, z: 21 }, B = perms(variantId);
  fill(dimension, origin, rotation, size, { x: 0, y: 0, z: 0 }, { x: 20, y: 0, z: 20 }, B.frame);
  for (let x = 0; x <= 12; x++) for (let z = 8; z <= 20; z++) setLocal(dimension, origin, rotation, size, x, 1, z, B.black);
  for (let x = 8; x <= 20; x++) for (let z = 0; z <= 12; z++) setLocal(dimension, origin, rotation, size, x, 1, z, B.black);
  for (let i = 0; i <= 10; i++) {
    setLocal(dimension, origin, rotation, size, 6 + i, 1, 14 - i, B.yellow);
  }
}

export function buildAircraftApron(dimension, origin, rotation, variantId) {
  const size = { x: 31, y: 3, z: 31 }, B = perms(variantId);
  fill(dimension, origin, rotation, size, { x: 0, y: 0, z: 0 }, { x: 30, y: 0, z: 30 }, B.frame);
  fill(dimension, origin, rotation, size, { x: 0, y: 1, z: 0 }, { x: 30, y: 1, z: 30 }, B.black);
  for (const x of [6,15,24]) {
    for (let z = 4; z <= 26; z++) setLocal(dimension, origin, rotation, size, x, 1, z, B.yellow);
  }
  for (let x = 2; x <= 28; x += 4) {
    setLocal(dimension, origin, rotation, size, x, 1, 1, B.light);
    setLocal(dimension, origin, rotation, size, x, 1, 29, B.light);
  }
}
