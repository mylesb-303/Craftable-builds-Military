import { worldDir } from "./scripts/kit.js";
import { toWorldLocation } from "./scripts/placement.js";
const size={x:7,y:3,z:5}, o={x:0,y:0,z:0}; let bad=0;
const L={north:[0,-1],south:[0,1],east:[1,0],west:[-1,0]};
for (const r of ["north","east","south","west"]) for (const [d,[dx,dz]] of Object.entries(L)) {
  const a=toWorldLocation(o,{x:3,y:0,z:2},size,r), b=toWorldLocation(o,{x:3+dx,y:0,z:2+dz},size,r);
  const v=[b.x-a.x,b.z-a.z]; const exp=Object.entries(L).find(([,w])=>w[0]===v[0]&&w[1]===v[1])[0];
  if (worldDir(d,r)!==exp){bad++;console.log(r,d,worldDir(d,r),exp);} }
console.log(bad?`FAIL ${bad}`:"direction mapping PASS (16/16)");
