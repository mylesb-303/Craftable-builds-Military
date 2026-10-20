import { createBlocks, setLocal, fillLocal, buildFoundation, buildRectShell, placeLights } from "../structure_helpers.js";

function buildMarineDeck(dimension, origin, rotation, size, B, deckAreas) {
  // Marine modules deliberately place only their own blocks. The construction
  // controller skips the volume clear, so surrounding water remains intact.
  for (const area of deckAreas) {
    fillLocal(dimension, origin, rotation, size, { x: area.x1, y: 3, z: area.z1 }, { x: area.x2, y: 3, z: area.z2 }, B.frame);
    fillLocal(dimension, origin, rotation, size, { x: area.x1, y: 4, z: area.z1 }, { x: area.x2, y: 4, z: area.z2 }, B.floor);
  }
  const supportPoints = [];
  for (const area of deckAreas) {
    const supportXs = area.x2 - area.x1 > 3 ? [area.x1 + 1, area.x2 - 1] : [area.x1];
    for (const x of supportXs) {
      for (let z = area.z1 + 1; z <= area.z2; z += 8) supportPoints.push([x, z]);
    }
  }
  for (const [x, z] of supportPoints) fillLocal(dimension, origin, rotation, size, { x, y: 0, z }, { x, y: 3, z }, B.dark);
}

function addPierFurniture(dimension, origin, rotation, size, B, edgeXs = [1, size.x - 2]) {
  for (const x of edgeXs) {
    for (let z = 3; z < size.z - 2; z += 7) {
      setLocal(dimension, origin, rotation, size, x, 5, z, B.warning);
      setLocal(dimension, origin, rotation, size, x, 6, z, B.light);
    }
  }
  for (let z = 2; z < size.z - 1; z += 6) {
    setLocal(dimension, origin, rotation, size, 0, 4, z, B.dark);
    setLocal(dimension, origin, rotation, size, size.x - 1, 4, z, B.dark);
  }
}

export function buildNavalHeadquarters(dimension, origin, rotation, variantId) {
  const SIZE = { x: 27, y: 12, z: 21 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 12, 14, { wallTop: 9, roofY: 10, windowStep: 4 });
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 2, z: 10 }, { x: 25, y: 8, z: 10 }, B.wall);
  for (const x of [4, 9, 13, 17, 22]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: 10 }, { x: x + 1, y: 4, z: 10 }, B.air);
  // Fleet command room: situation table, solid display blocks and stair seating.
  fillLocal(dimension, origin, rotation, SIZE, { x: 7, y: 2, z: 3 }, { x: 19, y: 2, z: 5 }, I.counter);
  for (const x of [8, 11, 14, 17]) {
    setLocal(dimension, origin, rotation, SIZE, x, 3, 3, I.monitor);
    setLocal(dimension, origin, rotation, SIZE, x, 2, 7, I.seat);
  }
  for (const x of [4, 7, 20, 23]) {
    setLocal(dimension, origin, rotation, SIZE, x, 2, 3, I.server);
    setLocal(dimension, origin, rotation, SIZE, x, 2, 6, I.equipment);
  }
  // Administration and communications rooms behind the central corridor.
  for (const x of [3, 8, 18, 23]) {
    setLocal(dimension, origin, rotation, SIZE, x, 2, 14, I.counter);
    setLocal(dimension, origin, rotation, SIZE, x, 3, 14, I.console);
    setLocal(dimension, origin, rotation, SIZE, x, 2, 17, I.filing);
    setLocal(dimension, origin, rotation, SIZE, x, 2, 16, I.seat);
  }
  for (const x of [5, 11, 15, 21]) setLocal(dimension, origin, rotation, SIZE, x, 2, 18, I.storage);
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 6, z: 20 }, { x: 25, y: 6, z: 20 }, B.blue);
  placeLights(dimension, origin, rotation, SIZE, [[4,4],[10,4],[16,4],[22,4],[4,15],[10,15],[16,15],[22,15]], 10, B);
}

export function buildHarbourControlTower(dimension, origin, rotation, variantId) {
  const SIZE = { x: 15, y: 26, z: 15 };
  const { B, I } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  fillLocal(dimension, origin, rotation, SIZE, { x: 4, y: 2, z: 4 }, { x: 10, y: 19, z: 10 }, B.wall);
  fillLocal(dimension, origin, rotation, SIZE, { x: 5, y: 2, z: 5 }, { x: 9, y: 19, z: 9 }, B.air);
  const stair = I.seat;
  for (let y = 2; y <= 18; y++) {
    const z = 9 - ((y - 2) % 5);
    setLocal(dimension, origin, rotation, SIZE, 9, y, Math.max(5, z), stair);
    if (y % 4 === 0) setLocal(dimension, origin, rotation, SIZE, 7, y, 7, B.light);
  }
  fillLocal(dimension, origin, rotation, SIZE, { x: 2, y: 19, z: 2 }, { x: 12, y: 20, z: 12 }, B.frame);
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 21, z: 1 }, { x: 13, y: 23, z: 13 }, B.glass);
  fillLocal(dimension, origin, rotation, SIZE, { x: 2, y: 21, z: 2 }, { x: 12, y: 23, z: 12 }, B.air);
  fillLocal(dimension, origin, rotation, SIZE, { x: 0, y: 24, z: 0 }, { x: 14, y: 24, z: 14 }, B.accent);
  fillLocal(dimension, origin, rotation, SIZE, { x: 6, y: 24, z: 6 }, { x: 8, y: 25, z: 8 }, B.secure);
  for (const [x, z] of [[3,3],[7,3],[11,3],[3,7],[11,7],[3,11],[7,11],[11,11]]) {
    setLocal(dimension, origin, rotation, SIZE, x, 20, z, I.console);
    setLocal(dimension, origin, rotation, SIZE, x, 21, z, I.monitor);
    setLocal(dimension, origin, rotation, SIZE, x, 20, Math.min(12, z + 2), I.seat);
  }
  for (const [x,z] of [[3,3],[7,3],[11,3],[3,7],[11,7],[3,11],[7,11],[11,11]]) setLocal(dimension, origin, rotation, SIZE, x, 24, z, B.light);
}

export function buildPierStraight(dimension, origin, rotation, variantId) {
  const SIZE = { x: 15, y: 7, z: 31 };
  const { B } = createBlocks(variantId);
  buildMarineDeck(dimension, origin, rotation, SIZE, B, [{ x1: 0, z1: 0, x2: 14, z2: 30 }]);
  addPierFurniture(dimension, origin, rotation, SIZE, B);
  for (let z = 2; z < 30; z += 4) setLocal(dimension, origin, rotation, SIZE, 7, 4, z, B.marker);
}

export function buildPierCorner(dimension, origin, rotation, variantId) {
  const SIZE = { x: 21, y: 7, z: 21 };
  const { B } = createBlocks(variantId);
  buildMarineDeck(dimension, origin, rotation, SIZE, B, [
    { x1: 0, z1: 0, x2: 8, z2: 20 },
    { x1: 9, z1: 12, x2: 20, z2: 20 }
  ]);
  for (const [x, z] of [[1,2],[1,8],[1,14],[7,19],[13,19],[19,19]]) {
    setLocal(dimension, origin, rotation, SIZE, x, 5, z, B.warning);
    setLocal(dimension, origin, rotation, SIZE, x, 6, z, B.light);
  }
}

export function buildPierTJunction(dimension, origin, rotation, variantId) {
  const SIZE = { x: 31, y: 7, z: 21 };
  const { B } = createBlocks(variantId);
  buildMarineDeck(dimension, origin, rotation, SIZE, B, [
    { x1: 10, z1: 0, x2: 20, z2: 20 },
    { x1: 0, z1: 12, x2: 30, z2: 20 }
  ]);
  for (const [x, z] of [[1,19],[7,19],[15,19],[23,19],[29,19],[11,5],[19,5]]) {
    setLocal(dimension, origin, rotation, SIZE, x, 5, z, B.warning);
    setLocal(dimension, origin, rotation, SIZE, x, 6, z, B.light);
  }
}

export function buildHeavyShipBerth(dimension, origin, rotation, variantId) {
  const SIZE = { x: 21, y: 8, z: 41 };
  const { B } = createBlocks(variantId);
  buildMarineDeck(dimension, origin, rotation, SIZE, B, [
    { x1: 0, z1: 0, x2: 5, z2: 40 },
    { x1: 15, z1: 0, x2: 20, z2: 40 },
    { x1: 6, z1: 34, x2: 14, z2: 40 }
  ]);
  addPierFurniture(dimension, origin, rotation, SIZE, B, [1, 19]);
  for (let z = 3; z < 34; z += 7) {
    fillLocal(dimension, origin, rotation, SIZE, { x: 5, y: 4, z }, { x: 6, y: 6, z }, B.dark);
    fillLocal(dimension, origin, rotation, SIZE, { x: 14, y: 4, z }, { x: 15, y: 6, z }, B.dark);
  }
}

export function buildSubmarineServiceBerth(dimension, origin, rotation, variantId) {
  const SIZE = { x: 31, y: 8, z: 41 };
  const { B, I } = createBlocks(variantId);
  // Nineteen-block clear water channel accommodates the current submarine
  // entity with generous turning and fender clearance.
  buildMarineDeck(dimension, origin, rotation, SIZE, B, [
    { x1: 0, z1: 0, x2: 5, z2: 40 },
    { x1: 25, z1: 0, x2: 30, z2: 40 },
    { x1: 6, z1: 35, x2: 24, z2: 40 }
  ]);
  addPierFurniture(dimension, origin, rotation, SIZE, B, [1, 29]);
  for (let z = 5; z < 34; z += 8) {
    setLocal(dimension, origin, rotation, SIZE, 3, 5, z, I.equipment);
    setLocal(dimension, origin, rotation, SIZE, 27, 5, z, I.equipment);
    fillLocal(dimension, origin, rotation, SIZE, { x: 5, y: 4, z }, { x: 6, y: 6, z }, B.dark);
    fillLocal(dimension, origin, rotation, SIZE, { x: 24, y: 4, z }, { x: 25, y: 6, z }, B.dark);
  }
}

export function buildNavalFuelingPier(dimension, origin, rotation, variantId) {
  const SIZE = { x: 17, y: 9, z: 31 };
  const { B } = createBlocks(variantId);
  buildMarineDeck(dimension, origin, rotation, SIZE, B, [{ x1: 0, z1: 0, x2: 16, z2: 30 }]);
  addPierFurniture(dimension, origin, rotation, SIZE, B);
  for (const x of [5, 11]) {
    for (const z of [6, 15, 24]) {
      fillLocal(dimension, origin, rotation, SIZE, { x, y: 5, z }, { x: x + 1, y: 7, z: z + 2 }, B.secure);
      setLocal(dimension, origin, rotation, SIZE, x, 8, z + 1, B.warning);
    }
  }
  fillLocal(dimension, origin, rotation, SIZE, { x: 7, y: 5, z: 1 }, { x: 9, y: 5, z: 29 }, B.warning);
}

export function buildDryDockSide(dimension, origin, rotation, variantId) {
  const SIZE = { x: 11, y: 12, z: 41 };
  const { B } = createBlocks(variantId);
  fillLocal(dimension, origin, rotation, SIZE, { x: 0, y: 0, z: 0 }, { x: 3, y: 8, z: 40 }, B.dark);
  fillLocal(dimension, origin, rotation, SIZE, { x: 4, y: 3, z: 0 }, { x: 10, y: 4, z: 40 }, B.floor);
  for (let z = 2; z < 40; z += 6) {
    fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 9, z }, { x: 2, y: 10, z }, B.warning);
    setLocal(dimension, origin, rotation, SIZE, 2, 11, z, B.light);
  }
}

export function buildDryDockGateEnd(dimension, origin, rotation, variantId) {
  const SIZE = { x: 31, y: 12, z: 13 };
  const { B } = createBlocks(variantId);
  fillLocal(dimension, origin, rotation, SIZE, { x: 0, y: 0, z: 0 }, { x: 5, y: 8, z: 12 }, B.dark);
  fillLocal(dimension, origin, rotation, SIZE, { x: 25, y: 0, z: 0 }, { x: 30, y: 8, z: 12 }, B.dark);
  fillLocal(dimension, origin, rotation, SIZE, { x: 6, y: 0, z: 8 }, { x: 24, y: 7, z: 12 }, B.secure);
  for (const x of [2, 7, 12, 18, 23, 28]) setLocal(dimension, origin, rotation, SIZE, x, 9, 10, B.light);
  fillLocal(dimension, origin, rotation, SIZE, { x: 0, y: 10, z: 9 }, { x: 30, y: 10, z: 11 }, B.warning);
}

export function buildNuclearSubmarinePen(dimension, origin, rotation, variantId) {
  const SIZE = { x: 39, y: 24, z: 45 };
  const { B, I } = createBlocks(variantId);
  // Eight-block service galleries surround a twenty-three-block clear water
  // channel. The taller arch preserves clearance above the submarine sail.
  buildMarineDeck(dimension, origin, rotation, SIZE, B, [
    { x1: 0, z1: 0, x2: 7, z2: 44 },
    { x1: 31, z1: 0, x2: 38, z2: 44 },
    { x1: 8, z1: 0, x2: 30, z2: 6 }
  ]);
  for (let z = 0; z < 45; z++) {
    for (let y = 5; y <= 19; y++) {
      const inset = Math.max(0, Math.floor((y - 5) / 3));
      setLocal(dimension, origin, rotation, SIZE, Math.min(7 + inset, 15), y, z, B.dark);
      setLocal(dimension, origin, rotation, SIZE, Math.max(31 - inset, 23), y, z, B.dark);
    }
    for (let x = 15; x <= 23; x++) setLocal(dimension, origin, rotation, SIZE, x, 21, z, B.accent);
  }
  fillLocal(dimension, origin, rotation, SIZE, { x: 0, y: 5, z: 0 }, { x: 7, y: 19, z: 0 }, B.secure);
  fillLocal(dimension, origin, rotation, SIZE, { x: 31, y: 5, z: 0 }, { x: 38, y: 19, z: 0 }, B.secure);
  for (let z = 6; z < 43; z += 7) {
    setLocal(dimension, origin, rotation, SIZE, 4, 5, z, I.equipment);
    setLocal(dimension, origin, rotation, SIZE, 34, 5, z, I.equipment);
    setLocal(dimension, origin, rotation, SIZE, 12, 18, z, B.light);
    setLocal(dimension, origin, rotation, SIZE, 26, 18, z, B.light);
  }
}

export function buildDocksideLoadingCrane(dimension, origin, rotation, variantId) {
  const SIZE = { x: 15, y: 26, z: 17 };
  const { B, I } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  for (const x of [2, 12]) {
    fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: 3 }, { x, y: 20, z: 13 }, B.warning);
    fillLocal(dimension, origin, rotation, SIZE, { x: x - 1, y: 2, z: 2 }, { x: x + 1, y: 3, z: 14 }, B.dark);
  }
  fillLocal(dimension, origin, rotation, SIZE, { x: 2, y: 20, z: 7 }, { x: 12, y: 22, z: 9 }, B.warning);
  fillLocal(dimension, origin, rotation, SIZE, { x: 6, y: 23, z: 1 }, { x: 8, y: 23, z: 15 }, B.frame);
  fillLocal(dimension, origin, rotation, SIZE, { x: 7, y: 16, z: 12 }, { x: 7, y: 22, z: 12 }, B.bars);
  setLocal(dimension, origin, rotation, SIZE, 7, 15, 12, I.machine);
  setLocal(dimension, origin, rotation, SIZE, 7, 25, 8, B.light);
}

export function buildCoastalDefenceBunker(dimension, origin, rotation, variantId) {
  const SIZE = { x: 25, y: 10, z: 19 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 11, 13, { wallTop: 7, roofY: 8, windows: false });
  fillLocal(dimension, origin, rotation, SIZE, { x: 0, y: 2, z: 0 }, { x: 24, y: 4, z: 2 }, B.dark);
  for (const x of [4, 8, 16, 20]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 3, z: 0 }, { x: x + 1, y: 4, z: 2 }, B.air);
  fillLocal(dimension, origin, rotation, SIZE, { x: 2, y: 2, z: 7 }, { x: 22, y: 6, z: 7 }, B.wall);
  for (const x of [5, 12, 19]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: 7 }, { x: x + 1, y: 4, z: 7 }, B.air);
  for (const x of [4, 10, 16, 21]) {
    setLocal(dimension, origin, rotation, SIZE, x, 2, 4, I.console);
    setLocal(dimension, origin, rotation, SIZE, x, 3, 4, I.monitor);
  }
  placeLights(dimension, origin, rotation, SIZE, [[4,4],[12,4],[20,4],[4,12],[12,12],[20,12]], 8, B);
}

export function buildSeawallModule(dimension, origin, rotation, variantId) {
  const SIZE = { x: 21, y: 9, z: 7 };
  const { B } = createBlocks(variantId);
  fillLocal(dimension, origin, rotation, SIZE, { x: 0, y: 0, z: 0 }, { x: 20, y: 6, z: 3 }, B.dark);
  fillLocal(dimension, origin, rotation, SIZE, { x: 0, y: 4, z: 4 }, { x: 20, y: 5, z: 6 }, B.floor);
  for (let x = 1; x < 20; x += 4) {
    setLocal(dimension, origin, rotation, SIZE, x, 6, 5, B.warning);
    setLocal(dimension, origin, rotation, SIZE, x, 7, 5, B.light);
  }
  for (const x of [0, 20]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 0, z: 0 }, { x, y: 8, z: 3 }, B.frame);
}
