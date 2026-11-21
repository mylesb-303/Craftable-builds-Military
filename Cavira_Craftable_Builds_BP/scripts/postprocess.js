import { BlockPermutation } from "@minecraft/server";

// ---------------------------------------------------------------------------
// Build post-processing (v1.7.0) — runs on the compiled grid before placement
//
//  access pass  — walks the build like a player (step up 1, drop 3, climb
//                 ladders/scaffolding) from its outside edges. Any enclosed
//                 indoor floor it cannot reach gets a 2-high doorway through a
//                 1–2 block wall, or a ladder shaft up from the floor below.
//  light pass   — simulates block light through the build. Every spawnable
//                 indoor floor is lit to ≥ 8 with ceiling lights; every outdoor
//                 spawnable surface to ≥ 1 with invisible light blocks, so
//                 hostile mobs (which need block light 0) cannot spawn.
//
// Both are generators so system.runJob can spread them over several ticks.
// ---------------------------------------------------------------------------

const RE = {
  passable: /(:air$|light_block|ladder|scaffolding|carpet|pressure_plate|torch|lantern|redstone_wire|rail|button|lever|_sign|banner|vine|short_grass|tall_grass|fern|sapling|dandelion|poppy|tulip|seagrass|kelp)/,
  climb: /(ladder|scaffolding|vine)/,
  transparent: /(:air$|light_block|glass|pane|bars|fence|ladder|scaffolding|carpet|pressure_plate|torch|lantern|redstone_wire|rail|button|lever|sign|banner|leaves|flower|azalea|slab|stairs|door|trapdoor|daylight_detector|brewing_stand|cauldron|hopper|anvil|grindstone|lectern|bell|chain|_rod|bed|short_grass|fern|sapling|campfire|kelp|seagrass|vine|water)/,
  halfSolid: /(slab|stairs|daylight_detector|carpet|pressure_plate|trapdoor|cauldron|hopper|anvil|grindstone|lectern|brewing_stand|bed|glass|pane|bars|fence|leaves|light_block|scaffolding|ladder)/
};
const EMIT = [
  [/sea_lantern|froglight|shroomlight|glowstone|jack_o_lantern|beacon|conduit|light_block_15|lit_redstone_lamp|^minecraft:lantern|campfire/, 15],
  [/end_rod|^minecraft:torch/, 14],
  [/soul_lantern|crying_obsidian|soul_torch/, 10],
  [/redstone_torch/, 7],
  [/magma/, 3]
];

const INDOOR_TARGET = 8;
const OUTDOOR_TARGET = 1;
const MAX_ACCESS_FIXES = 16;

function classify(typeId) {
  let emit = 0;
  for (const [re, v] of EMIT) if (re.test(typeId)) { emit = v; break; }
  const passable = RE.passable.test(typeId);
  const transparent = RE.transparent.test(typeId) || passable;
  return {
    id: typeId,
    air: typeId === "minecraft:air",
    passable,
    climb: RE.climb.test(typeId),
    transparent,
    emit,
    // mobs spawn only on top of full opaque blocks
    spawnFloor: !passable && !transparent && !RE.halfSolid.test(typeId) && emit === 0
  };
}

let LIGHT_PERM;
function lightPermutation() {
  if (LIGHT_PERM) return LIGHT_PERM;
  for (const [id, states] of [["minecraft:light_block_15"], ["minecraft:light_block", { block_light_level: 15 }]]) {
    try {
      LIGHT_PERM = states ? BlockPermutation.resolve(id, states) : BlockPermutation.resolve(id);
      return LIGHT_PERM;
    } catch {
      // try next form
    }
  }
  LIGHT_PERM = null;
  return LIGHT_PERM;
}

function ladderPermutation(face) {
  const v = { north: 2, south: 3, west: 4, east: 5 }[face];
  try {
    return BlockPermutation.resolve("minecraft:ladder", { facing_direction: v });
  } catch {
    return BlockPermutation.resolve("minecraft:ladder");
  }
}

/** Shared view over a compiled grid. Unwritten cells (0) are treated as solid terrain. */
function view(compiled) {
  const { W, H, D, grid, palette } = compiled;
  const info = [];
  const inf = (v) => {
    if (!v) return null;
    let i = info[v];
    if (!i) info[v] = i = classify(palette.list[v].type.id);
    return i;
  };
  const idx = (x, y, z) => (y * D + z) * W + x;
  const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D;
  const at = (x, y, z) => (inside(x, y, z) ? inf(grid[idx(x, y, z)]) : null);
  const passable = (x, y, z) => {
    if (!inside(x, y, z)) return y >= 0; // open space beyond the build edges
    const i = at(x, y, z);
    return !!i && i.passable;
  };
  const solidBelow = (x, y, z) => {
    if (!inside(x, y - 1, z)) return false;
    const i = at(x, y - 1, z);
    if (i && /fence|bars|pane|_wall$/.test(i.id)) return false; // you can't really stand on railings
    return !i || !i.passable || i.climb; // unwritten = terrain
  };
  const standable = (x, y, z) => inside(x, y, z) && passable(x, y, z) && passable(x, y + 1, z) && (solidBelow(x, y, z) || !!at(x, y, z)?.climb);
  // 0 = unknown, 1 = open sky, 2 = roofed (memoised: the passes ask for the same cells many times)
  const roofMemo = new Uint8Array(W * H * D);
  const roofed = (x, y, z) => {
    const k = (y * D + z) * W + x;
    if (roofMemo[k]) return roofMemo[k] === 2;
    let r = false;
    for (let yy = y + 2; yy < Math.min(H, y + 18); yy++) {
      const i = at(x, yy, z);
      if (i && !i.air && !i.id.includes("light_block")) { r = true; break; }
    }
    roofMemo[k] = r ? 2 : 1;
    return r;
  };
  const set = (x, y, z, perm, attachSeq) => {
    for (let yy = Math.max(0, y - 18); yy < y; yy++) roofMemo[(yy * D + z) * W + x] = 0;
    const k = idx(x, y, z);
    const id = palette.id(perm);
    grid[k] = id;
    if (palette.phase[id] === 2) compiled.attach.set(k, attachSeq ?? 1e9 + compiled.attach.size);
    else compiled.attach.delete(k);
  };
  return { W, H, D, grid, idx, inside, at, passable, standable, roofed, set, inf };
}

/** Reachability flood from the build's outer edges. */
function* reach(v) {
  const { W, H, D, idx, standable, at } = v;
  const seen = new Uint8Array(W * H * D);
  const q = [];
  const push = (x, y, z) => {
    if (x < 0 || z < 0 || x >= W || z >= D || y < 1 || y >= H - 1) return;
    const k = idx(x, y, z);
    if (seen[k] || !standable(x, y, z)) return;
    seen[k] = 1;
    q.push(x, y, z);
  };
  for (let y = 1; y < H - 1; y++) {
    for (let x = 0; x < W; x++) { push(x, y, 0); push(x, y, D - 1); }
    for (let z = 0; z < D; z++) { push(0, y, z); push(W - 1, y, z); }
  }
  let n = 0;
  while (q.length) {
    const z = q.pop(), y = q.pop(), x = q.pop();
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      push(x + dx, y, z + dz);
      if (v.passable(x, y + 2, z)) push(x + dx, y + 1, z + dz);
      for (let d = 1; d <= 3; d++) {
        if (!v.passable(x + dx, y - d + 1, z + dz)) break;
        push(x + dx, y - d, z + dz);
      }
    }
    if (at(x, y, z)?.climb || at(x, y - 1, z)?.climb) { push(x, y + 1, z); push(x, y - 1, z); }
    if (++n % 512 === 0) yield;
  }
  return seen;
}

function* unreachedComponents(v, seen) {
  const { W, H, D, idx, standable, roofed } = v;
  const comp = new Int32Array(W * H * D);
  const comps = [];
  let n = 0;
  for (let y = 1; y < H - 1; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (++n % 1024 === 0) yield;
    const k = idx(x, y, z);
    if (seen[k] || comp[k] || !standable(x, y, z)) continue;
    const cells = [];
    const st = [x, y, z];
    comp[k] = comps.length + 1;
    while (st.length) {
      const cz = st.pop(), cy = st.pop(), cx = st.pop();
      cells.push([cx, cy, cz]);
      if (++n % 1024 === 0) yield;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, nz = cz + dz;
        if (nx < 0 || nz < 0 || nx >= W || nz >= D) continue;
        const kk = idx(nx, cy, nz);
        if (comp[kk] || seen[kk] || !standable(nx, cy, nz)) continue;
        comp[kk] = comps.length + 1;
        st.push(nx, cy, nz);
      }
    }
    comps.push(cells);
  }
  // indoor = most of the area has a roof (skips dish bowls, mast tops and open roofs)
  const indoor = [];
  for (const c of comps) {
    if (c.length < 12) continue;
    let x1 = Infinity, x2 = -Infinity, z1 = Infinity, z2 = -Infinity, roofs = 0;
    for (const [cx, cy, cz] of c) {
      if (cx < x1) x1 = cx; if (cx > x2) x2 = cx; if (cz < z1) z1 = cz; if (cz > z2) z2 = cz;
      if (roofed(cx, cy, cz)) roofs++;
      if (++n % 1024 === 0) yield;
    }
    // 1-block strips are rack/girder/ledge tops, not rooms
    if (x1 === x2 || z1 === z2) continue;
    if (roofs >= 0.6 * c.length) indoor.push(c);
  }
  return indoor.sort((a, b) => b.length - a.length);
}

function tryDoor(v, seen, cells) {
  const air = BlockPermutation.resolve("minecraft:air");
  for (const [x, y, z] of cells) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (let thick = 1; thick <= 2; thick++) {
        let ok = true;
        for (let t = 1; t <= thick; t++) {
          const wx = x + dx * t, wz = z + dz * t;
          if (!v.inside(wx, y + 1, wz) || v.passable(wx, y, wz) && v.passable(wx, y + 1, wz)) { ok = false; break; }
          const below = v.at(wx, y - 1, wz);
          if (!below || below.passable) { ok = false; break; }
        }
        if (!ok) continue;
        const tx = x + dx * (thick + 1), tz = z + dz * (thick + 1);
        if (!v.inside(tx, y, tz) || !seen[v.idx(tx, y, tz)]) continue;
        for (let t = 1; t <= thick; t++) {
          v.set(x + dx * t, y, z + dz * t, air);
          v.set(x + dx * t, y + 1, z + dz * t, air);
        }
        return true;
      }
    }
  }
  return false;
}

function tryLadder(v, seen, cells) {
  const air = BlockPermutation.resolve("minecraft:air");
  for (const [x, y, z] of cells) {
    for (const [dx, dz, face] of [[1, 0, "west"], [-1, 0, "east"], [0, 1, "north"], [0, -1, "south"]]) {
      // find a reachable floor below in this column
      for (let y0 = y - 2; y0 >= Math.max(1, y - 16); y0--) {
        if (!seen[v.idx(x, y0, z)]) continue;
        let ok = true;
        for (let yy = y0; yy <= y; yy++) {
          const wall = v.at(x + dx, yy, z + dz);
          if (!wall || wall.passable || wall.transparent && !/slab|stairs/.test(wall.id)) { ok = false; break; }
        }
        if (!ok) continue;
        const ladder = ladderPermutation(face);
        for (let yy = y0; yy <= y; yy++) v.set(x, yy, z, ladder);
        v.set(x, y + 1, z, air);
        return true;
      }
    }
  }
  return false;
}

/** Access pass. Returns { fixed, remaining }. */
export function* accessPass(compiled, report = {}) {
  const v = view(compiled);
  let fixed = 0;
  for (let round = 0; round < MAX_ACCESS_FIXES; round++) {
    const seen = yield* reach(v);
    const comps = yield* unreachedComponents(v, seen);
    report.remaining = comps.reduce((s, c) => s + c.length, 0);
    if (!comps.length) break;
    let progress = false;
    for (const cells of comps) {
      if (tryDoor(v, seen, cells) || tryLadder(v, seen, cells)) { fixed++; progress = true; break; }
    }
    if (!progress) break;
  }
  report.fixed = fixed;
  return report;
}

/** Count of opaque, unlit horizontal neighbours — 3+ means (x, y, z) sits inside a wall, floor or ceiling surface. */
function solidAround(v, x, y, z) {
  let n = 0;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const i = v.at(x + dx, y, z + dz);
    if (i && !i.transparent && !i.passable && i.emit === 0) n++;
  }
  return n;
}

const FIXTURE = /sea_lantern|froglight|shroomlight|glowstone|redstone_lamp/;

/**
 * Fixture pass (v1.8): lights must be built into the structure. Any light block
 * that hangs off a wall or ceiling, or floats, is moved into the surface it is
 * mounted on (recessed); one with nothing to sit in becomes an invisible light
 * block so the area stays lit. Returns { recessed, hidden }.
 */
export function* fixturePass(compiled, report = {}) {
  const v = view(compiled);
  const { W, H, D, at } = v;
  const sea = BlockPermutation.resolve("minecraft:sea_lantern");
  const air = BlockPermutation.resolve("minecraft:air");
  const hiddenLight = lightPermutation();
  const open = (x, y, z) => { const i = at(x, y, z); return !!i && i.transparent; };
  const recessable = (x, y, z) => {
    const i = at(x, y, z);
    return !!i && !i.transparent && !i.passable && i.emit === 0 && !/door|stairs|slab|chest|barrel|furnace|smoker|bed|table|lectern|anvil|stand|terracotta|_planks|crafting|loom|bookshelf|scaffold|ladder/.test(i.id);
  };
  let recessed = 0, hidden = 0, n = 0;
  for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (++n % 1024 === 0) yield;
    const i = at(x, y, z);
    if (!i || !FIXTURE.test(i.id) || !open(x, y - 1, z)) continue;
    let sideOpen = 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (open(x + dx, y, z + dz)) sideOpen++;
    if (sideOpen < 3) continue;
    const perm = compiled.palette.list[compiled.grid[v.idx(x, y, z)]];
    // 1) hanging under a ceiling: set it into the ceiling instead
    if (recessable(x, y + 1, z) && solidAround(v, x, y + 1, z) >= 2) {
      v.set(x, y + 1, z, perm ?? sea);
      v.set(x, y, z, air);
      recessed++;
      continue;
    }
    // 2) mounted on a wall: set it into the wall behind it
    let moved = false;
    // the wall block must itself be embedded once the light moves in (not a thin strip open on 3 sides)
    const embedded = (tx, tz) => {
      if (!open(tx, y - 1, tz)) return true;
      let o = 0;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if ((tx + dx === x && tz + dz === z) || open(tx + dx, y, tz + dz)) o++;
      return o < 3;
    };
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (recessable(x + dx, y, z + dz) && embedded(x + dx, z + dz)) {
        v.set(x + dx, y, z + dz, perm ?? sea);
        v.set(x, y, z, air);
        recessed++;
        moved = true;
        break;
      }
    }
    if (moved) continue;
    // 3) nothing to sit in: keep the light, lose the floating block
    v.set(x, y, z, hiddenLight ?? air);
    hidden++;
  }
  Object.assign(report, { recessed, hidden });
  return report;
}

/** Light pass. Returns { added, darkBefore, darkAfter }. */
export function* lightPass(compiled, report = {}) {
  const v = view(compiled);
  const { W, H, D, idx, inside, at } = v;
  const L = new Uint8Array(W * H * D);
  const q = [];
  const spread = function* () {
    let n = 0;
    while (q.length) {
      const lvl = q.pop(), z = q.pop(), y = q.pop(), x = q.pop();
      if (lvl <= 1) continue;
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
        const nx = x + dx, ny = y + dy, nz = z + dz;
        if (!inside(nx, ny, nz)) continue;
        const i = at(nx, ny, nz);
        if (!i || !i.transparent) continue;
        const k = idx(nx, ny, nz);
        if (L[k] >= lvl - 1) continue;
        L[k] = lvl - 1;
        q.push(nx, ny, nz, lvl - 1);
      }
      if (++n % 1024 === 0) yield;
    }
  };
  const addSource = (x, y, z, lvl) => {
    const k = idx(x, y, z);
    if (L[k] < lvl) L[k] = lvl;
    q.push(x, y, z, lvl);
  };
  let n = 0;
  for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const i = at(x, y, z);
    if (i && i.emit) addSource(x, y, z, i.emit);
    if (++n % 2048 === 0) yield;
  }
  yield* spread();

  const spawnSpot = (x, y, z) => {
    if (!inside(x, y, z) || !inside(x, y - 1, z) || !inside(x, y + 1, z)) return false;
    const c = at(x, y, z), a = at(x, y + 1, z), b = at(x, y - 1, z);
    return !!c && c.air && !!a && a.passable && !!b && b.spawnFloor;
  };
  const light = lightPermutation();
  const sea = BlockPermutation.resolve("minecraft:sea_lantern");
  let added = 0;
  let darkBefore = 0;
  const target = (x, y, z) => (v.roofed(x, y, z) ? INDOOR_TARGET : OUTDOOR_TARGET);
  for (let y = 1; y < H - 1; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (spawnSpot(x, y, z) && L[idx(x, y, z)] < target(x, y, z)) darkBefore++;
    if (++n % 1024 === 0) yield;
  }
  // two sweeps: a coarse lattice first (even spacing), then everything left
  for (const step of [5, 1]) {
    for (let y = 1; y < H - 1; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      if (++n % 1024 === 0) yield;
      if (step > 1 && (x % step !== 2 || z % step !== 2)) continue;
      if (!spawnSpot(x, y, z)) continue;
      const t = target(x, y, z);
      if (L[idx(x, y, z)] >= t) continue;
      let placed = false;
      if (t === INDOOR_TARGET) {
        // a visible ceiling light directly above, if there is a ceiling within reach
        for (let yy = y + 2; yy <= Math.min(H - 1, y + 7); yy++) {
          const i = at(x, yy, z);
          if (!i || i.air || i.passable) continue;
          if (!i.transparent && i.emit === 0 && at(x, yy - 1, z)?.air && solidAround(v, x, yy, z) >= 3) {
            v.set(x, yy, z, sea);
            addSource(x, yy, z, 15);
            placed = true;
          }
          break;
        }
      }
      if (!placed) {
        const ly = at(x, y + 1, z)?.air && t === INDOOR_TARGET ? y + 1 : y;
        if (light) {
          v.set(x, ly, z, light);
          addSource(x, ly, z, 15);
        } else {
          v.set(x, y - 1, z, sea); // fallback: flush floor light
          addSource(x, y - 1, z, 15);
        }
      }
      added++;
      yield* spread();
    }
  }
  // count anything still dark (should be 0)
  let darkAfter = 0;
  for (let y = 1; y < H - 1; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (spawnSpot(x, y, z) && L[idx(x, y, z)] < OUTDOOR_TARGET) darkAfter++;
    if (++n % 1024 === 0) yield;
  }
  Object.assign(report, { added, darkBefore, darkAfter });
  return report;
}

/** Debug helper (harness): unreached indoor floor components after the access pass. */
export function* debugUnreached(compiled) {
  const v = view(compiled);
  const seen = yield* reach(v);
  const comps = yield* unreachedComponents(v, seen);
  return comps.map((cells) => {
    const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]), zs = cells.map((c) => c[2]);
    return { n: cells.length, y: [Math.min(...ys), Math.max(...ys)], x: [Math.min(...xs), Math.max(...xs)], z: [Math.min(...zs), Math.max(...zs)] };
  });
}

/** Debug helper (harness): the reachability grid. */
export function* debugReach(compiled) {
  return yield* reach(view(compiled));
}
