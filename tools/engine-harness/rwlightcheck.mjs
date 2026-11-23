// v1.9.1: runway light wave — every lamp has its support under it, the wave lights each pair in order from the near threshold, and leaves nothing lit after a full cycle.
import { MockDimension, system, world, BlockPermutation } from "@minecraft/server";
import { constructStaged, worldBounds } from "./scripts/construction_engine.js";
import { runBuilder, postPassesFor } from "./scripts/main.js";
import { STRUCTURES } from "./scripts/registry.js";
import { clearVolume, clearStartY, toWorldLocation } from "./scripts/placement.js";
import { fullRunwayLampCells, FULL_RUNWAY_SIZES } from "./scripts/structures/full_runways.js";
let bad = 0;
for (const id of Object.keys(FULL_RUNWAY_SIZES)) for (const rotation of ["south", "east"]) {
  const s = Object.values(STRUCTURES).flat().find(x => x.id === id);
  const d = new MockDimension(); const o = { x: 3, y: 61, z: -7 };
  await constructStaged(d, (r) => { clearVolume(r, o, s.size, rotation, clearStartY(s)); runBuilder(id, r, o, rotation, "standard", {}); }, null, worldBounds(o, s.size, rotation), postPassesFor(s));
  const pairs = fullRunwayLampCells(id).map(p => p.map(([x, y, z]) => toWorldLocation(o, { x, y, z }, s.size, rotation)));
  const ids = (l) => d.getBlock(l).typeId;
  const badCells = pairs.flat().filter(l => !(ids(l) === "minecraft:polished_deepslate" && ids({ ...l, y: l.y + 1 }) === "minecraft:redstone_lamp"));
  if (badCells.length) console.log("   bad:", badCells.slice(0, 4).map(l => `${ids(l).slice(10)}/${ids({ ...l, y: l.y + 1 }).slice(10)}`).join(" "), "count", badCells.length);
  const okSupport = badCells.length === 0;
  // first pair nearest the player end (local high z)
  const nearFirst = fullRunwayLampCells(id)[0][0][2] > fullRunwayLampCells(id).at(-1)[0][2];
  // drive the controller
  world.getDimension = () => d;
  const { registerRunwayLights, installRunwayLights } = await import("./scripts/runway_lights.js");
  let tick; const orig = system.runInterval; system.runInterval = (f) => { tick = f; return 1; };
  let loadCb; const subs = world.afterEvents.worldLoad.subscribe; world.afterEvents.worldLoad.subscribe = (f) => { loadCb = f; };
  installRunwayLights(); loadCb(); system.runInterval = orig; world.afterEvents.worldLoad.subscribe = subs;
  registerRunwayLights(id, d, o, rotation);
  let order = true, maxLit = 0;
  for (let t = 0; t < pairs.length + 3; t++) {
    tick();
    const litNow = pairs.map((p, i) => ids(p[0]) === "minecraft:redstone_block" ? i : -1).filter(i => i >= 0);
    maxLit = Math.max(maxLit, litNow.length);
    if (litNow.length && litNow.at(-1) !== Math.min(t, pairs.length - 1)) order = false;
  }
  const leftover = pairs.filter(p => ids(p[0]) === "minecraft:redstone_block").length;
  const ok = okSupport && nearFirst && order && maxLit <= 3 && leftover === 0;
  if (!ok) bad++;
  console.log(`${ok ? "PASS" : "FAIL"} ${id} ${rotation}: ${pairs.length} lamp pairs, supports ${okSupport}, near-end first ${nearFirst}, wave in order ${order}, max lit ${maxLit}, left lit ${leftover}`);
}
console.log(bad ? `RWLIGHTS FAIL (${bad})` : "RWLIGHTS PASS");
