import { MockDimension } from "@minecraft/server";
import { STRUCTURES } from "./scripts/registry.js";
import { runBuilder } from "./scripts/main.js";
import { clearVolume, clearStartY } from "./scripts/placement.js";
import { compileBuild, worldBounds } from "./scripts/construction_engine.js";
const [id, x1, x2, z1, z2, y1, y2] = [process.argv[2], ...process.argv.slice(3).map(Number)];
const s = Object.values(STRUCTURES).flat().find(x => x.id === id); const o = { x: 0, y: 0, z: 0 };
const c = compileBuild(new MockDimension(), d => { clearVolume(d, o, s.size, "south", clearStartY(s)); runBuilder(s.id, d, o, "south", "standard", {}); }, worldBounds(o, s.size, "south"));
const ch = (v) => { if (!v) return "?"; const t = c.palette.list[v].type.id.replace("minecraft:", ""); const st = c.palette.list[v].getAllStates();
  if (t === "air") return "."; if (t.includes("stairs")) return "^v><"[["north","south","east","west"].indexOf(["east","west","south","north"][st.weirdo_direction])] ?? "s"; if (t.includes("ladder")) return "H"; if (t.includes("fence")||t.includes("bars")) return "#"; return t[0].toUpperCase(); };
for (let y = y2; y >= y1; y--) { let line = `y${y}`.padEnd(5); for (let z = z1; z <= z2; z++) { for (let x = x1; x <= x2; x++) line += ch(c.grid[(y * c.D + z) * c.W + x]); line += " "; } console.log(line); }
import { debugReach } from "./scripts/postprocess.js";
const g = debugReach(c); let r; do { r = g.next(); } while (!r.done); const seen = r.value;
console.log("reach (R = reachable standable):");
for (let y = y2; y >= y1; y--) { let line = `y${y}`.padEnd(5); for (let z = z1; z <= z2; z++) { for (let x = x1; x <= x2; x++) line += seen[(y * c.D + z) * c.W + x] ? "R" : "-"; line += " "; } console.log(line); }
