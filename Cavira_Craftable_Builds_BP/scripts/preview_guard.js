import { system, world } from "@minecraft/server";
import { decodePermutation, encodePermutation } from "./construction_engine.js";

// ---------------------------------------------------------------------------
// Preview guard (v1.4.1)
//  * Preview marker blocks cannot be broken (prevents free-concrete duping and
//    stops players punching holes in the restore data).
//  * Previews are written to a world dynamic property while active, so if the
//    game closes, crashes or the Realm restarts mid-preview, the original
//    terrain is restored automatically the next time the world loads.
// ---------------------------------------------------------------------------

const PROP_PREFIX = "cavira:preview:";
const CHUNK = 30000; // dynamic property strings are capped at 32,767 chars
const PROTECTED = new Map(); // "dimId|x,y,z" -> playerId
let recoveryHandle;
// Each world session gets its own key namespace, so recovery of a crashed
// session can never touch a preview that is live in the current session.
const SESSION = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
const owner = (playerId) => `${SESSION}:${playerId}`;

function blockKey(dimensionId, loc) {
  return `${dimensionId}|${loc.x},${loc.y},${loc.z}`;
}

function propKeys(ownerKey) {
  const count = Number(world.getDynamicProperty(`${PROP_PREFIX}${ownerKey}:n`) ?? 0);
  const keys = [];
  for (let i = 0; i < count; i++) keys.push(`${PROP_PREFIX}${ownerKey}:${i}`);
  return keys;
}

function clearStored(ownerKey) {
  for (const k of propKeys(ownerKey)) world.setDynamicProperty(k, undefined);
  world.setDynamicProperty(`${PROP_PREFIX}${ownerKey}:n`, undefined);
}

function writeStored(ownerKey, json) {
  clearStored(ownerKey);
  const parts = Math.ceil(json.length / CHUNK);
  for (let i = 0; i < parts; i++) world.setDynamicProperty(`${PROP_PREFIX}${ownerKey}:${i}`, json.slice(i * CHUNK, (i + 1) * CHUNK));
  world.setDynamicProperty(`${PROP_PREFIX}${ownerKey}:n`, parts);
}

/** Records a live preview: protects its blocks and persists restore data. */
export function registerPreview(playerId, dimension, changed) {
  for (const entry of changed) PROTECTED.set(blockKey(dimension.id, entry.location), playerId);
  try {
    // Palette-compress: most original blocks are air/grass/dirt.
    const palette = [];
    const paletteIndex = new Map();
    const rows = changed.map((entry) => {
      const encoded = encodePermutation(entry.permutation);
      const id = JSON.stringify(encoded);
      if (!paletteIndex.has(id)) {
        paletteIndex.set(id, palette.length);
        palette.push(encoded);
      }
      return [entry.location.x, entry.location.y, entry.location.z, paletteIndex.get(id)];
    });
    const json = JSON.stringify({ d: dimension.id, p: palette, r: rows });
    writeStored(owner(playerId), json);
  } catch (error) {
    console.warn(`[CAVIRA] Could not persist preview restore data: ${error}`);
  }
}

/** Forgets a preview once its blocks have been restored or built over. */
export function unregisterPreview(playerId, dimension, changed) {
  for (const entry of changed) PROTECTED.delete(blockKey(dimension.id, entry.location));
  try {
    clearStored(owner(playerId));
  } catch {
    // Non-fatal.
  }
}

/** Attempts to restore any previews left behind by a previous session. */
function recoverStoredPreviews() {
  let outstanding = 0;
  const ids = new Set();
  for (const k of world.getDynamicPropertyIds()) {
    if (!k.startsWith(PROP_PREFIX) || !k.endsWith(":n")) continue;
    const ownerKey = k.slice(PROP_PREFIX.length, -2);
    if (!ownerKey.startsWith(`${SESSION}:`)) ids.add(ownerKey);
  }
  for (const ownerKey of ids) {
    try {
      const json = propKeys(ownerKey).map((k) => world.getDynamicProperty(k) ?? "").join("");
      const data = JSON.parse(json);
      const dimension = world.getDimension(data.d);
      const palette = data.p.map(decodePermutation);
      const remaining = [];
      for (const row of data.r) {
        const [x, y, z, p] = row;
        const block = dimension.getBlock({ x, y, z });
        if (!block) {
          remaining.push(row); // chunk not loaded yet — retry later
          continue;
        }
        if (palette[p]) block.setPermutation(palette[p]);
      }
      if (remaining.length === 0) {
        clearStored(ownerKey);
        console.warn(`[CAVIRA] Restored an unfinished construction preview from a previous session.`);
      } else {
        outstanding++;
        writeStored(ownerKey, JSON.stringify({ d: data.d, p: data.p, r: remaining }));
      }
    } catch (error) {
      console.warn(`[CAVIRA] Discarding unreadable preview restore data: ${error}`);
      clearStored(ownerKey);
    }
  }
  return outstanding;
}

/**
 * Installs break protection, leave handling and post-reload recovery.
 * @param {(playerId:string) => void} onPlayerLeave called (deferred) when a player with a preview leaves
 */
export function installPreviewGuard(onPlayerLeave) {
  world.beforeEvents.playerBreakBlock.subscribe((event) => {
    const k = blockKey(event.block.dimension.id, event.block.location);
    if (!PROTECTED.has(k)) return;
    event.cancel = true;
    const player = event.player;
    system.run(() => {
      try {
        player.onScreenDisplay.setActionBar("§eThat is a construction preview marker — cancel the preview with the tablet to remove it.");
      } catch {
        // Player may have left.
      }
    });
  });

  world.beforeEvents.playerLeave.subscribe((event) => {
    const playerId = event.player.id;
    system.run(() => onPlayerLeave(playerId));
  });

  world.afterEvents.worldLoad.subscribe(() => {
    // Retry every 5 s until all stored previews are restored (their chunks
    // may not be loaded the instant the world opens).
    if (recoverStoredPreviews() > 0) {
      recoveryHandle = system.runInterval(() => {
        if (recoverStoredPreviews() === 0) system.clearRun(recoveryHandle);
      }, 100);
    }
  });
}
