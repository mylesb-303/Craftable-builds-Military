import { system, world } from "@minecraft/server";

// ---------------------------------------------------------------------------
// Temporary chunk loading for very large builds (v1.6.0)
// Big structures such as the 81 × 113 Super-Heavy Hangar reach beyond the
// chunks a phone, tablet or console keeps loaded around the player. We add a
// temporary ticking area over the build site, wait for it to load, and remove
// it once the preview is cancelled or construction (or undo) finishes.
// Names come from a fixed pool so leftovers are cleaned up after a crash
// without touching ticking areas the player made themselves.
// ---------------------------------------------------------------------------

const POOL = ["cavira_build_0", "cavira_build_1", "cavira_build_2", "cavira_build_3", "cavira_build_4", "cavira_build_5", "cavira_build_6", "cavira_build_7"];
// Bedrock caps one ticking area at 100 chunks, so big sites are split into tiles.
const MAX_CHUNKS = 100;

/** Splits world bounds into chunk-aligned boxes of at most MAX_CHUNKS chunks each. */
export function tileBounds(bounds) {
  const cx1 = Math.floor(bounds.min.x / 16), cx2 = Math.floor(bounds.max.x / 16);
  const cz1 = Math.floor(bounds.min.z / 16), cz2 = Math.floor(bounds.max.z / 16);
  const w = cx2 - cx1 + 1, h = cz2 - cz1 + 1;
  // cut along the longer side into strips the full width of the shorter side
  const alongX = w > h;
  const across = alongX ? h : w;
  const stripsAcross = Math.ceil(across / MAX_CHUNKS);
  const acrossPer = Math.ceil(across / stripsAcross);
  const alongPer = Math.max(1, Math.floor(MAX_CHUNKS / acrossPer));
  const tiles = [];
  for (let a = 0; a < (alongX ? w : h); a += alongPer) for (let b = 0; b < across; b += acrossPer) {
    const A1 = a, A2 = Math.min((alongX ? w : h) - 1, a + alongPer - 1);
    const B1 = b, B2 = Math.min(across - 1, b + acrossPer - 1);
    const [x1, x2, z1, z2] = alongX ? [A1, A2, B1, B2] : [B1, B2, A1, A2];
    tiles.push({
      min: { x: Math.max(bounds.min.x, (cx1 + x1) * 16), y: bounds.min.y, z: Math.max(bounds.min.z, (cz1 + z1) * 16) },
      max: { x: Math.min(bounds.max.x, (cx1 + x2) * 16 + 15), y: bounds.max.y, z: Math.min(bounds.max.z, (cz1 + z2) * 16 + 15) }
    });
  }
  return tiles;
}
const IN_USE = new Map(); // name -> owner key
// Least-recently-released first. Bedrock does not always finish removing a
// ticking area before the next command runs, so re-adding the name that was
// just removed fails ("already exists"). That is what stopped sectioned builds
// after section 1 in v1.7.2: every section now gets a different pool name.
const RELEASE_ORDER = [...POOL];
let lastError = "";

/** Last ticking-area error, for player-facing messages. */
export function lastLoadError() {
  return lastError;
}

function run(dimension, command) {
  try {
    dimension.runCommand(command);
    return true;
  } catch (error) {
    lastError = String(error?.message ?? error);
    console.warn(`[CAVIRA] ${command} failed: ${lastError}`);
    return false;
  }
}

function freeNames() {
  return RELEASE_ORDER.filter((n) => !IN_USE.has(n));
}

function markReleased(name) {
  const i = RELEASE_ORDER.indexOf(name);
  if (i >= 0) RELEASE_ORDER.splice(i, 1);
  RELEASE_ORDER.push(name);
}

function sampleLoaded(dimension, bounds) {
  const xs = [];
  const zs = [];
  for (let x = bounds.min.x; x <= bounds.max.x; x += 8) xs.push(x);
  xs.push(bounds.max.x);
  for (let z = bounds.min.z; z <= bounds.max.z; z += 8) zs.push(z);
  zs.push(bounds.max.z);
  const y = Math.max(bounds.min.y, dimension.heightRange?.min ?? -64);
  for (const x of xs) for (const z of zs) {
    try {
      if (!dimension.getBlock({ x, y, z })) return false;
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Makes sure every chunk under `bounds` is loaded. Returns the ticking-area
 * name it created (release it later), "" if nothing was needed, or undefined
 * if loading failed.
 */
export async function ensureLoaded(dimension, bounds, ownerKey, onWait) {
  if (sampleLoaded(dimension, bounds)) return "";
  release(dimension, ownerKey);
  const tiles = tileBounds(bounds);
  const names = [];
  for (const { min, max } of tiles) {
    let added = false;
    // try up to 3 different free names, giving Bedrock a moment between attempts
    for (let attempt = 0; attempt < 3 && !added; attempt++) {
      const name = freeNames()[0];
      if (!name) break;
      if (run(dimension, `tickingarea add ${min.x} ${min.y} ${min.z} ${max.x} ${max.y} ${max.z} ${name} true`)) {
        IN_USE.set(name, ownerKey);
        names.push(name);
        added = true;
      } else {
        markReleased(name); // skip it for now; it may still be mid-removal
        await system.waitTicks(10);
      }
    }
    if (!added) {
      release(dimension, ownerKey);
      return undefined;
    }
  }
  onWait?.();
  // far-away sites can take a while to generate and load on tablets/consoles
  const polls = 160 * Math.max(1, Math.min(3, tiles.length)); // 40 s per tile, max 120 s
  for (let i = 0; i < polls; i++) {
    await system.waitTicks(5);
    if (sampleLoaded(dimension, bounds)) return names.join(",");
  }
  lastError = "the area did not finish loading in time";
  release(dimension, ownerKey);
  return undefined;
}

/** Removes the ticking area owned by `ownerKey`, if any. */
export function release(dimension, ownerKey) {
  for (const [name, owner] of IN_USE) {
    if (owner !== ownerKey) continue;
    IN_USE.delete(name);
    markReleased(name);
    run(dimension, `tickingarea remove ${name}`);
  }
}

/** Removes leftover pool areas from a previous session (crash or quit mid-build). */
export function cleanupLeftovers() {
  for (const id of ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"]) {
    let dim;
    try {
      dim = world.getDimension(id);
    } catch {
      continue;
    }
    for (const name of POOL) {
      try {
        dim.runCommand(`tickingarea remove ${name}`);
      } catch {
        // not present — fine
      }
    }
  }
}
