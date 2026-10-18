import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "./placement.js";
import { getPalette } from "./variants.js";
import { getInteriorBlocks } from "./interior_blocks.js";

export function createBlocks(variantId) {
  const palette = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(palette)) B[key] = BlockPermutation.resolve(id);
  B.secure = BlockPermutation.resolve("minecraft:iron_block");
  B.warning = BlockPermutation.resolve("minecraft:red_concrete");
  B.marker = BlockPermutation.resolve("minecraft:yellow_concrete");
  B.white = BlockPermutation.resolve("minecraft:white_concrete");
  B.cyan = BlockPermutation.resolve("minecraft:cyan_concrete");
  B.blue = BlockPermutation.resolve("minecraft:light_blue_concrete");
  B.dark = BlockPermutation.resolve("minecraft:deepslate_tiles");
  B.obsidian = BlockPermutation.resolve("minecraft:obsidian");
  B.road = BlockPermutation.resolve("minecraft:black_concrete");
  B.post = BlockPermutation.resolve("minecraft:stripped_oak_log");
  B.water = BlockPermutation.resolve("minecraft:light_blue_stained_glass");
  B.green = BlockPermutation.resolve("minecraft:green_concrete");
  return { B, I: getInteriorBlocks() };
}

export function setLocal(dimension, origin, rotation, size, x, y, z, permutation) {
  const location = toWorldLocation(origin, { x, y, z }, size, rotation);
  dimension.getBlock(location)?.setPermutation(permutation);
}

export function fillLocal(dimension, origin, rotation, size, from, to, permutation) {
  for (let x = from.x; x <= to.x; x++) {
    for (let y = from.y; y <= to.y; y++) {
      for (let z = from.z; z <= to.z; z++) {
        setLocal(dimension, origin, rotation, size, x, y, z, permutation);
      }
    }
  }
}

export function buildFoundation(dimension, origin, rotation, size, B) {
  fillLocal(dimension, origin, rotation, size, { x: 0, y: 0, z: 0 }, { x: size.x - 1, y: 0, z: size.z - 1 }, B.frame);
  fillLocal(dimension, origin, rotation, size, { x: 0, y: 1, z: 0 }, { x: size.x - 1, y: 1, z: size.z - 1 }, B.floor);
}

export function buildRectShell(dimension, origin, rotation, size, B, entranceFrom, entranceTo, options = {}) {
  buildFoundation(dimension, origin, rotation, size, B);
  const wallTop = options.wallTop ?? size.y - 3;
  const roofY = options.roofY ?? size.y - 2;
  const frontZ = size.z - 1;
  fillLocal(dimension, origin, rotation, size, { x: 1, y: 2, z: 1 }, { x: size.x - 2, y: wallTop, z: size.z - 2 }, B.air);

  for (let y = 2; y <= wallTop; y++) {
    for (let x = 0; x < size.x; x++) {
      const entrance = x >= entranceFrom && x <= entranceTo && y <= (options.entranceTop ?? 4);
      const rearWindow = options.windows !== false && y >= 3 && y <= 4 && x > 1 && x < size.x - 2 && x % (options.windowStep ?? 5) !== 0;
      setLocal(dimension, origin, rotation, size, x, y, frontZ, entrance ? B.air : B.wall);
      setLocal(dimension, origin, rotation, size, x, y, 0, rearWindow ? B.glass : B.wall);
    }
    for (let z = 1; z < frontZ; z++) {
      const sideWindow = options.windows !== false && y >= 3 && y <= 4 && z % (options.windowStep ?? 5) !== 0;
      setLocal(dimension, origin, rotation, size, 0, y, z, sideWindow ? B.glass : B.wall);
      setLocal(dimension, origin, rotation, size, size.x - 1, y, z, sideWindow ? B.glass : B.wall);
    }
  }

  fillLocal(dimension, origin, rotation, size, { x: 0, y: roofY, z: 0 }, { x: size.x - 1, y: roofY, z: frontZ }, B.accent);
  for (const [x, z] of [[0, 0], [size.x - 1, 0], [0, frontZ], [size.x - 1, frontZ]]) {
    fillLocal(dimension, origin, rotation, size, { x, y: 2, z }, { x, y: roofY, z }, B.frame);
  }
}

export function placeLights(dimension, origin, rotation, size, points, y, B) {
  for (const [x, z] of points) setLocal(dimension, origin, rotation, size, x, y, z, B.light);
}
