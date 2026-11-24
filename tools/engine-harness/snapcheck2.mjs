// v1.12: new airfield pieces — every connector lands adjacent, on the same level, facing the right way.
import { computeSnap } from "./scripts/main.js";
import { STRUCTURES } from "./scripts/registry.js";
import { toWorldLocation } from "./scripts/placement.js";
const S = Object.fromEntries(Object.values(STRUCTURES).flat().map(s => [s.id, s]));
let bad = 0, n = 0;
const W = (piece) => (c) => toWorldLocation(piece.origin, { x: c.x, y: 0, z: c.z }, piece.structure.size, piece.rotation);
const dirVec = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
function link(prev, nextId, conn, label) {
  n++;
  const next = S[nextId];
  const r = computeSnap(prev, next, conn);
  if (!r) { bad++; console.log(`FAIL ${label}: no snap`); return undefined; }
  const piece = { structure: next, origin: r.origin, rotation: r.rotation };
  const a = W(prev)(prev.structure.snap[conn]), b = W(piece)(next.snap.in);
  const d = Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
  const ok = d === 1 && r.origin.y === prev.origin.y;
  if (!ok) bad++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label} (gap ${d}, rot ${r.rotation})`);
  return piece;
}
const heading = (piece, conn) => {
  const rotIdx = ["south", "west", "north", "east"].indexOf(piece.rotation);
  const order = ["south", "west", "north", "east"];
  return order[(order.indexOf(piece.structure.snap[conn].dir) + rotIdx) % 4];
};
for (const rot of ["south", "west", "north", "east"]) {
  const o = { x: 300, y: 64, z: -200 };
  const t0 = { structure: S.taxiway_straight, origin: o, rotation: rot };
  const L = link(t0, "taxiway_corner_left", "out", `${rot}: straight -> left corner`);
  const R = link(t0, "taxiway_corner", "out", `${rot}: straight -> right corner`);
  if (L && R) {
    const hl = heading(L, "out"), hr = heading(R, "out");
    const ok = hl !== hr && hl !== heading(t0, "out") && hr !== heading(t0, "out") && dirVec[hl][0] === -dirVec[hr][0] && dirVec[hl][1] === -dirVec[hr][1];
    n++; if (!ok) bad++; console.log(`${ok ? "PASS" : "FAIL"} ${rot}: left and right corners turn opposite ways (${hl} / ${hr})`);
    link(L, "taxiway_straight_long", "out", `${rot}: left corner -> long straight`);
  }
  const long1 = link(t0, "taxiway_straight_long", "out", `${rot}: straight -> long straight`);
  const long2 = long1 && link(long1, "taxiway_straight_long", "out", `${rot}: long -> long`);
  const T = long2 && link(long2, "taxiway_t_junction", "out", `${rot}: long -> T-junction`);
  if (T) {
    const e1 = link(T, "taxiway_straight", "out", `${rot}: T right exit -> straight`);
    const e2 = link(T, "taxiway_straight", "branch", `${rot}: T left exit -> straight`);
    if (e1 && e2) { const ok = heading(e1, "out") !== heading(e2, "out"); n++; if (!ok) bad++; console.log(`${ok ? "PASS" : "FAIL"} ${rot}: T exits lead opposite ways`); }
  }
  const r0 = { structure: S.runway_straight, origin: o, rotation: rot };
  const ag = link(r0, "runway_arresting_gear", "out", `${rot}: runway -> arresting gear`);
  const r1 = ag && link(ag, "runway_straight", "out", `${rot}: arresting gear -> runway`);
  r1 && link(r1, "runway_overrun", "out", `${rot}: runway -> overrun`);
  n++; const none = computeSnap({ structure: S.runway_overrun, origin: o, rotation: rot }, S.runway_straight, "out") === undefined;
  if (!none) bad++; console.log(`${none ? "PASS" : "FAIL"} ${rot}: overrun ends the runway (no out)`);
}
console.log(bad ? `SNAP2 FAIL ${bad}/${n}` : `SNAP2 PASS (${n})`);
