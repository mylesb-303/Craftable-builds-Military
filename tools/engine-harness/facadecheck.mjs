// Counts screen/light cells set into outside faces: sea lantern / cyan glass / black concrete
// cells with an open-sky air neighbour horizontally, inside a wall line (solid above & below).
import { MockDimension } from "@minecraft/server";
const dir = process.argv[2] ?? "./scripts"; // pass a second scripts folder to compare versions
const { compileBuild, worldBounds } = await import(`${dir}/construction_engine.js`);
const { runBuilder } = await import(`${dir}/main.js`);
const { STRUCTURES } = await import(`${dir}/registry.js`);
const { clearVolume, clearStartY } = await import(`${dir}/placement.js`);
const { sectionPlan, sectionBounds } = await import(`${dir}/sections.js`);
let total = 0; const per = [];
for (const s of Object.values(STRUCTURES).flat()) {
  if (process.argv[3] && !s.id.startsWith(process.argv[3])) continue;
  const o = { x: 0, y: 61, z: 0 }, rot = "south";
  const plan = sectionPlan(s); if (plan) continue;
  const comp = compileBuild(new MockDimension(), (r) => { clearVolume(r, o, s.size, rot, clearStartY(s)); runBuilder(s.id, r, o, rot, "standard", {}); }, worldBounds(o, s.size, rot), false);
  const { W, H, D, grid, palette } = comp;
  const id = (x, y, z) => (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) ? "out" : (grid[(y * D + z) * W + x] ? palette.list[grid[(y * D + z) * W + x]].type.id : "terrain");
  const sky = (x, y, z) => { const t = id(x, y, z); if (t === "out") return true; if (t !== "minecraft:air") return false; for (let yy = y + 1; yy < H; yy++) { const u = id(x, yy, z); if (u !== "minecraft:air" && !u.includes("light_block")) return false; } return true; };
  let n = 0;
  for (let y = 1; y < H - 1; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const t = id(x, y, z);
    if (!/sea_lantern|cyan_stained_glass/.test(t)) continue;
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) if (sky(x + dx, y, z + dz) && id(x - dx, y, z - dz) === "minecraft:air" && !sky(x - dx, y, z - dz)) { n++; if (process.env.V) console.log(s.id, t.slice(10), x, y, z, "out", dx, dz); break; }
  }
  total += n; if (n) per.push([s.id, n]);
}
per.sort((a, b) => b[1] - a[1]); console.log(per.slice(0, 25).map((r) => r.join(":")).join("  ")); console.log("FACADE fittings:", total);
