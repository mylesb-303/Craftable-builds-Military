import { system, MolangVariableMap } from "@minecraft/server";
import { compileBuild, worldBounds } from "./construction_engine.js";
import { clearVolume, clearStartY, toWorldLocation } from "./placement.js";
import { sectionPlan } from "./sections.js";

// ---------------------------------------------------------------------------
// Hologram preview (v1.9.0).
// Shows the real building as a glowing, see-through block hologram before it
// is placed. The build is compiled once (nothing is written to the world),
// its outer shell is extracted, tinted with approximate block colours and
// drawn with a custom particle that only the placing player can see
// (Player.spawnParticle). Big builds are drawn at a coarser level of detail
// so the particle count stays within a fixed budget on tablets and consoles.
// ---------------------------------------------------------------------------

export const HOLO_PARTICLE = "cavira:holo_voxel";
const BUDGET = 1600;         // particles alive per player at once
const LIFE_TICKS = 24;       // matches the particle's lifetime (1.2 s)
const CYCLE_TICKS = 16;      // every cell is re-emitted at least this often
const MAX_LOD = 8;

// --- block colours (approximate, by name) -----------------------------------
const COLOURS = [
  [/glass|pane/, [0.55, 0.85, 1.0]],
  [/sea_lantern|froglight|glowstone|shroomlight|lamp|lantern/, [1.0, 0.97, 0.75]],
  [/yellow|gold|hay|bamboo/, [1.0, 0.82, 0.15]],
  [/red|nether_brick|tnt|redstone/, [0.85, 0.2, 0.2]],
  [/orange|terracotta|acacia|copper/, [0.9, 0.5, 0.25]],
  [/lime|green|moss|leaves|grass|azalea|cactus/, [0.35, 0.7, 0.3]],
  [/cyan|prismarine|diamond|warped/, [0.2, 0.75, 0.8]],
  [/light_blue|ice/, [0.5, 0.75, 1.0]],
  [/blue|lapis/, [0.25, 0.4, 0.9]],
  [/purple|magenta|purpur|amethyst/, [0.65, 0.4, 0.85]],
  [/pink/, [0.95, 0.6, 0.75]],
  [/white|quartz|snow|calcite|bone|wool|birch|diorite/, [0.95, 0.95, 0.95]],
  [/black|blackstone|obsidian|deepslate|basalt|coal|tinted/, [0.22, 0.22, 0.26]],
  [/brown|spruce|dark_oak|oak|log|planks|wood|barrel|chest|mud|dirt|bookshelf/, [0.55, 0.38, 0.22]],
  [/light_gray|smooth_stone|andesite|iron|tuff|stone|cobble|gravel|concrete|tile|brick|slab|stairs|wall/, [0.68, 0.7, 0.72]],
  [/water/, [0.25, 0.45, 0.95]]
];
const FALLBACK = [0.6, 0.85, 1.0];
const HOLO_TINT = [0.45, 0.85, 1.0];
/** Approximate block colour, nudged toward cyan so it reads as a hologram. */
const colourOf = (id) => {
  let rgb = FALLBACK;
  for (const [re, c] of COLOURS) if (re.test(id)) { rgb = c; break; }
  return rgb.map((v, i) => Math.round((0.72 * v + 0.28 * HOLO_TINT[i]) * 100) / 100);
};

const NOT_SHOWN = /:air$|light_block|structure_void/;
const SEE_THROUGH = /:air$|light_block|glass|pane|bars|fence|rail|torch|ladder|carpet|lantern|chain|button|lever|flower|water|leaves/;

/**
 * Compiles a structure for its hologram (synchronous, like the construction
 * engine's compile step — it must not run inside a job slice). Nothing is
 * written to the world. Sectioned (very long) builds model the near end only.
 */
export function compileHologramSource(dimension, structure, runBuilder, variantId, options = {}) {
  const origin = { x: 0, y: 0, z: 0 };
  const plan = sectionPlan(structure);
  const zRange = plan ? [plan[0][0], structure.size.z - 1] : undefined;
  const bounds = worldBounds(origin, structure.size, "south");
  if (zRange) bounds.min.z = zRange[0];
  const compiled = compileBuild(dimension, (recorder) => {
    if (structure.placementMode !== "overlay" && structure.placementMode !== "excavation") {
      clearVolume(recorder, origin, structure.size, "south", clearStartY(structure));
    }
    runBuilder(structure.id, recorder, origin, "south", variantId, { ...options, zRange });
  }, bounds, true);
  return { compiled, partial: Boolean(plan), origin };
}

/**
 * Builds the hologram model from a compiled source: a list of cells in the
 * structure's local frame (rotation "south"), each { x, y, z, k, rgb }.
 * A generator — run it as a job.
 */
export function* modelHologram(source, structure) {
  const { compiled, origin } = source;
  const { W, H, D, grid, palette, min } = compiled;
  const ids = palette.list.map((p) => (p ? p.type.id : "minecraft:air"));
  const at = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D ? -1 : grid[(y * D + z) * W + x]);
  // show what stands above ground; foundations are hidden by the terrain anyway
  const groundY = Math.max(0, (structure.foundationDepth ?? 1) - 1) - (min.y - origin.y);
  const surface = [];
  let n = 0;
  for (let y = Math.max(0, groundY); y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (++n % 4096 === 0) yield;
    const v = at(x, y, z);
    if (v <= 0 || NOT_SHOWN.test(ids[v])) continue;
    let exposed = false;
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const u = at(x + dx, y + dy, z + dz);
      if (u === -1 ? dy !== -1 : u > 0 && SEE_THROUGH.test(ids[u])) { exposed = true; break; }
    }
    if (exposed) surface.push([x + min.x - origin.x, y + min.y - origin.y, z + min.z - origin.z, v]);
  }
  // level of detail: merge into k×k×k cells until the count fits the budget
  let cells = [];
  for (let k = 1; k <= MAX_LOD; k++) {
    const seen = new Map();
    let m = 0;
    for (const [x, y, z, v] of surface) {
      if (++m % 2048 === 0) yield;
      const cx = Math.floor(x / k), cy = Math.floor(y / k), cz = Math.floor(z / k);
      const key = (cy * 4096 + cz) * 4096 + cx; // numeric key: cheaper than strings
      if (!seen.has(key)) seen.set(key, [cx * k, cy * k, cz * k, v]);
      if (seen.size > BUDGET && k < MAX_LOD) break; // too many at this LOD: try the next one
    }
    if (seen.size > BUDGET && k < MAX_LOD) { yield; continue; }
    cells = [...seen.values()].map(([x, y, z, v]) => ({ x, y, z, k, rgb: colourOf(ids[v]) }));
    if (cells.length <= BUDGET) break;
    yield;
  }
  return { cells, lod: cells[0]?.k ?? 1, surface: surface.length, partial: source.partial };
}

/** One reusable molang map per colour/size combination. */
function molangFor(cache, rgb, k, alpha) {
  const key = `${rgb.join(",")}|${k}|${alpha}`;
  let m = cache.get(key);
  if (!m) {
    m = new MolangVariableMap();
    m.setColorRGBA("variable.color", { red: rgb[0], green: rgb[1], blue: rgb[2], alpha });
    m.setFloat("variable.size", 0.5 * k);
    cache.set(key, m);
  }
  return m;
}

/**
 * Starts drawing a hologram for a preview session. The session supplies
 * origin, rotation and structure; it may change while the hologram runs.
 * Returns a stop function.
 */
export function startHologram(player, session, model) {
  const cache = new Map();
  let i = 0;
  const perTick = Math.max(20, Math.ceil(model.cells.length / CYCLE_TICKS));
  let handle;
  const stop = () => {
    session.holoStopped = true;
    if (handle !== undefined) system.clearRun(handle);
    handle = undefined;
  };
  handle = system.runInterval(() => {
    if (session.holoStopped) return stop();
    try {
      if (!player.isValid) return stop();
    } catch {
      return stop();
    }
    const { origin, rotation, structure } = session;
    if (!origin) return;
    const alpha = session.holoInvalid ? 0.55 : 0.42;
    for (let s = 0; s < perTick && model.cells.length; s++) {
      const cell = model.cells[i];
      i = (i + 1) % model.cells.length;
      const half = (cell.k - 1) / 2;
      // rotate the cell's centre block, then centre the particle in that block
      const size = structure.size;
      const w = toWorldLocation(origin, { x: Math.min(size.x - 1, Math.round(cell.x + half)), y: cell.y, z: Math.min(size.z - 1, Math.round(cell.z + half)) }, size, rotation);
      const cy = Math.min(cell.y + cell.k / 2, size.y - 0.5);
      const rgb = session.holoInvalid ? [1, 0.25, 0.25] : cell.rgb;
      try {
        player.spawnParticle(HOLO_PARTICLE, { x: w.x + 0.5, y: origin.y + cy, z: w.z + 0.5 }, molangFor(cache, rgb, cell.k, alpha));
      } catch {
        // unloaded chunk / outside the world: skip this cell this cycle
      }
    }
  }, 1);
  return stop;
}

export const HOLOGRAM_TIMING = { BUDGET, LIFE_TICKS, CYCLE_TICKS };
