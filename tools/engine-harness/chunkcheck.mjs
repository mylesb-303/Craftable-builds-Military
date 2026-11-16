import { MockDimension } from "@minecraft/server";
import { ensureLoaded, release } from "./scripts/chunk_loader.js";
const d = new MockDimension(); d.unloadedX = 50;            // far part of the site starts unloaded
d.onCommand = (cmd) => { if (cmd.startsWith("tickingarea add")) setTimeout(() => { d.unloadedX = Infinity; }, 5); };
const b = { min: { x: 0, y: 60, z: 0 }, max: { x: 80, y: 99, z: 112 } };
const name = await ensureLoaded(d, b, "p1");
console.log("area:", name, "commands:", d.commands);
release(d, "p1"); console.log("after release:", d.commands.at(-1));
const d2 = new MockDimension(); console.log("already loaded ->", JSON.stringify(await ensureLoaded(d2, b, "p2")), "(no command:", !d2.commands, ")");
