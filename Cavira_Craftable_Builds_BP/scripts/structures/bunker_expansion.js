import { createBlocks, setLocal, fillLocal, placeLights } from "../structure_helpers.js";

function shellBox(dimension, origin, rotation, size, from, to, block) {
  for (let x = from.x; x <= to.x; x++) for (let z = from.z; z <= to.z; z++) {
    setLocal(dimension, origin, rotation, size, x, from.y, z, block);
    setLocal(dimension, origin, rotation, size, x, to.y, z, block);
  }
  for (let y = from.y + 1; y < to.y; y++) {
    for (let x = from.x; x <= to.x; x++) {
      setLocal(dimension, origin, rotation, size, x, y, from.z, block);
      setLocal(dimension, origin, rotation, size, x, y, to.z, block);
    }
    for (let z = from.z + 1; z < to.z; z++) {
      setLocal(dimension, origin, rotation, size, from.x, y, z, block);
      setLocal(dimension, origin, rotation, size, to.x, y, z, block);
    }
  }
}

function buildObsidianEnvelope(dimension, origin, rotation, size, from, to, B) {
  shellBox(dimension, origin, rotation, size, from, to, B.obsidian);
  const inner = {
    from: { x: from.x + 1, y: from.y + 1, z: from.z + 1 },
    to: { x: to.x - 1, y: to.y - 1, z: to.z - 1 }
  };
  shellBox(dimension, origin, rotation, size, inner.from, inner.to, B.secure);
  fillLocal(dimension, origin, rotation, size,
    { x: inner.from.x + 1, y: inner.from.y + 1, z: inner.from.z + 1 },
    { x: inner.to.x - 1, y: inner.to.y - 1, z: inner.to.z - 1 }, B.air);
}

function buildAccessShaft(dimension, origin, rotation, size, x1, z1, x2, z2, bottom, top, B) {
  shellBox(dimension, origin, rotation, size,
    { x: x1, y: bottom, z: z1 }, { x: x2, y: top, z: z2 }, B.obsidian);
  shellBox(dimension, origin, rotation, size,
    { x: x1 + 1, y: bottom + 1, z: z1 + 1 }, { x: x2 - 1, y: top - 1, z: z2 - 1 }, B.secure);
  fillLocal(dimension, origin, rotation, size,
    { x: x1 + 2, y: bottom + 2, z: z1 + 2 }, { x: x2 - 2, y: top, z: z2 - 2 }, B.air);
  for (let y = bottom + 2; y <= top; y += 3) setLocal(dimension, origin, rotation, size, x1 + 2, y, z1 + 2, B.light);
}

function buildSurfaceEntrance(dimension, origin, rotation, size, cx, y, frontZ, B) {
  fillLocal(dimension, origin, rotation, size, { x: cx - 4, y, z: frontZ - 4 }, { x: cx + 4, y: y + 2, z: frontZ }, B.dark);
  fillLocal(dimension, origin, rotation, size, { x: cx - 3, y: y + 1, z: frontZ - 3 }, { x: cx + 3, y: y + 2, z: frontZ - 1 }, B.air);
  fillLocal(dimension, origin, rotation, size, { x: cx - 1, y, z: frontZ }, { x: cx + 1, y: y + 2, z: frontZ }, B.air);
  setLocal(dimension, origin, rotation, size, cx, y + 2, frontZ - 3, B.light);
}

function wallWithDoor(dimension, origin, rotation, size, axis, at, start, end, y1, y2, doorAt, B) {
  if (axis === "x") {
    fillLocal(dimension, origin, rotation, size, { x: at, y: y1, z: start }, { x: at, y: y2, z: end }, B.wall);
    fillLocal(dimension, origin, rotation, size, { x: at, y: y1, z: doorAt }, { x: at, y: y1 + 2, z: doorAt + 1 }, B.air);
  } else {
    fillLocal(dimension, origin, rotation, size, { x: start, y: y1, z: at }, { x: end, y: y2, z: at }, B.wall);
    fillLocal(dimension, origin, rotation, size, { x: doorAt, y: y1, z: at }, { x: doorAt + 1, y: y1 + 2, z: at }, B.air);
  }
}

function commandStations(dimension, origin, rotation, size, xs, z, y, I) {
  for (const x of xs) {
    setLocal(dimension, origin, rotation, size, x, y, z, I.console);
    setLocal(dimension, origin, rotation, size, x, y + 1, z, I.monitor);
  }
}

function bunkRow(dimension, origin, rotation, size, xs, zs, y, B, I) {
  for (const x of xs) for (const z of zs) {
    fillLocal(dimension, origin, rotation, size, { x, y, z }, { x: x + 2, y, z }, B.white);
    setLocal(dimension, origin, rotation, size, x + 2, y + 1, z, I.locker);
  }
}

export function buildSmallNuclearBunker(dimension, origin, rotation, variantId) {
  const SIZE = { x: 23, y: 20, z: 19 };
  const { B, I } = createBlocks(variantId);
  buildObsidianEnvelope(dimension, origin, rotation, SIZE, { x: 1, y: 1, z: 1 }, { x: 21, y: 10, z: 17 }, B);
  buildAccessShaft(dimension, origin, rotation, SIZE, 8, 13, 14, 18, 7, 18, B);
  buildAccessShaft(dimension, origin, rotation, SIZE, 16, 1, 21, 6, 7, 18, B);
  buildSurfaceEntrance(dimension, origin, rotation, SIZE, 11, 17, 18, B);
  wallWithDoor(dimension, origin, rotation, SIZE, "x", 8, 3, 15, 3, 8, 8, B);
  wallWithDoor(dimension, origin, rotation, SIZE, "z", 9, 3, 19, 3, 8, 10, B);
  commandStations(dimension, origin, rotation, SIZE, [3, 5, 7], 4, 3, I);
  bunkRow(dimension, origin, rotation, SIZE, [10, 14], [5, 8], 3, B, I);
  for (const x of [4, 6]) setLocal(dimension, origin, rotation, SIZE, x, 3, 12, I.storage);
  for (const x of [10, 12, 14]) setLocal(dimension, origin, rotation, SIZE, x, 3, 12, I.machine);
  placeLights(dimension, origin, rotation, SIZE, [[4,5],[11,5],[17,5],[4,12],[11,12],[17,12]], 9, B);
}

export function buildMediumNuclearBunker(dimension, origin, rotation, variantId) {
  const SIZE = { x: 31, y: 25, z: 25 };
  const { B, I } = createBlocks(variantId);
  buildObsidianEnvelope(dimension, origin, rotation, SIZE, { x: 1, y: 1, z: 1 }, { x: 29, y: 13, z: 23 }, B);
  buildAccessShaft(dimension, origin, rotation, SIZE, 12, 18, 18, 24, 10, 23, B);
  buildAccessShaft(dimension, origin, rotation, SIZE, 23, 1, 29, 7, 10, 23, B);
  buildSurfaceEntrance(dimension, origin, rotation, SIZE, 15, 22, 24, B);
  wallWithDoor(dimension, origin, rotation, SIZE, "x", 10, 3, 21, 3, 11, 11, B);
  wallWithDoor(dimension, origin, rotation, SIZE, "x", 20, 3, 21, 3, 11, 6, B);
  wallWithDoor(dimension, origin, rotation, SIZE, "z", 10, 3, 27, 3, 11, 14, B);
  wallWithDoor(dimension, origin, rotation, SIZE, "z", 16, 3, 27, 3, 11, 5, B);
  commandStations(dimension, origin, rotation, SIZE, [12, 15, 18], 5, 3, I);
  fillLocal(dimension, origin, rotation, SIZE, { x: 12, y: 3, z: 7 }, { x: 18, y: 3, z: 8 }, I.counter);
  bunkRow(dimension, origin, rotation, SIZE, [3, 6], [12, 15, 18], 3, B, I);
  for (const [x,z] of [[22,4],[25,4],[22,7],[25,7]]) setLocal(dimension, origin, rotation, SIZE, x, 3, z, I.storage);
  for (const [x,z] of [[22,12],[25,12],[22,15],[25,15]]) setLocal(dimension, origin, rotation, SIZE, x, 3, z, I.machine);
  for (const x of [12,15,18]) setLocal(dimension, origin, rotation, SIZE, x, 3, 19, I.server);
  placeLights(dimension, origin, rotation, SIZE, [[5,5],[15,5],[25,5],[5,13],[15,13],[25,13],[5,20],[15,20],[25,20]], 12, B);
}

export function buildLargeNuclearBunker(dimension, origin, rotation, variantId) {
  const SIZE = { x: 41, y: 31, z: 33 };
  const { B, I } = createBlocks(variantId);
  buildObsidianEnvelope(dimension, origin, rotation, SIZE, { x: 1, y: 1, z: 1 }, { x: 39, y: 19, z: 31 }, B);
  fillLocal(dimension, origin, rotation, SIZE, { x: 3, y: 10, z: 3 }, { x: 37, y: 11, z: 29 }, B.secure);
  buildAccessShaft(dimension, origin, rotation, SIZE, 17, 25, 23, 32, 16, 29, B);
  buildAccessShaft(dimension, origin, rotation, SIZE, 33, 1, 39, 7, 16, 29, B);
  buildSurfaceEntrance(dimension, origin, rotation, SIZE, 20, 28, 32, B);
  for (const y of [3, 12]) {
    wallWithDoor(dimension, origin, rotation, SIZE, "x", 13, 3, 29, y, y + 6, 15, B);
    wallWithDoor(dimension, origin, rotation, SIZE, "x", 27, 3, 29, y, y + 6, 8, B);
    wallWithDoor(dimension, origin, rotation, SIZE, "z", 16, 3, 37, y, y + 6, 19, B);
  }
  commandStations(dimension, origin, rotation, SIZE, [15,18,21,24,27], 5, 12, I);
  fillLocal(dimension, origin, rotation, SIZE, { x: 15, y: 12, z: 8 }, { x: 25, y: 12, z: 10 }, I.counter);
  bunkRow(dimension, origin, rotation, SIZE, [3,7,11], [18,22,26], 12, B, I);
  for (let x = 3; x <= 11; x += 2) setLocal(dimension, origin, rotation, SIZE, x, 3, 5, I.server);
  for (let x = 15; x <= 25; x += 3) setLocal(dimension, origin, rotation, SIZE, x, 3, 20, I.storage);
  for (let x = 29; x <= 36; x += 2) setLocal(dimension, origin, rotation, SIZE, x, 3, 5, I.machine);
  for (const y of [9,18]) placeLights(dimension, origin, rotation, SIZE, [[6,6],[20,6],[34,6],[6,20],[20,20],[34,20],[6,27],[20,27],[34,27]], y, B);
}

export function buildStrategicOperationsBunker(dimension, origin, rotation, variantId) {
  const SIZE = { x: 51, y: 37, z: 41 };
  const { B, I } = createBlocks(variantId);
  buildObsidianEnvelope(dimension, origin, rotation, SIZE, { x: 1, y: 1, z: 1 }, { x: 49, y: 25, z: 39 }, B);
  fillLocal(dimension, origin, rotation, SIZE, { x: 3, y: 9, z: 3 }, { x: 47, y: 10, z: 37 }, B.secure);
  fillLocal(dimension, origin, rotation, SIZE, { x: 3, y: 17, z: 3 }, { x: 47, y: 18, z: 37 }, B.secure);
  buildAccessShaft(dimension, origin, rotation, SIZE, 22, 33, 28, 40, 22, 35, B);
  buildAccessShaft(dimension, origin, rotation, SIZE, 3, 1, 9, 8, 22, 35, B);
  buildAccessShaft(dimension, origin, rotation, SIZE, 42, 1, 48, 8, 22, 35, B);
  buildSurfaceEntrance(dimension, origin, rotation, SIZE, 25, 34, 40, B);
  buildSurfaceEntrance(dimension, origin, rotation, SIZE, 6, 34, 8, B);
  for (const y of [3, 11, 19]) {
    wallWithDoor(dimension, origin, rotation, SIZE, "x", 16, 3, 37, y, y + 5, 18, B);
    wallWithDoor(dimension, origin, rotation, SIZE, "x", 34, 3, 37, y, y + 5, 12, B);
    wallWithDoor(dimension, origin, rotation, SIZE, "z", 14, 3, 47, y, y + 5, 24, B);
    wallWithDoor(dimension, origin, rotation, SIZE, "z", 27, 3, 47, y, y + 5, 8, B);
  }
  // Strategic command floor: central situation table, joint-service consoles and servers.
  fillLocal(dimension, origin, rotation, SIZE, { x: 20, y: 19, z: 16 }, { x: 30, y: 19, z: 23 }, I.counter);
  for (const [x,z] of [[18,16],[25,12],[32,16],[18,24],[25,27],[32,24]]) {
    setLocal(dimension, origin, rotation, SIZE, x, 19, z, I.console);
    setLocal(dimension, origin, rotation, SIZE, x, 20, z, I.monitor);
  }
  for (let x = 36; x <= 46; x += 2) for (const z of [5,8,11]) setLocal(dimension, origin, rotation, SIZE, x, 19, z, I.server);
  // Accommodation, medical and briefing level.
  bunkRow(dimension, origin, rotation, SIZE, [4,8,12], [17,21,25], 11, B, I);
  fillLocal(dimension, origin, rotation, SIZE, { x: 19, y: 11, z: 5 }, { x: 31, y: 11, z: 8 }, I.counter);
  for (const [x,z] of [[36,17],[40,17],[44,17],[36,22],[40,22],[44,22]]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 11, z }, { x: x + 2, y: 11, z }, B.white);
  // Power, water, filtration, workshops and secure stores on the lowest level.
  for (let x = 4; x <= 14; x += 2) setLocal(dimension, origin, rotation, SIZE, x, 3, 5, I.machine);
  for (let x = 19; x <= 31; x += 3) setLocal(dimension, origin, rotation, SIZE, x, 3, 7, B.water);
  for (let x = 36; x <= 46; x += 2) setLocal(dimension, origin, rotation, SIZE, x, 3, 5, I.storage);
  for (const y of [8,16,24]) placeLights(dimension, origin, rotation, SIZE, [[7,7],[25,7],[43,7],[7,20],[25,20],[43,20],[7,34],[25,34],[43,34]], y, B);
}
