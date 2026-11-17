import { MockDimension } from "@minecraft/server";
import { STRUCTURES } from "./scripts/registry.js";
import { runBuilder } from "./scripts/main.js";
import { clearVolume, clearStartY } from "./scripts/placement.js";
import { compileBuild, worldBounds } from "./scripts/construction_engine.js";
import { lightPass } from "./scripts/postprocess.js";
const id = process.argv[2]; const s = Object.values(STRUCTURES).flat().find(x => x.id === id); const o = { x: 0, y: 0, z: 0 };
const c = compileBuild(new MockDimension(), d => { clearVolume(d, o, s.size, "south", clearStartY(s)); runBuilder(s.id, d, o, "south", "standard", {}); }, worldBounds(o, s.size, "south"));
const before = c.grid.slice(); const g = lightPass(c); let r; do { r = g.next(); } while (!r.done);
const by = {}; for (let i = 0; i < before.length; i++) if (before[i] !== c.grid[i]) { const x = i % c.W, t = (i - x) / c.W, z = t % c.D, y = (t - z) / c.D; const k = `${c.palette.list[c.grid[i]].type.id.replace("minecraft:","")}@y${y}${z>=101?"(apron)":""}`; by[k] = (by[k] ?? 0) + 1; }
console.log(r.value, by);
