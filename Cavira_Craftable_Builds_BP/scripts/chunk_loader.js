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

const POOL = ["cavira_build_0", "cavira_build_1", "cavira_build_2", "cavira_build_3", "cavira_build_4", "cavira_build_5"];
const IN_USE = new Map(); // name -> owner key

function run(dimension, command) {
  try {
    dimension.runCommand(command);
    return true;
  } catch (error) {
    console.warn(`[CAVIRA] ${command} failed: ${error}`);
    return false;
  }
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
  const name = POOL.find((n) => !IN_USE.has(n));
  if (!name) return undefined;
  const { min, max } = bounds;
  if (!run(dimension, `tickingarea add ${min.x} ${min.y} ${min.z} ${max.x} ${max.y} ${max.z} ${name} true`)) return undefined;
  IN_USE.set(name, ownerKey);
  onWait?.();
  for (let i = 0; i < 60; i++) {
    await system.waitTicks(5);
    if (sampleLoaded(dimension, bounds)) return name;
  }
  release(dimension, ownerKey);
  return undefined;
}

/** Removes the ticking area owned by `ownerKey`, if any. */
export function release(dimension, ownerKey) {
  for (const [name, owner] of IN_USE) {
    if (owner !== ownerKey) continue;
    IN_USE.delete(name);
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
