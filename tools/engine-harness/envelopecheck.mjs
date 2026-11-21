// v1.8: every hangar's aircraft envelope must be empty (air or invisible light blocks only) after all passes.
import { MockDimension } from "@minecraft/server";
import { compileBuild, worldBounds } from "./scripts/construction_engine.js";
import { runBuilder, postPassesFor } from "./scripts/main.js";
import { STRUCTURES } from "./scripts/registry.js";
import { clearVolume, clearStartY } from "./scripts/placement.js";
let bad = 0, n = 0;
for (const s of Object.values(STRUCTURES).flat()) {
  if (!s.envelope) continue;
  n++;
  const o = { x: 0, y: 61, z: 0 };
  const comp = compileBuild(new MockDimension(), (r) => { clearVolume(r, o, s.size, "south", clearStartY(s)); runBuilder(s.id, r, o, "south", "standard", {}); }, worldBounds(o, s.size, "south"));
  for (const [, pass] of postPassesFor(s)) { const g = pass(comp, {}); while (!g.next().done); }
  const { W, D, grid, palette } = comp;
  const hits = new Map();
  const boxes = Array.isArray(s.envelope) ? s.envelope : [s.envelope];
  const E = boxes[0];
  for (const B of boxes) for (let y = B.y1; y <= B.y2; y++) for (let z = B.z1; z <= B.z2; z++) for (let x = B.x1; x <= B.x2; x++) {
    const v = grid[(y * D + z) * W + x];
    const id = v ? palette.list[v].type.id : "unwritten";
    if (id === "minecraft:air" || id.includes("light_block")) continue;
    if (!hits.has(id)) hits.set(id, `${x},${y},${z}`);
    hits.set(id + "#", (hits.get(id + "#") ?? 0) + 1);
  }
  const ok = hits.size === 0;
  if (!ok) bad++;
  console.log(`${ok ? "PASS" : "FAIL"} ${s.id} envelope ${boxes.length} box(es), first ${E.x2 - E.x1 + 1}w x ${E.y2 - E.y1 + 1}h x ${E.z2 - E.z1 + 1}d` + (ok ? "" : " — " + [...hits].filter(([k]) => !k.endsWith("#")).map(([k, at]) => `${k}×${hits.get(k + "#")} (e.g. ${at})`).join(", ")));
}
console.log(bad ? `ENVELOPE FAIL (${bad}/${n})` : `ENVELOPE PASS (${n})`);
