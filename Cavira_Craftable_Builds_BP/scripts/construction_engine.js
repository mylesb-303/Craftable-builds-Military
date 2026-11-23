import { BlockPermutation, system } from "@minecraft/server";

// ---------------------------------------------------------------------------
// CAVIRA staged construction engine — v2 (v1.5.0)
//
// Builders still call dimension.getBlock(loc)?.setPermutation(p) (or the fast
// recorder.fillWorld box API). They run against a *recording* dimension that
// compiles the build into a dense palette-indexed grid (2 bytes per block), so
// even a 400k-block bomber hangar compiles in well under a megabyte.
//
// The grid is then captured (for undo) and applied with system.runJob, spread
// over as many ticks as the device needs.
//
// Safe write order (construction AND undo):
//   phase 0  solid blocks, bottom-up     floors -> walls -> roofs
//   phase 1  air, top-down               carve interiors after shells seal (water-safe)
//   phase 2  attachables, write order    doors, ladders, lanterns, plants, scaffolding
// ---------------------------------------------------------------------------

const ATTACHABLE = /(door|ladder|pressure_plate|torch|lantern|button|lever|_sign|banner|carpet|rail|vine|flower|sapling|fern|short_grass|tall_grass|tallgrass|double_plant|dandelion|poppy|tulip|orchid|allium|bluet|daisy|cornflower|lily|rose|peony|lilac|sunflower|bush|snow_layer|redstone_wire|repeater|comparator|trapdoor|_bed|:bed$|candle|seagrass|kelp|reeds|sugar_cane|cactus|mushroom$|_coral$|_fan$|wall_fan|frame|painting|bell|chain$|cocoa|wheat|carrots|potatoes|beetroot|nether_wart|pointed_dripstone|glow_lichen|hanging_roots|spore_blossom|pitcher|torchflower|azalea$|scaffolding|end_rod|lightning_rod|light_block)/;

const OPS_PER_YIELD = 48;
const SCAN_PER_YIELD = 4096;

function phaseOf(typeId) {
  if (typeId === "minecraft:air") return 1;
  if (ATTACHABLE.test(typeId)) return 2;
  return 0;
}

class Palette {
  constructor() {
    this.list = [null];
    this.ids = new Map();
    this.phase = [0];
  }
  id(permutation) {
    let id = this.ids.get(permutation);
    if (id === undefined) {
      id = this.list.length;
      this.list.push(permutation);
      this.ids.set(permutation, id);
      this.phase.push(phaseOf(permutation.type.id));
    }
    return id;
  }
}

/** getBlock that treats unloaded / out-of-world locations as missing instead of throwing. */
export function safeGetBlock(dimension, location) {
  try {
    return dimension.getBlock(location);
  } catch {
    return undefined;
  }
}

/** World-space bounding box for a structure placed at origin/size/rotation. */
export function worldBounds(origin, size, rotation, margin = 0) {
  const swap = rotation === "east" || rotation === "west";
  const sx = swap ? size.z : size.x;
  const sz = swap ? size.x : size.z;
  return {
    min: { x: origin.x - margin, y: origin.y - margin, z: origin.z - margin },
    max: { x: origin.x + sx - 1 + margin, y: origin.y + size.y - 1 + margin, z: origin.z + sz - 1 + margin }
  };
}

/**
 * Compiles builder code into a grid. Returns a CompiledBuild.
 */
export function compileBuild(realDimension, buildFn, bounds, clip = false) {
  const min = bounds.min;
  const W = bounds.max.x - min.x + 1;
  const H = bounds.max.y - min.y + 1;
  const D = bounds.max.z - min.z + 1;
  const grid = new Uint16Array(W * H * D);
  const palette = new Palette();
  const attach = new Map(); // idx -> sequence (write order for phase 2)
  const overflow = new Map(); // "x,y,z" -> { location, id, seq }
  let seq = 0;

  const write = (x, y, z, permutation) => {
    const id = palette.id(permutation);
    const lx = x - min.x;
    const ly = y - min.y;
    const lz = z - min.z;
    if (lx < 0 || ly < 0 || lz < 0 || lx >= W || ly >= H || lz >= D) {
      if (clip) return; // sectioned builds: other sections own these blocks
      const k = `${x},${y},${z}`;
      overflow.delete(k);
      overflow.set(k, { location: { x, y, z }, id, seq: seq++ });
      return;
    }
    const idx = (ly * D + lz) * W + lx;
    grid[idx] = id;
    if (palette.phase[id] === 2) {
      attach.delete(idx);
      attach.set(idx, seq++);
    } else if (attach.size) {
      attach.delete(idx);
    }
  };

  // A single reusable writer object keeps legacy builders allocation-free.
  const writer = {
    _x: 0, _y: 0, _z: 0,
    setPermutation(permutation) {
      write(this._x, this._y, this._z, permutation);
    }
  };
  const recorder = {
    id: realDimension.id,
    isRecorder: true,
    getBlock(location) {
      writer._x = Math.floor(location.x);
      writer._y = Math.floor(location.y);
      writer._z = Math.floor(location.z);
      return writer;
    },
    /** Fast world-space box fill (inclusive). */
    fillWorld(a, b, permutation) {
      const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x);
      const y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
      const z1 = Math.min(a.z, b.z), z2 = Math.max(a.z, b.z);
      for (let y = y1; y <= y2; y++) for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) write(x, y, z, permutation);
    },
    write,
    /** typeId already compiled at a world cell (null = untouched terrain / outside). */
    read(x, y, z) {
      const lx = x - min.x, ly = y - min.y, lz = z - min.z;
      if (lx < 0 || ly < 0 || lz < 0 || lx >= W || ly >= H || lz >= D) return null;
      const id = grid[(ly * D + lz) * W + lx];
      return id ? palette.list[id].type.id : null;
    }
  };
  buildFn(recorder);
  return { min, W, H, D, grid, palette, attach, overflow };
}

/**
 * Generator over grid indices in safe phase order for a given value array.
 * Yields { idx } objects via callback to avoid allocation; returns via `visit`.
 */
function* orderedVisit(compiled, values, phaseOfValue, visit, extra) {
  const { W, D, H } = compiled;
  const layer = W * D;
  let scanned = 0;
  // phase 0: bottom-up
  for (let y = 0; y < H; y++) {
    const base = y * layer;
    for (let i = 0; i < layer; i++) {
      const v = values[base + i];
      if (v && phaseOfValue(v) === 0) yield* visit(base + i, v);
      if (++scanned % SCAN_PER_YIELD === 0) yield;
    }
  }
  // phase 1: top-down
  for (let y = H - 1; y >= 0; y--) {
    const base = y * layer;
    for (let i = 0; i < layer; i++) {
      const v = values[base + i];
      if (v && phaseOfValue(v) === 1) yield* visit(base + i, v);
      if (++scanned % SCAN_PER_YIELD === 0) yield;
    }
  }
  // phase 2: attachables in write order (or any remaining when no order known)
  if (extra?.attachOrder) {
    for (const idx of extra.attachOrder) {
      const v = values[idx];
      if (v && phaseOfValue(v) === 2) yield* visit(idx, v);
    }
  } else {
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (v && phaseOfValue(v) === 2) yield* visit(i, v);
      if (++scanned % SCAN_PER_YIELD === 0) yield;
    }
  }
}

function locOf(compiled, idx) {
  const { W, D, min } = compiled;
  const x = idx % W;
  const t = (idx - x) / W;
  const z = t % D;
  const y = (t - z) / D;
  return { x: min.x + x, y: min.y + y, z: min.z + z };
}

function samePermutation(current, target) {
  if (current === target) return true;
  try {
    return current.matches(target.type.id, target.getAllStates());
  } catch {
    return false;
  }
}

function countNonZero(values) {
  let n = 0;
  for (let i = 0; i < values.length; i++) if (values[i]) n++;
  return n;
}

/** Staged capture. Removes no-op writes from the grid; returns snapshot data. */
function* captureJob(dimension, compiled, progress) {
  const { grid, palette } = compiled;
  const orig = new Uint16Array(grid.length);
  const origPalette = new Palette();
  const total = countNonZero(grid) + compiled.overflow.size;
  let n = 0;
  let abort = false;
  const attachOrder = [...compiled.attach.entries()].sort((a, b) => a[1] - b[1]).map((e) => e[0]);
  compiled.attachOrder = attachOrder;

  const visit = function* (idx, v) {
    if (abort) return;
    const block = safeGetBlock(dimension, locOf(compiled, idx));
    if (!block) {
      abort = true;
      return;
    }
    const current = block.permutation;
    if (samePermutation(current, palette.list[v])) grid[idx] = 0;
    else orig[idx] = origPalette.id(current);
    if (++n % OPS_PER_YIELD === 0) {
      progress?.(n / total);
      yield;
    }
  };
  yield* orderedVisit(compiled, grid, (v) => palette.phase[v], visit, { attachOrder });
  if (abort) return { ok: false, reason: "Part of the build area is in an unloaded chunk or outside the world height. Move closer and try again." };

  const overflowSnap = [];
  for (const entry of compiled.overflow.values()) {
    const block = safeGetBlock(dimension, entry.location);
    if (!block) return { ok: false, reason: "Part of the build area is in an unloaded chunk. Move closer and try again." };
    overflowSnap.push({ location: entry.location, permutation: block.permutation });
    if (++n % OPS_PER_YIELD === 0) yield;
  }
  return { ok: true, snapshot: { dimension, compiled: { min: compiled.min, W: compiled.W, H: compiled.H, D: compiled.D }, orig, palette: origPalette, overflow: overflowSnap } };
}

function* applyGridJob(dimension, compiled, values, paletteObj, progress, attachOrder) {
  const total = countNonZero(values);
  let n = 0;
  let failed = 0;
  const visit = function* (idx, v) {
    try {
      const block = dimension.getBlock(locOf(compiled, idx));
      if (block) block.setPermutation(paletteObj.list[v]);
      else failed++;
    } catch {
      failed++;
    }
    if (++n % OPS_PER_YIELD === 0) {
      progress?.(total ? n / total : 1);
      yield;
    }
  };
  yield* orderedVisit(compiled, values, (v) => paletteObj.phase[v], visit, attachOrder ? { attachOrder } : undefined);
  return failed;
}

function* applyListJob(dimension, entries) {
  let failed = 0;
  let n = 0;
  const sorted = [...entries].sort((a, b) => phaseOf(a.permutation.type.id) - phaseOf(b.permutation.type.id) || a.location.y - b.location.y);
  for (const e of sorted) {
    try {
      const block = dimension.getBlock(e.location);
      if (block) block.setPermutation(e.permutation);
      else failed++;
    } catch {
      failed++;
    }
    if (++n % OPS_PER_YIELD === 0) yield;
  }
  return failed;
}

/**
 * Runs a generator as a job. `onStep(n)` is called every 16 resumptions (progress),
 * and when `maxTicks` is set a watchdog cancels a job that has not finished in time
 * (so a slow planning pass on a busy device can never freeze a build).
 */
function runJobAsync(generator, onStep, maxTicks = 0) {
  return new Promise((resolve, reject) => {
    let done = false, jobId, watch;
    const finish = (fn, v) => {
      if (done) return;
      done = true;
      if (watch !== undefined) system.clearRun(watch);
      fn(v);
    };
    function* wrapper() {
      try {
        let n = 0, r = generator.next();
        while (!r.done) {
          if (onStep && ++n % 16 === 0) onStep(n);
          yield;
          if (done) return;
          r = generator.next();
        }
        finish(resolve, r.value);
      } catch (error) {
        finish(reject, error);
      }
    }
    jobId = system.runJob(wrapper());
    if (maxTicks > 0) {
      const start = system.currentTick ?? 0;
      watch = system.runInterval(() => {
        if ((system.currentTick ?? 0) - start < maxTicks) return;
        try { system.clearJob(jobId); } catch { /* already finished */ }
        finish(reject, new Error(`timed out after ${maxTicks} ticks`));
      }, 20);
    }
  });
}

/** Rough number of generator steps a planning pass takes for a grid (for the progress bar). */
const PASS_STEPS = { access: 1 / 900, fixtures: 1 / 1024, light: 1 / 450 };
const PASS_MAX_TICKS = 20 * 240; // 4 minutes: skip the pass rather than stall the build

/**
 * Full staged construction.
 * @returns {Promise<{ok:boolean, reason?:string, snapshot?:object, changed?:number}>}
 */
export async function constructStaged(dimension, buildFn, onProgress, bounds, post = [], clip = false) {
  let compiled;
  try {
    compiled = compileBuild(dimension, buildFn, bounds, clip);
  } catch (error) {
    return { ok: false, reason: `Builder error: ${error}` };
  }
  const reports = {};
  for (const [name, pass] of post) {
    try {
      const label = name === "access" ? "Checking access" : name === "fixtures" ? "Fitting lights" : "Planning lighting";
      const est = Math.max(16, compiled.W * compiled.H * compiled.D * (PASS_STEPS[name] ?? 1 / 600));
      onProgress?.(label, 0);
      reports[name] = await runJobAsync(pass(compiled), (n) => onProgress?.(label, Math.min(0.99, n / est)), PASS_MAX_TICKS);
    } catch (error) {
      console.warn(`[CAVIRA] ${name} pass skipped: ${error}`);
    }
  }
  const captured = await runJobAsync(captureJob(dimension, compiled, (f) => onProgress?.("Surveying site", f)));
  if (!captured.ok) return captured;
  const changed = countNonZero(compiled.grid) + compiled.overflow.size;
  try {
    let failed = await runJobAsync(applyGridJob(dimension, compiled, compiled.grid, compiled.palette, (f) => onProgress?.("Constructing", f), compiled.attachOrder));
    if (compiled.overflow.size) {
      const list = [...compiled.overflow.values()].map((e) => ({ location: e.location, permutation: compiled.palette.list[e.id] }));
      failed += await runJobAsync(applyListJob(dimension, list));
    }
    if (failed > 0) console.warn(`[CAVIRA] ${failed} block writes skipped (chunk unloaded during build).`);
    return { ok: true, snapshot: captured.snapshot, changed, reports };
  } catch (error) {
    console.warn(`[CAVIRA] Construction error, rolling back: ${error}`);
    await restoreStaged(captured.snapshot);
    return { ok: false, reason: "Construction was interrupted and the area has been restored." };
  }
}

/** Staged restore of a snapshot taken by constructStaged (undo / rollback). */
export async function restoreStaged(snapshot, onProgress) {
  if (!snapshot) return false;
  let failed = await runJobAsync(applyGridJob(snapshot.dimension, snapshot.compiled, snapshot.orig, snapshot.palette, (f) => onProgress?.("Restoring", f)));
  if (snapshot.overflow?.length) failed += await runJobAsync(applyListJob(snapshot.dimension, snapshot.overflow));
  return failed === 0;
}

/** Serialises a permutation for dynamic-property storage. */
export function encodePermutation(permutation) {
  return [permutation.type.id, permutation.getAllStates()];
}

export function decodePermutation(encoded) {
  try {
    const [typeId, states] = encoded;
    return BlockPermutation.resolve(typeId, states);
  } catch {
    return undefined;
  }
}
