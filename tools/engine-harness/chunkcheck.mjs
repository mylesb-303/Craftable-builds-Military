import { MockDimension } from "@minecraft/server";
import { ensureLoaded, release } from "./scripts/chunk_loader.js";
const d = new MockDimension(); d.unloadedX = 50;            // far part of the site starts unloaded
d.onCommand = (cmd) => { if (cmd.startsWith("tickingarea add")) setTimeout(() => { d.unloadedX = Infinity; }, 5); };
const b = { min: { x: 0, y: 60, z: 0 }, max: { x: 80, y: 99, z: 112 } };
const name = await ensureLoaded(d, b, "p1");
console.log("area:", name, "commands:", d.commands);
release(d, "p1"); console.log("after release:", d.commands.at(-1));
const d2 = new MockDimension(); console.log("already loaded ->", JSON.stringify(await ensureLoaded(d2, b, "p2")), "(no command:", !d2.commands, ")");
// v1.8: a 641 x 179 runway site needs several <=100-chunk tiles
{ const d = new MockDimension(); d.unloadedX = 50;
  d.onCommand = (cmd) => { if (cmd.startsWith("tickingarea add")) setTimeout(() => { d.unloadedX = Infinity; }, 5); };
  const big = { min: { x: 3, y: 60, z: 7 }, max: { x: 3 + 178, y: 67, z: 7 + 640 } };
  const n = await ensureLoaded(d, big, "p3");
  const adds = d.commands.filter(c => c.startsWith("tickingarea add"));
  const ok = adds.every(c => { const [x1,,z1,x2,,z2] = c.split(" ").slice(2, 8).map(Number); return (Math.floor(x2/16)-Math.floor(x1/16)+1)*(Math.floor(z2/16)-Math.floor(z1/16)+1) <= 100; });
  release(d, "p3");
  const removes = d.commands.filter(c => c.startsWith("tickingarea remove")).length;
  console.log(`multi-tile: ${adds.length} areas, all <=100 chunks: ${ok}, removed ${removes} -> ${n && ok && removes === adds.length ? "PASS" : "FAIL"}`); }
