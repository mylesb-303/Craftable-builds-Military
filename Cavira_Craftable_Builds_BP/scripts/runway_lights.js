import { world, system, BlockPermutation } from "@minecraft/server";
import { toWorldLocation } from "./placement.js";
import { fullRunwayLampCells, FULL_RUNWAY_SIZES } from "./structures/full_runways.js";

// ---------------------------------------------------------------------------
// Sequenced runway edge lights (v1.9.1).
// Each full runway's edge lamps are real redstone lamps with a block under
// them. A light wave runs down the runway by switching the block under each
// lamp pair to a redstone block and back, so the lamps are lit by genuine
// redstone power. Script-driven rather than repeater chains because repeaters
// placed by script can ignore their direction (MCPE-190505), which would break
// the chain on rotated runways. Records persist in a world dynamic property;
// a record removes itself once its lamps are gone (undone or demolished).
// ---------------------------------------------------------------------------

const PROP = "cavira:runway_lights";
const MAX = 12;
const TRAIL = 3;        // lamp pairs lit at once
const PAUSE = 30;       // ticks between waves
const LAMP = /redstone_lamp/;
const SUPPORT = "minecraft:polished_deepslate"; // the runway's foundation block (kit B.concrete)

let records = [];
let lit;
let off;

function load() {
  try {
    records = JSON.parse(String(world.getDynamicProperty(PROP) ?? "[]"));
  } catch {
    records = [];
  }
  for (const r of records) prepare(r);
}

function save() {
  world.setDynamicProperty(PROP, JSON.stringify(records.map(({ id, dim, origin, rotation }) => ({ id, dim, origin, rotation }))));
}

function prepare(r) {
  const size = FULL_RUNWAY_SIZES[r.id];
  r.cells = fullRunwayLampCells(r.id).map((pair) => pair.map(([x, y, z]) => toWorldLocation(r.origin, { x, y, z }, size, r.rotation)));
  r.head = 0;
  r.wait = 0;
}

/** Starts the light wave on a newly built full runway. */
export function registerRunwayLights(structureId, dimension, origin, rotation) {
  if (!FULL_RUNWAY_SIZES[structureId]) return;
  records = records.filter((r) => !(r.dim === dimension.id && r.origin.x === origin.x && r.origin.y === origin.y && r.origin.z === origin.z));
  const r = { id: structureId, dim: dimension.id, origin, rotation };
  prepare(r);
  records.push(r);
  while (records.length > MAX) records.shift();
  save();
}

function setUnder(dimension, loc, perm) {
  try {
    const block = dimension.getBlock(loc);
    if (!block) return "unloaded";
    // only touch our own lamp supports: never overwrite something a player put there
    const id = block.typeId;
    if (id !== "minecraft:redstone_block" && id !== SUPPORT) return "foreign";
    const above = dimension.getBlock({ x: loc.x, y: loc.y + 1, z: loc.z });
    if (!above || !LAMP.test(above.typeId)) return "gone";
    block.setPermutation(perm);
    return "ok";
  } catch {
    return "unloaded";
  }
}

function step() {
  if (!records.length) return;
  lit ??= BlockPermutation.resolve("minecraft:redstone_block");
  off ??= BlockPermutation.resolve(SUPPORT);
  let changed = false;
  for (const r of records) {
    if (r.wait > 0) { r.wait--; continue; }
    let dimension;
    try {
      dimension = world.getDimension(r.dim);
    } catch {
      continue;
    }
    const n = r.cells.length;
    let gone = 0, checked = 0;
    if (r.head < n) for (const loc of r.cells[r.head]) { checked++; if (setUnder(dimension, loc, lit) === "gone") gone++; }
    const tail = r.head - TRAIL;
    if (tail >= 0 && tail < n) for (const loc of r.cells[tail]) setUnder(dimension, loc, off);
    if (checked && gone === checked && r.head === 0) { r.dead = true; changed = true; continue; }
    r.head++;
    if (r.head >= n + TRAIL) { r.head = 0; r.wait = PAUSE; }
  }
  if (changed) {
    records = records.filter((r) => !r.dead);
    save();
  }
}

export function installRunwayLights() {
  world.afterEvents.worldLoad.subscribe(() => {
    load();
    system.runInterval(step, 1);
  });
}
