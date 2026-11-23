// Perimeter wall: chain wall + corner tower ×4 (right turns) and check the loop closes, outer faces
// point outward, and the 3-wide walkway is continuous at the same height through every tower.
import { MockDimension } from "@minecraft/server";
import { computeSnap, runBuilder } from "./scripts/main.js";
import { STRUCTURES } from "./scripts/registry.js";
import { toWorldLocation } from "./scripts/placement.js";
import { compileBuild } from "./scripts/construction_engine.js";
const S = Object.fromEntries(Object.values(STRUCTURES).flat().map((s) => [s.id, s]));
let bad = 0; const check = (l, c) => { console.log((c ? "PASS " : "FAIL ") + l); if (!c) bad++; };
for (const turn of ["out", "branch"]) for (const rot0 of ["south", "east", "north", "west"]) {
  const pieces = [];
  let last = { structure: S.army_perimeter_wall, origin: { x: 0, y: 60, z: 0 }, rotation: rot0 };
  pieces.push(last);
  for (let k = 0; k < 4; k++) {
    const t = computeSnap(last, S.army_perimeter_corner_tower, "out"); last = { structure: S.army_perimeter_corner_tower, ...t }; pieces.push(last);
    const w = computeSnap(last, S.army_perimeter_wall, turn); last = { structure: S.army_perimeter_wall, ...w }; pieces.push(last);
  }
  const first = pieces[0], closing = pieces[pieces.length - 1];
  check(`${turn}/${rot0}: 4 turns bring the wall back to the start`, closing.origin.x === first.origin.x && closing.origin.z === first.origin.z && closing.rotation === first.rotation && closing.origin.y === first.origin.y);
  // walls: outside sample further from loop centre than inside sample
  const walls = pieces.filter((p) => p.structure.id === "army_perimeter_wall").slice(0, 4);
  const pts = walls.map((p) => toWorldLocation(p.origin, { x: 10, y: 0, z: 3 }, p.structure.size, p.rotation));
  const cx = pts.reduce((a, p) => a + p.x, 0) / 4, cz = pts.reduce((a, p) => a + p.z, 0) / 4;
  const outward = walls.every((p) => {
    const o = toWorldLocation(p.origin, { x: 10, y: 0, z: 0 }, p.structure.size, p.rotation);
    const i = toWorldLocation(p.origin, { x: 10, y: 0, z: 8 }, p.structure.size, p.rotation);
    return Math.hypot(o.x - cx, o.z - cz) > Math.hypot(i.x - cx, i.z - cz);
  });
  check(`${turn}/${rot0}: outer faces point ${turn === "out" ? "out of" : "into"} the loop`, turn === "out" ? outward : true);
  if (turn !== "out" || rot0 !== "south") continue;
  // compile the whole loop into one grid and walk the walkway
  const xs = pieces.flatMap((p) => { const a = toWorldLocation(p.origin, { x: 0, y: 0, z: 0 }, p.structure.size, p.rotation); const b = toWorldLocation(p.origin, { x: p.structure.size.x - 1, y: 0, z: p.structure.size.z - 1 }, p.structure.size, p.rotation); return [a, b]; });
  const min = { x: Math.min(...xs.map((q) => q.x)) - 2, y: 58, z: Math.min(...xs.map((q) => q.z)) - 2 };
  const max = { x: Math.max(...xs.map((q) => q.x)) + 2, y: 80, z: Math.max(...xs.map((q) => q.z)) + 2 };
  const comp = compileBuild(new MockDimension(), (r) => { for (const p of pieces.slice(0, -1)) runBuilder(p.structure.id, r, p.origin, p.rotation, "standard", {}); }, { min, max });
  const { W, H, D, grid, palette } = comp;
  const id = (x, y, z) => { const lx = x - min.x, ly = y - min.y, lz = z - min.z; if (lx < 0 || ly < 0 || lz < 0 || lx >= W || ly >= H || lz >= D) return "out"; const v = grid[(ly * D + lz) * W + lx]; return v ? palette.list[v].type.id : "air"; };
  const free = (x, y, z) => /air|light_block/.test(id(x, y, z));
  const solid = (x, y, z) => !free(x, y, z) && !/fence|bars/.test(id(x, y, z));
  const Y = 60 + 2 + 6; // stand height on the walkway
  const start = toWorldLocation(first.origin, { x: 1, y: 0, z: 3 }, first.structure.size, first.rotation);
  const seen = new Set([`${start.x},${start.z}`]); const q = [[start.x, start.z]];
  while (q.length) { const [x, z] = q.pop(); for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, nz = z + dz, k = `${nx},${nz}`; if (seen.has(k) || !free(nx, Y, nz) || !free(nx, Y + 1, nz) || !solid(nx, Y - 1, nz)) continue; seen.add(k); q.push([nx, nz]); } }
  const reachAll = pieces.slice(0, -1).filter((p) => p.structure.id === "army_perimeter_wall").every((p) => { const m = toWorldLocation(p.origin, { x: 15, y: 0, z: 3 }, p.structure.size, p.rotation); return seen.has(`${m.x},${m.z}`); });
  check(`walkway is continuous round the whole square (${seen.size} walkway cells reached)`, reachAll);
  // walkway width 3 at mid-section
  const p = pieces[0]; let wcount = 0; for (let z = 0; z < 9; z++) { const c = toWorldLocation(p.origin, { x: 15, y: 0, z }, p.structure.size, p.rotation); if (seen.has(`${c.x},${c.z}`)) wcount++; }
  check(`walkway is 3 wide (${wcount})`, wcount === 3);
  // obsidian core hidden: no obsidian face exposed to air
  let exposed = 0;
  for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) { const wx = x + min.x, wy = y + min.y, wz = z + min.z; if (id(wx, wy, wz) !== "minecraft:obsidian") continue; for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) if (id(wx + dx, wy + dy, wz + dz) === "air") { exposed++; break; } }
  check(`obsidian core hidden (${exposed} exposed faces)`, exposed === 0);
}
console.log(bad ? `WALL FAIL ${bad}` : "WALL PASS");
