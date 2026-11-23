// v1.10: Operations Map Room — terrain scan fills the table; unloaded land falls back to the designed map; table centre marks the room.
import { MockDimension, BlockPermutation } from "@minecraft/server";
import { constructStaged, worldBounds } from "./scripts/construction_engine.js";
import { runBuilder, postPassesFor } from "./scripts/main.js";
import { STRUCTURES } from "./scripts/registry.js";
import { clearVolume, clearStartY, toWorldLocation } from "./scripts/placement.js";
import { scanTerrain } from "./scripts/terrain_scan.js";
import { MAP_TABLE } from "./scripts/structures/map_room.js";
const s = Object.values(STRUCTURES).flat().find(x => x.id === "operations_map_room");
let bad = 0;
for (const [label, unloadedX, expectScanned] of [["loaded world", Infinity, true], ["half the land loaded", 20, true], ["land not loaded", -1000, false]]) for (const rotation of ["south", "east"]) {
  const d = new MockDimension(); const o = { x: 0, y: 63, z: 0 };
  // a hill and a lake to see on the map
  for (let x = -30; x <= 30; x++) for (let z = -40; z <= -20; z++) for (let y = 63; y < 63 + Math.max(0, 20 - Math.abs(x)); y++) d.blocks.set(`${x},${y},${z}`, BlockPermutation.resolve("minecraft:stone"));
  for (let x = 30; x <= 60; x++) for (let z = 0; z <= 20; z++) d.blocks.set(`${x},62,${z}`, BlockPermutation.resolve("minecraft:water"));
  d.unloadedX = unloadedX;
  const terrain = scanTerrain(d, o, rotation, s.size, 2);
  d.unloadedX = Infinity;
  await constructStaged(d, (r) => { clearVolume(r, o, s.size, rotation, clearStartY(s)); runBuilder(s.id, r, o, rotation, "standard", { terrain }); }, null, worldBounds(o, s.size, rotation), postPassesFor(s));
  const { TX1, TX2, TZ1, TZ2 } = MAP_TABLE;
  const kinds = new Map();
  let relief = 0;
  for (let x = TX1 + 1; x < TX2; x++) for (let z = TZ1 + 1; z < TZ2; z++) {
    const w = toWorldLocation(o, { x, y: 2, z }, s.size, rotation);
    const id = d.getBlock(w).typeId; kinds.set(id, (kinds.get(id) ?? 0) + 1);
    if (d.getBlock({ ...w, y: w.y + 1 }).typeId !== "minecraft:air") relief++;
  }
  const filled = [...kinds.entries()].filter(([k]) => k !== "minecraft:air").reduce((a, [, n]) => a + n, 0);
  const ok = terrain.scanned === expectScanned && filled === (TX2 - TX1 - 1) * (TZ2 - TZ1 - 1) && (!expectScanned || (kinds.has("minecraft:blue_concrete") && relief > 0));
  if (!ok) bad++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label} ${rotation}: scanned ${terrain.scanned}, table cells filled ${filled}, relief cells ${relief}, surfaces ${[...kinds.keys()].map(k => k.slice(10)).join(", ")}`);
}
console.log(bad ? `MAPROOM FAIL (${bad})` : "MAPROOM PASS");
