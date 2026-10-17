import { createBlocks, setLocal, fillLocal, buildFoundation, buildRectShell, placeLights } from "../structure_helpers.js";

export function buildHQAdministrationWing(dimension, origin, rotation, variantId) {
  const SIZE = { x: 27, y: 11, z: 17 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 12, 14, { wallTop: 8, roofY: 9, windowStep: 4 });

  // Two office levels linked visually by a formal colonnaded frontage.
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 5, z: 1 }, { x: 25, y: 5, z: 15 }, B.floor);
  for (const x of [2, 6, 10, 16, 20, 24]) {
    fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: 15 }, { x, y: 8, z: 15 }, B.white);
  }
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 2, z: 7 }, { x: 25, y: 8, z: 7 }, B.wall);
  for (const x of [4, 9, 13, 17, 22]) {
    fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: 7 }, { x: x + 1, y: 4, z: 7 }, B.air);
    fillLocal(dimension, origin, rotation, SIZE, { x, y: 6, z: 7 }, { x: x + 1, y: 8, z: 7 }, B.air);
  }
  for (const y of [2, 6]) {
    for (const x of [3, 8, 18, 23]) {
      fillLocal(dimension, origin, rotation, SIZE, { x, y, z: 3 }, { x: x + 2, y, z: 4 }, I.counter);
      setLocal(dimension, origin, rotation, SIZE, x + 1, y + 1, 3, I.monitor);
    }
  }
  placeLights(dimension, origin, rotation, SIZE, [[4,3],[10,3],[16,3],[22,3],[4,11],[10,11],[16,11],[22,11]], 9, B);
}

export function buildHQCommandRotunda(dimension, origin, rotation, variantId) {
  const SIZE = { x: 25, y: 14, z: 25 };
  const { B, I } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  const cx = 12;
  const cz = 12;

  for (let x = 0; x < SIZE.x; x++) {
    for (let z = 0; z < SIZE.z; z++) {
      const distance = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
      if (distance < 10) {
        for (let y = 2; y <= 10; y++) setLocal(dimension, origin, rotation, SIZE, x, y, z, B.air);
      }
      if (distance >= 10 && distance < 11.4) {
        for (let y = 2; y <= 10; y++) {
          const entrance = z >= 22 && x >= 11 && x <= 13 && y <= 4;
          const window = y >= 5 && y <= 7 && ((x + z) % 3 !== 0);
          setLocal(dimension, origin, rotation, SIZE, x, y, z, entrance ? B.air : window ? B.glass : B.wall);
        }
      }
      if (distance < 11.4) setLocal(dimension, origin, rotation, SIZE, x, 11, z, B.accent);
      if (distance < 8.5) setLocal(dimension, origin, rotation, SIZE, x, 12, z, B.frame);
      if (distance < 5.5) setLocal(dimension, origin, rotation, SIZE, x, 13, z, B.dark);
    }
  }

  // Circular operations floor with a central command table and surrounding stations.
  for (const z of [8, 12, 16]) {
    fillLocal(dimension, origin, rotation, SIZE, { x: 7, y: 2, z }, { x: 17, y: 2, z }, I.counter);
    for (const x of [8, 11, 14, 17]) setLocal(dimension, origin, rotation, SIZE, x, 3, z, I.keyboard);
  }
  for (const [x, z] of [[12,4],[18,6],[20,12],[18,18],[12,20],[6,18],[4,12],[6,6]]) {
    setLocal(dimension, origin, rotation, SIZE, x, 3, z, I.monitor);
    setLocal(dimension, origin, rotation, SIZE, x, 11, z, B.light);
  }
}

export function buildCeremonialFountainPlaza(dimension, origin, rotation, variantId) {
  const SIZE = { x: 31, y: 6, z: 31 };
  const { B } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  const cx = 15;
  const cz = 15;
  for (let x = 1; x < 30; x++) {
    for (let z = 1; z < 30; z++) {
      const distance = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
      if (distance >= 8 && distance < 10) setLocal(dimension, origin, rotation, SIZE, x, 2, z, B.white);
      if (distance < 8) setLocal(dimension, origin, rotation, SIZE, x, 2, z, B.water);
    }
  }
  fillLocal(dimension, origin, rotation, SIZE, { x: 14, y: 2, z: 14 }, { x: 16, y: 3, z: 16 }, B.frame);
  setLocal(dimension, origin, rotation, SIZE, 15, 4, 15, B.water);
  setLocal(dimension, origin, rotation, SIZE, 15, 5, 15, B.light);
  for (const [x, z] of [[3,3],[27,3],[3,27],[27,27],[15,3],[15,27],[3,15],[27,15]]) {
    fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z }, { x, y: 4, z }, B.post);
    setLocal(dimension, origin, rotation, SIZE, x, 5, z, B.light);
  }
  // Formal approach line toward the command rotunda.
  for (let z = 20; z <= 30; z++) {
    setLocal(dimension, origin, rotation, SIZE, 11, 2, z, B.accent);
    setLocal(dimension, origin, rotation, SIZE, 19, 2, z, B.accent);
  }
}

export function buildOfficersQuarters(dimension, origin, rotation, variantId) {
  const SIZE = { x: 19, y: 10, z: 25 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 8, 10, { wallTop: 7, roofY: 8, windowStep: 4 });
  B.mattress = B.green;

  // Central corridor with eight private rooms, each furnished with a bed, desk and locker.
  for (const x of [7, 11]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: 1 }, { x, y: 7, z: 22 }, B.wall);
  for (const z of [6, 11, 16, 21]) {
    fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 2, z }, { x: 7, y: 7, z }, B.wall);
    fillLocal(dimension, origin, rotation, SIZE, { x: 11, y: 2, z }, { x: 17, y: 7, z }, B.wall);
  }
  for (const z of [3, 8, 13, 18]) {
    fillLocal(dimension, origin, rotation, SIZE, { x: 7, y: 2, z }, { x: 7, y: 4, z: z + 1 }, B.air);
    fillLocal(dimension, origin, rotation, SIZE, { x: 11, y: 2, z }, { x: 11, y: 4, z: z + 1 }, B.air);
    fillLocal(dimension, origin, rotation, SIZE, { x: 2, y: 2, z }, { x: 4, y: 2, z }, B.mattress);
    fillLocal(dimension, origin, rotation, SIZE, { x: 14, y: 2, z }, { x: 16, y: 2, z }, B.mattress);
    setLocal(dimension, origin, rotation, SIZE, 6, 2, z + 1, I.counter);
    setLocal(dimension, origin, rotation, SIZE, 12, 2, z + 1, I.counter);
    setLocal(dimension, origin, rotation, SIZE, 6, 2, z + 2, I.locker);
    setLocal(dimension, origin, rotation, SIZE, 12, 2, z + 2, I.locker);
  }
  placeLights(dimension, origin, rotation, SIZE, [[3,4],[9,4],[15,4],[3,9],[9,9],[15,9],[3,14],[9,14],[15,14],[3,19],[9,19],[15,19]], 8, B);
}

export function buildLogisticsHall(dimension, origin, rotation, variantId) {
  const SIZE = { x: 31, y: 12, z: 25 };
  const { B, I } = createBlocks(variantId);
  buildRectShell(dimension, origin, rotation, SIZE, B, 11, 19, { wallTop: 9, roofY: 10, windows: false, entranceTop: 7 });

  // Four long storage aisles with high racks and a central handling lane.
  for (const x of [3, 8, 22, 27]) {
    for (const z of [3, 6, 9, 12, 15, 18]) {
      for (const y of [2, 5, 8]) setLocal(dimension, origin, rotation, SIZE, x, y, z, I.storage);
      fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: z + 1 }, { x, y: 8, z: z + 1 }, I.rail);
    }
  }
  for (let z = 2; z <= 21; z++) {
    setLocal(dimension, origin, rotation, SIZE, 13, 1, z, B.marker);
    setLocal(dimension, origin, rotation, SIZE, 17, 1, z, B.marker);
  }
  fillLocal(dimension, origin, rotation, SIZE, { x: 11, y: 2, z: 2 }, { x: 19, y: 2, z: 3 }, I.counter);
  for (const x of [12,15,18]) setLocal(dimension, origin, rotation, SIZE, x, 3, 2, I.monitor);
  placeLights(dimension, origin, rotation, SIZE, [[4,4],[10,4],[15,4],[20,4],[26,4],[4,11],[10,11],[15,11],[20,11],[26,11],[4,18],[10,18],[15,18],[20,18],[26,18]], 10, B);
}

export function buildHeavyVehicleMaintenanceHangar(dimension, origin, rotation, variantId) {
  const SIZE = { x: 35, y: 15, z: 27 };
  const { B, I } = createBlocks(variantId);
  buildFoundation(dimension, origin, rotation, SIZE, B);
  fillLocal(dimension, origin, rotation, SIZE, { x: 1, y: 2, z: 1 }, { x: 33, y: 12, z: 25 }, B.air);

  // Tall rear and side walls; three open vehicle portals with red structural columns.
  for (let y = 2; y <= 11; y++) {
    for (let x = 0; x <= 34; x++) setLocal(dimension, origin, rotation, SIZE, x, y, 0, B.wall);
    for (let z = 1; z <= 26; z++) {
      setLocal(dimension, origin, rotation, SIZE, 0, y, z, B.wall);
      setLocal(dimension, origin, rotation, SIZE, 34, y, z, B.wall);
    }
  }
  for (const x of [0, 11, 23, 34]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: 26 }, { x, y: 13, z: 26 }, B.warning);
  fillLocal(dimension, origin, rotation, SIZE, { x: 0, y: 12, z: 0 }, { x: 34, y: 12, z: 26 }, B.accent);

  // Three servicing lanes, inspection pits and a full-width overhead crane.
  for (const centreX of [6, 17, 28]) {
    for (let z = 4; z <= 24; z++) {
      setLocal(dimension, origin, rotation, SIZE, centreX - 4, 1, z, B.marker);
      setLocal(dimension, origin, rotation, SIZE, centreX + 4, 1, z, B.marker);
    }
    fillLocal(dimension, origin, rotation, SIZE, { x: centreX, y: 1, z: 8 }, { x: centreX, y: 1, z: 19 }, B.secure);
  }
  fillLocal(dimension, origin, rotation, SIZE, { x: 2, y: 10, z: 13 }, { x: 32, y: 10, z: 13 }, B.marker);
  for (const x of [2, 32]) fillLocal(dimension, origin, rotation, SIZE, { x, y: 2, z: 13 }, { x, y: 10, z: 13 }, B.frame);
  setLocal(dimension, origin, rotation, SIZE, 17, 9, 13, I.machine);

  for (const x of [3,7,12,16,20,25,29,33]) {
    setLocal(dimension, origin, rotation, SIZE, x, 2, 2, I.workbench);
    setLocal(dimension, origin, rotation, SIZE, x, 3, 2, I.equipment);
  }
  placeLights(dimension, origin, rotation, SIZE, [[5,5],[17,5],[29,5],[5,12],[17,12],[29,12],[5,20],[17,20],[29,20]], 12, B);
}
