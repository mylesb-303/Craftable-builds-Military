import { computeSnap } from "./scripts/main.js";
import { STRUCTURES } from "./scripts/registry.js";
import { toWorldLocation } from "./scripts/placement.js";
const S = Object.fromEntries(STRUCTURES.airfield.map(s => [s.id, s]));
let bad = 0;
const check = (label, cond) => { console.log((cond ? "PASS " : "FAIL ") + label); if (!cond) bad++; };
for (const rot of ["south", "west", "north", "east"]) {
  const o = { x: 100, y: 61, z: 200 };
  const prev = { structure: S.runway_straight, origin: o, rotation: rot };
  // straight -> straight: centrelines meet edge to edge, same heading
  const a = computeSnap(prev, S.runway_straight, "out");
  const pOut = toWorldLocation(o, { x: 27, y: 0, z: 0 }, S.runway_straight.size, rot);
  const nIn = toWorldLocation(a.origin, { x: 27, y: 0, z: 63 }, S.runway_straight.size, a.rotation);
  check(`${rot}: straight->straight adjacent (${Math.abs(pOut.x - nIn.x) + Math.abs(pOut.z - nIn.z)} apart) same heading`, Math.abs(pOut.x - nIn.x) + Math.abs(pOut.z - nIn.z) === 1 && a.rotation === rot && a.origin.y === o.y);
  // straight -> threshold: threshold turned round so its approach end points away
  const t = computeSnap(prev, S.runway_threshold, "out");
  const tIn = toWorldLocation(t.origin, { x: 27, y: 0, z: 0 }, S.runway_threshold.size, t.rotation);
  check(`${rot}: far-end threshold faces away (rot ${t.rotation})`, Math.abs(pOut.x - tIn.x) + Math.abs(pOut.z - tIn.z) === 1 && t.rotation !== rot);
  // taxiway corner -> straight continues along the exit direction
  const cPrev = { structure: S.taxiway_corner, origin: o, rotation: rot };
  const ts = computeSnap(cPrev, S.taxiway_straight, "out");
  const cOut = toWorldLocation(o, { x: 44, y: 0, z: 12 }, S.taxiway_corner.size, rot);
  const tsIn = toWorldLocation(ts.origin, { x: 12, y: 0, z: 31 }, S.taxiway_straight.size, ts.rotation);
  check(`${rot}: corner->taxiway turns 90° (rot ${ts.rotation})`, Math.abs(cOut.x - tsIn.x) + Math.abs(cOut.z - tsIn.z) === 1 && ts.rotation !== rot);
  // junction branch -> taxiway straight
  const jPrev = { structure: S.runway_taxiway_junction, origin: o, rotation: rot };
  const br = computeSnap(jPrev, S.taxiway_straight, "branch");
  const jOut = toWorldLocation(o, { x: 86, y: 0, z: 32 }, S.runway_taxiway_junction.size, rot);
  const brIn = toWorldLocation(br.origin, { x: 12, y: 0, z: 31 }, S.taxiway_straight.size, br.rotation);
  check(`${rot}: junction branch->taxiway adjacent`, Math.abs(jOut.x - brIn.x) + Math.abs(jOut.z - brIn.z) === 1);
}
console.log(bad ? `SNAP FAIL ${bad}` : "SNAP PASS (16/16)");
