// v1.7.2: sectioned construction of the full runways == one-shot build; undo exact; each section <= 64 chunks
import { MockDimension } from "@minecraft/server";
import { constructStaged, restoreStaged, worldBounds } from "./scripts/construction_engine.js";
import { runBuilder, constructSections, postPassesFor } from "./scripts/main.js";
import { STRUCTURES } from "./scripts/registry.js";
import { clearVolume, clearStartY } from "./scripts/placement.js";
import { sectionPlan, sectionBounds } from "./scripts/sections.js";
const all = Object.values(STRUCTURES).flat();
const key = (p) => p ? p.type.id + JSON.stringify(p.getAllStates?.() ?? {}) : "air";
let bad = 0;
const sectioned = all.filter(s => sectionPlan(s));
console.log("sectioned builds:", sectioned.map(s => `${s.id}(${sectionPlan(s).length})`).join(" "));
for (const s of sectioned) for (const rot of ["south", "east"]) {
  const o = { x: 5, y: 61, z: 9 };
  const fn = (zRange) => (r) => { clearVolume(r, o, s.size, rot, clearStartY(s)); runBuilder(s.id, r, o, rot, "standard", { designator: "27L", zRange }); };
  const A = new MockDimension(), B = new MockDimension();
  for (const d of [A, B]) for (const [k, v] of [[1, "minecraft:stone"]]) {} // flat world from mock defaults
  const a = await constructStaged(A, fn(undefined), null, worldBounds(o, s.size, rot), postPassesFor(s));
  const player = { id: "t", sendMessage() {}, onScreenDisplay: { setActionBar() {} } };
  const b = await constructSections(player, B, s, o, rot, sectionPlan(s), fn, () => {});
  // compare all positions written in either world
  const keys = new Set([...A.blocks.keys(), ...B.blocks.keys()]);
  let diff = 0, lightDiff = 0;
  for (const k of keys) {
    const ka = key(A.blocks.get(k)), kb = key(B.blocks.get(k));
    if (ka === kb) continue;
    if (/light_block|sea_lantern/.test(ka + kb)) lightDiff++; else { diff++; if (diff<4) console.log('  diff', k, ka, '|', kb); }
  }
  let maxChunks = 0;
  for (const [z1, z2] of sectionPlan(s)) { const bb = sectionBounds(o, s.size, rot, z1, z2); maxChunks = Math.max(maxChunks, (Math.floor(bb.max.x/16)-Math.floor(bb.min.x/16)+1)*(Math.floor(bb.max.z/16)-Math.floor(bb.min.z/16)+1)); }
  const before = new MockDimension();
  for (let i = b.snapshots.length - 1; i >= 0; i--) await restoreStaged(b.snapshots[i]);
  let undoDiff = 0;
  for (const k of B.blocks.keys()) { const [x,y,z]=k.split(',').map(Number); if (key(B.blocks.get(k)) !== key(before.getBlock({x,y,z}).permutation)) undoDiff++; }
  const ok = b.ok && diff === 0 && undoDiff === 0 && maxChunks <= 64;
  if (!ok) bad++;
  console.log(`${ok ? "PASS" : "FAIL"} ${s.id} ${rot}: sections=${b.snapshots.length} blockDiff=${diff} lightOnlyDiff=${lightDiff} maxChunks/section=${maxChunks} undoDiff=${undoDiff} placed=${b.changed}`);
}
console.log(bad ? `SECTIONS FAIL (${bad})` : "SECTIONS PASS");
