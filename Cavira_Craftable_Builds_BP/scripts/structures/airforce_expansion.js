import { createBlocks, setLocal, fillLocal, buildFoundation, buildRectShell, placeLights } from "../structure_helpers.js";

function buildShelter(dimension, origin, rotation, size, offsetX, width, B, I) {
  const frontZ = size.z - 1;
  const centre = offsetX + Math.floor(width / 2);
  const radius = Math.floor(width / 2);
  for (let z = 0; z <= frontZ; z++) {
    for (let x = offsetX; x < offsetX + width; x++) {
      const normalized = Math.abs(x - centre) / radius;
      const roofY = 6 + Math.floor(5 * Math.sqrt(Math.max(0, 1 - normalized * normalized)));
      if (x === offsetX || x === offsetX + width - 1) {
        for (let y = 2; y <= roofY; y++) setLocal(dimension, origin, rotation, size, x, y, z, B.wall);
      }
      setLocal(dimension, origin, rotation, size, x, roofY, z, B.accent);
      if (z === 0) {
        for (let y = 2; y <= roofY; y++) setLocal(dimension, origin, rotation, size, x, y, z, B.wall);
      }
    }
  }
  for (let z = 3; z <= frontZ; z++) setLocal(dimension, origin, rotation, size, centre, 1, z, B.marker);
  for (const z of [5, 12, 19]) setLocal(dimension, origin, rotation, size, centre, 10, z, B.light);
  setLocal(dimension, origin, rotation, size, offsetX + 2, 2, 2, I.workbench);
  setLocal(dimension, origin, rotation, size, offsetX + width - 3, 2, 2, I.storage);
}

export function buildHardenedFighterShelter(dimension, origin, rotation, variantId) {
  const SIZE = { x: 21, y: 12, z: 25 };
  const { B, I } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 2, z: 1 }, { x: 19, y: 10, z: 24 }, B.air);
  buildShelter(dimension, origin, rotation, SIZE, 0, 21, B, I);
  for (const x of [0, 20]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: 24 }, { x, y: 8, z: 24 }, B.secure);
}

export function buildFighterShelterRow(dimension, origin, rotation, variantId) {
  const SIZE = { x: 49, y: 12, z: 25 };
  const { B, I } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 2, z: 1 }, { x: 47, y: 10, z: 24 }, B.air);
  for (const offsetX of [1, 17, 33]) buildShelter(dimension, origin, rotation, SIZE, offsetX, 15, B, I);
  for (const x of [0, 16, 32, 48]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 1, z: 0 }, { x, y: 9, z: 24 }, B.secure);
}

export function buildHelicopterHangar(dimension, origin, rotation, variantId) {
  const SIZE = { x: 41, y: 14, z: 27 };
  const { B, I } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 2, z: 1 }, { x: 39, y: 11, z: 25 }, B.air);

  for (let y = 2; y <= 10; y++) {
    for (let x = 0; x <= 40; x++) setLocal(dimension, origin, rotation, SIZE, x, y, 0, y >= 4 && y <= 7 ? B.glass : B.wall);
    for (let z = 1; z <= 26; z++) {
      setLocal(dimension, origin, rotation, SIZE, 0, y, z, y >= 4 && y <= 8 ? B.glass : B.wall);
      setLocal(dimension, origin, rotation, SIZE, 40, y, z, y >= 4 && y <= 8 ? B.glass : B.wall);
    }
  }
  for (const x of [0, 13, 27, 40]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: 26 }, { x, y: 12, z: 26 }, B.frame);
  // Glass-front panels above the three wide flight-line openings.
  for (let x = 1; x < 40; x++) {
    if ([13,27].includes(x)) continue;
    for (let y = 9; y <= 11; y++) setLocal(dimension, origin, rotation, SIZE, x, y, 26, B.glass);
  }
  fillLocal(dimension, origin, rotation, SIZE, { x: 0, y: 11, z: 0 }, { x: 40, y: 11, z: 26 }, B.accent);
  for (const centreX of [7, 20, 34]) {
    for (let z = 4; z <= 25; z++) setLocal(dimension, origin, rotation, SIZE, centreX, 1, z, B.marker);
    for (const z of [7,15,23]) setLocal(dimension, origin, rotation, SIZE, centreX, 11, z, B.light);
    setLocal(dimension, origin, rotation, SIZE, centreX - 4, 2, 2, I.workbench);
    setLocal(dimension, origin, rotation, SIZE, centreX + 4, 2, 2, I.storage);
  }
}

export function buildAirfieldOperationsBuilding(dimension, origin, rotation, variantId) {
  const SIZE = { x: 25, y: 10, z: 19 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 11, 13, { wallTop: 7, roofY: 8, windowStep: 4 });
  // Dispatch room, briefing room and flight-line monitoring suite.
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 2, z: 9 }, { x: 23, y: 7, z: 9 }, B.wall);
  for (const x of [5,11,17]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: 9 }, { x: x + 1, y: 4, z: 9 }, B.air);
  for (const z of [3,6,12,15]) {
    fillLocal(dimension, origin, rotation, SIZE, { x: 4, y: 2, z }, { x: 10, y: 2, z }, I.counter);
    fillLocal(dimension, origin, rotation, SIZE, { x: 14, y: 2, z }, { x: 20, y: 2, z }, I.counter);
    for (const x of [5,8,15,18]) setLocal(dimension, origin, rotation, SIZE, x, 3, z, I.monitor);
  }
  for (const x of [2,22]) for (const z of [2,5,12,15]) setLocal(dimension, origin, rotation, SIZE, x, 2, z, I.server);
  placeLights(dimension, origin, rotation, SIZE, [[4,4],[12,4],[20,4],[4,13],[12,13],[20,13]], 8, B);
}

export function buildFuelTankFarm(dimension, origin, rotation, variantId) {
  const SIZE = { x: 29, y: 14, z: 23 };
  const { B } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);

  // Containment wall with a front service opening.
  for (let x = 0; x < SIZE.x; x++) {
    const gate = x >= 13 && x <= 15;
    if (!gate) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: 22 }, { x, y: 4, z: 22 }, B.secure);
    fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: 0 }, { x, y: 4, z: 0 }, B.secure);
  }
  for (let z = 1; z < 22; z++) for (const x of [0,28]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z }, { x, y: 4, z }, B.secure);

  for (const [cx, cz] of [[8,7],[20,7],[8,16],[20,16]]) {
    for (let x = cx - 4; x <= cx + 4; x++) {
      for (let z = cz - 4; z <= cz + 4; z++) {
        const distance = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
        if (distance >= 3.2 && distance < 4.5) for (let y = 2; y <= 10; y++) setLocal(dimension, origin, rotation, SIZE, x, y, z, B.white);
        if (distance < 4.2) setLocal(dimension, origin, rotation, SIZE, x, 11, z, B.accent);
      }
    }
    setLocal(dimension, origin, rotation, SIZE, cx, 12, cz, B.warning);
  }
  for (const [x,z] of [[2,2],[26,2],[2,20],[26,20],[14,20]]) setLocal(dimension, origin, rotation, SIZE, x, 5, z, B.light);
}

export function buildRadarRadomeFacility(dimension, origin, rotation, variantId) {
  const SIZE = { x: 33, y: 22, z: 33 };
  const { B, I } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  const cx = 16;
  const cz = 16;

  // Stepped central operations base.
  for (let x = 7; x <= 25; x++) for (let z = 7; z <= 25; z++) {
    const distance = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
    if (distance < 9.5) {
      for (let y = 2; y <= 7; y++) setLocal(dimension, origin, rotation, SIZE, x, y, z, distance > 8.2 ? B.wall : B.air);
      setLocal(dimension, origin, rotation, SIZE, x, 8, z, B.frame);
    }
  }
  fillLocal(dimension, origin, rotation, SIZE, { x: 15, y: 2, z: 24 }, { x: 17, y: 4, z: 25 }, B.air);

  // White geodesic-style radome above the operations platform.
  for (let x = 7; x <= 25; x++) for (let y = 9; y <= 20; y++) for (let z = 7; z <= 25; z++) {
    const dx = x - cx;
    const dy = (y - 9) - 5.5;
    const dz = z - cz;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (distance >= 8.1 && distance < 9.2) setLocal(dimension, origin, rotation, SIZE, x, y, z, B.white);
  }

  // Four surrounding strategic-service cylinders.
  for (const [tx,tz] of [[5,5],[27,5],[5,27],[27,27]]) {
    for (let x = tx - 3; x <= tx + 3; x++) for (let z = tz - 3; z <= tz + 3; z++) {
      const d = Math.sqrt((x - tx) ** 2 + (z - tz) ** 2);
      if (d >= 2.2 && d < 3.5) for (let y = 2; y <= 9; y++) setLocal(dimension, origin, rotation, SIZE, x, y, z, B.accent);
      if (d < 3.2) setLocal(dimension, origin, rotation, SIZE, x, 10, z, B.frame);
    }
  }
  for (const x of [12,16,20]) {
    setLocal(dimension, origin, rotation, SIZE, x, 2, 12, I.console);
    setLocal(dimension, origin, rotation, SIZE, x, 3, 11, I.monitor);
  }
  setLocal(dimension, origin, rotation, SIZE, 16, 21, 16, B.light);
}

export function buildHelicopterApron(dimension, origin, rotation, variantId) {
  const SIZE = { x: 41, y: 3, z: 41 };
  const { B } = createBlocks(variantId);
  fillLocal(dimension, origin, rotation, SIZE, { x: 0, y: 0, z: 0 }, { x: 40, y: 0, z: 40 }, B.frame);
  fillLocal(dimension, origin, rotation, SIZE, { x: 0, y: 1, z: 0 }, { x: 40, y: 1, z: 40 }, B.road);
  for (const [cx,cz] of [[11,11],[29,11],[11,29],[29,29]]) {
    for (let x = cx - 8; x <= cx + 8; x++) for (let z = cz - 8; z <= cz + 8; z++) {
      const d = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
      if (d >= 7 && d < 8.2) setLocal(dimension, origin, rotation, SIZE, x, 1, z, B.white);
    }
    fillLocal(dimension, origin, rotation, SIZE, { x: cx - 4, y: 1, z: cz - 1 }, { x: cx + 4, y: 1, z: cz + 1 }, B.white);
    fillLocal(dimension, origin, rotation, SIZE, { x: cx - 1, y: 1, z: cz - 5 }, { x: cx + 1, y: 1, z: cz + 5 }, B.white);
  }
  for (let i = 2; i <= 38; i += 4) {
    setLocal(dimension, origin, rotation, SIZE, i, 1, 0, B.light);
    setLocal(dimension, origin, rotation, SIZE, i, 1, 40, B.light);
    setLocal(dimension, origin, rotation, SIZE, 0, 1, i, B.light);
    setLocal(dimension, origin, rotation, SIZE, 40, 1, i, B.light);
  }
}
