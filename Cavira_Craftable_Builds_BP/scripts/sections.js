import { toWorldLocation } from "./placement.js";

// ---------------------------------------------------------------------------
// Sectioned construction (v1.7.2).
// Very long builds (the full runways) are too big to load at once: Bedrock
// caps a ticking area at 100 chunks and a tablet or console struggles to hold
// several hundred chunks loaded while a script works through them. Such builds
// are split along their length into sections that each fit ONE temporary
// ticking area; each section is loaded, built and released in turn, starting
// at the end nearest the player.
// ---------------------------------------------------------------------------

const SECTION_CHUNKS = 64; // per-section budget (well under the 100-chunk cap)

/** Worst-case number of chunks a span of n blocks can touch. */
const span = (n) => Math.floor((n - 1) / 16) + 2;

/**
 * Local z ranges [z1, z2] to build, nearest the player first, or null when the
 * whole build fits comfortably in one ticking area.
 */
export function sectionPlan(structure) {
  const { x, z } = structure.size;
  const cols = span(x);
  if (cols * span(z) <= SECTION_CHUNKS) return null;
  const rows = Math.max(2, Math.floor(SECTION_CHUNKS / cols));
  const len = (rows - 1) * 16;
  const plan = [];
  for (let z2 = z - 1; z2 >= 0; z2 -= len) plan.push([Math.max(0, z2 - len + 1), z2]);
  return plan;
}

/** World bounds of the local box x 0..size.x-1, all y, z z1..z2. */
export function sectionBounds(origin, size, rotation, z1, z2) {
  const a = toWorldLocation(origin, { x: 0, y: 0, z: z1 }, size, rotation);
  const b = toWorldLocation(origin, { x: size.x - 1, y: size.y - 1, z: z2 }, size, rotation);
  return {
    min: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), z: Math.min(a.z, b.z) },
    max: { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y), z: Math.max(a.z, b.z) }
  };
}
