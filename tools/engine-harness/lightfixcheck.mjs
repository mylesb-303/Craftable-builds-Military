// v1.8: lights must be built into the structure. Flags light blocks that stick out
// (4+ open faces = mounted on a surface or floating), excluding real fixtures (lanterns, torches, end rods).
import { MockDimension } from "@minecraft/server";
import { compileBuild, worldBounds } from "./scripts/construction_engine.js";
import { runBuilder, postPassesFor } from "./scripts/main.js";
import { STRUCTURES } from "./scripts/registry.js";
import { clearVolume, clearStartY } from "./scripts/placement.js";
import { sectionPlan, sectionBounds } from "./scripts/sections.js";
const LIGHT = /sea_lantern|froglight|shroomlight|glowstone|redstone_lamp/;
const OPEN = /:air$|light_block|fence|bars|pane|rail|torch|:lantern$|soul_lantern|carpet|pressure_plate|button|sign|banner|flower|ladder|scaffolding|chain/;
const sid = (s) => s.id;
let total = 0; const rows = [];
const only = process.argv[2];
for (const s of Object.values(STRUCTURES).flat()) {
  if (only && !s.id.startsWith(only)) continue;
  const o = { x: 0, y: 61, z: 0 }; const plan = sectionPlan(s); const [z1, z2] = plan ? plan[0] : [0, s.size.z - 1];
  const b = plan ? sectionBounds(o, s.size, "south", z1, z2) : worldBounds(o, s.size, "south");
  const comp = compileBuild(new MockDimension(), (r) => { clearVolume(r, o, s.size, "south", clearStartY(s)); runBuilder(s.id, r, o, "south", "standard", { zRange: plan ? [z1, z2] : undefined }); }, b, Boolean(plan));
  for (const [, pass] of postPassesFor(s)) { const g = pass(comp, {}); while (!g.next().done); }
  const { W, H, D, grid, palette } = comp;
  const id = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) ? "minecraft:air" : (grid[(y * D + z) * W + x] ? palette.list[grid[(y * D + z) * W + x]].type.id : "terrain");
  let n = 0, ex = "";
  for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (!LIGHT.test(id(x, y, z))) continue;
    // stuck-on = hangs off a wall/ceiling or floats: open below and on at least 3 sides
    // (a light set into a wall, ceiling or floor has solid neighbours around it; a lamp head on a post has a solid block below)
    let sideOpen = 0;
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) if (OPEN.test(id(x+dx,y,z+dz))) sideOpen++;
    // a light in a 1-thick wall line (e.g. a door lintel) has solid/lit blocks on both ends of one axis
    const inLine = (a, b) => !OPEN.test(id(x + a, y, z + b)) && !OPEN.test(id(x - a, y, z - b));
    if (OPEN.test(id(x, y - 1, z)) && sideOpen >= 3 && !inLine(1, 0) && !inLine(0, 1)) { n++; if (!ex) ex = `${x},${y},${z}`; if (process.env.WHY) console.log(sid(s), id(x,y,z).slice(10), x,y,z, "below:", id(x,y-1,z).slice(10), "above:", id(x,y+1,z).slice(10), "sides:", [[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>id(x+a,y,z+b).slice(10)).join("/")); }
  }
  total += n; rows.push([n, s.id, ex]);
}
rows.sort((a, b) => b[0] - a[0]);
for (const [n, sid, ex] of rows) if (n) console.log(`${String(n).padStart(4)} stuck-on lights  ${sid}  (e.g. ${ex})`);
console.log(total ? `LIGHTFIX FAIL (${total} lights stick out)` : "LIGHTFIX PASS");
