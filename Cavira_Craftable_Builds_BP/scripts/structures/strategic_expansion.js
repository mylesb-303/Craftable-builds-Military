import { createBlocks, setLocal, fillLocal, buildFoundation, buildRectShell, placeLights } from "../structure_helpers.js";

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

function buildUpwardDish(dimension, origin, rotation, size, cx, bowlY, cz, radius, B, scanner = false) {
  const rise = Math.max(2, Math.ceil(radius / 2));
  for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
    const squared = dx * dx + dz * dz;
    if (squared > radius * radius) continue;
    const y = bowlY + Math.round((squared / (radius * radius)) * rise);
    const rim = squared >= (radius - 1.2) * (radius - 1.2);
    const ribs = dx === 0 || dz === 0 || Math.abs(dx) === Math.abs(dz);
    setLocal(dimension, origin, rotation, size, cx + dx, y, cz + dz, rim ? B.dark : ribs && scanner ? B.frame : B.white);
  }
  const receiverY = bowlY + rise + 4;
  fillLocal(dimension, origin, rotation, size, { x: cx, y: bowlY + 1, z: cz }, { x: cx, y: receiverY, z: cz }, B.dark);
  setLocal(dimension, origin, rotation, size, cx, receiverY, cz, scanner ? B.warning : B.light);
  for (const [sx, sz] of [[cx - radius + 1, cz], [cx + radius - 1, cz], [cx, cz - radius + 1], [cx, cz + radius - 1]]) {
    const steps = Math.max(Math.abs(sx - cx), Math.abs(sz - cz));
    for (let i = 0; i <= steps; i++) {
      const t = i / Math.max(1, steps);
      const x = Math.round(sx + (cx - sx) * t);
      const z = Math.round(sz + (cz - sz) * t);
      const edgeDistance = Math.sqrt((sx - cx) ** 2 + (sz - cz) ** 2);
      const edgeY = bowlY + Math.round((edgeDistance * edgeDistance / (radius * radius)) * rise);
      const y = Math.round(edgeY + (receiverY - edgeY) * t);
      setLocal(dimension, origin, rotation, size, x, y, z, B.dark);
    }
  }
}

function wallRoom(dimension, origin, rotation, size, yTop, B) {
  const middle = Math.floor(size.z / 2);
  fillLocal(dimension, origin, rotation, size, { x: 1, y: 2, z: middle }, { x: size.x - 2, y: yTop, z: middle }, B.wall);
  const centre = Math.floor(size.x / 2);
  fillLocal(dimension, origin, rotation, size, { x: centre - 1, y: 2, z: middle }, { x: centre + 1, y: 4, z: middle }, B.air);
}

function furnishOperationsRoom(dimension, origin, rotation, size, y, z, xs, I) {
  for (const x of xs) {
    setLocal(dimension, origin, rotation, size, x, y, z, I.console);
    setLocal(dimension, origin, rotation, size, x, y + 1, z, I.monitor);
    if (z + 2 < size.z - 1) setLocal(dimension, origin, rotation, size, x, y, z + 2, I.seat);
  }
}

export function buildSmallTacticalRadarPost(dimension, origin, rotation, variantId) {
  const SIZE = { x: 19, y: 20, z: 19 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 8, 10, { wallTop: 6, roofY: 7, windows: false });
  furnishOperationsRoom(dimension, origin, rotation, SIZE, 2, 3, [4, 9, 14], I);
  for (const x of [3, 15]) setLocal(dimension, origin, rotation, SIZE, x, 2, 11, I.server);
  buildPedestal(dimension, origin, rotation, SIZE, 9, 9, 8, 10, 3, B);
  buildUpwardDish(dimension, origin, rotation, SIZE, 9, 11, 9, 6, B, true);
  placeLights(dimension, origin, rotation, SIZE, [[1,1],[17,1],[1,17],[17,17]], 7, B);
}

export function buildMediumRadarStation(dimension, origin, rotation, variantId) {
  const SIZE = { x: 31, y: 27, z: 27 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 13, 17, { wallTop: 7, roofY: 8, windows: false });
  wallRoom(dimension, origin, rotation, SIZE, 7, B);
  furnishOperationsRoom(dimension, origin, rotation, SIZE, 2, 4, [4,8,12,18,22,26], I);
  for (const x of [3,6,24,27]) setLocal(dimension, origin, rotation, SIZE, x, 2, 17, I.server);
  buildPedestal(dimension, origin, rotation, SIZE, 15, 13, 9, 15, 5, B);
  buildUpwardDish(dimension, origin, rotation, SIZE, 15, 16, 13, 10, B, true);
  placeLights(dimension, origin, rotation, SIZE, [[2,2],[28,2],[2,24],[28,24],[8,8],[22,8]], 8, B);
}

export function buildLargeEarlyWarningRadarComplex(dimension, origin, rotation, variantId) {
  const SIZE = { x: 45, y: 38, z: 39 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 20, 24, { wallTop: 11, roofY: 12, windows: false, entranceTop: 5 });
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 7, z: 1 }, { x: 43, y: 7, z: 37 }, B.floor);
  for (const y of [2,8]) furnishOperationsRoom(dimension, origin, rotation, SIZE, y, 5, [4,9,14,20,25,30,35,40], I);
  for (const y of [2,8]) for (const x of [4,8,36,40]) setLocal(dimension, origin, rotation, SIZE, x, y, 21, I.server);
  buildPedestal(dimension, origin, rotation, SIZE, 22, 20, 13, 21, 7, B);
  buildUpwardDish(dimension, origin, rotation, SIZE, 22, 22, 20, 15, B, true);
  for (const [x,z] of [[4,4],[40,4],[4,34],[40,34]]) {
    fillLocal(dimension, origin, rotation, SIZE, { x, y: 13, z }, { x, y: 24, z }, B.dark);
    setLocal(dimension, origin, rotation, SIZE, x, 25, z, B.light);
  }
  placeLights(dimension, origin, rotation, SIZE, [[5,5],[15,5],[30,5],[40,5],[5,31],[15,31],[30,31],[40,31]], 12, B);
}

export function buildSmallCommunicationsDishStation(dimension, origin, rotation, variantId) {
  const SIZE = { x: 17, y: 20, z: 17 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 7, 9, { wallTop: 5, roofY: 6, windows: false });
  furnishOperationsRoom(dimension, origin, rotation, SIZE, 2, 3, [3,8,13], I);
  buildPedestal(dimension, origin, rotation, SIZE, 8, 8, 7, 10, 3, B);
  buildUpwardDish(dimension, origin, rotation, SIZE, 8, 11, 8, 6, B);
  placeLights(dimension, origin, rotation, SIZE, [[1,1],[15,1],[1,15],[15,15]], 6, B);
}

export function buildMediumSatelliteDishStation(dimension, origin, rotation, variantId) {
  const SIZE = { x: 29, y: 30, z: 29 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 12, 16, { wallTop: 7, roofY: 8, windows: false });
  wallRoom(dimension, origin, rotation, SIZE, 7, B);
  furnishOperationsRoom(dimension, origin, rotation, SIZE, 2, 4, [4,8,12,16,20,24], I);
  for (const x of [3,6,22,25]) setLocal(dimension, origin, rotation, SIZE, x, 2, 18, I.server);
  buildPedestal(dimension, origin, rotation, SIZE, 14, 14, 9, 16, 5, B);
  buildUpwardDish(dimension, origin, rotation, SIZE, 14, 17, 14, 11, B);
  placeLights(dimension, origin, rotation, SIZE, [[2,2],[26,2],[2,26],[26,26],[8,8],[20,8]], 8, B);
}

export function buildLargeStrategicSatelliteArray(dimension, origin, rotation, variantId) {
  const SIZE = { x: 45, y: 44, z: 45 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 20, 24, { wallTop: 10, roofY: 11, windows: false, entranceTop: 5 });
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 6, z: 1 }, { x: 43, y: 6, z: 43 }, B.floor);
  for (const y of [2,7]) furnishOperationsRoom(dimension, origin, rotation, SIZE, y, 4, [4,9,14,20,25,30,35,40], I);
  for (const y of [2,7]) for (const x of [4,8,36,40]) setLocal(dimension, origin, rotation, SIZE, x, y, 18, I.server);
  buildPedestal(dimension, origin, rotation, SIZE, 22, 27, 12, 27, 8, B);
  buildUpwardDish(dimension, origin, rotation, SIZE, 22, 28, 27, 15, B);
  buildPedestal(dimension, origin, rotation, SIZE, 9, 9, 12, 18, 4, B);
  buildUpwardDish(dimension, origin, rotation, SIZE, 9, 19, 9, 7, B);
  buildPedestal(dimension, origin, rotation, SIZE, 35, 9, 12, 18, 4, B);
  buildUpwardDish(dimension, origin, rotation, SIZE, 35, 19, 9, 7, B);
  for (const [x,z] of [[2,2],[42,2],[2,42],[42,42]]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z }, { x, y: 9, z }, B.post);
  placeLights(dimension, origin, rotation, SIZE, [[2,2],[42,2],[2,42],[42,42],[12,36],[22,40],[32,36]], 11, B);
}

export function buildStandaloneSmallSatelliteDish(dimension, origin, rotation, variantId) {
  const SIZE = { x: 13, y: 17, z: 13 };
  const { B } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  buildPedestal(dimension, origin, rotation, SIZE, 6, 6, 2, 7, 3, B);
  buildUpwardDish(dimension, origin, rotation, SIZE, 6, 8, 6, 5, B);
  for (const [x,z] of [[0,0],[12,0],[0,12],[12,12]]) setLocal(dimension, origin, rotation, SIZE, x, 2, z, B.light);
}

export function buildStandaloneMediumSatelliteDish(dimension, origin, rotation, variantId) {
  const SIZE = { x: 21, y: 23, z: 21 };
  const { B } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  buildPedestal(dimension, origin, rotation, SIZE, 10, 10, 2, 12, 5, B);
  buildUpwardDish(dimension, origin, rotation, SIZE, 10, 13, 10, 8, B);
  for (const [x,z] of [[1,1],[19,1],[1,19],[19,19]]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z }, { x, y: 5, z }, B.post);
  for (const [x,z] of [[1,1],[19,1],[1,19],[19,19]]) setLocal(dimension, origin, rotation, SIZE, x, 6, z, B.light);
}

export function buildStandaloneLargeSatelliteDish(dimension, origin, rotation, variantId) {
  const SIZE = { x: 31, y: 33, z: 31 };
  const { B } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  buildPedestal(dimension, origin, rotation, SIZE, 15, 15, 2, 18, 7, B);
  buildUpwardDish(dimension, origin, rotation, SIZE, 15, 19, 15, 13, B);
  for (let x = 3; x <= 27; x++) for (let z = 3; z <= 27; z++) {
    const distance = Math.sqrt((x - 15) ** 2 + (z - 15) ** 2);
    if (distance >= 9.5 && distance <= 10.5) setLocal(dimension, origin, rotation, SIZE, x, 8, z, B.frame);
  }
  for (const [x,z] of [[2,2],[28,2],[2,28],[28,28],[15,3],[15,27]]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z }, { x, y: 6, z }, B.post);
  for (const [x,z] of [[2,2],[28,2],[2,28],[28,28],[15,3],[15,27]]) setLocal(dimension, origin, rotation, SIZE, x, 7, z, B.light);
}
