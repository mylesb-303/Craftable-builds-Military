import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";
import { getInteriorBlocks } from "../interior_blocks.js";

const SIZE = { x: 25, y: 10, z: 9 };
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

function rotatedDoorDirection(rotation, baseDirection = 0) {
  const turns = { south: 0, west: 1, north: 2, east: 3 }[rotation] ?? 0;
  return (baseDirection + turns) % 4;
}

function placeIronDoor(dimension, origin, rotation, x, z, hinge = false, baseDirection = 0) {
  const direction = rotatedDoorDirection(rotation, baseDirection);
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

  // Large checkpoint foundation: 25 wide x 9 deep.
  fill(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 24, y: 0, z: 8 }, B.frame);
  fill(dimension, origin, rotation, { x: 0, y: FLOOR_Y, z: 0 }, { x: 24, y: FLOOR_Y, z: 8 }, B.floor);

  // Two larger staffed guard buildings.
  const booths = [
    { x0: 0, x1: 5, doorX: 5, innerX: 2, hinge: false },
    { x0: 19, x1: 24, doorX: 19, innerX: 22, hinge: true }
  ];

  for (const booth of booths) {
    const { x0, x1, doorX, innerX, hinge } = booth;

    // Full exterior shell first.
    for (let y = 2; y <= 6; y++) {
      for (let x = x0; x <= x1; x++) {
        const frontWindow = y >= 3 && y <= 5 && x > x0 && x < x1;
        setLocal(dimension, origin, rotation, x, y, 0, frontWindow ? B.glass : B.wall);
        setLocal(dimension, origin, rotation, x, y, 8, frontWindow ? B.glass : B.wall);
      }

      for (let z = 1; z <= 7; z++) {
        const sideWindow = y >= 3 && y <= 5 && z >= 2 && z <= 6;
        setLocal(dimension, origin, rotation, x0, y, z, sideWindow ? B.glass : B.wall);
        setLocal(dimension, origin, rotation, x1, y, z, sideWindow ? B.glass : B.wall);
      }
    }

    // Roof and recessed light.
    fill(dimension, origin, rotation, { x: x0, y: 7, z: 0 }, { x: x1, y: 7, z: 8 }, B.accent);
    setLocal(dimension, origin, rotation, innerX, 7, 4, B.light);

    // Furnished booth interior.
    fill(dimension, origin, rotation, { x: innerX - 1, y: 2, z: 2 }, { x: innerX + 1, y: 2, z: 2 }, I.counter);
    setLocal(dimension, origin, rotation, innerX, 3, 2, I.keyboard);
    setLocal(dimension, origin, rotation, innerX, 3, 1, I.monitor);
    setLocal(dimension, origin, rotation, innerX, 2, 6, I.storage);
    setLocal(dimension, origin, rotation, innerX, 4, 6, I.equipment);

    // Proper personnel doorway cut directly into the lane-facing wall.
    fill(dimension, origin, rotation, { x: doorX, y: 2, z: 4 }, { x: doorX, y: 4, z: 4 }, B.air);
    placeIronDoor(dimension, origin, rotation, doorX, 4, hinge, doorX < 12 ? 1 : 3);

    // Keep wall around the door intact, but clear both immediate approach blocks.
    const laneStepX = doorX < 12 ? doorX + 1 : doorX - 1;
    const roomStepX = doorX < 12 ? doorX - 1 : doorX + 1;
    fill(dimension, origin, rotation, { x: laneStepX, y: 2, z: 4 }, { x: laneStepX, y: 3, z: 4 }, B.air);
    fill(dimension, origin, rotation, { x: roomStepX, y: 2, z: 4 }, { x: roomStepX, y: 3, z: 4 }, B.air);
    // Pressure plates are placed after all corridor-clearing passes below,
    // otherwise the lane-side plate is erased by the vehicle tunnel clear.
  }

  // Wide 13-block vehicle corridor between the buildings (x 6..18).
  // Keep the entire lane open from ground to gantry clearance.
  fill(dimension, origin, rotation, { x: 6, y: 2, z: 0 }, { x: 18, y: 6, z: 8 }, B.air);

  // Lane markings for two-way vehicles.
  for (let z = 0; z <= 8; z++) {
    setLocal(dimension, origin, rotation, 9, FLOOR_Y, z, B.camoA);
    setLocal(dimension, origin, rotation, 15, FLOOR_Y, z, B.camoA);
    if (z % 2 === 0) setLocal(dimension, origin, rotation, 12, FLOOR_Y, z, B.light);
  }

  // Gantry columns sit outside the usable vehicle corridor.
  fill(dimension, origin, rotation, { x: 6, y: 2, z: 0 }, { x: 6, y: 7, z: 1 }, B.frame);
  fill(dimension, origin, rotation, { x: 18, y: 2, z: 0 }, { x: 18, y: 7, z: 1 }, B.frame);
  fill(dimension, origin, rotation, { x: 6, y: 2, z: 7 }, { x: 6, y: 7, z: 8 }, B.frame);
  fill(dimension, origin, rotation, { x: 18, y: 2, z: 7 }, { x: 18, y: 7, z: 8 }, B.frame);

  // High overhead security gantry gives tall vehicles generous clearance.
  fill(dimension, origin, rotation, { x: 6, y: 8, z: 0 }, { x: 18, y: 9, z: 8 }, B.accent);
  for (const x of [8, 12, 16]) {
    setLocal(dimension, origin, rotation, x, 8, 2, B.light);
    setLocal(dimension, origin, rotation, x, 8, 6, B.light);
  }

  // Re-open the full driving tunnel after placing gantry supports, except the four outer corner columns.
  fill(dimension, origin, rotation, { x: 7, y: 2, z: 0 }, { x: 17, y: 7, z: 8 }, B.air);

  // Place both personnel-door pressure plates LAST so neither is deleted.
  // Doors themselves are created with open_bit:false, so they spawn closed.
  for (const booth of booths) {
    const laneStepX = booth.doorX < 12 ? booth.doorX + 1 : booth.doorX - 1;
    const roomStepX = booth.doorX < 12 ? booth.doorX - 1 : booth.doorX + 1;
    setLocal(dimension, origin, rotation, laneStepX, FLOOR_Y + 1, 4, pressurePlate);
    setLocal(dimension, origin, rotation, roomStepX, FLOOR_Y + 1, 4, pressurePlate);
  }
}
