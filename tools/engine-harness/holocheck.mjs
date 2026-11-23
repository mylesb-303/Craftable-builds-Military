// v1.9: hologram model for every build — runs as a job, fits the particle budget, cells lie inside the build volume.
import { MockDimension, system } from "@minecraft/server";
import { compileHologramSource, modelHologram, HOLOGRAM_TIMING } from "./scripts/hologram.js";
import { runBuilder } from "./scripts/main.js";
import { STRUCTURES } from "./scripts/registry.js";
let bad = 0, worstSlice = 0; const rows = [];
for (const s of Object.values(STRUCTURES).flat()) {
  const g = modelHologram(compileHologramSource(new MockDimension(), s, runBuilder, "standard", { designator: "09" }), s);
  let r, t = performance.now(), maxSlice = 0;
  do { r = g.next(); const now = performance.now(); maxSlice = Math.max(maxSlice, now - t); t = now; } while (!r.done);
  const m = r.value;
  const inside = m.cells.every(c => c.x >= 0 && c.z >= 0 && c.y >= 0 && c.x < s.size.x && c.z < s.size.z && c.y < s.size.y);
  const ok = m.cells.length > 0 && m.cells.length <= HOLOGRAM_TIMING.BUDGET && inside;
  if (!ok) bad++;
  worstSlice = Math.max(worstSlice, maxSlice);
  rows.push(`${ok ? "PASS" : "FAIL"} ${s.id.padEnd(36)} shell ${String(m.surface).padStart(6)} -> ${String(m.cells.length).padStart(5)} particles  LOD 1:${m.lod}${m.partial ? "  (near section)" : ""}  slice ${maxSlice.toFixed(0)}ms`);
}
console.log(rows.join("\n"));
console.log(bad ? `HOLO FAIL (${bad})` : `HOLO PASS worst slice ${worstSlice.toFixed(0)} ms`);
// draw test: one full cycle covers every cell, every particle lies inside the placed build's bounds, in all rotations
{
  const { startHologram, HOLO_PARTICLE } = await import("./scripts/hologram.js");
  const { worldBounds } = await import("./scripts/construction_engine.js");
  let fails = 0;
  for (const id of ["super_heavy_aircraft_hangar", "watch_tower", "guard_post", "runway_full_long", "pier_corner"]) {
    const s = Object.values(STRUCTURES).flat().find(x => x.id === id);
    const gen = modelHologram(compileHologramSource(new MockDimension(), s, runBuilder, "standard", {}), s);
    let r; do { r = gen.next(); } while (!r.done);
    const model = r.value;
    for (const rotation of ["south", "west", "north", "east"]) {
      let tick; const orig = system.runInterval; system.runInterval = (f) => { tick = f; return 7; };
      const spawned = [];
      const player = { isValid: true, spawnParticle: (name, loc, m) => { if (name !== HOLO_PARTICLE) throw new Error("bad particle"); spawned.push(loc); } };
      const origin = { x: 100, y: 64, z: -40 };
      const session = { origin, rotation, structure: s };
      const stop = startHologram(player, session, model);
      system.runInterval = orig;
      for (let t = 0; t < HOLOGRAM_TIMING.CYCLE_TICKS; t++) tick();
      stop();
      const b = worldBounds(origin, s.size, rotation);
      const out = spawned.filter(p => p.x < b.min.x || p.x > b.max.x + 1 || p.z < b.min.z || p.z > b.max.z + 1 || p.y < b.min.y || p.y > b.max.y + 1);
      const ok = spawned.length >= model.cells.length && out.length === 0;
      if (!ok) { fails++; console.log(`FAIL draw ${id} ${rotation}: spawned ${spawned.length}/${model.cells.length}, outside ${out.length}`); }
    }
  }
  console.log(fails ? `DRAW FAIL (${fails})` : "DRAW PASS (5 builds × 4 rotations)");
}
