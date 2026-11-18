// Measures the longest stretch of work between yields in each staged job (engine + post passes).
// Bedrock interrupts a runJob slice that runs too long ("InternalError: interrupted").
import { MockDimension } from "@minecraft/server";
import { compileBuild, worldBounds } from "./scripts/construction_engine.js";
import { runBuilder, postPassesFor } from "./scripts/main.js";
import { STRUCTURES } from "./scripts/registry.js";
import { clearVolume, clearStartY } from "./scripts/placement.js";
import { sectionPlan, sectionBounds } from "./scripts/sections.js";
const LIMIT = Number(process.env.SLICE_MS ?? 15);
const only = process.argv[2];
let worst = 0, bad = 0;
for (const s of Object.values(STRUCTURES).flat()) {
  if (only && !s.id.startsWith(only)) continue;
  const o = { x: 0, y: 61, z: 0 }, rot = "south";
  const plan = sectionPlan(s);
  const [z1, z2] = plan ? plan[0] : [0, s.size.z - 1];
  const bounds = plan ? sectionBounds(o, s.size, rot, z1, z2) : worldBounds(o, s.size, rot);
  const comp = compileBuild(new MockDimension(), (r) => { clearVolume(r, o, s.size, rot, clearStartY(s)); runBuilder(s.id, r, o, rot, "standard", { zRange: plan ? [z1, z2] : undefined }); }, bounds, Boolean(plan));
  for (const [name, pass] of postPassesFor(s)) {
    const g = pass(comp, {});
    let max = 0, t = performance.now(), r;
    do { r = g.next(); const now = performance.now(); max = Math.max(max, now - t); t = now; } while (!r.done);
    worst = Math.max(worst, max);
    if (max > LIMIT) { bad++; console.log(`SLOW ${s.id} ${name}: ${max.toFixed(1)} ms between yields`); }
  }
}
console.log(bad ? `SLICE FAIL (${bad}) worst ${worst.toFixed(1)} ms` : `SLICE PASS worst ${worst.toFixed(1)} ms`);
