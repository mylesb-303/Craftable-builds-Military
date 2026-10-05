import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";
import { getInteriorBlocks } from "../interior_blocks.js";

// Long-form accommodation block based on the supplied military-base barracks.
// The front face is at local z = 40 and contains the main entrance.
const SIZE = { x: 23, y: 9, z: 41 };

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

function placeSleepingBay(dimension, origin, rotation, z, B, I) {
  // Two double-tier sleeping positions face the central aisle: four troops per bay.
  for (let i = 0; i < 3; i++) {
    setLocal(dimension, origin, rotation, 2 + i, 2, z, B.mattress);
    setLocal(dimension, origin, rotation, 2 + i, 5, z, B.mattress);
    setLocal(dimension, origin, rotation, 20 - i, 2, z, B.mattress);
    setLocal(dimension, origin, rotation, 20 - i, 5, z, B.mattress);
  }
  for (const y of [3, 6]) {
    setLocal(dimension, origin, rotation, 2, y, z, B.pillow);
    setLocal(dimension, origin, rotation, 20, y, z, B.pillow);
  }

  // Bed frames and personal lockers leave a clear route into every berth.
  for (const y of [2, 3, 4, 5, 6]) {
    setLocal(dimension, origin, rotation, 1, y, z - 1, B.bars);
    setLocal(dimension, origin, rotation, 1, y, z + 1, B.bars);
    setLocal(dimension, origin, rotation, 21, y, z - 1, B.bars);
    setLocal(dimension, origin, rotation, 21, y, z + 1, B.bars);
  }
  setLocal(dimension, origin, rotation, 7, 2, z, I.locker);
  setLocal(dimension, origin, rotation, 15, 2, z, I.locker);
  setLocal(dimension, origin, rotation, 8, 2, z, I.storage);
  setLocal(dimension, origin, rotation, 14, 2, z, I.storage);

  // Bright cyan dividers reproduce the distinctive privacy screens in the reference build.
  const dividerZ = z - 2;
  fill(dimension, origin, rotation, { x: 2, y: 3, z: dividerZ }, { x: 8, y: 5, z: dividerZ }, B.partition);
  fill(dimension, origin, rotation, { x: 14, y: 3, z: dividerZ }, { x: 20, y: 5, z: dividerZ }, B.partition);
  for (const x of [1, 9, 13, 21]) {
    fill(dimension, origin, rotation, { x, y: 2, z: dividerZ }, { x, y: 6, z: dividerZ }, B.post);
  }
}

export function buildArmyBarracks(dimension, origin, rotation, variantId) {
  const palette = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(palette)) B[key] = BlockPermutation.resolve(id);
  const I = getInteriorBlocks();

  B.mattress = BlockPermutation.resolve("minecraft:light_gray_wool");
  B.pillow = BlockPermutation.resolve("minecraft:white_wool");
  B.partition = BlockPermutation.resolve("minecraft:cyan_concrete");
  B.post = BlockPermutation.resolve("minecraft:stripped_oak_log");
  B.sink = BlockPermutation.resolve("minecraft:cauldron");
  B.shower = BlockPermutation.resolve("minecraft:light_blue_stained_glass");
  B.bench = BlockPermutation.resolve("minecraft:polished_andesite");
  B.entry = BlockPermutation.resolve("minecraft:red_concrete");

  // Integrated two-block foundation and a completely cleared interior volume.
  fill(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 22, y: 0, z: 40 }, B.frame);
  fill(dimension, origin, rotation, { x: 0, y: 1, z: 0 }, { x: 22, y: 1, z: 40 }, B.floor);
  fill(dimension, origin, rotation, { x: 1, y: 2, z: 1 }, { x: 21, y: 6, z: 39 }, B.air);

  // Low rectangular exterior with a wide front entrance and restrained windows.
  for (let y = 2; y <= 6; y++) {
    for (let x = 0; x <= 22; x++) {
      const frontEntrance = x >= 9 && x <= 13 && y <= 4;
      const frontWindow = y >= 3 && y <= 4 && ((x >= 3 && x <= 6) || (x >= 16 && x <= 19));
      setLocal(dimension, origin, rotation, x, y, 40, frontEntrance ? B.air : frontWindow ? B.glass : B.wall);

      const rearWindow = y >= 3 && y <= 4 && ((x >= 2 && x <= 5) || (x >= 17 && x <= 20));
      setLocal(dimension, origin, rotation, x, y, 0, rearWindow ? B.glass : B.wall);
    }
    for (let z = 1; z <= 39; z++) {
      const sideWindow = y >= 3 && y <= 4 && [9, 10, 17, 18, 25, 26, 33, 34].includes(z);
      setLocal(dimension, origin, rotation, 0, y, z, sideWindow ? B.glass : B.wall);
      setLocal(dimension, origin, rotation, 22, y, z, sideWindow ? B.glass : B.wall);
    }
  }

  // Stone corner piers, shallow roof and the pale parapet visible in the walkthrough.
  for (const [x, z] of [[0, 0], [22, 0], [0, 40], [22, 40]]) {
    fill(dimension, origin, rotation, { x, y: 2, z }, { x, y: 8, z }, B.frame);
  }
  fill(dimension, origin, rotation, { x: 0, y: 7, z: 0 }, { x: 22, y: 7, z: 40 }, B.wall);
  for (let x = 0; x <= 22; x++) {
    setLocal(dimension, origin, rotation, x, 8, 0, B.accent);
    setLocal(dimension, origin, rotation, x, 8, 40, B.accent);
  }
  for (let z = 1; z <= 39; z++) {
    setLocal(dimension, origin, rotation, 0, 8, z, B.accent);
    setLocal(dimension, origin, rotation, 22, 8, z, B.accent);
  }

  // Red entrance surround and canopy match the strong doorway marker in the reference.
  for (const x of [8, 14]) fill(dimension, origin, rotation, { x, y: 2, z: 40 }, { x, y: 6, z: 40 }, B.entry);
  fill(dimension, origin, rotation, { x: 8, y: 5, z: 38 }, { x: 14, y: 5, z: 40 }, B.entry);
  for (const x of [8, 14]) fill(dimension, origin, rotation, { x, y: 2, z: 38 }, { x, y: 4, z: 38 }, B.post);

  // Rear service suite: ablutions, duty office and kit/mess storage.
  fill(dimension, origin, rotation, { x: 1, y: 2, z: 6 }, { x: 21, y: 6, z: 6 }, B.wall);
  for (const [fromX, toX] of [[4, 5], [10, 12], [17, 18]]) {
    fill(dimension, origin, rotation, { x: fromX, y: 2, z: 6 }, { x: toX, y: 4, z: 6 }, B.air);
  }
  for (const x of [8, 14]) {
    fill(dimension, origin, rotation, { x, y: 2, z: 1 }, { x, y: 6, z: 5 }, B.wall);
    fill(dimension, origin, rotation, { x, y: 2, z: 4 }, { x, y: 4, z: 5 }, B.air);
  }

  // Ablutions with sinks, shower screens and a changing bench.
  for (const x of [2, 4, 6]) setLocal(dimension, origin, rotation, x, 2, 1, B.sink);
  for (const x of [2, 4, 6]) fill(dimension, origin, rotation, { x, y: 2, z: 3 }, { x, y: 5, z: 4 }, B.shower);
  fill(dimension, origin, rotation, { x: 2, y: 2, z: 5 }, { x: 6, y: 2, z: 5 }, B.bench);

  // Duty desk and monitoring station face directly down the central aisle.
  fill(dimension, origin, rotation, { x: 10, y: 2, z: 2 }, { x: 12, y: 2, z: 3 }, I.counter);
  setLocal(dimension, origin, rotation, 10, 3, 2, I.keyboard);
  setLocal(dimension, origin, rotation, 12, 3, 2, I.keyboard);
  setLocal(dimension, origin, rotation, 11, 3, 1, I.monitor);
  setLocal(dimension, origin, rotation, 9, 2, 2, I.filing);
  setLocal(dimension, origin, rotation, 13, 2, 2, I.storage);

  // Kit store and small mess counter.
  for (const x of [16, 18, 20]) {
    setLocal(dimension, origin, rotation, x, 2, 1, I.storage);
    setLocal(dimension, origin, rotation, x, 2, 3, I.locker);
  }
  fill(dimension, origin, rotation, { x: 16, y: 2, z: 5 }, { x: 20, y: 2, z: 5 }, I.counter);

  // Eight repeated bays provide 32 sleeping positions while preserving the long central aisle.
  for (const z of [9, 13, 17, 21, 25, 29, 33, 37]) placeSleepingBay(dimension, origin, rotation, z, B, I);
  for (let z = 7; z <= 39; z++) {
    setLocal(dimension, origin, rotation, 10, 1, z, B.frame);
    setLocal(dimension, origin, rotation, 12, 1, z, B.frame);
  }

  // Continuous recessed lighting echoes the bright ceiling strips in the reference interior.
  for (const z of [4, 9, 13, 17, 21, 25, 29, 33, 37]) {
    for (const x of [5, 11, 17]) setLocal(dimension, origin, rotation, x, 7, z, B.light);
  }

  // Compact rooftop ventilation bank keeps the exterior recognisable without adding height.
  for (const z of [12, 20, 28]) {
    setLocal(dimension, origin, rotation, 9, 8, z, I.equipment);
    setLocal(dimension, origin, rotation, 13, 8, z, I.equipment);
  }
}
