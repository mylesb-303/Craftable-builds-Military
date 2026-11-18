// Simulates Bedrock ticking areas: unloaded chunks read as missing, add of a just-removed name throws.
import { MockDimension } from "@minecraft/server";
import { constructSections, runBuilder } from "./scripts/main.js";
import { STRUCTURES } from "./scripts/registry.js";
import { clearVolume, clearStartY } from "./scripts/placement.js";
import { sectionPlan } from "./scripts/sections.js";
const s = Object.values(STRUCTURES).flat().find(x => x.id === "runway_full_long");
const d = new MockDimension();
const areas = new Map(); const justRemoved = new Set();
const near = { min: { x: -64, z: -64 }, max: { x: 64, z: 64 } }; // player's own loaded area
const inBox = (b, x, z) => x >= b.min.x && x <= b.max.x && z >= b.min.z && z <= b.max.z;
const base = d.getBlock.bind(d);
d.getBlock = (l) => {
  const x = Math.floor(l.x), z = Math.floor(l.z);
  const ok = inBox(near, x, z) || [...areas.values()].some(b => inBox(b, x, z));
  if (!ok) throw new Error("LocationInUnloadedChunkError");
  return base(l);
};
let maxAreas = 0;
d.runCommand = (cmd) => {
  const p = cmd.split(" ");
  if (p[1] === "add") {
    const name = p[8];
    if (areas.has(name) || justRemoved.has(name)) throw new Error(`A ticking area named ${name} already exists`);
    justRemoved.clear();
    const [x1, , z1, x2, , z2] = p.slice(2, 8).map(Number);
    areas.set(name, { min: { x: Math.floor(x1 / 16) * 16, z: Math.floor(z1 / 16) * 16 }, max: { x: Math.floor(x2 / 16) * 16 + 15, z: Math.floor(z2 / 16) * 16 + 15 } });
    maxAreas = Math.max(maxAreas, areas.size);
  } else if (p[1] === "remove") { areas.delete(p[2]); justRemoved.add(p[2]); }
  return { successCount: 1 };
};
const o = { x: -80, y: 61, z: -600 }; // runway runs north, away from the player
const rot = "south";
const fn = (zRange) => (r) => { clearVolume(r, o, s.size, rot, clearStartY(s)); runBuilder(s.id, r, o, rot, "standard", { designator: "09", zRange }); };
const msgs = [];
const player = { id: "p", sendMessage: (m) => msgs.push(m), onScreenDisplay: { setActionBar() {} } };
const r = await constructSections(player, d, s, o, rot, sectionPlan(s), fn, () => {});
console.log(`sections built ${r.snapshots.length}/${sectionPlan(s).length}, ok=${r.ok}, reason=${r.reason ?? "-"}, max simultaneous areas=${maxAreas}, left over=${areas.size}`);
console.log(r.ok && r.snapshots.length === sectionPlan(s).length && areas.size === 0 && maxAreas === 1 ? "LOADSIM PASS" : "LOADSIM FAIL");
// resume: fail section 6 once (simulated load timeout), then resume from there
{
  const d2 = d; let failOnce = true; const realRun = d2.runCommand;
  d2.runCommand = (cmd) => { if (failOnce && cmd.includes(" add ") && d2._adds === 5) { failOnce = false; throw new Error("simulated failure"); } if (cmd.includes(" add ")) d2._adds = (d2._adds ?? 0) + 1; return realRun(cmd); };
  // make the add fail on all 3 retries of section 6
  let left = 3; d2.runCommand = ((inner) => (cmd) => { if (cmd.includes(" add ") && (d2._adds ?? 0) === 5 && left > 0) { left--; throw new Error("simulated failure"); } return inner(cmd); })(realRun);
  d2._adds = 0; const realInner = d2.runCommand;
  d2.runCommand = (cmd) => { const out = realInner(cmd); if (cmd.includes(" add ")) d2._adds++; return out; };
  const plan = sectionPlan(s);
  const o2 = { x: -80, y: 61, z: -1300 };
  const fn2 = (zRange) => (r) => { clearVolume(r, o2, s.size, rot, clearStartY(s)); runBuilder(s.id, r, o2, rot, "standard", { zRange }); };
  const a = await constructSections(player, d2, s, o2, rot, plan, fn2, () => {});
  const b = await constructSections(player, d2, s, o2, rot, plan, fn2, () => {}, a.snapshots.length, a.snapshots);
  console.log(`first run ${a.snapshots.length}/${plan.length} (${a.reason}); after resume ${b.snapshots.length}/${plan.length} ok=${b.ok}`);
  console.log(!a.ok && b.ok && b.snapshots.length === plan.length ? "RESUME PASS" : "RESUME FAIL");
}
