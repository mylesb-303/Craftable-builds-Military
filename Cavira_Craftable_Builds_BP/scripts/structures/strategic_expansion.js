import { createBlocks, setLocal, fillLocal, buildFoundation, buildRectShell, placeLights } from "../structure_helpers.js";

function buildMast(dimension, origin, rotation, size, cx, cz, fromY, toY, B) {
  for (let y = fromY; y <= toY; y++) {
    const block = y % 3 === 0 ? B.secure : B.dark;
    setLocal(dimension, origin, rotation, size, cx, y, cz, block);
    for (const [dx, dz] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      setLocal(dimension, origin, rotation, size, cx + dx, y, cz + dz, y % 2 === 0 ? B.bars : B.air);
    }
  }
}

function buildRadarPanel(dimension, origin, rotation, size, fromX, toX, fromY, toY, z, B) {
  for (let x = fromX; x <= toX; x++) for (let y = fromY; y <= toY; y++) {
    const border = x === fromX || x === toX || y === fromY || y === toY;
    const grid = (x - fromX) % 4 === 0 || (y - fromY) % 3 === 0;
    setLocal(dimension, origin, rotation, size, x, y, z, border ? B.dark : grid ? B.frame : B.secure);
  }
  const centreX = Math.floor((fromX + toX) / 2);
  fillLocal(dimension, origin, rotation, size, { x: centreX - 1, y: fromY - 1, z }, { x: centreX + 1, y: fromY, z }, B.warning);
  for (const x of [fromX, toX]) setLocal(dimension, origin, rotation, size, x, toY, z, B.light);
}

function buildDish(dimension, origin, rotation, size, cx, cy, cz, radius, B) {
  // A vertical, slightly upward-facing stepped parabola. The centre is recessed
  // and the rim projects forward, producing a readable vanilla-block dish.
  for (let dx = -radius; dx <= radius; dx++) for (let dy = -radius; dy <= radius; dy++) {
    const squared = dx * dx + dy * dy;
    if (squared > radius * radius) continue;
    const depth = Math.round((radius * radius - squared) / Math.max(2, radius * 2));
    const x = cx + dx;
    const y = cy + dy;
    const z = cz - depth;
    const rim = squared >= (radius - 1) * (radius - 1);
    setLocal(dimension, origin, rotation, size, x, y, z, rim ? B.dark : B.white);
  }
  const feedZ = Math.min(size.z - 2, cz + Math.max(2, Math.floor(radius / 2)));
  fillLocal(dimension, origin, rotation, size, { x: cx, y: cy, z: cz }, { x: cx, y: cy, z: feedZ }, B.dark);
  setLocal(dimension, origin, rotation, size, cx, cy, feedZ, B.light);

  // Three articulated support arms from the bowl to the receiver.
  for (const [sx, sy] of [[cx - radius + 1, cy], [cx + radius - 1, cy], [cx, cy + radius - 1]]) {
    const steps = Math.max(Math.abs(sx - cx), Math.abs(sy - cy), 1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(sx + (cx - sx) * t);
      const y = Math.round(sy + (cy - sy) * t);
      const z = Math.round(cz + (feedZ - cz) * t);
      setLocal(dimension, origin, rotation, size, x, y, z, B.dark);
    }
  }
}

function buildPedestal(dimension, origin, rotation, size, cx, cz, baseY, topY, radius, B) {
  for (let x = cx - radius; x <= cx + radius; x++) for (let z = cz - radius; z <= cz + radius; z++) {
    const distance = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
    if (distance <= radius) {
      setLocal(dimension, origin, rotation, size, x, baseY, z, B.frame);
      if (distance >= radius - 0.8) for (let y = baseY + 1; y <= Math.min(topY, baseY + 2); y++) setLocal(dimension, origin, rotation, size, x, y, z, B.dark);
    }
  }
  fillLocal(dimension, origin, rotation, size, { x: cx - 1, y: baseY + 1, z: cz - 1 }, { x: cx + 1, y: topY, z: cz + 1 }, B.secure);
  for (let y = baseY + 2; y <= topY; y += 3) setLocal(dimension, origin, rotation, size, cx, y, cz + 2, B.light);
}

function furnishOperationsRoom(dimension, origin, rotation, size, y, z, xs, I) {
  for (const x of xs) {
    setLocal(dimension, origin, rotation, size, x, y, z, I.console);
    setLocal(dimension, origin, rotation, size, x, y + 1, z, I.monitor);
  }
}

export function buildSmallTacticalRadarPost(dimension, origin, rotation, variantId) {
  const SIZE = { x: 15, y: 12, z: 15 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 6, 8, { wallTop: 5, roofY: 6, windows: false });
  furnishOperationsRoom(dimension, origin, rotation, SIZE, 2, 3, [4,7,10], I);
  for (const x of [3,11]) setLocal(dimension, origin, rotation, SIZE, x, 2, 9, I.machine);
  buildMast(dimension, origin, rotation, SIZE, 7, 7, 7, 9, B);
  buildRadarPanel(dimension, origin, rotation, SIZE, 2, 12, 8, 11, 7, B);
  for (const [x,z] of [[1,1],[13,1],[1,13],[13,13]]) setLocal(dimension, origin, rotation, SIZE, x, 3, z, B.light);
}

export function buildMediumRadarStation(dimension, origin, rotation, variantId) {
  const SIZE = { x: 25, y: 18, z: 21 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 10, 14, { wallTop: 7, roofY: 8, windows: false });
  wallRoom(dimension, origin, rotation, SIZE, 8, B);
  furnishOperationsRoom(dimension, origin, rotation, SIZE, 2, 4, [3,6,10,14,18,21], I);
  for (const x of [3,6,18,21]) setLocal(dimension, origin, rotation, SIZE, x, 2, 13, I.server);
  buildMast(dimension, origin, rotation, SIZE, 12, 10, 9, 13, B);
  buildRadarPanel(dimension, origin, rotation, SIZE, 3, 21, 12, 17, 10, B);
  for (const [x,z] of [[2,2],[22,2],[2,18],[22,18]]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z }, { x, y: 5, z }, B.post);
  placeLights(dimension, origin, rotation, SIZE, [[2,2],[22,2],[2,18],[22,18],[6,6],[18,6],[6,15],[18,15]], 8, B);
}

function wallRoom(dimension, origin, rotation, size, yTop, B) {
  const middle = Math.floor(size.z / 2);
  fillLocal(dimension, origin, rotation, size, { x: 1, y: 2, z: middle }, { x: size.x - 2, y: yTop, z: middle }, B.wall);
  const centre = Math.floor(size.x / 2);
  fillLocal(dimension, origin, rotation, size, { x: centre - 1, y: 2, z: middle }, { x: centre + 1, y: 4, z: middle }, B.air);
}

export function buildLargeEarlyWarningRadarComplex(dimension, origin, rotation, variantId) {
  const SIZE = { x: 39, y: 28, z: 33 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 17, 21, { wallTop: 11, roofY: 12, windows: false, entranceTop: 5 });
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 7, z: 1 }, { x: 37, y: 7, z: 31 }, B.floor);
  for (const y of [2,8]) {
    furnishOperationsRoom(dimension, origin, rotation, SIZE, y, 5, [4,8,12,17,21,26,30,34], I);
    for (const x of [4,7,31,34]) setLocal(dimension, origin, rotation, SIZE, x, y, 18, I.server);
  }
  buildMast(dimension, origin, rotation, SIZE, 19, 15, 13, 20, B);
  buildRadarPanel(dimension, origin, rotation, SIZE, 4, 34, 19, 27, 15, B);
  for (const [x,z] of [[5,5],[33,5],[5,27],[33,27]]) {
    fillLocal(dimension, origin, rotation, SIZE, { x, y: 13, z }, { x, y: 22, z }, B.dark);
    setLocal(dimension, origin, rotation, SIZE, x, 23, z, B.light);
  }
  placeLights(dimension, origin, rotation, SIZE, [[4,4],[19,4],[34,4],[4,26],[19,26],[34,26]], 12, B);
}

export function buildSmallCommunicationsDishStation(dimension, origin, rotation, variantId) {
  const SIZE = { x: 13, y: 14, z: 13 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 5, 7, { wallTop: 4, roofY: 5, windows: false });
  furnishOperationsRoom(dimension, origin, rotation, SIZE, 2, 3, [3,6,9], I);
  buildPedestal(dimension, origin, rotation, SIZE, 6, 6, 6, 8, 2, B);
  buildDish(dimension, origin, rotation, SIZE, 6, 9, 6, 4, B);
  for (const [x,z] of [[1,1],[11,1],[1,11],[11,11]]) setLocal(dimension, origin, rotation, SIZE, x, 3, z, B.light);
}

export function buildMediumSatelliteDishStation(dimension, origin, rotation, variantId) {
  const SIZE = { x: 23, y: 24, z: 23 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 9, 13, { wallTop: 7, roofY: 8, windows: false });
  wallRoom(dimension, origin, rotation, SIZE, 7, B);
  furnishOperationsRoom(dimension, origin, rotation, SIZE, 2, 4, [3,6,10,14,17,20], I);
  for (const x of [3,6,17,20]) setLocal(dimension, origin, rotation, SIZE, x, 2, 15, I.server);
  buildPedestal(dimension, origin, rotation, SIZE, 11, 11, 9, 14, 4, B);
  buildDish(dimension, origin, rotation, SIZE, 11, 15, 11, 8, B);
  placeLights(dimension, origin, rotation, SIZE, [[2,2],[20,2],[2,20],[20,20],[7,7],[15,7],[7,15],[15,15]], 8, B);
}

export function buildLargeStrategicSatelliteArray(dimension, origin, rotation, variantId) {
  const SIZE = { x: 37, y: 36, z: 37 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 16, 20, { wallTop: 10, roofY: 11, windows: false, entranceTop: 5 });
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 6, z: 1 }, { x: 35, y: 6, z: 35 }, B.floor);
  for (const y of [2,7]) {
    furnishOperationsRoom(dimension, origin, rotation, SIZE, y, 4, [4,8,12,17,21,26,30,33], I);
    for (const x of [4,7,29,32]) setLocal(dimension, origin, rotation, SIZE, x, y, 16, I.server);
  }
  buildPedestal(dimension, origin, rotation, SIZE, 18, 18, 12, 23, 6, B);
  buildDish(dimension, origin, rotation, SIZE, 18, 24, 19, 11, B);
  buildPedestal(dimension, origin, rotation, SIZE, 7, 8, 12, 17, 3, B);
  buildDish(dimension, origin, rotation, SIZE, 7, 19, 9, 5, B);
  buildPedestal(dimension, origin, rotation, SIZE, 29, 8, 12, 17, 3, B);
  buildDish(dimension, origin, rotation, SIZE, 29, 19, 9, 5, B);
  for (const [x,z] of [[2,2],[34,2],[2,34],[34,34]]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z }, { x, y: 8, z }, B.post);
  placeLights(dimension, origin, rotation, SIZE, [[2,2],[34,2],[2,34],[34,34],[10,28],[18,28],[26,28]], 11, B);
}

export function buildStandaloneSmallSatelliteDish(dimension, origin, rotation, variantId) {
  const SIZE = { x: 9, y: 11, z: 9 };
  const { B } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  buildPedestal(dimension, origin, rotation, SIZE, 4, 4, 2, 6, 2, B);
  buildDish(dimension, origin, rotation, SIZE, 4, 7, 4, 3, B);
  for (const [x,z] of [[0,0],[8,0],[0,8],[8,8]]) setLocal(dimension, origin, rotation, SIZE, x, 2, z, B.light);
}

export function buildStandaloneMediumSatelliteDish(dimension, origin, rotation, variantId) {
  const SIZE = { x: 15, y: 19, z: 15 };
  const { B } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  buildPedestal(dimension, origin, rotation, SIZE, 7, 7, 2, 11, 4, B);
  buildDish(dimension, origin, rotation, SIZE, 7, 12, 7, 6, B);
  for (const [x,z] of [[1,1],[13,1],[1,13],[13,13]]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z }, { x, y: 4, z }, B.post);
  for (const [x,z] of [[1,1],[13,1],[1,13],[13,13]]) setLocal(dimension, origin, rotation, SIZE, x, 5, z, B.light);
}

export function buildStandaloneLargeSatelliteDish(dimension, origin, rotation, variantId) {
  const SIZE = { x: 25, y: 29, z: 25 };
  const { B } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  buildPedestal(dimension, origin, rotation, SIZE, 12, 12, 2, 17, 6, B);
  buildDish(dimension, origin, rotation, SIZE, 12, 18, 13, 10, B);
  // Two maintenance rings with access lighting.
  for (let x = 3; x <= 21; x++) for (let z = 3; z <= 21; z++) {
    const distance = Math.sqrt((x - 12) ** 2 + (z - 12) ** 2);
    if (distance >= 7.5 && distance <= 8.5) setLocal(dimension, origin, rotation, SIZE, x, 7, z, B.frame);
  }
  for (const [x,z] of [[2,2],[22,2],[2,22],[22,22],[12,3],[12,21]]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z }, { x, y: 5, z }, B.post);
  for (const [x,z] of [[2,2],[22,2],[2,22],[22,22],[12,3],[12,21]]) setLocal(dimension, origin, rotation, SIZE, x, 6, z, B.light);
}
