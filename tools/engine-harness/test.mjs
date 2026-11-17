import { MockDimension, world, system } from "@minecraft/server";
import { STRUCTURES } from "./scripts/registry.js";
import { runBuilder } from "./scripts/main.js";
import { clearVolume, showFootprintPreview, validatePlacement, restorePreview } from "./scripts/placement.js";
import { constructStaged, restoreStaged, worldBounds } from "./scripts/construction_engine.js";
import { registerPreview, unregisterPreview } from "./scripts/preview_guard.js";

const eq = (a,b) => { if (a.size!==b.size) return false; for (const [k,v] of a) if (b.get(k)!==v) return false; return true; };
const everything = Object.values(STRUCTURES).flat();
const all = everything.filter(s => !process.env.ONLY || s.id.startsWith(process.env.ONLY));
let fail = 0, maxWrites = 0, maxTicks = 0, maxName="";
const origin = { x: 100, y: 61, z: -40 };
for (const s of all) {
  for (const rot of ["north","east","south","west"]) {
    const build = (d) => { if (s.placementMode!=="overlay" && s.placementMode!=="excavation") clearVolume(d, origin, s.size, rot); runBuilder(s.id, d, origin, rot, "woodland"); };
    // legacy single-tick reference
    const legacy = new MockDimension(); let legacyErr;
    try { build(legacy); } catch(e){ legacyErr=e; }
    if (legacyErr) { console.log(`FAIL legacy ${s.id} ${rot}: ${legacyErr}`); fail++; continue; }
    const dim = new MockDimension(); globalThis.__dim = dim;
    if (!validatePlacement(dim, origin, s.size, rot).ok) { console.log(`FAIL validate ${s.id}`); fail++; }
    const t0 = system.ticks;
    const res = await constructStaged(dim, build, undefined, worldBounds(origin, s.size, rot));
    const ticks = system.ticks - t0;
    if (!res.ok) { console.log(`FAIL staged ${s.id} ${rot}: ${res.reason}`); fail++; continue; }
    // compare final world state (ignoring blocks unchanged vs base terrain)
    const norm = (d) => { const m=new Map(); for (const [k,p] of d.blocks){ const [x,y,z]=k.split(',').map(Number); const b=d.base(x,y,z); if (p!==b) m.set(k,p.type.id+JSON.stringify(p.getAllStates())); } return m; };
    if (!eq(norm(legacy), norm(dim))) { console.log(`FAIL mismatch ${s.id} ${rot}`); fail++; }
    if (dim.writes > maxWrites) { maxWrites = dim.writes; maxName = s.id; maxTicks = ticks; }
    // undo
    await restoreStaged(res.snapshot);
    if (norm(dim).size !== 0) { console.log(`FAIL undo ${s.id} ${rot}: ${norm(dim).size} blocks differ`); fail++; }
  }
}
console.log(`structures=${all.length} rotations=4 failures=${fail}`);
console.log(`largest job: ${maxName} ${maxWrites} writes (incl. undo) over ${maxTicks} mock ticks`);

// unloaded-chunk abort: nothing must change
{ const s = everything.find(x=>x.id==="watch_tower"); const dim=new MockDimension(); dim.unloadedX = origin.x+5; globalThis.__dim=dim;
  const r = await constructStaged(dim, d=>{clearVolume(d,origin,s.size,"south"); runBuilder(s.id,d,origin,"south","woodland");}, undefined, worldBounds(origin,s.size,"south"));
  console.log(`unloaded abort: ok=${r.ok} writes=${dim.writes} -> ${!r.ok && dim.writes===0 ? "PASS":"FAIL"}`); }

// height-range validation
{ const dim=new MockDimension(); console.log(`height check: ${!validatePlacement(dim,{x:0,y:300,z:0},{x:23,y:64,z:23},"south").ok?"PASS":"FAIL"}`); }

// preview persistence + recovery from a "previous session"
{ const s = all.reduce((a,b)=> a.size.x*a.size.z > b.size.x*b.size.z ? a : b);
  const dim=new MockDimension(); globalThis.__dim=dim;
  const changed = showFootprintPreview(dim, origin, s.size, "east", s.foundationDepth??1, s.previewFloorY);
  registerPreview("p1", dim, changed);
  const keys = world.getDynamicPropertyIds(); const maxLen=Math.max(...keys.map(k=>String(world.getDynamicProperty(k)).length));
  console.log(`preview ${s.id}: ${changed.length} markers, ${keys.length} props, max prop len ${maxLen}`);
  // simulate crash: rename keys to an older session id
  for (const k of keys) { const v=world.getDynamicProperty(k); world.setDynamicProperty(k,undefined); world.setDynamicProperty(k.replace(/preview:[^:]+:/,"preview:oldsession:"),v); }
  globalThis.__worldLoad();
  const left = [...dim.blocks].filter(([k,p])=>{const [x,y,z]=k.split(',').map(Number); return p!==dim.base(x,y,z);}).length;
  console.log(`recovery: ${left} blocks still differ, props left ${world.getDynamicPropertyIds().length} -> ${left===0 && world.getDynamicPropertyIds().length===0?"PASS":"FAIL"}`);
  // live-session preview must NOT be touched by recovery
  const ch2 = showFootprintPreview(dim, origin, s.size, "east", s.foundationDepth??1, s.previewFloorY); registerPreview("p2", dim, ch2);
  globalThis.__worldLoad(); const live = [...dim.blocks].filter(([k,p])=>{const [x,y,z]=k.split(',').map(Number); return p!==dim.base(x,y,z);}).length;
  console.log(`live preview untouched by recovery: ${live>0?"PASS":"FAIL"}`);
  unregisterPreview("p2", dim, ch2); restorePreview(dim, ch2);
  console.log(`unregister clears props: ${world.getDynamicPropertyIds().length===0?"PASS":"FAIL"}`); }
