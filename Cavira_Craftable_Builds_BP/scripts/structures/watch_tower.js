import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";
import { getInteriorBlocks } from "../interior_blocks.js";

const SIZE = { x: 23, y: 64, z: 23 };
const CX = 11;
const CZ = 11;

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

function disc(dimension, origin, rotation, y, radius, permutation, hollow = false, thickness = 1) {
  const r2 = radius * radius;
  const inner = Math.max(0, radius - thickness);
  const inner2 = inner * inner;
  for (let x = CX - radius; x <= CX + radius; x++) {
    for (let z = CZ - radius; z <= CZ + radius; z++) {
      const dx = x - CX;
      const dz = z - CZ;
      const d2 = dx * dx + dz * dz;
      if (d2 > r2) continue;
      if (hollow && d2 < inner2) continue;
      setLocal(dimension, origin, rotation, x, y, z, permutation);
    }
  }
}

function cylinderShell(dimension, origin, rotation, y0, y1, radius, permutation, thickness = 1) {
  for (let y = y0; y <= y1; y++) disc(dimension, origin, rotation, y, radius, permutation, true, thickness);
}

function rotateDirection(localDirection, rotation) {
  const vectors = {
    north: { x: 0, z: -1 },
    south: { x: 0, z: 1 },
    east: { x: 1, z: 0 },
    west: { x: -1, z: 0 }
  };
  const v = vectors[localDirection];
  let out = v;
  if (rotation === "west") out = { x: -v.z, z: v.x };
  else if (rotation === "north") out = { x: -v.x, z: -v.z };
  else if (rotation === "east") out = { x: v.z, z: -v.x };

  if (out.x === 1) return "east";
  if (out.x === -1) return "west";
  if (out.z === 1) return "south";
  return "north";
}

function facingDirectionValue(direction) {
  return { north: 2, south: 3, west: 4, east: 5 }[direction] ?? 3;
}

function placeIronDoor(dimension, origin, rotation, x, y, z, hinge = false) {
  const direction = facingDirectionValue(rotateDirection("south", rotation));
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
  setLocal(dimension, origin, rotation, x, y, z, lower);
  setLocal(dimension, origin, rotation, x, y + 1, z, upper);
}

function placeLadderColumn(dimension, origin, rotation, x, z, y0, y1) {
  const facing = facingDirectionValue(rotateDirection("south", rotation));
  const ladder = BlockPermutation.resolve("minecraft:ladder", { facing_direction: facing });
  for (let y = y0; y <= y1; y++) setLocal(dimension, origin, rotation, x, y, z, ladder);
}

export function buildWatchTower(dimension, origin, rotation, variantId) {
  const p = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(p)) B[key] = BlockPermutation.resolve(id);
  const I = getInteriorBlocks();

  const white = BlockPermutation.resolve("minecraft:white_concrete");
  const red = BlockPermutation.resolve("minecraft:red_concrete");
  const dark = BlockPermutation.resolve("minecraft:deepslate_tiles");
  const iron = BlockPermutation.resolve("minecraft:iron_block");
  const plate = BlockPermutation.resolve("minecraft:stone_pressure_plate");
  const beacon = BlockPermutation.resolve("minecraft:redstone_lamp");

  // Buried foundation and broad circular base.
  disc(dimension, origin, rotation, 0, 9, B.frame);
  disc(dimension, origin, rotation, 1, 9, B.floor);
  cylinderShell(dimension, origin, rotation, 2, 7, 9, dark, 2);
  disc(dimension, origin, rotation, 7, 9, dark);

  // Ground-level entrance into a protected ladder shaft.
  fill(dimension, origin, rotation, { x: 10, y: 2, z: 18 }, { x: 12, y: 4, z: 20 }, B.air);
  fill(dimension, origin, rotation, { x: 10, y: 1, z: 18 }, { x: 12, y: 1, z: 20 }, B.floor);
  placeIronDoor(dimension, origin, rotation, 11, 2, 19, false);
  setLocal(dimension, origin, rotation, 11, 2, 18, plate);
  setLocal(dimension, origin, rotation, 11, 2, 20, plate);

  // Internal central ladder shaft. Solid rear wall supports the ladder.
  fill(dimension, origin, rotation, { x: 9, y: 2, z: 8 }, { x: 13, y: 52, z: 9 }, B.frame);
  fill(dimension, origin, rotation, { x: 10, y: 2, z: 10 }, { x: 12, y: 52, z: 12 }, B.air);
  placeLadderColumn(dimension, origin, rotation, 11, 9, 2, 52);

  // Lower striped tower body inspired by the reference build.
  for (let y = 8; y <= 30; y++) {
    const standardStripe = Math.floor((y - 8) / 4) % 2 === 0;
    const stripe = variantId === "standard" ? (standardStripe ? red : white) : (standardStripe ? B.camoA : B.wall);
    cylinderShell(dimension, origin, rotation, y, y, 6, stripe, 2);
  }

  // Intermediate observation/service ring.
  disc(dimension, origin, rotation, 31, 8, dark);
  cylinderShell(dimension, origin, rotation, 32, 35, 8, B.glass, 1);
  for (let y = 32; y <= 35; y++) {
    for (const [x, z] of [[3,11],[19,11],[11,3],[11,19]]) setLocal(dimension, origin, rotation, x, y, z, B.frame);
  }
  disc(dimension, origin, rotation, 36, 8, dark);

  // Narrow upper shaft.
  for (let y = 37; y <= 46; y++) {
    const standardStripe = Math.floor((y - 37) / 3) % 2 === 0;
    const stripe = variantId === "standard" ? (standardStripe ? white : red) : (standardStripe ? B.wall : B.camoA);
    cylinderShell(dimension, origin, rotation, y, y, 5, stripe, 2);
  }

  // Structural transition ring below the main observation deck.
  disc(dimension, origin, rotation, 47, 7, dark);
  disc(dimension, origin, rotation, 48, 8, dark);

  // Main observation floor and wraparound glazed control cab.
  disc(dimension, origin, rotation, 49, 9, B.floor);
  for (let y = 50; y <= 54; y++) {
    disc(dimension, origin, rotation, y, 9, B.glass, true, 1);
    for (const [x, z] of [[2,11],[20,11],[11,2],[11,20],[5,5],[17,5],[5,17],[17,17]]) {
      setLocal(dimension, origin, rotation, x, y, z, B.frame);
    }
  }

  // Keep the ladder access open into the observation room.
  fill(dimension, origin, rotation, { x: 10, y: 49, z: 9 }, { x: 12, y: 52, z: 12 }, B.air);
  placeLadderColumn(dimension, origin, rotation, 11, 9, 49, 52);

  // Observation consoles around the perimeter.
  for (const x of [5, 8, 11, 14, 17]) {
    setLocal(dimension, origin, rotation, x, 50, 5, I.counter);
    setLocal(dimension, origin, rotation, x, 51, 5, I.keyboard);
    setLocal(dimension, origin, rotation, x, 51, 4, I.monitor);
  }
  for (const [x, z] of [[4,11],[18,11],[11,18]]) {
    setLocal(dimension, origin, rotation, x, 50, z, I.counter);
    setLocal(dimension, origin, rotation, x, 51, z, I.keyboard);
  }
  setLocal(dimension, origin, rotation, 6, 50, 16, I.storage);
  setLocal(dimension, origin, rotation, 16, 50, 16, I.equipment);

  // Recessed lighting within the control room.
  for (const [x, z] of [[6,6],[11,6],[16,6],[6,11],[16,11],[6,16],[11,16],[16,16]]) {
    setLocal(dimension, origin, rotation, x, 55, z, B.light);
  }

  // Layered roof inspired by the stepped roof profile in the reference screenshots.
  disc(dimension, origin, rotation, 55, 10, variantId === "standard" ? white : B.wall);
  disc(dimension, origin, rotation, 56, 9, variantId === "standard" ? white : B.wall);
  disc(dimension, origin, rotation, 57, 8, variantId === "standard" ? red : B.camoA);
  disc(dimension, origin, rotation, 58, 7, variantId === "standard" ? red : B.camoA);
  disc(dimension, origin, rotation, 59, 6, variantId === "standard" ? white : B.wall);

  // Roof beacon / aircraft warning light. Ground reference to beacon top = 62 blocks.
  fill(dimension, origin, rotation, { x: 10, y: 60, z: 10 }, { x: 12, y: 61, z: 12 }, iron);
  setLocal(dimension, origin, rotation, 11, 62, 11, beacon);
}
