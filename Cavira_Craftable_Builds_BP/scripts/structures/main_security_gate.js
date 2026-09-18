import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";
import { getInteriorBlocks } from "../interior_blocks.js";

const SIZE = { x: 15, y: 8, z: 5 };
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

function rotatedDoorDirection(rotation, baseDirection = 1) {
  const turns = { south: 0, west: 1, north: 2, east: 3 }[rotation] ?? 0;
  return (baseDirection + turns) % 4;
}

function placeIronDoor(dimension, origin, rotation, x, z, hinge = false) {
  const direction = rotatedDoorDirection(rotation, 1);
  const lower = BlockPermutation.resolve("minecraft:iron_door", {
    direction,
    door_hinge_bit: hinge,
    open_bit: false,
    upper_block_bit: false
  });
  const upper = BlockPermutation.resolve("minecraft:iron_door", {
    direction,
    door_hinge_bit: hinge,
    open_bit: false,
    upper_block_bit: true
  });
  setLocal(dimension, origin, rotation, x, 2, z, lower);
  setLocal(dimension, origin, rotation, x, 3, z, upper);
}

export function buildMainSecurityGate(dimension, origin, rotation, variantId) {
  const p = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(p)) B[key] = BlockPermutation.resolve(id);
  const I = getInteriorBlocks();
  const pressurePlate = BlockPermutation.resolve("minecraft:stone_pressure_plate");

  // Buried strip foundation and finished roadway/floor.
  fill(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 14, y: 0, z: 4 }, B.frame);
  fill(dimension, origin, rotation, { x: 0, y: FLOOR_Y, z: 0 }, { x: 14, y: FLOOR_Y, z: 4 }, B.floor);

  // Twin checkpoint buildings.
  for (const [x0, x1] of [[0, 3], [11, 14]]) {
    for (let y = 2; y <= 5; y++) {
      for (let x = x0; x <= x1; x++) {
        setLocal(dimension, origin, rotation, x, y, 0, y >= 3 && y <= 4 && x > x0 && x < x1 ? B.glass : B.wall);
        setLocal(dimension, origin, rotation, x, y, 4, y >= 3 && y <= 4 && x > x0 && x < x1 ? B.glass : B.wall);
      }
      for (let z = 1; z <= 3; z++) {
        setLocal(dimension, origin, rotation, x0, y, z, y >= 3 && y <= 4 ? B.glass : B.wall);
        setLocal(dimension, origin, rotation, x1, y, z, y >= 3 && y <= 4 ? B.glass : B.wall);
      }
    }
    fill(dimension, origin, rotation, { x: x0, y: 6, z: 0 }, { x: x1, y: 6, z: 4 }, B.accent);

    // Realistic staffed booth: counter, thin screen, control panel, storage and recessed light.
    const innerX = x0 === 0 ? 1 : 13;
    setLocal(dimension, origin, rotation, innerX, 2, 1, I.counter);
    setLocal(dimension, origin, rotation, innerX, 3, 1, I.keyboard);
    setLocal(dimension, origin, rotation, innerX, 3, 2, I.monitor);
    setLocal(dimension, origin, rotation, innerX, 2, 3, I.storage);
    setLocal(dimension, origin, rotation, innerX, 4, 3, I.equipment);
    setLocal(dimension, origin, rotation, innerX, 6, 2, B.light);
  }

  // Personnel doors from the vehicle lane into both checkpoint rooms.
  setLocal(dimension, origin, rotation, 3, 2, 2, B.air);
  setLocal(dimension, origin, rotation, 3, 3, 2, B.air);
  setLocal(dimension, origin, rotation, 11, 2, 2, B.air);
  setLocal(dimension, origin, rotation, 11, 3, 2, B.air);
  placeIronDoor(dimension, origin, rotation, 3, 2, false);
  placeIronDoor(dimension, origin, rotation, 11, 2, true);

  // Pressure plates on both sides make the doors usable without redstone wiring.
  for (const [x, z] of [[2,2],[4,2],[10,2],[12,2]]) {
    setLocal(dimension, origin, rotation, x, FLOOR_Y + 1, z, pressurePlate);
  }

  // Gate pillars and overhead gantry.
  fill(dimension, origin, rotation, { x: 4, y: 2, z: 1 }, { x: 5, y: 6, z: 3 }, B.frame);
  fill(dimension, origin, rotation, { x: 9, y: 2, z: 1 }, { x: 10, y: 6, z: 3 }, B.frame);
  fill(dimension, origin, rotation, { x: 4, y: 6, z: 1 }, { x: 10, y: 7, z: 3 }, B.accent);

  // Open vehicle lane markings and flush overhead illumination.
  for (const x of [6, 8]) {
    for (let z = 0; z <= 4; z++) setLocal(dimension, origin, rotation, x, FLOOR_Y, z, B.camoA);
  }
  for (const x of [5, 7, 9]) setLocal(dimension, origin, rotation, x, 6, 2, B.light);
}
