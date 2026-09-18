import { BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "../placement.js";
import { getPalette } from "../variants.js";
import { getInteriorBlocks } from "../interior_blocks.js";

const SIZE = { x: 21, y: 11, z: 17 };
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

function placeWorkstation(dimension, origin, rotation, x, y, z, B, I) {
  setLocal(dimension, origin, rotation, x, y, z, I.counter);
  setLocal(dimension, origin, rotation, x, y + 1, z, I.keyboard);
  setLocal(dimension, origin, rotation, x, y + 1, z - 1, I.monitor);
}

export function buildBaseHeadquarters(dimension, origin, rotation, variantId) {
  const p = getPalette(variantId);
  const B = {};
  for (const [key, id] of Object.entries(p)) B[key] = BlockPermutation.resolve(id);
  const I = getInteriorBlocks();
  B.step = BlockPermutation.resolve("minecraft:polished_andesite");
  B.rail = BlockPermutation.resolve("minecraft:iron_bars");

  // Integrated foundation and finished ground floor.
  fill(dimension, origin, rotation, { x: 0, y: 0, z: 0 }, { x: 20, y: 0, z: 16 }, B.frame);
  fill(dimension, origin, rotation, { x: 0, y: FLOOR_Y, z: 0 }, { x: 20, y: FLOOR_Y, z: 16 }, B.floor);

  // Exterior shell.
  for (let y = 2; y <= 8; y++) {
    for (let x = 0; x <= 20; x++) {
      for (const z of [0, 16]) {
        const frontDoor = z === 16 && x >= 9 && x <= 11 && y <= 4;
        const window = ((y >= 3 && y <= 4) || (y >= 6 && y <= 7)) && x % 4 !== 0;
        setLocal(dimension, origin, rotation, x, y, z, frontDoor ? B.air : window ? B.glass : B.wall);
      }
    }
    for (let z = 1; z <= 15; z++) {
      for (const x of [0, 20]) {
        const window = ((y >= 3 && y <= 4) || (y >= 6 && y <= 7)) && z % 4 !== 0;
        setLocal(dimension, origin, rotation, x, y, z, window ? B.glass : B.wall);
      }
    }
  }

  for (const [x, z] of [[0,0],[20,0],[0,16],[20,16]]) {
    fill(dimension, origin, rotation, { x, y: 2, z }, { x, y: 9, z }, B.frame);
  }

  // Second floor and roof.
  fill(dimension, origin, rotation, { x: 1, y: 5, z: 1 }, { x: 19, y: 5, z: 15 }, B.floor);
  fill(dimension, origin, rotation, { x: 0, y: 9, z: 0 }, { x: 20, y: 9, z: 16 }, B.accent);

  // Main entrance: clear three-block portal, recessed threshold and a defined internal lobby.
  fill(dimension, origin, rotation, { x: 9, y: 2, z: 15 }, { x: 11, y: 4, z: 16 }, B.air);
  fill(dimension, origin, rotation, { x: 9, y: 1, z: 14 }, { x: 11, y: 1, z: 16 }, B.frame);
  fill(dimension, origin, rotation, { x: 8, y: 5, z: 15 }, { x: 12, y: 5, z: 16 }, B.accent);

  // Dedicated stairwell opening and clearance.
  fill(dimension, origin, rotation, { x: 2, y: 5, z: 10 }, { x: 4, y: 5, z: 14 }, B.air);
  fill(dimension, origin, rotation, { x: 2, y: 6, z: 10 }, { x: 4, y: 7, z: 14 }, B.air);

  // Ground-floor corridor spine.
  for (let z = 2; z <= 14; z++) {
    setLocal(dimension, origin, rotation, 9, 2, z, B.camoA);
    setLocal(dimension, origin, rotation, 11, 2, z, B.camoA);
  }

  // Reception: desk, thin monitor panes and control panels.
  fill(dimension, origin, rotation, { x: 7, y: 2, z: 12 }, { x: 13, y: 2, z: 12 }, I.counter);
  for (const x of [8, 10, 12]) {
    setLocal(dimension, origin, rotation, x, 3, 12, I.keyboard);
    setLocal(dimension, origin, rotation, x, 3, 11, I.monitor);
  }
  setLocal(dimension, origin, rotation, 6, 2, 12, I.filing);
  setLocal(dimension, origin, rotation, 14, 2, 12, I.storage);

  // Briefing room with conference tables and lectern.
  fill(dimension, origin, rotation, { x: 2, y: 2, z: 8 }, { x: 6, y: 2, z: 8 }, I.counter);
  fill(dimension, origin, rotation, { x: 4, y: 2, z: 10 }, { x: 6, y: 2, z: 10 }, I.counter);
  setLocal(dimension, origin, rotation, 4, 2, 12, I.lectern);
  fill(dimension, origin, rotation, { x: 2, y: 3, z: 7 }, { x: 6, y: 3, z: 7 }, I.monitor);

  // Operations / situation centre: central console rows and display wall.
  for (const x of [7, 10, 13]) {
    placeWorkstation(dimension, origin, rotation, x, 2, 5, B, I);
    placeWorkstation(dimension, origin, rotation, x, 2, 7, B, I);
  }
  for (const x of [6, 8, 10, 12, 14]) setLocal(dimension, origin, rotation, x, 3, 2, I.monitor);
  setLocal(dimension, origin, rotation, 10, 2, 3, I.console);

  // Communications/server room, rear right.
  for (const x of [15, 17, 19]) {
    setLocal(dimension, origin, rotation, x, 2, 2, I.server);
    setLocal(dimension, origin, rotation, x, 2, 4, I.equipment);
    setLocal(dimension, origin, rotation, x, 2, 6, I.server);
  }

  // Stores/reference room, rear left.
  for (const z of [2, 4, 6]) {
    setLocal(dimension, origin, rotation, 2, 2, z, I.filing);
    setLocal(dimension, origin, rotation, 4, 2, z, I.storage);
  }

  // Proper internal staircase: three blocks wide, with a bottom landing,
  // a continuous rise and a generous upper landing.
  fill(dimension, origin, rotation, { x: 2, y: 2, z: 14 }, { x: 4, y: 2, z: 14 }, B.step);
  fill(dimension, origin, rotation, { x: 2, y: 2, z: 13 }, { x: 4, y: 2, z: 13 }, B.step);
  fill(dimension, origin, rotation, { x: 2, y: 3, z: 12 }, { x: 4, y: 3, z: 12 }, B.step);
  fill(dimension, origin, rotation, { x: 2, y: 4, z: 11 }, { x: 4, y: 4, z: 11 }, B.step);
  fill(dimension, origin, rotation, { x: 2, y: 5, z: 10 }, { x: 4, y: 5, z: 10 }, B.step);
  fill(dimension, origin, rotation, { x: 2, y: 5, z: 9 }, { x: 5, y: 5, z: 10 }, B.step);

  // Clear headroom above every tread.
  fill(dimension, origin, rotation, { x: 2, y: 3, z: 13 }, { x: 4, y: 4, z: 14 }, B.air);
  fill(dimension, origin, rotation, { x: 2, y: 4, z: 12 }, { x: 4, y: 5, z: 12 }, B.air);
  fill(dimension, origin, rotation, { x: 2, y: 5, z: 11 }, { x: 4, y: 6, z: 11 }, B.air);

  // Continuous guard rails on the exposed side and around the upper landing.
  for (const [y, z] of [[2,14],[2,13],[3,12],[4,11],[5,10]]) {
    setLocal(dimension, origin, rotation, 1, y, z, B.rail);
    setLocal(dimension, origin, rotation, 5, y, z, B.rail);
  }
  for (let z = 9; z <= 10; z++) setLocal(dimension, origin, rotation, 6, 6, z, B.rail);

  // Upper-floor office banks and command office.
  for (const x of [6, 10, 14, 18]) {
    placeWorkstation(dimension, origin, rotation, x, 6, 4, B, I);
  }
  fill(dimension, origin, rotation, { x: 8, y: 6, z: 11 }, { x: 12, y: 6, z: 12 }, I.counter);
  setLocal(dimension, origin, rotation, 9, 7, 11, I.keyboard);
  setLocal(dimension, origin, rotation, 11, 7, 11, I.keyboard);
  setLocal(dimension, origin, rotation, 9, 7, 10, I.monitor);
  setLocal(dimension, origin, rotation, 11, 7, 10, I.monitor);
  setLocal(dimension, origin, rotation, 17, 6, 12, I.filing);
  setLocal(dimension, origin, rotation, 18, 6, 12, I.storage);

  // Recessed lighting. Keep the whole stairwell completely clear.
  const groundLights = [[6,3],[10,3],[14,3],[17,3],[6,8],[10,8],[14,8],[17,8],[6,13],[10,13],[14,13],[17,13]];
  const upperLights = [[6,3],[10,3],[14,3],[17,3],[6,8],[10,8],[14,8],[17,8],[6,13],[10,13],[14,13],[17,13]];
  for (const [x, z] of groundLights) setLocal(dimension, origin, rotation, x, 5, z, B.light);
  for (const [x, z] of upperLights) setLocal(dimension, origin, rotation, x, 9, z, B.light);

  // Rooftop communications mast.
  fill(dimension, origin, rotation, { x: 9, y: 10, z: 7 }, { x: 11, y: 10, z: 9 }, B.frame);
  setLocal(dimension, origin, rotation, 10, 10, 8, B.bars);
}
