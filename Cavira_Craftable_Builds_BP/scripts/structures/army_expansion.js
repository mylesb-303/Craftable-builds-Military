import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";
import { getInteriorBlocks } from "../interior_blocks.js";

function setLocal(dimension, origin, rotation, size, x, y, z, permutation) {
  const location = toWorldLocation(origin, { x, y, z }, size, rotation);
  dimension.getBlock(location)?.setPermutation(permutation);
}

function fill(dimension, origin, rotation, size, from, to, permutation) {
  for (let x = from.x; x <= to.x; x++) {
    for (let y = from.y; y <= to.y; y++) {
      for (let z = from.z; z <= to.z; z++) {
        setLocal(dimension, origin, rotation, size, x, y, z, permutation);
      }
    }
  }
}

function getBlocks(variantId) {
  const palette = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(palette)) B[key] = BlockPermutation.resolve(id);
  B.secure = BlockPermutation.resolve("minecraft:iron_block");
  B.warning = BlockPermutation.resolve("minecraft:red_concrete");
  B.medical = BlockPermutation.resolve("minecraft:white_concrete");
  B.mattress = BlockPermutation.resolve("minecraft:white_wool");
  B.marker = BlockPermutation.resolve("minecraft:yellow_concrete");
  return { B, I: getInteriorBlocks() };
}

function buildStandardShell(dimension, origin, rotation, size, B, entranceFrom, entranceTo, windowStep = 4) {
  fill(dimension, origin, rotation, size, { x: 0, y: 0, z: 0 }, { x: size.x - 1, y: 0, z: size.z - 1 }, B.frame);
  fill(dimension, origin, rotation, size, { x: 0, y: 1, z: 0 }, { x: size.x - 1, y: 1, z: size.z - 1 }, B.floor);
  fill(dimension, origin, rotation, size, { x: 1, y: 2, z: 1 }, { x: size.x - 2, y: size.y - 3, z: size.z - 2 }, B.air);

  const wallTop = size.y - 3;
  const frontZ = size.z - 1;
  for (let y = 2; y <= wallTop; y++) {
    for (let x = 0; x < size.x; x++) {
      for (const z of [0, frontZ]) {
        const entrance = z === frontZ && x >= entranceFrom && x <= entranceTo && y <= 4;
        const window = y >= 3 && y <= 4 && x >= 2 && x <= size.x - 3 && x % windowStep !== 0;
        setLocal(dimension, origin, rotation, size, x, y, z, entrance ? B.air : window ? B.glass : B.wall);
      }
    }
    for (let z = 1; z < frontZ; z++) {
      for (const x of [0, size.x - 1]) {
        const window = y >= 3 && y <= 4 && z % windowStep !== 0;
        setLocal(dimension, origin, rotation, size, x, y, z, window ? B.glass : B.wall);
      }
    }
  }

  for (const [x, z] of [[0, 0], [size.x - 1, 0], [0, frontZ], [size.x - 1, frontZ]]) {
    fill(dimension, origin, rotation, size, { x, y: 2, z }, { x, y: size.y - 2, z }, B.frame);
  }
  fill(dimension, origin, rotation, size, { x: 0, y: size.y - 2, z: 0 }, { x: size.x - 1, y: size.y - 2, z: frontZ }, B.accent);
}

function placeBed(dimension, origin, rotation, size, x, z, B) {
  fill(dimension, origin, rotation, size, { x, y: 2, z }, { x: x + 2, y: 2, z }, B.mattress);
  setLocal(dimension, origin, rotation, size, x, 3, z, B.medical);
}

export function buildArmyVehicleDepot(dimension, origin, rotation, variantId) {
  const SIZE = { x: 29, y: 12, z: 23 };
  const { B, I } = getBlocks(variantId);

  // Foundation and clear depot volume.
  fill(dimension, origin, rotation, SIZE, { x: 0, y: 0, z: 0 }, { x: 28, y: 0, z: 22 }, B.frame);
  fill(dimension, origin, rotation, SIZE, { x: 0, y: 1, z: 0 }, { x: 28, y: 1, z: 22 }, B.floor);
  fill(dimension, origin, rotation, SIZE, { x: 1, y: 2, z: 1 }, { x: 27, y: 9, z: 21 }, B.air);

  // Side and rear shell; the front stays open across three full vehicle bays.
  for (let y = 2; y <= 9; y++) {
    for (let x = 0; x <= 28; x++) {
      const rearWindow = y >= 4 && y <= 5 && x % 4 !== 0;
      setLocal(dimension, origin, rotation, SIZE, x, y, 0, rearWindow ? B.glass : B.wall);
    }
    for (let z = 1; z <= 22; z++) {
      for (const x of [0, 28]) {
        const sideWindow = y >= 4 && y <= 5 && z % 4 !== 0;
        setLocal(dimension, origin, rotation, SIZE, x, y, z, sideWindow ? B.glass : B.wall);
      }
    }
  }
  for (const x of [0, 9, 19, 28]) fill(dimension, origin, rotation, SIZE, { x, y: 2, z: 22 }, { x, y: 10, z: 22 }, B.frame);
  fill(dimension, origin, rotation, SIZE, { x: 0, y: 10, z: 0 }, { x: 28, y: 10, z: 22 }, B.accent);
  for (const x of [4, 14, 24]) setLocal(dimension, origin, rotation, SIZE, x, 11, 11, I.equipment);

  // Three marked maintenance bays and inspection pits.
  for (const centreX of [5, 14, 23]) {
    for (let z = 4; z <= 20; z++) {
      setLocal(dimension, origin, rotation, SIZE, centreX - 3, 1, z, B.marker);
      setLocal(dimension, origin, rotation, SIZE, centreX + 3, 1, z, B.marker);
    }
    fill(dimension, origin, rotation, SIZE, { x: centreX, y: 1, z: 7 }, { x: centreX, y: 1, z: 15 }, B.secure);
  }

  // Rear servicing wall with tools, machines, lockers and stores.
  for (const x of [2, 6, 10, 18, 22, 26]) {
    setLocal(dimension, origin, rotation, SIZE, x, 2, 2, I.counter);
    setLocal(dimension, origin, rotation, SIZE, x, 3, 2, I.workbench);
  }
  for (const x of [12, 13, 15, 16]) setLocal(dimension, origin, rotation, SIZE, x, 2, 2, I.locker);
  for (const [x, z] of [[2, 5], [26, 5], [2, 8], [26, 8]]) setLocal(dimension, origin, rotation, SIZE, x, 2, z, I.storage);

  const lights = [[4, 5], [14, 5], [24, 5], [4, 12], [14, 12], [24, 12], [4, 19], [14, 19], [24, 19]];
  for (const [x, z] of lights) setLocal(dimension, origin, rotation, SIZE, x, 10, z, B.light);
}

export function buildArmyMedicalFacility(dimension, origin, rotation, variantId) {
  const SIZE = { x: 23, y: 10, z: 19 };
  const { B, I } = getBlocks(variantId);
  buildStandardShell(dimension, origin, rotation, SIZE, B, 10, 12, 4);

  // Medical stripe and protected entrance canopy.
  fill(dimension, origin, rotation, SIZE, { x: 9, y: 5, z: 18 }, { x: 13, y: 5, z: 18 }, B.medical);
  fill(dimension, origin, rotation, SIZE, { x: 10, y: 1, z: 16 }, { x: 12, y: 1, z: 18 }, B.medical);

  // Reception and central staff station.
  fill(dimension, origin, rotation, SIZE, { x: 6, y: 2, z: 14 }, { x: 16, y: 2, z: 14 }, I.counter);
  for (const x of [8, 11, 14]) {
    setLocal(dimension, origin, rotation, SIZE, x, 3, 14, I.keyboard);
    setLocal(dimension, origin, rotation, SIZE, x, 3, 13, I.monitor);
  }
  setLocal(dimension, origin, rotation, SIZE, 5, 2, 14, I.filing);
  setLocal(dimension, origin, rotation, SIZE, 17, 2, 14, I.storage);

  // Treatment ward on the left with six accessible beds.
  fill(dimension, origin, rotation, SIZE, { x: 10, y: 2, z: 1 }, { x: 10, y: 7, z: 12 }, B.wall);
  for (const z of [3, 7, 11]) {
    placeBed(dimension, origin, rotation, SIZE, 2, z, B);
    placeBed(dimension, origin, rotation, SIZE, 6, z, B);
  }
  for (const z of [2, 6, 10]) setLocal(dimension, origin, rotation, SIZE, 9, 2, z, I.storage);

  // Examination rooms and pharmacy stores on the right.
  fill(dimension, origin, rotation, SIZE, { x: 11, y: 2, z: 7 }, { x: 21, y: 7, z: 7 }, B.wall);
  for (const x of [14, 18]) {
    fill(dimension, origin, rotation, SIZE, { x, y: 2, z: 7 }, { x: x + 1, y: 4, z: 7 }, B.air);
    placeBed(dimension, origin, rotation, SIZE, x, 3, B);
  }
  for (const x of [12, 15, 18, 21]) {
    setLocal(dimension, origin, rotation, SIZE, x, 2, 9, I.filing);
    setLocal(dimension, origin, rotation, SIZE, x, 2, 11, I.storage);
  }

  const lights = [[4, 3], [8, 3], [14, 3], [19, 3], [4, 9], [8, 9], [14, 10], [19, 10], [6, 15], [12, 15], [18, 15]];
  for (const [x, z] of lights) setLocal(dimension, origin, rotation, SIZE, x, 8, z, B.light);
}

export function buildArmyCommandBunker(dimension, origin, rotation, variantId) {
  const SIZE = { x: 21, y: 8, z: 17 };
  const { B, I } = getBlocks(variantId);

  // Two buried foundation layers put the finished bunker floor at ground level.
  fill(dimension, origin, rotation, SIZE, { x: 0, y: 0, z: 0 }, { x: 20, y: 1, z: 16 }, B.secure);
  fill(dimension, origin, rotation, SIZE, { x: 0, y: 2, z: 0 }, { x: 20, y: 2, z: 16 }, B.floor);
  fill(dimension, origin, rotation, SIZE, { x: 1, y: 3, z: 1 }, { x: 19, y: 5, z: 15 }, B.air);

  // Windowless reinforced shell and narrow blast entrance.
  for (let y = 3; y <= 5; y++) {
    for (let x = 0; x <= 20; x++) {
      for (const z of [0, 16]) {
        const entrance = z === 16 && x >= 9 && x <= 11 && y <= 5;
        setLocal(dimension, origin, rotation, SIZE, x, y, z, entrance ? B.air : B.secure);
      }
    }
    for (let z = 1; z <= 15; z++) {
      setLocal(dimension, origin, rotation, SIZE, 0, y, z, B.secure);
      setLocal(dimension, origin, rotation, SIZE, 20, y, z, B.secure);
    }
  }
  fill(dimension, origin, rotation, SIZE, { x: 0, y: 6, z: 0 }, { x: 20, y: 6, z: 16 }, B.secure);
  fill(dimension, origin, rotation, SIZE, { x: 1, y: 7, z: 1 }, { x: 19, y: 7, z: 15 }, B.camoA);

  // Operations room with dual console rows and situation wall.
  for (const z of [6, 9]) {
    fill(dimension, origin, rotation, SIZE, { x: 5, y: 3, z }, { x: 15, y: 3, z }, I.counter);
    for (const x of [6, 9, 12, 15]) setLocal(dimension, origin, rotation, SIZE, x, 4, z, I.keyboard);
  }
  for (const x of [5, 7, 9, 11, 13, 15]) setLocal(dimension, origin, rotation, SIZE, x, 4, 2, I.monitor);

  // Briefing room, communications bank and secure records corners.
  fill(dimension, origin, rotation, SIZE, { x: 2, y: 3, z: 12 }, { x: 7, y: 3, z: 13 }, I.counter);
  setLocal(dimension, origin, rotation, SIZE, 4, 3, 14, I.lectern);
  for (const z of [11, 13, 15]) {
    setLocal(dimension, origin, rotation, SIZE, 18, 3, z, I.server);
    setLocal(dimension, origin, rotation, SIZE, 16, 3, z, I.equipment);
  }
  for (const z of [2, 4]) {
    setLocal(dimension, origin, rotation, SIZE, 2, 3, z, I.filing);
    setLocal(dimension, origin, rotation, SIZE, 18, 3, z, I.storage);
  }

  const lights = [[3, 3], [10, 3], [17, 3], [3, 8], [10, 8], [17, 8], [3, 13], [10, 13], [17, 13]];
  for (const [x, z] of lights) setLocal(dimension, origin, rotation, SIZE, x, 6, z, B.light);
}

export function buildArmyDefensiveCheckpoint(dimension, origin, rotation, variantId) {
  const SIZE = { x: 19, y: 9, z: 13 };
  const { B, I } = getBlocks(variantId);

  fill(dimension, origin, rotation, SIZE, { x: 0, y: 0, z: 0 }, { x: 18, y: 0, z: 12 }, B.frame);
  fill(dimension, origin, rotation, SIZE, { x: 0, y: 1, z: 0 }, { x: 18, y: 1, z: 12 }, B.floor);

  // Central five-block vehicle lane with yellow approach markings.
  for (let z = 0; z <= 12; z++) {
    for (const x of [7, 11]) setLocal(dimension, origin, rotation, SIZE, x, 1, z, B.marker);
  }

  // Twin hardened inspection booths.
  for (const fromX of [1, 13]) {
    fill(dimension, origin, rotation, SIZE, { x: fromX, y: 2, z: 3 }, { x: fromX + 4, y: 6, z: 9 }, B.wall);
    fill(dimension, origin, rotation, SIZE, { x: fromX + 1, y: 2, z: 4 }, { x: fromX + 3, y: 5, z: 8 }, B.air);
    fill(dimension, origin, rotation, SIZE, { x: fromX + 1, y: 4, z: 3 }, { x: fromX + 3, y: 4, z: 3 }, B.glass);
    fill(dimension, origin, rotation, SIZE, { x: fromX, y: 4, z: 5 }, { x: fromX, y: 4, z: 7 }, B.glass);
    fill(dimension, origin, rotation, SIZE, { x: fromX + 4, y: 4, z: 5 }, { x: fromX + 4, y: 4, z: 7 }, B.glass);
    fill(dimension, origin, rotation, SIZE, { x: fromX + 2, y: 2, z: 9 }, { x: fromX + 2, y: 4, z: 9 }, B.air);
    fill(dimension, origin, rotation, SIZE, { x: fromX, y: 7, z: 3 }, { x: fromX + 4, y: 7, z: 9 }, B.accent);
    setLocal(dimension, origin, rotation, SIZE, fromX + 2, 2, 6, I.counter);
    setLocal(dimension, origin, rotation, SIZE, fromX + 2, 3, 5, I.monitor);
  }

  // Overhead gantry and visible stop barrier.
  fill(dimension, origin, rotation, SIZE, { x: 5, y: 7, z: 6 }, { x: 13, y: 7, z: 6 }, B.frame);
  fill(dimension, origin, rotation, SIZE, { x: 7, y: 3, z: 8 }, { x: 11, y: 3, z: 8 }, B.warning);
  for (const [x, z] of [[2, 2], [16, 2], [2, 10], [16, 10], [9, 6]]) setLocal(dimension, origin, rotation, SIZE, x, 8, z, B.light);

  // Low defensive firing positions on both approaches.
  for (const x of [0, 18]) {
    fill(dimension, origin, rotation, SIZE, { x, y: 2, z: 0 }, { x, y: 4, z: 2 }, B.secure);
    fill(dimension, origin, rotation, SIZE, { x, y: 2, z: 10 }, { x, y: 4, z: 12 }, B.secure);
  }
}

export function buildArmyPerimeterWall(dimension, origin, rotation, variantId) {
  const SIZE = { x: 21, y: 8, z: 5 };
  const { B } = getBlocks(variantId);

  // Deep continuous footing and five-block-thick reinforced wall base.
  fill(dimension, origin, rotation, SIZE, { x: 0, y: 0, z: 0 }, { x: 20, y: 0, z: 4 }, B.frame);
  fill(dimension, origin, rotation, SIZE, { x: 0, y: 1, z: 0 }, { x: 20, y: 2, z: 4 }, B.secure);
  fill(dimension, origin, rotation, SIZE, { x: 0, y: 3, z: 1 }, { x: 20, y: 5, z: 3 }, B.wall);

  // Patrol ledge and alternating protected firing slots.
  fill(dimension, origin, rotation, SIZE, { x: 0, y: 6, z: 0 }, { x: 20, y: 6, z: 4 }, B.frame);
  for (let x = 0; x <= 20; x++) {
    const firingGap = x % 4 === 2;
    setLocal(dimension, origin, rotation, SIZE, x, 7, 0, firingGap ? B.bars : B.accent);
    setLocal(dimension, origin, rotation, SIZE, x, 7, 4, firingGap ? B.bars : B.accent);
  }

  // End caps align repeated modules; lights mark every fifth block.
  fill(dimension, origin, rotation, SIZE, { x: 0, y: 2, z: 0 }, { x: 0, y: 7, z: 4 }, B.secure);
  fill(dimension, origin, rotation, SIZE, { x: 20, y: 2, z: 0 }, { x: 20, y: 7, z: 4 }, B.secure);
  for (const x of [5, 10, 15]) {
    setLocal(dimension, origin, rotation, SIZE, x, 7, 1, B.light);
    setLocal(dimension, origin, rotation, SIZE, x, 7, 3, B.light);
  }
}
