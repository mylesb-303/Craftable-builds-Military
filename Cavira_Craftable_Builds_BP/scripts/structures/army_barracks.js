import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";
import { getInteriorBlocks } from "../interior_blocks.js";

const SIZE = { x: 25, y: 10, z: 19 };

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

function placeBunk(dimension, origin, rotation, x, z, direction, B) {
  const alongX = direction === "x";
  const dx = alongX ? 1 : 0;
  const dz = alongX ? 0 : 1;

  // Two three-block-long sleeping platforms with a clear usable gap between tiers.
  for (let i = 0; i < 3; i++) {
    setLocal(dimension, origin, rotation, x + dx * i, 2, z + dz * i, B.mattress);
    setLocal(dimension, origin, rotation, x + dx * i, 5, z + dz * i, B.mattress);
  }
  setLocal(dimension, origin, rotation, x, 3, z, B.pillow);
  setLocal(dimension, origin, rotation, x, 6, z, B.pillow);

  // Iron end frames sit beside the mattresses so they never replace the sleeping surface.
  for (const offset of [0, 2]) {
    const bx = x + dx * offset;
    const bz = z + dz * offset;
    const frameX = bx + (alongX ? 0 : 1);
    const frameZ = bz + (alongX ? 1 : 0);
    for (let y = 2; y <= 6; y++) setLocal(dimension, origin, rotation, frameX, y, frameZ, B.bars);
  }
}

function placeTable(dimension, origin, rotation, x, z, I, B) {
  fill(dimension, origin, rotation, { x, y: 2, z }, { x: x + 3, y: 2, z: z + 1 }, I.counter);
  for (const [cx, cz] of [[x - 1, z], [x - 1, z + 1], [x + 4, z], [x + 4, z + 1]]) {
    setLocal(dimension, origin, rotation, cx, 2, cz, B.seat);
  }
}

export function buildArmyBarracks(dimension, origin, rotation, variantId) {
  const palette = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(palette)) B[key] = BlockPermutation.resolve(id);
  const I = getInteriorBlocks();

  B.mattress = BlockPermutation.resolve("minecraft:green_wool");
  B.pillow = BlockPermutation.resolve("minecraft:white_wool");
  B.seat = BlockPermutation.resolve("minecraft:polished_andesite");
  B.sink = BlockPermutation.resolve("minecraft:cauldron");
  B.shower = BlockPermutation.resolve("minecraft:light_gray_stained_glass");
  B.notice = BlockPermutation.resolve("minecraft:oak_sign");

  // Integrated two-block foundation, finished ground floor and clear interior volume.
  fill(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 24, y: 0, z: 18 }, B.frame);
  fill(dimension, origin, rotation, { x: 0, y: 1, z: 0 }, { x: 24, y: 1, z: 18 }, B.floor);
  fill(dimension, origin, rotation, { x: 1, y: 2, z: 1 }, { x: 23, y: 7, z: 17 }, B.air);

  // Exterior shell with a three-block-wide front entrance and regular barracks windows.
  for (let y = 2; y <= 7; y++) {
    for (let x = 0; x <= 24; x++) {
      for (const z of [0, 18]) {
        const entrance = z === 18 && x >= 11 && x <= 13 && y <= 4;
        const window = y >= 3 && y <= 4 && x >= 2 && x <= 22 && x % 4 !== 0;
        setLocal(dimension, origin, rotation, x, y, z, entrance ? B.air : window ? B.glass : B.wall);
      }
    }
    for (let z = 1; z <= 17; z++) {
      for (const x of [0, 24]) {
        const window = y >= 3 && y <= 4 && z % 4 !== 0;
        setLocal(dimension, origin, rotation, x, y, z, window ? B.glass : B.wall);
      }
    }
  }

  // Reinforced corners, flat roof and a low contrasting parapet.
  for (const [x, z] of [[0, 0], [24, 0], [0, 18], [24, 18]]) {
    fill(dimension, origin, rotation, { x, y: 2, z }, { x, y: 8, z }, B.frame);
  }
  fill(dimension, origin, rotation, { x: 0, y: 8, z: 0 }, { x: 24, y: 8, z: 18 }, B.accent);
  for (let x = 0; x <= 24; x++) {
    setLocal(dimension, origin, rotation, x, 9, 0, B.frame);
    setLocal(dimension, origin, rotation, x, 9, 18, B.frame);
  }
  for (let z = 1; z <= 17; z++) {
    setLocal(dimension, origin, rotation, 0, 9, z, B.frame);
    setLocal(dimension, origin, rotation, 24, 9, z, B.frame);
  }

  // Central corridor separates two accommodation wings. Doorways remain three blocks high.
  for (const x of [10, 14]) {
    fill(dimension, origin, rotation, { x, y: 2, z: 5 }, { x, y: 7, z: 17 }, B.wall);
    for (const z of [7, 12, 16]) fill(dimension, origin, rotation, { x, y: 2, z }, { x, y: 4, z }, B.air);
  }

  // Rear service block: ablutions on the left, duty office centrally and mess/common room right.
  fill(dimension, origin, rotation, { x: 1, y: 2, z: 5 }, { x: 9, y: 7, z: 5 }, B.wall);
  fill(dimension, origin, rotation, { x: 15, y: 2, z: 5 }, { x: 23, y: 7, z: 5 }, B.wall);
  fill(dimension, origin, rotation, { x: 10, y: 2, z: 5 }, { x: 14, y: 4, z: 5 }, B.air);
  for (const [x, z] of [[4, 5], [19, 5]]) {
    fill(dimension, origin, rotation, { x, y: 2, z }, { x: x + 1, y: 4, z }, B.air);
  }

  // Left and right sleeping wings: twelve double-tier bunks and dedicated locker banks.
  for (const z of [7, 11, 15]) {
    placeBunk(dimension, origin, rotation, 2, z, "x", B);
    placeBunk(dimension, origin, rotation, 6, z, "x", B);
    placeBunk(dimension, origin, rotation, 16, z, "x", B);
    placeBunk(dimension, origin, rotation, 20, z, "x", B);
  }
  for (const z of [7, 9, 11, 13, 15, 17]) {
    setLocal(dimension, origin, rotation, 9, 2, z, I.locker);
    setLocal(dimension, origin, rotation, 15, 2, z, I.locker);
  }

  // Ablutions: sinks, shower dividers and changing benches.
  for (const x of [2, 4, 6, 8]) setLocal(dimension, origin, rotation, x, 2, 2, B.sink);
  for (const x of [2, 5, 8]) {
    fill(dimension, origin, rotation, { x, y: 2, z: 3 }, { x, y: 6, z: 4 }, B.shower);
  }
  fill(dimension, origin, rotation, { x: 2, y: 2, z: 1 }, { x: 8, y: 2, z: 1 }, I.counter);

  // Duty office faces the entrance through the central corridor.
  fill(dimension, origin, rotation, { x: 11, y: 2, z: 2 }, { x: 13, y: 2, z: 3 }, I.counter);
  setLocal(dimension, origin, rotation, 11, 3, 2, I.keyboard);
  setLocal(dimension, origin, rotation, 13, 3, 2, I.keyboard);
  setLocal(dimension, origin, rotation, 12, 3, 1, I.monitor);
  setLocal(dimension, origin, rotation, 10, 2, 2, I.filing);
  setLocal(dimension, origin, rotation, 14, 2, 2, I.storage);

  // Mess and communal area with two large tables, storage and a wall display.
  placeTable(dimension, origin, rotation, 16, 2, I, B);
  placeTable(dimension, origin, rotation, 16, 4, I, B);
  for (const z of [1, 3]) setLocal(dimension, origin, rotation, 22, 2, z, I.storage);
  fill(dimension, origin, rotation, { x: 16, y: 3, z: 1 }, { x: 20, y: 3, z: 1 }, I.monitor);

  // Recessed lighting throughout sleeping wings, service rooms and corridor.
  const lights = [
    [4, 4], [8, 4], [12, 3], [17, 4], [21, 4],
    [4, 9], [8, 9], [12, 9], [16, 9], [20, 9],
    [4, 14], [8, 14], [12, 14], [16, 14], [20, 14], [12, 17]
  ];
  for (const [x, z] of lights) setLocal(dimension, origin, rotation, x, 8, z, B.light);

  // Small rooftop ventilation bank keeps the silhouette purposeful without excessive height.
  for (const x of [8, 12, 16]) setLocal(dimension, origin, rotation, x, 9, 9, I.equipment);
}
