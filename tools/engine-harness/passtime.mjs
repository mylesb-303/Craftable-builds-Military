import { MockDimension } from "@minecraft/server";
import { compileBuild, worldBounds } from "./scripts/construction_engine.js";
import { runBuilder, postPassesFor } from "./scripts/main.js";
import { STRUCTURES } from "./scripts/registry.js";
import { clearVolume, clearStartY } from "./scripts/placement.js";
import { sectionPlan, sectionBounds } from "./scripts/sections.js";
const rows = [];
for (const s of Object.values(STRUCTURES).flat()) {
  const o = { x: 0, y: 61, z: 0 }, rot = "south";
  const plan = sectionPlan(s);
  const [z1, z2] = plan ? plan[0] : [0, s.size.z - 1];
  const bounds = plan ? sectionBounds(o, s.size, rot, z1, z2) : worldBounds(o, s.size, rot);
  const comp = compileBuild(new MockDimension(), (r) => { clearVolume(r, o, s.size, rot, clearStartY(s)); runBuilder(s.id, r, o, rot, "standard", { zRange: plan ? [z1, z2] : undefined }); }, bounds, Boolean(plan));
  for (const [name, pass] of postPassesFor(s)) {
    const g = pass(comp, {}); let n = 0; const t = performance.now(); let r;
    do { r = g.next(); n++; } while (!r.done);
    rows.push([s.id, name, Math.round(performance.now() - t), n]);
  }
}
rows.sort((a, b) => b[2] - a[2]); for (const r of rows.slice(0, 14)) console.log(r.join("\t"));
