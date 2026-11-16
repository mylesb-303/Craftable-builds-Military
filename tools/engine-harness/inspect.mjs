// usage: node inspect.mjs <structureId> [rotation]
import { MockDimension } from "@minecraft/server";
import { STRUCTURES } from "./scripts/registry.js";
import { runBuilder } from "./scripts/main.js";
import { clearVolume } from "./scripts/placement.js";
import { constructStaged, worldBounds } from "./scripts/construction_engine.js";
import { writeFileSync } from "fs";
const id = process.argv[2], rot = process.argv[3] ?? "south";
const s = Object.values(STRUCTURES).flat().find(x => x.id === id);
const G = 62; const origin = { x: 0, y: G - ((s.previewFloorY ?? Math.max(0,(s.foundationDepth??1)-1))), z: 0 };
const dim = new MockDimension(); dim.base = (x,y,z) => (y < G ? (y < G-3 ? "minecraft:stone" : "minecraft:dirt") : y === G ? "minecraft:grass_block" : "minecraft:air");
const { BlockPermutation } = await import("@minecraft/server");
const baseFn = dim.base; dim.base = (x,y,z)=>BlockPermutation.resolve(baseFn(x,y,z));
const res = await constructStaged(dim, d => { if (s.placementMode!=="overlay" && s.placementMode!=="excavation") clearVolume(d, origin, s.size, rot); runBuilder(s.id, d, origin, rot, "standard"); }, undefined, worldBounds(origin, s.size, rot, 2));
if (!res.ok) { console.log("BUILD FAILED", res.reason); process.exit(1); }
const b = worldBounds(origin, s.size, rot, 2);
const W=b.max.x-b.min.x+1,H=b.max.y-b.min.y+1,D=b.max.z-b.min.z+1;
const pal=[], pidx=new Map(); const cells=new Uint16Array(W*H*D);
const get=(x,y,z)=>dim.getBlock({x,y,z}).permutation.type.id;
for(let y=0;y<H;y++)for(let z=0;z<D;z++)for(let x=0;x<W;x++){const t=get(b.min.x+x,b.min.y+y,b.min.z+z);let i=pidx.get(t);if(i===undefined){i=pal.length;pal.push(t);pidx.set(t,i);}cells[(y*D+z)*W+x]=i;}
writeFileSync(`/tmp/${id}.json`, JSON.stringify({W,H,D,minY:b.min.y,ground:G,pal,cells:Array.from(cells)}));
// ---- walkability BFS ----
const PASS = /air|ladder|scaffolding|carpet|pressure_plate|lantern|azalea|torch|door|rail|button|lever|sign|banner|short_grass/;
const CLIMB = /ladder|scaffolding/;
const at=(x,y,z)=>{ if(x<0||y<0||z<0||x>=W||y>=H||z>=D) return "minecraft:air"; return pal[cells[(y*D+z)*W+x]]; };
const free=(x,y,z)=>PASS.test(at(x,y,z));
const solid=(x,y,z)=>!free(x,y,z) || CLIMB.test(at(x,y,z));
const standable=(x,y,z)=>free(x,y,z)&&free(x,y+1,z)&&(solid(x,y-1,z)||CLIMB.test(at(x,y,z)));
// start: outside the structure at ground level in front (south-ish edge) — find any standable surface cell on the bounding edge
const gy=G-b.min.y+1; let start=null;
for(let x=0;x<W&&!start;x++) for(const z of [D-1,0]) if(standable(x,gy,z)) {start=[x,gy,z];break;}
const seen=new Uint8Array(W*H*D); const q=[start]; seen[(start[1]*D+start[2])*W+start[0]]=1;
const push=(x,y,z)=>{ if(x<0||y<1||z<0||x>=W||y>=H-1||z>=D) return; const k=(y*D+z)*W+x; if(seen[k]||!standable(x,y,z)) return; seen[k]=1; q.push([x,y,z]); };
while(q.length){ const [x,y,z]=q.pop();
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ push(x+dx,y,z+dz); if(free(x,y+2,z)) push(x+dx,y+1,z+dz); for(let dd=1;dd<=3;dd++){ if(!free(x+dx,y-dd+1,z+dz)) break; push(x+dx,y-dd,z+dz);} }
  if(CLIMB.test(at(x,y,z))||CLIMB.test(at(x,y-1,z))){ push(x,y+1,z); push(x,y-1,z); }
}
// report: fraction of interior "room floor" air cells reachable — count standable cells by y level and reached
const levels={}; for(let y=1;y<H-1;y++)for(let z=0;z<D;z++)for(let x=0;x<W;x++){ if(y>=gy) continue; if(!standable(x,y,z)) continue; const k=(y*D+z)*W+x; const L=(levels[y+b.min.y]??={total:0,reached:0}); L.total++; if(seen[k]) L.reached++; }
const out=Object.entries(levels).filter(([,v])=>v.total>20).map(([y,v])=>`y${y}: ${v.reached}/${v.total}`);
console.log(`${id} ${rot} size ${s.size.x}x${s.size.y}x${s.size.z} changed=${res.changed}`); console.log("underground walk levels reached:", out.join("  ") || "(none)");
const maxT=Math.max(0,...Object.values(levels).map(v=>v.total)); const floors=Object.values(levels).filter(v=>v.total>=0.4*maxT && v.total>100);
console.log(floors.length && floors.every(v=>v.reached===v.total) ? "FLOORS OK" : (floors.length? "FLOORS UNREACHABLE" : "NO UNDERGROUND FLOORS"));
