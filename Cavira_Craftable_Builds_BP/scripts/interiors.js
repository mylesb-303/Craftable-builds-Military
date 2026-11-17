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
  const aisle = (u) => u === doorU || u === doorU + 1;
  /** start positions for units of width w with 1-block gaps, never covering the door lane */
  const slots = (w, from = 0, to = F.W - 1) => {
    const out = [];
    for (let u = from; u + w - 1 <= to;) {
      let blocked = false;
      for (let k = 0; k < w; k++) if (aisle(u + k)) blocked = true;
      if (blocked) { u++; continue; }
      out.push(u);
      u += w + 1;
    }
    return out;
  };
  const B = c.B;

  // ---- lighting: ceiling grid + wall accents -------------------------------
  for (let u = 1; u < F.W - 1; u += 4) for (let v = 1; v < F.L - 1; v += 4) set2(u, H, v, B.sea);
  if (room.wallLights !== false) for (let v = 1; v < F.L - 1; v += 4) { set2(-1, 3, v, B.sea); set2(F.W, 3, v, B.sea); }

  const screenWall = (u1, u2, dy1, dy2) => {
    for (let u = u1; u <= u2; u++) for (let dy = dy1; dy <= dy2; dy++) {
      const border = u === u1 || u === u2 || dy === dy1 || dy === dy2;
      wall(u, dy, border ? B.black : (u + dy) % 3 === 0 ? B.sea : B.cyanGlass);
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
  const crate = (u, v, i) => set(u, 0, v, [B.greenTerracotta, B.orangeTerracotta, B.barrel, B.greenTerracotta][i % 4]);
  const bunk = (u, v, along) => {
    // along: number of v cells (2)
    set(u, 0, v, B.whiteWool); set(u, 0, v + 1, B.greenWool);
    set(u, 1, v, B.bars); set(u, 1, v + 1, B.bars);
    set(u, 2, v, B.whiteWool); set(u, 2, v + 1, B.greenWool);
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
        set(u, 0, vMid, B.darkOak); set(u, 0, vMid + 1, u % 2 ? B.darkOak : B.sea);
        const [xa, za] = F.map(u, vMid - 1); c.chair(xa, y0, za, F.toDoor);
        const [xb, zb] = F.map(u, vMid + 2); c.chair(xb, y0, zb, F.back);
      }
      break;
    }
    case "bunks":
    case "barracks": {
      for (let u = 0; u < F.W; u++) if (!aisle(u)) { set(u, 0, 0, B.iron); set(u, 1, 0, B.iron); }
      for (let v = 2; v + 1 < F.L - 1; v += 3) { bunk(0, v); bunk(F.W - 1, v); if (F.W >= 9) { bunk(2, v); bunk(F.W - 3, v); } }
      for (let v = 2; v < F.L - 1; v += 3) { set(1, 0, v + 2, B.greenTerracotta); set(F.W - 2, 0, v + 2, B.greenTerracotta); }
      break;
    }
    case "officers": {
      for (let u = 1; u < F.W - 1; u += 4) { set(u, 0, 0, B.whiteWool); set(u, 0, 1, B.blue); set(u + 1, 0, 0, B.spruce); set(u + 1, 1, 0, B.lantern); }
      for (let u = 1; u < F.W - 1; u += 4) { set(u, 0, F.L - 2, B.spruce); const [x, z] = F.map(u, F.L - 3); c.chair(x, y0, z, F.toDoor); set(u + 1, 0, F.L - 2, B.bookshelf); }
      break;
    }
    case "mess": {
      for (let u = 1; u < F.W - 1; u++) { set(u, 0, 0, B.smooth); if (u % 3 === 0) set(u, 0, 0, B.smoker); }
      for (let v = 2; v + 2 < F.L; v += 3) {
        for (let u = 1; u < F.W - 1; u++) {
          if (aisle(u)) continue;
          set(u, 0, v + 1, B.spruce);
          const [xa, za] = F.map(u, v); c.bench(xa, y0, za, F.toDoor);
          const [xb, zb] = F.map(u, v + 2); if (v + 2 < F.L - 1) c.bench(xb, y0, zb, F.back);
        }
      }
      break;
    }
    case "kitchen": {
      const items = [B.smoker, B.furnace, B.smooth, B.cauldron, B.smooth, B.crafting, B.barrel, B.smooth];
      for (let u = 0; u < F.W; u++) set(u, 0, 0, items[u % items.length]);
      for (let v = 1; v < F.L - 1; v++) { set(0, 0, v, v % 2 ? B.barrel : B.smooth); set(F.W - 1, 0, v, v % 2 ? B.smooth : B.iron); }
      if (F.W >= 7) for (let u = 2; u < F.W - 2; u++) if (!aisle(u)) set(u, 0, Math.floor(F.L / 2), B.smooth);
      break;
    }
    case "medical": {
      const mid = Math.floor(F.W / 2);
      for (let du = -1; du <= 1; du++) wall(mid + du, 2, B.red);
      wall(mid, 1, B.red); wall(mid, 3, B.red);
      for (const [du, dy] of [[-1, 1], [1, 1], [-1, 3], [1, 3]]) wall(mid + du, dy, B.white);
      for (let v = 1; v + 1 < F.L - 1; v += 3) {
        for (const u of [0, F.W - 1]) { set(u, 0, v, B.quartz); set(u, 0, v + 1, B.whiteWool); set(u, 1, v, B.sea); }
        if (F.W >= 7) { set(1, 0, v + 2, B.brewing); set(F.W - 2, 0, v + 2, B.white); }
      }
      for (let u = 1; u < F.W - 1; u++) if (!aisle(u)) set(u, 0, 0, u % 2 ? B.white : B.brewing);
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
      for (let u = 1; u < F.W - 1; u += 3) if (!aisle(u)) { set(u, 0, 2, B.spruce); set(u, 1, 2, B.daylight); const [x, z] = F.map(u, 3); c.chair(x, y0, z, F.back); }
      break;
    }
    case "briefing": {
      screenWall(1, F.W - 2, 1, Math.min(4, H - 1));
      set(Math.floor(F.W / 2), 0, 1, B.lectern);
      for (let v = 3; v < F.L - 1; v += 2) for (let u = 1; u < F.W - 1; u++) if (!aisle(u)) { const [x, z] = F.map(u, v); c.chair(x, y0, z, F.back); }
      break;
    }
    case "lab": {
      for (let u = 0; u < F.W; u++) { set(u, 0, 0, B.white); set(u, 1, 0, u % 3 === 0 ? B.brewing : u % 3 === 1 ? B.glass : B.cauldron); }
      for (let u = 2; u < F.W - 2; u++) if (!aisle(u)) set(u, 0, Math.floor(F.L / 2), B.quartz);
      break;
    }
    case "workshop": {
      const items = [B.crafting, B.anvil, B.smithing, B.grindstone, B.blackstone, B.loom];
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
