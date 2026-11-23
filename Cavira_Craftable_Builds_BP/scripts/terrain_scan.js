import { toWorldLocation } from "./placement.js";
import { MAP_TABLE, MAP_SCALE } from "./structures/map_room.js";

// ---------------------------------------------------------------------------
// Terrain scan for the Operations Map Room (v1.10.0). Samples the land around
// the placement with downward raycasts (one per table cell) and classifies the
// surface. Cells in unloaded chunks come back "unknown"; the builder fills
// those from the designed map.
// ---------------------------------------------------------------------------

const KINDS = [
  [/water|ice|kelp|seagrass/, "water"],
  [/sand|sandstone/, "sand"],
  [/snow|powder/, "snow"],
  [/leaves|log|wood|mangrove|azalea|bamboo|mushroom_block/, "forest"],
  [/grass_block|moss|short_grass|tall_grass|fern/, "grass"],
  [/dirt|podzol|mud|mycelium|farmland|clay|path/, "soil"],
  [/stone|gravel|andesite|diorite|granite|tuff|calcite|deepslate|terracotta|basalt|ore/, "stone"]
];

const kindOf = (id) => {
  for (const [re, k] of KINDS) if (re.test(id)) return k;
  return "built"; // anything else on top is treated as a man-made structure
};

export function scanTerrain(dimension, origin, rotation, size, foundationDepth = 2) {
  const { TX1, TX2, TZ1, TZ2 } = MAP_TABLE;
  const TW = TX2 - TX1 - 1, TD = TZ2 - TZ1 - 1;
  const cu = Math.floor(TW / 2), cv = Math.floor(TD / 2);
  const centre = { x: Math.floor(size.x / 2), z: Math.floor(size.z / 2) };
  const ground = toWorldLocation(origin, { x: 0, y: foundationDepth - 1, z: 0 }, size, rotation).y;
  const cells = [];
  let scanned = 0;
  for (let v = 0; v < TD; v++) for (let u = 0; u < TW; u++) {
    const local = { x: centre.x + (u - cu) * MAP_SCALE, y: 0, z: centre.z + (v - cv) * MAP_SCALE };
    const w = toWorldLocation(origin, local, size, rotation);
    let cell = { kind: "unknown", rel: 0 };
    try {
      const top = Math.min((dimension.heightRange?.max ?? 320) - 1, ground + 96);
      const hit = dimension.getBlockFromRay({ x: w.x + 0.5, y: top, z: w.z + 0.5 }, { x: 0, y: -1, z: 0 }, { includeLiquidBlocks: true, includePassableBlocks: false, maxDistance: 192 });
      if (hit?.block) {
        cell = { kind: kindOf(hit.block.typeId), rel: hit.block.location.y - ground };
        scanned++;
      }
    } catch {
      // unloaded chunk or outside the world: leave "unknown"
    }
    cells.push(cell);
  }
  return { cells, scanned: scanned > TW * TD * 0.25, here: [cu, cv], scale: MAP_SCALE };
}
