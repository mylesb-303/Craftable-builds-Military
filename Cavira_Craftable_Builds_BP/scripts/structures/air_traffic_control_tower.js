import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";
import { getInteriorBlocks } from "../interior_blocks.js";

const SIZE = { x: 13, y: 24, z: 13 };

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

export function buildAirTrafficControlTower(dimension, origin, rotation, variantId) {
  const palette = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(palette)) B[key] = BlockPermutation.resolve(id);
  const I = getInteriorBlocks();

  // Foundation and lobby floor.
  fill(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 12, y: 0, z: 12 }, B.frame);
  fill(dimension, origin, rotation, { x: 1, y: 1, z: 1 }, { x: 11, y: 1, z: 11 }, B.floor);

  // Reinforced lower operations block.
  for (let y = 2; y <= 6; y++) {
    for (let x = 0; x <= 12; x++) {
      const frontDoor = (x === 6) && (y === 2 || y === 3);
      const frontWindow = y >= 3 && y <= 4 && (x >= 2 && x <= 4 || x >= 8 && x <= 10);
      setLocal(dimension, origin, rotation, x, y, 12, frontDoor ? B.air : frontWindow ? B.glass : (x === 0 || x === 12 ? B.frame : B.wall));
      setLocal(dimension, origin, rotation, x, y, 0, (y >= 3 && y <= 4 && x >= 3 && x <= 9) ? B.glass : (x === 0 || x === 12 ? B.frame : B.wall));
    }
    for (let z = 1; z <= 11; z++) {
      const sideWindow = y >= 3 && y <= 4 && z >= 3 && z <= 9;
      setLocal(dimension, origin, rotation, 0, y, z, sideWindow ? B.glass : B.frame);
      setLocal(dimension, origin, rotation, 12, y, z, sideWindow ? B.glass : B.frame);
    }
  }
  fill(dimension, origin, rotation, { x: 0, y: 6, z: 0 }, { x: 12, y: 6, z: 12 }, B.accent);

  // Central tower shaft.
  for (let y = 7; y <= 17; y++) {
    fill(dimension, origin, rotation, { x: 4, y, z: 4 }, { x: 8, y, z: 8 }, B.wall);
    if (y % 3 === 0) {
      setLocal(dimension, origin, rotation, 6, y, 4, B.glass);
      setLocal(dimension, origin, rotation, 6, y, 8, B.glass);
      setLocal(dimension, origin, rotation, 4, y, 6, B.glass);
      setLocal(dimension, origin, rotation, 8, y, 6, B.glass);
    }
  }

  // Internal access core using compact vanilla stairs around the shaft perimeter.
  const STAIR = BlockPermutation.resolve("minecraft:polished_andesite_stairs");
  for (let y = 2; y <= 16; y++) {
    const z = 10 - ((y - 2) % 7);
    setLocal(dimension, origin, rotation, 9, y, Math.max(3, z), STAIR);
  }

  // Control cab floor.
  fill(dimension, origin, rotation, { x: 2, y: 18, z: 2 }, { x: 10, y: 18, z: 10 }, B.floor);

  // Glass control cab with structural corners.
  for (let y = 19; y <= 21; y++) {
    for (let x = 1; x <= 11; x++) {
      setLocal(dimension, origin, rotation, x, y, 1, (x === 1 || x === 11) ? B.frame : B.glass);
      setLocal(dimension, origin, rotation, x, y, 11, (x === 1 || x === 11) ? B.frame : B.glass);
    }
    for (let z = 2; z <= 10; z++) {
      setLocal(dimension, origin, rotation, 1, y, z, B.glass);
      setLocal(dimension, origin, rotation, 11, y, z, B.glass);
    }
  }

  // Cab consoles and recognisable workstations.
  fill(dimension, origin, rotation, { x: 3, y: 19, z: 3 }, { x: 9, y: 19, z: 3 }, I.counter);
  for (const x of [3, 5, 7, 9]) {
    setLocal(dimension, origin, rotation, x, 20, 3, I.keyboard);
    setLocal(dimension, origin, rotation, x, 20, 2, I.monitor);
  }
  setLocal(dimension, origin, rotation, 3, 19, 9, I.storage);
  setLocal(dimension, origin, rotation, 9, 19, 9, I.equipment);

  // Recessed cab lighting and radar/antenna roof.
  for (const [x, z] of [[3,3],[9,3],[3,9],[9,9],[6,6]]) setLocal(dimension, origin, rotation, x, 22, z, B.light);
  fill(dimension, origin, rotation, { x: 1, y: 22, z: 1 }, { x: 11, y: 22, z: 11 }, B.accent);
  fill(dimension, origin, rotation, { x: 5, y: 23, z: 5 }, { x: 7, y: 23, z: 7 }, B.frame);
  setLocal(dimension, origin, rotation, 6, 23, 4, B.bars);
  setLocal(dimension, origin, rotation, 6, 23, 8, B.bars);
}
