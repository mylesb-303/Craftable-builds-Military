import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";
import { getInteriorBlocks } from "../interior_blocks.js";

const SIZE = { x: 21, y: 10, z: 17 };

function setLocal(dimension, origin, rotation, x, y, z, permutation) {
  const location = toWorldLocation(origin, { x, y, z }, SIZE, rotation);
  dimension.getBlock(location)?.setPermutation(permutation);
}

function fill(dimension, origin, rotation, from, to, permutation) {
  for (let x = from.x; x <= to.x; x++) {
    for (let y = from.y; y <= to.y; y++) {
      for (let z = from.z; z <= to.z; z++) {
        setLocal(dimension, origin, rotation, x, y, z, permutation);
      }
    }
  }
}

function placeEquipmentRack(dimension, origin, rotation, x, z, B) {
  fill(dimension, origin, rotation, { x, y: 2, z }, { x: x + 4, y: 2, z }, B.frame);
  fill(dimension, origin, rotation, { x, y: 3, z }, { x: x + 4, y: 3, z }, B.accent);
  for (const rx of [x, x + 2, x + 4]) {
    setLocal(dimension, origin, rotation, rx, 4, z, B.bars);
    setLocal(dimension, origin, rotation, rx, 5, z, B.bars);
  }
}

function placeCrateStack(dimension, origin, rotation, x, z, I, B) {
  setLocal(dimension, origin, rotation, x, 2, z, I.storage);
  setLocal(dimension, origin, rotation, x, 3, z, B.frame);
  setLocal(dimension, origin, rotation, x, 4, z, I.storage);
}

export function buildArmyArmoury(dimension, origin, rotation, variantId) {
  const palette = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(palette)) B[key] = BlockPermutation.resolve(id);
  const I = getInteriorBlocks();
  B.secure = BlockPermutation.resolve("minecraft:iron_block");
  B.warning = BlockPermutation.resolve("minecraft:red_concrete");

  // Reinforced foundation, finished floor and clear construction volume.
  fill(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 20, y: 0, z: 16 }, B.frame);
  fill(dimension, origin, rotation, { x: 0, y: 1, z: 0 }, { x: 20, y: 1, z: 16 }, B.floor);
  fill(dimension, origin, rotation, { x: 1, y: 2, z: 1 }, { x: 19, y: 7, z: 15 }, B.air);

  // Low-window reinforced exterior shell with a three-block security entrance.
  for (let y = 2; y <= 7; y++) {
    for (let x = 0; x <= 20; x++) {
      for (const z of [0, 16]) {
        const entrance = z === 16 && x >= 9 && x <= 11 && y <= 4;
        const slit = y === 4 && x >= 2 && x <= 18 && x % 4 === 2;
        setLocal(dimension, origin, rotation, x, y, z, entrance ? B.air : slit ? B.glass : B.wall);
      }
    }
    for (let z = 1; z <= 15; z++) {
      for (const x of [0, 20]) {
        const slit = y === 4 && z % 4 === 2;
        setLocal(dimension, origin, rotation, x, y, z, slit ? B.glass : B.wall);
      }
    }
  }

  // Armoured corners, entrance portal and roof parapet.
  for (const [x, z] of [[0, 0], [20, 0], [0, 16], [20, 16]]) {
    fill(dimension, origin, rotation, { x, y: 2, z }, { x, y: 8, z }, B.secure);
  }
  for (const x of [8, 12]) fill(dimension, origin, rotation, { x, y: 2, z: 15 }, { x, y: 7, z: 16 }, B.secure);
  fill(dimension, origin, rotation, { x: 0, y: 8, z: 0 }, { x: 20, y: 8, z: 16 }, B.accent);
  for (let x = 0; x <= 20; x++) {
    setLocal(dimension, origin, rotation, x, 9, 0, B.frame);
    setLocal(dimension, origin, rotation, x, 9, 16, B.frame);
  }
  for (let z = 1; z <= 15; z++) {
    setLocal(dimension, origin, rotation, 0, 9, z, B.frame);
    setLocal(dimension, origin, rotation, 20, 9, z, B.frame);
  }

  // Public issue hall is separated from every secure storage area.
  fill(dimension, origin, rotation, { x: 1, y: 2, z: 11 }, { x: 19, y: 7, z: 11 }, B.wall);
  fill(dimension, origin, rotation, { x: 9, y: 2, z: 11 }, { x: 11, y: 4, z: 11 }, B.air);
  fill(dimension, origin, rotation, { x: 3, y: 2, z: 13 }, { x: 8, y: 2, z: 13 }, I.counter);
  fill(dimension, origin, rotation, { x: 12, y: 2, z: 13 }, { x: 17, y: 2, z: 13 }, I.counter);
  for (const x of [4, 7, 13, 16]) {
    setLocal(dimension, origin, rotation, x, 3, 13, I.keyboard);
    setLocal(dimension, origin, rotation, x, 3, 12, I.monitor);
  }
  setLocal(dimension, origin, rotation, 2, 2, 14, I.filing);
  setLocal(dimension, origin, rotation, 18, 2, 14, I.storage);

  // Rear rooms: equipment store left, ammunition store right and central maintenance bay.
  fill(dimension, origin, rotation, { x: 7, y: 2, z: 1 }, { x: 7, y: 7, z: 10 }, B.wall);
  fill(dimension, origin, rotation, { x: 13, y: 2, z: 1 }, { x: 13, y: 7, z: 10 }, B.wall);
  for (const x of [7, 13]) {
    fill(dimension, origin, rotation, { x, y: 2, z: 8 }, { x, y: 4, z: 9 }, B.air);
  }

  // Equipment racks and issue lockers.
  for (const z of [2, 5, 8]) placeEquipmentRack(dimension, origin, rotation, 1, z, B);
  for (const z of [2, 4, 6, 8, 10]) setLocal(dimension, origin, rotation, 6, 2, z, I.locker);

  // Ammunition room uses separated double-level barrel stacks and inspection aisle.
  for (const x of [15, 17, 19]) {
    for (const z of [2, 5, 8]) placeCrateStack(dimension, origin, rotation, x, z, I, B);
  }
  fill(dimension, origin, rotation, { x: 14, y: 1, z: 1 }, { x: 19, y: 1, z: 2 }, B.warning);

  // Central maintenance benches and equipment servicing stations.
  fill(dimension, origin, rotation, { x: 8, y: 2, z: 8 }, { x: 12, y: 2, z: 9 }, I.counter);
  setLocal(dimension, origin, rotation, 8, 3, 8, I.workbench);
  setLocal(dimension, origin, rotation, 10, 3, 8, I.machine);
  setLocal(dimension, origin, rotation, 12, 3, 8, I.equipment);
  setLocal(dimension, origin, rotation, 9, 3, 10, I.filing);
  setLocal(dimension, origin, rotation, 11, 3, 10, I.storage);

  // Internal armoured vault with a barred checkpoint and protected reserve crates.
  fill(dimension, origin, rotation, { x: 8, y: 2, z: 1 }, { x: 12, y: 6, z: 1 }, B.secure);
  fill(dimension, origin, rotation, { x: 8, y: 2, z: 2 }, { x: 8, y: 6, z: 6 }, B.secure);
  fill(dimension, origin, rotation, { x: 12, y: 2, z: 2 }, { x: 12, y: 6, z: 6 }, B.secure);
  fill(dimension, origin, rotation, { x: 8, y: 2, z: 6 }, { x: 12, y: 6, z: 6 }, B.secure);
  fill(dimension, origin, rotation, { x: 8, y: 7, z: 1 }, { x: 12, y: 7, z: 6 }, B.secure);
  fill(dimension, origin, rotation, { x: 9, y: 2, z: 2 }, { x: 11, y: 5, z: 5 }, B.air);
  fill(dimension, origin, rotation, { x: 10, y: 2, z: 6 }, { x: 10, y: 4, z: 6 }, B.air);
  setLocal(dimension, origin, rotation, 10, 7, 3, B.light);
  for (const [x, z] of [[9, 2], [11, 2], [9, 4], [11, 4]]) {
    setLocal(dimension, origin, rotation, x, 2, z, I.storage);
    setLocal(dimension, origin, rotation, x, 3, z, B.frame);
  }

  // Recessed lighting keeps the issue hall and all secure rooms readable.
  const lights = [
    [3, 3], [6, 6], [3, 9],
    [10, 3], [10, 9],
    [15, 3], [18, 6], [15, 9],
    [4, 14], [10, 14], [16, 14]
  ];
  for (const [x, z] of lights) setLocal(dimension, origin, rotation, x, 8, z, B.light);

  // Compact rooftop ventilation and security-light bank.
  for (const x of [7, 10, 13]) setLocal(dimension, origin, rotation, x, 9, 8, I.equipment);
  setLocal(dimension, origin, rotation, 10, 9, 15, B.warning);
}
