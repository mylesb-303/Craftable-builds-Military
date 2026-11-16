import { BlockPermutation, system } from "@minecraft/server";

// ---------------------------------------------------------------------------
// CAVIRA staged construction engine (v1.4.1)
//
// Builders are unchanged: they still call dimension.getBlock(loc)?.setPermutation(p).
// We hand them a *recording* dimension instead of the real one, so a build is
// first compiled into a de-duplicated list of block writes. That list is then
// captured (for undo) and applied with system.runJob, spreading the work over
// as many ticks as the device needs instead of one giant tick.
//
// Write ordering (applies to both construction and undo/rollback):
//   1. Solid / non-air blocks, bottom-up  -> floors before walls before roofs.
//   2. Air blocks, top-down               -> interiors are carved only after the
//                                           shell is sealed (water-safe).
//   3. Attachable blocks, recorded order  -> doors, ladders, plates, torches,
//                                           plants etc. go on once supports exist.
// ---------------------------------------------------------------------------

const ATTACHABLE = /(door|ladder|pressure_plate|torch|lantern|button|lever|_sign|banner|carpet|rail|vine|flower|sapling|fern|short_grass|tall_grass|tallgrass|double_plant|dandelion|poppy|tulip|orchid|allium|bluet|daisy|cornflower|lily|rose|peony|lilac|sunflower|bush|snow_layer|redstone_wire|repeater|comparator|trapdoor|_bed|candle|seagrass|kelp|reeds|sugar_cane|cactus|mushroom$|_coral$|_fan$|wall_fan|frame|painting|bell|chain$|cocoa|wheat|carrots|potatoes|beetroot|nether_wart|pointed_dripstone|moss_carpet|glow_lichen|hanging_roots|spore_blossom|pitcher|torchflower|azalea$|flowering_azalea$)/;

const OPS_PER_YIELD = 48;

function key(x, y, z) {
  return `${x},${y},${z}`;
}

function isAirId(id) {
  return id === "minecraft:air";
}

function phaseOf(typeId) {
  if (isAirId(typeId)) return 1;
  if (ATTACHABLE.test(typeId)) return 2;
  return 0;
}

/** Sorts writes into the safe application order described above. */
export function orderWrites(writes) {
  const indexed = writes.map((w, i) => ({ w, i, phase: phaseOf(w.permutation.type.id) }));
  indexed.sort((a, b) => {
    if (a.phase !== b.phase) return a.phase - b.phase;
    if (a.phase === 0 && a.w.location.y !== b.w.location.y) return a.w.location.y - b.w.location.y;
    if (a.phase === 1 && a.w.location.y !== b.w.location.y) return b.w.location.y - a.w.location.y;
    return a.i - b.i;
  });
  return indexed.map((entry) => entry.w);
}

/**
 * Runs builder code against a recording dimension and returns the final,
 * de-duplicated set of writes (last write to a position wins).
 */
export function compileBuild(realDimension, buildFn) {
  const writes = new Map();
  const recorder = {
    id: realDimension.id,
    getBlock(location) {
      const x = Math.floor(location.x);
      const y = Math.floor(location.y);
      const z = Math.floor(location.z);
      return {
        location: { x, y, z },
        setPermutation(permutation) {
          const k = key(x, y, z);
          // Re-inserting moves the entry to the end, preserving true write order
          // for attachables such as lower/upper door halves.
          writes.delete(k);
          writes.set(k, { location: { x, y, z }, permutation });
        }
      };
    }
  };
  buildFn(recorder);
  return orderWrites([...writes.values()]);
}

function samePermutation(current, target) {
  try {
    return current.matches(target.type.id, target.getAllStates());
  } catch {
    return false;
  }
}

/**
 * Staged capture: reads every target block once, drops writes that would not
 * change anything, and records the original permutation for undo.
 * Yields a result object: { ok, writes, snapshot, reason }.
 */
function* captureJob(dimension, writes, progress) {
  const pending = [];
  const snapshot = [];
  let n = 0;
  for (const write of writes) {
    const block = dimension.getBlock(write.location);
    if (!block) {
      return { ok: false, reason: "Part of the build area is in an unloaded chunk or outside the world height. Move closer and try again." };
    }
    const original = block.permutation;
    if (!samePermutation(original, write.permutation)) {
      pending.push(write);
      snapshot.push({ location: write.location, permutation: original });
    }
    if (++n % OPS_PER_YIELD === 0) {
      progress?.(n / writes.length);
      yield;
    }
  }
  return { ok: true, writes: pending, snapshot: orderWrites(snapshot) };
}

function* applyJob(dimension, writes, progress) {
  let n = 0;
  let failed = 0;
  for (const write of writes) {
    try {
      const block = dimension.getBlock(write.location);
      if (block) block.setPermutation(write.permutation);
      else failed++;
    } catch {
      failed++;
    }
    if (++n % OPS_PER_YIELD === 0) {
      progress?.(n / writes.length);
      yield;
    }
  }
  return failed;
}

/** Wraps system.runJob so callers can await a generator's return value. */
function runJobAsync(generator) {
  return new Promise((resolve, reject) => {
    let result;
    function* wrapper() {
      try {
        result = yield* generator;
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
    system.runJob(wrapper());
  });
}

/**
 * Full staged construction.
 * @returns {Promise<{ok:boolean, reason?:string, snapshot?:object, changed?:number}>}
 */
export async function constructStaged(dimension, buildFn, onProgress) {
  let writes;
  try {
    writes = compileBuild(dimension, buildFn);
  } catch (error) {
    return { ok: false, reason: `Builder error: ${error}` };
  }

  const captured = await runJobAsync(captureJob(dimension, writes, (f) => onProgress?.("Surveying site", f)));
  if (!captured.ok) return captured;

  const snapshot = { dimension, blocks: captured.snapshot };
  try {
    const failed = await runJobAsync(applyJob(dimension, captured.writes, (f) => onProgress?.("Constructing", f)));
    if (failed > 0) console.warn(`[CAVIRA] ${failed} block writes skipped (chunk unloaded during build).`);
    return { ok: true, snapshot, changed: captured.writes.length };
  } catch (error) {
    console.warn(`[CAVIRA] Construction error, rolling back: ${error}`);
    await restoreStaged(snapshot);
    return { ok: false, reason: "Construction was interrupted and the area has been restored." };
  }
}

/** Staged restore of a snapshot taken by constructStaged (undo / rollback). */
export async function restoreStaged(snapshot, onProgress) {
  if (!snapshot) return false;
  const failed = await runJobAsync(applyJob(snapshot.dimension, snapshot.blocks, (f) => onProgress?.("Restoring", f)));
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
