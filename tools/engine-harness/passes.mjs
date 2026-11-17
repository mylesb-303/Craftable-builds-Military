// Runs every structure through compile + access + light passes; prints a table.
import { MockDimension } from "@minecraft/server";
import { STRUCTURES } from "./scripts/registry.js";
import { runBuilder, postPassesFor } from "./scripts/main.js";
import { clearVolume, clearStartY } from "./scripts/placement.js";
import { compileBuild, worldBounds } from "./scripts/construction_engine.js";
const only = process.argv[2];
const rows = [];
for (const s of Object.values(STRUCTURES).flat()) {
  if (only && s.id !== only) continue;
  const o = { x: 0, y: 61, z: 0 };
  const t0 = Date.now();
  const comp = compileBuild(new MockDimension(), d => { if (s.placementMode !== "overlay" && s.placementMode !== "excavation") clearVolume(d, o, s.size, "south", clearStartY(s)); runBuilder(s.id, d, o, "south", "standard", {}); }, worldBounds(o, s.size, "south"));
  const rep = {};
  for (const [name, pass] of postPassesFor(s)) { const g = pass(comp); let r; do { r = g.next(); } while (!r.done); rep[name] = r.value; }
  rows.push([s.id, rep.access ? `${rep.access.fixed} fixed / ${rep.access.remaining} unreached` : "-", rep.light ? `${rep.light.darkBefore} dark -> ${rep.light.darkAfter} (+${rep.light.added} lights)` : "overlay", `${Date.now() - t0}ms`]);
}
for (const r of rows) console.log(r.map((c, i) => String(c).padEnd([34, 24, 34, 8][i])).join(""));
