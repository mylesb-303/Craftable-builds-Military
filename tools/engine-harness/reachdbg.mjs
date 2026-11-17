import { MockDimension } from "@minecraft/server";
import { STRUCTURES } from "./scripts/registry.js";
import { runBuilder } from "./scripts/main.js";
import { clearVolume, clearStartY } from "./scripts/placement.js";
import { compileBuild, worldBounds } from "./scripts/construction_engine.js";
import { accessPass } from "./scripts/postprocess.js";
const id = process.argv[2]; const s = Object.values(STRUCTURES).flat().find(x => x.id === id);
const o = { x: 0, y: 0, z: 0 };
const comp = compileBuild(new MockDimension(), d => { clearVolume(d, o, s.size, "south", clearStartY(s)); runBuilder(s.id, d, o, "south", "standard", {}); }, worldBounds(o, s.size, "south"));
const before = comp.grid.slice();
const g = accessPass(comp); let r; do { r = g.next(); } while (!r.done);
// list changed cells (fixes)
const ch = []; for (let i = 0; i < before.length; i++) if (before[i] !== comp.grid[i]) { const x = i % comp.W, t = (i - x) / comp.W, z = t % comp.D, y = (t - z) / comp.D; ch.push([x, y, z, comp.palette.list[comp.grid[i]].type.id.replace("minecraft:", "")]); }
console.log("fixes:", r.value, "changed cells:", ch.length); console.log(ch.slice(0, 40).map(c => c.join(",")).join("  "));
import { debugUnreached } from "./scripts/postprocess.js";
const g2 = debugUnreached(comp); let r2; do { r2 = g2.next(); } while (!r2.done);
console.log("unreached:", JSON.stringify(r2.value.slice(0, 8)));
