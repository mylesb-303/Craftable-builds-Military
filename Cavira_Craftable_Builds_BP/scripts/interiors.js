import { OPPOSITE, LEFT } from "./kit.js";

// ---------------------------------------------------------------------------
// Furnished room library (v1.5.0)
// furnishRoom(c, room) fills an already-hollow room with a complete interior.
// room = { x1, z1, x2, z2 (interior, inclusive), walk, h (air height), door, doorU?, type }
// Furniture is laid out in a room frame: u runs along the back wall, v runs
// from the back wall (v = 0) toward the door wall (v = L - 1).
// ---------------------------------------------------------------------------

function frame(room) {
  const { x1, z1, x2, z2, door } = room;
  const W = door === "north" || door === "south" ? x2 - x1 + 1 : z2 - z1 + 1;
  const L = door === "north" || door === "south" ? z2 - z1 + 1 : x2 - x1 + 1;
  const map = {
    south: (u, v) => [x1 + u, z1 + v],
    north: (u, v) => [x2 - u, z2 - v],
    east: (u, v) => [x1 + v, z2 - u],
    west: (u, v) => [x2 - v, z1 + u]
  }[door];
  const back = OPPOSITE[door];
  // u+ direction in local terms
  const uDir = { south: "east", north: "west", east: "north", west: "south" }[door];
  return { W, L, map, back, toDoor: door, uDir, uNeg: OPPOSITE[uDir] };
}

export function furnishRoom(c, room) {
  const F = frame(room);
  const y0 = room.walk;
  const H = room.h;
  const doorU = room.doorU ?? Math.floor(F.W / 2);
  const set = (u, dy, v, p) => {
    if (u < 0 || v < 0 || u >= F.W || v >= F.L) return;
    const [x, z] = F.map(u, v);
    c.set(x, y0 + dy, z, p);
  };
  /** wall cell behind the back wall row (v = -1), for screens/signs */
  const wall = (u, dy, p) => set2(u, dy, -1, p);
  const set2 = (u, dy, v, p) => {
    const [x, z] = F.map(u, v);
    c.set(x, y0 + dy, z, p);
  };
  /** fitting checks for a wall cell (u, dy, v) that lies just outside the room frame */
  const GLAZED = /glass|pane|bars|:air$|door|ladder/;
  const beyondOf = (u, v) => (v === -1 ? [u, -2] : u === -1 ? [-2, v] : u === F.W ? [F.W + 1, v] : [u, v + 1]);
  /** "glazed" (window / opening), "outer" (solid but its far side is open air) or "inner" */
  const wallKind = (u, dy, v) => {
    const [x, z] = F.map(u, v);
    const here = c.get(x, y0 + dy, z);
    if (here === null && c.get(x, y0 - 1, z) === null) return "inner"; // live placement: nothing known
    if (!here || GLAZED.test(here)) return "glazed";
    const [bu, bv] = beyondOf(u, v);
    const [bx, bz] = F.map(bu, bv);
    const beyond = c.get(bx, y0 + dy, bz);
    return beyond === null || GLAZED.test(beyond) ? "outer" : "inner";
  };
  const fittable = (u, dy, v) => wallKind(u, dy, v) === "inner";
  const aisle = (u) => u === doorU || u === doorU + 1;
  /** start positions for units of width w with 1-block gaps, never covering the door lane */
  const slots = (w, from = 0, to = F.W - 1, gap = 1) => {
    const out = [];
    for (let u = from; u + w - 1 <= to;) {
      let blocked = false;
      for (let k = 0; k < w; k++) if (aisle(u + k) || aisle(u + k - 1) && gap > 1 || aisle(u + k + 1) && gap > 1) blocked = true;
      if (blocked) { u++; continue; }
      out.push(u);
      u += w + gap;
    }
    return out;
  };
  const B = c.B;

  // ---- lighting: ceiling grid + wall accents -------------------------------
  for (let u = 1; u < F.W - 1; u += 4) for (let v = 1; v < F.L - 1; v += 4) set2(u, H, v, B.sea);
  // wall accent lights only go into solid inner walls — never into windows or outside faces
  if (room.wallLights !== false) for (let v = 1; v < F.L - 1; v += 4) {
    if (fittable(-1, 3, v)) set2(-1, 3, v, B.sea);
    if (fittable(F.W, 3, v)) set2(F.W, 3, v, B.sea);
  }

  /** screen wall: set into the back wall when it is a solid inner wall, otherwise
   *  mounted on the room side of it (v = 0) so windows and the facade stay intact */
  const screenWall = (u1, u2, dy1, dy2) => {
    let mode = "inner";
    for (let u = u1; u <= u2; u++) for (let dy = dy1; dy <= dy2; dy++) {
      const k = wallKind(u, dy, -1);
      if (k === "glazed") mode = "skip";
      else if (k === "outer" && mode === "inner") mode = "outer";
    }
    if (mode === "skip") return; // a window wall keeps its windows
    const inWall = mode === "inner";
    for (let u = u1; u <= u2; u++) for (let dy = dy1; dy <= dy2; dy++) {
      const border = u === u1 || u === u2 || dy === dy1 || dy === dy2;
      const p = border ? B.black : (u + dy) % 3 === 0 ? B.sea : B.cyanGlass;
      if (inWall) wall(u, dy, p); else set(u, dy, 0, p);
    }
  };
  const console1 = (u, v, facing) => {
    set(u, 0, v, B.blackstone);
    set(u, 1, v, B.daylight);
    if (facing) {
      const [x, z] = F.map(u, v + 1);
      c.chair(x, y0, z, F.back);
    }
  };
  /** local direction for a room-frame direction: "back" (v-), "door" (v+), "u+" or "u-" */
  const dirOf = (d) => ({ back: F.back, door: F.toDoor, "u+": F.uDir, "u-": F.uNeg })[d];
  /** real bed with its foot at (u, v) and pillow pointing toward `d` (room-frame direction) */
  const bed = (u, dy, v, d) => {
    if (u < 0 || v < 0 || u >= F.W || v >= F.L) return;
    const [x, z] = F.map(u, v);
    c.bed(x, y0 + dy, z, dirOf(d));
  };
  const table = (u, v, id = "minecraft:spruce_slab") => set(u, 0, v, c.slabTop(id));
  const crate = (u, v, i) => set(u, 0, v, [B.greenTerracotta, B.orangeTerracotta, B.barrel, B.greenTerracotta][i % 4]);
  /** real bunk bed: two beds stacked on a spruce slab frame; pillows toward the back wall */
  const bunk = (u, v) => {
    bed(u, 0, v + 1, "back");
    const frameSlab = c.slabTop("minecraft:spruce_slab");
    set(u, 1, v, frameSlab); set(u, 1, v + 1, frameSlab);
    if (H >= 4) bed(u, 2, v + 1, "back");
  };

  switch (room.type) {
    case "command":
    case "comms": {
      screenWall(1, F.W - 2, 1, Math.min(4, H - 1));
      for (let u = 1; u < F.W - 1; u++) if (!aisle(u) || F.L < 6) console1(u, 1, true);
      if (F.L >= 7 && F.W >= 7) {
        const cu = Math.floor(F.W / 2) - 1;
        const cv = Math.floor(F.L / 2) + 1;
        for (let u = cu - 1; u <= cu + 2; u++) for (let v = cv; v <= cv + 1; v++) set(u, 0, v, u === cu - 1 || u === cu + 2 ? B.blackstone : B.sea);
        for (let u = cu - 1; u <= cu + 2; u++) set(u, 1, cv, B.lightPlate);
      }
      for (let v = 3; v < F.L - 2; v++) { set(0, 0, v, B.blackstone); set(0, 1, v, v % 2 ? B.daylight : B.cyanGlass); set(F.W - 1, 0, v, B.blackstone); set(F.W - 1, 1, v, v % 2 ? B.cyanGlass : B.daylight); }
      if (room.type === "comms") { set(0, 0, F.L - 2, B.jukebox); set(F.W - 1, 0, F.L - 2, B.noteblock); }
      break;
    }
    case "conference": {
      screenWall(Math.max(1, Math.floor(F.W / 2) - 3), Math.min(F.W - 2, Math.floor(F.W / 2) + 3), 1, Math.min(4, H - 1));
      const u1 = 2, u2 = F.W - 3, vMid = Math.floor(F.L / 2);
      for (let u = u1; u <= u2; u++) {
        table(u, vMid, "minecraft:dark_oak_slab"); table(u, vMid + 1, "minecraft:dark_oak_slab");
        const [xa, za] = F.map(u, vMid - 1); c.chair(xa, y0, za, F.toDoor);
        const [xb, zb] = F.map(u, vMid + 2); c.chair(xb, y0, zb, F.back);
      }
      break;
    }
    case "bunks":
    case "barracks": {
      // v1.11 dormitory: bunks evenly spaced along the back wall (and the front wall in deep
      // rooms) with 2-block gaps, a footlocker at each foot, wall lockers at the ends and a
      // clear central floor and 2-wide corridor.
      const us = slots(1, 0, F.W - 1, 2);
      for (const u of us) {
        bunk(u, 0); // beds at v 0..1, frame slab above
        set(u, 0, 2, c.facing("minecraft:chest", F.toDoor));
      }
      if (F.L >= 11) for (const u of us) {
        bed(u, 0, F.L - 4, "door"); // foot at L-4, head at L-3 (keeps v L-2..L-1 as corridor)
        set(u, 1, F.L - 4, c.slabTop("minecraft:spruce_slab")); set(u, 1, F.L - 3, c.slabTop("minecraft:spruce_slab"));
        if (H >= 4) bed(u, 2, F.L - 4, "door");
        set(u, 0, F.L - 5, c.facing("minecraft:chest", F.back));
      }
      // tall lockers on the end walls, mid-room
      for (let v = 3; v < F.L - 5; v++) for (const u of [0, F.W - 1]) if (!us.includes(u) || v > 3) { set(u, 0, v, c.barrel(u === 0 ? F.uDir : F.uNeg)); set(u, 1, v, c.barrel(u === 0 ? F.uDir : F.uNeg)); }
      break;
    }
    case "officers": {
      for (let u = 1; u < F.W - 1; u += 4) {
        if (aisle(u)) continue;
        bed(u, 0, 1, "back");
        set(u, 0, 2, c.P("minecraft:blue_carpet")); set(u + 1, 0, 2, c.P("minecraft:blue_carpet"));
        set(u + 1, 0, 0, c.barrel(F.toDoor)); set(u + 1, 1, 0, B.lantern); // bedside cabinet + lamp
        if (u + 2 < F.W - 1) set(u + 2, 0, 0, c.facing("minecraft:chest", F.toDoor));
      }
      for (let u = 1; u < F.W - 1; u += 4) {
        if (aisle(u)) continue;
        table(u, F.L - 2, "minecraft:dark_oak_slab");
        const [x, z] = F.map(u, F.L - 3); c.chair(x, y0, z, F.toDoor);
        set(u + 1, 0, F.L - 2, B.bookshelf);
        set(u, 1, F.L - 2, c.P("minecraft:flower_pot"));
      }
      break;
    }
    case "mess": {
      for (let u = 1; u < F.W - 1; u++) { set(u, 0, 0, B.smooth); if (u % 3 === 0) set(u, 0, 0, B.smoker); }
      for (let v = 2; v + 2 < F.L; v += 3) {
        for (let u = 1; u < F.W - 1; u++) {
          if (aisle(u)) continue;
          table(u, v + 1);
          const [xa, za] = F.map(u, v); c.bench(xa, y0, za, F.toDoor);
          const [xb, zb] = F.map(u, v + 2); if (v + 2 < F.L - 1) c.bench(xb, y0, zb, F.back);
        }
      }
      break;
    }
    case "kitchen": {
      const worktop = c.slabTop("minecraft:smooth_stone_slab");
      const items = [c.facing("minecraft:smoker", F.toDoor), c.facing("minecraft:furnace", F.toDoor), worktop, B.cauldron, worktop, B.crafting, c.barrel(F.toDoor), worktop];
      for (let u = 0; u < F.W; u++) set(u, 0, 0, items[u % items.length]);
      for (let v = 1; v < F.L - 1; v++) { set(0, 0, v, v % 2 ? c.barrel(F.uDir) : worktop); set(F.W - 1, 0, v, v % 2 ? worktop : c.facing("minecraft:blast_furnace", F.uNeg)); }
      if (F.W >= 7) for (let u = 2; u < F.W - 2; u++) if (!aisle(u)) set(u, 0, Math.floor(F.L / 2), worktop);
      break;
    }
    case "medical": {
      // v1.11 ward: beds head-to-wall along the back (and front, in deep rooms) every 3 blocks
      // with a bedside cabinet and curtain between each, nurses' station and supply shelving
      // on the side walls. The middle of the ward and the 2-wide entry corridor stay clear.
      const mid = Math.floor(F.W / 2);
      const crossOk = [-1, 0, 1].every((du) => [1, 2, 3].every((dy) => wallKind(mid + du, dy, -1) !== "glazed"));
      if (crossOk) {
        for (let du = -1; du <= 1; du++) wall(mid + du, 2, B.red);
        wall(mid, 1, B.red); wall(mid, 3, B.red);
        for (const [du, dy] of [[-1, 1], [1, 1], [-1, 3], [1, 3]]) wall(mid + du, dy, B.white);
      }
      const us = slots(1, 1, F.W - 2, 2);
      const curtain = c.P("minecraft:white_stained_glass_pane");
      for (const u of us) {
        bed(u, 0, 1, "back"); // head at v 0, foot at v 1
        if (u + 1 < F.W - 1 && !aisle(u + 1)) { set(u + 1, 0, 0, c.barrel(F.toDoor)); set(u + 1, 1, 0, curtain); set(u + 1, 0, 1, curtain); set(u + 1, 1, 1, curtain); }
      }
      if (F.L >= 12) for (const u of us) {
        bed(u, 0, F.L - 4, "door"); // head at L-3, foot at L-4
        if (u + 1 < F.W - 1 && !aisle(u + 1)) { set(u + 1, 0, F.L - 3, c.barrel(F.back)); set(u + 1, 1, F.L - 3, curtain); set(u + 1, 0, F.L - 4, curtain); set(u + 1, 1, F.L - 4, curtain); }
      }
      // supply shelving and the nurses' station along the side walls, mid-room
      const vm = Math.floor(F.L / 2);
      for (let v = vm - 2; v <= vm + 1; v++) {
        set(0, 0, v, v % 2 ? B.cauldron : c.slabTop("minecraft:quartz_slab"));
        set(F.W - 1, 0, v, c.slabTop("minecraft:quartz_slab"));
      }
      set(0, 1, vm - 1, B.brewing); set(F.W - 1, 1, vm, B.brewing);
      break;
    }
    case "decon": {
      for (let u = 0; u + 2 < F.W; u += 3) {
        set(u, 0, 0, B.cauldron);
        for (let dy = 0; dy < 3; dy++) { set(u + 2, dy, 0, B.glass); set(u + 2, dy, 1, B.glass); set(u + 1, dy, 1, B.glass); }
        set(u, 3, 0, B.sea);
      }
      for (let u = 0; u < F.W; u++) if (!aisle(u)) set(u, 0, F.L - 2, B.white);
      break;
    }
    case "storage":
    case "supplies": {
      for (let v = 0; v < F.L - 2; v += 3) {
        for (let u = 0; u < F.W; u++) {
          if (aisle(u)) continue;
          set(u, 0, v, B.spruce); crate(u, 1, v, u + v); set(u, 2, v, B.spruce); crate(u, 3, v, u + v + 1);
          if (v + 1 < F.L - 2) crate(u, 0, v + 1, u * 3 + v);
        }
      }
      break;
    }
    case "armoury": {
      for (let u = 0; u < F.W; u++) if (!aisle(u)) { set(u, 0, 0, u % 3 === 0 ? B.smithing : B.blackstone); set(u, 1, 0, B.bars); set(u, 2, 0, B.bars); }
      for (let v = 1; v < F.L - 1; v++) { set(0, 0, v, v % 2 ? B.greenTerracotta : B.anvil); set(F.W - 1, 0, v, v % 2 ? B.grindstone : B.greenTerracotta); }
      if (F.L >= 6) for (let u = 2; u < F.W - 2; u++) if (!aisle(u)) set(u, 0, Math.floor(F.L / 2), B.blackstone);
      break;
    }
    case "generator": {
      for (let u = 0; u < F.W; u++) for (let v = 0; v < F.L; v++) if (u === 0 || v === 0 || u === F.W - 1) set2(u, -1, v, (u + v) % 2 ? B.black : B.yellow);
      const depth = Math.min(3, F.L - 3);
      for (const u of slots(3, 1, F.W - 2)) {
        for (let du = 0; du < 3; du++) for (let dv = 1; dv <= depth; dv++) { set(u + du, 0, dv, B.black); set(u + du, 1, dv, du === 1 ? B.froglight : B.iron); set(u + du, 2, dv, B.tile); }
        set(u + 1, 0, depth + 1, B.blast);
        for (let dy = 3; dy < H; dy++) set(u + 1, dy, 2, B.basalt);
      }
      for (let v = depth + 3; v < F.L - 1; v++) { set(0, 0, v, B.iron); set(0, 1, v, B.lamp); set(F.W - 1, 0, v, B.barrel); }
      break;
    }
    case "water": {
      for (const u of slots(2, 1, F.W - 2)) {
        for (let dy = 0; dy < Math.min(4, H - 1); dy++) for (let du = 0; du < 2; du++) for (let dv = 1; dv < 3; dv++) set(u + du, dy, dv, dy === 0 ? B.iron : B.lightBlueGlass);
        for (let dy = 4; dy < H; dy++) set(u, dy, 1, B.basalt);
      }
      for (let u = 0; u < F.W; u++) if (!aisle(u)) set(u, 0, F.L - 2, u % 2 ? B.iron : B.cauldron);
      break;
    }
    case "hvac": {
      for (const u of slots(3, 0, F.W - 1)) {
        for (let du = 0; du < 3; du++) for (let dy = 0; dy < 3; dy++) set(u + du, dy, 0, du === 1 && dy === 1 ? B.bars : B.white);
        for (let du = 0; du < 3; du++) for (let dy = 0; dy < 3; dy++) set(u + du, dy, 1, B.lightGrey);
      }
      for (let u = 0; u < F.W; u++) set2(u, H - 1, Math.floor(F.L / 2), B.grey);
      break;
    }
    case "servers": {
      if (room.wallLights !== false) for (let v = 0; v < F.L; v++) { set2(-1, 3, v, B.sea); }
      for (let v = 1; v < F.L - 1; v += 2) {
        for (let u = 0; u < F.W; u++) {
          if (aisle(u)) continue;
          set(u, 0, v, B.blackstone); set(u, 1, v, u % 2 ? B.cyanGlass : B.sea); set(u, 2, v, B.black);
        }
      }
      break;
    }
    case "office": {
      for (let u = 0; u < F.W; u++) if (!aisle(u)) set(u, 0, 0, u % 2 ? B.bookshelf : B.chiseledBookshelf);
      for (let u = 1; u < F.W - 1; u += 3) if (!aisle(u)) { table(u, 2, "minecraft:dark_oak_slab"); set(u, 1, 2, c.P("minecraft:flower_pot")); const [x, z] = F.map(u, 3); c.chair(x, y0, z, F.back); }
      break;
    }
    case "briefing": {
      screenWall(1, F.W - 2, 1, Math.min(4, H - 1));
      set(Math.floor(F.W / 2), 0, 1, B.lectern);
      for (let v = 3; v < F.L - 1; v += 2) for (let u = 1; u < F.W - 1; u++) if (!aisle(u)) { const [x, z] = F.map(u, v); c.chair(x, y0, z, F.back); }
      break;
    }
    case "lab": {
      for (let u = 0; u < F.W; u++) { set(u, 0, 0, u % 3 === 2 ? B.cauldron : c.slabTop("minecraft:quartz_slab")); if (u % 3 === 0) set(u, 1, 0, B.brewing); }
      for (let u = 2; u < F.W - 2; u++) if (!aisle(u)) set(u, 0, Math.floor(F.L / 2), c.slabTop("minecraft:quartz_slab"));
      break;
    }
    case "workshop": {
      const items = [B.crafting, B.anvil, B.smithing, B.grindstone, c.slabTop("minecraft:polished_blackstone_slab"), c.facing("minecraft:loom", F.toDoor)];
      for (let u = 0; u < F.W; u++) if (!aisle(u)) set(u, 0, 0, items[u % items.length]);
      for (let v = 1; v < F.L - 1; v++) { crate(0, 0, v, v); crate(F.W - 1, 0, v, v + 1); }
      break;
    }
    case "lobby":
    default: {
      for (let u = 0; u < F.W; u++) if (!aisle(u) && (u === 0 || u === F.W - 1)) { set(u, 0, 0, c.P("minecraft:flowering_azalea", undefined, "minecraft:moss_block")); }
      break;
    }
  }
}

export { frame as roomFrame, LEFT };
