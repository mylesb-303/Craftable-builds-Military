import { BlockPermutation } from "@minecraft/server";

const REPLACEABLE_BLOCKS = new Set([
  "minecraft:air",
  "minecraft:short_grass",
  "minecraft:tall_grass",
  "minecraft:fern",
  "minecraft:large_fern",
  "minecraft:snow_layer",
  "minecraft:deadbush",
  "minecraft:vine"
]);

const UNSUPPORTED_GROUND = new Set([
  "minecraft:air",
  "minecraft:water",
  "minecraft:flowing_water",
  "minecraft:lava",
  "minecraft:flowing_lava",
  "minecraft:short_grass",
  "minecraft:tall_grass",
  "minecraft:fern",
  "minecraft:large_fern",
  "minecraft:snow_layer",
  "minecraft:vine"
]);

function normalizeYaw(yaw) {
  return ((yaw % 360) + 360) % 360;
}

export function getCardinalRotation(player) {
  const yaw = normalizeYaw(player.getRotation().y);

  if (yaw >= 315 || yaw < 45) return "south";
  if (yaw >= 45 && yaw < 135) return "west";
  if (yaw >= 135 && yaw < 225) return "north";
  return "east";
}

export function rotateXZ(x, z, sizeX, sizeZ, rotation) {
  switch (rotation) {
    case "west":
      return { x: sizeZ - 1 - z, z: x };
    case "north":
      return { x: sizeX - 1 - x, z: sizeZ - 1 - z };
    case "east":
      return { x: z, z: sizeX - 1 - x };
    case "south":
    default:
      return { x, z };
  }
}

export function toWorldLocation(origin, local, size, rotation) {
  const rotated = rotateXZ(local.x, local.z, size.x, size.z, rotation);
  return {
    x: origin.x + rotated.x,
    y: origin.y + local.y,
    z: origin.z + rotated.z
  };
}

export function getPlacementOrigin(player, size, rotation) {
  const hit = player.getBlockFromViewDirection({ maxDistance: 16 });
  if (!hit?.block) return undefined;

  // The aimed-at ground block is the front-centre threshold of the structure,
  // rather than the local 0,0 corner. For even widths, the left centre block
  // is used so the two-block doorway still straddles the visible centre line.
  const anchorLocal = {
    x: Math.floor((size.x - 1) / 2),
    y: 0,
    z: size.z - 1
  };
  const anchorOffset = rotateXZ(
    anchorLocal.x,
    anchorLocal.z,
    size.x,
    size.z,
    rotation
  );

  const { x, y, z } = hit.block.location;
  return {
    x: x - anchorOffset.x,
    y: y + 1,
    z: z - anchorOffset.z
  };
}

export function validatePlacement(dimension, origin, size, rotation) {
  for (let x = 0; x < size.x; x++) {
    for (let z = 0; z < size.z; z++) {
      const supportLoc = toWorldLocation(
        origin,
        { x, y: -1, z },
        size,
        rotation
      );
      const support = dimension.getBlock(supportLoc);

      if (!support || UNSUPPORTED_GROUND.has(support.typeId)) {
        return {
          ok: false,
          reason: "The entire footprint needs solid, level ground."
        };
      }

      for (let y = 0; y < size.y; y++) {
        const loc = toWorldLocation(origin, { x, y, z }, size, rotation);
        const block = dimension.getBlock(loc);

        if (!block) {
          return {
            ok: false,
            reason: "Part of the build area is outside loaded or valid world space."
          };
        }

        if (!REPLACEABLE_BLOCKS.has(block.typeId)) {
          return {
            ok: false,
            reason: `Build area blocked by ${block.typeId.replace("minecraft:", "")} at ${loc.x}, ${loc.y}, ${loc.z}.`
          };
        }
      }
    }
  }

  return { ok: true };
}

export function showFootprintPreview(dimension, origin, size, rotation) {
  const outline = BlockPermutation.resolve("minecraft:lime_concrete");
  const front = BlockPermutation.resolve("minecraft:yellow_concrete");
  const changed = [];

  for (let x = 0; x < size.x; x++) {
    for (let z = 0; z < size.z; z++) {
      const perimeter = x === 0 || z === 0 || x === size.x - 1 || z === size.z - 1;
      if (!perimeter) continue;

      const loc = toWorldLocation(origin, { x, y: 0, z }, size, rotation);
      const block = dimension.getBlock(loc);
      if (!block || !REPLACEABLE_BLOCKS.has(block.typeId)) continue;

      changed.push({ location: loc, permutation: block.permutation });
      const isFrontDoor = z === size.z - 1 && (x === Math.floor((size.x - 1) / 2) || x === Math.ceil((size.x - 1) / 2));
      block.setPermutation(isFrontDoor ? front : outline);
    }
  }

  return changed;
}

export function restorePreview(dimension, changed) {
  for (const entry of changed) {
    dimension.getBlock(entry.location)?.setPermutation(entry.permutation);
  }
}

export function captureVolume(dimension, origin, size, rotation) {
  const blocks = [];
  for (let x = 0; x < size.x; x++) {
    for (let y = 0; y < size.y; y++) {
      for (let z = 0; z < size.z; z++) {
        const location = toWorldLocation(origin, { x, y, z }, size, rotation);
        const block = dimension.getBlock(location);
        if (block) blocks.push({ location, permutation: block.permutation });
      }
    }
  }
  return { dimension, blocks };
}

export function restoreVolume(snapshot) {
  if (!snapshot) return false;
  for (const entry of snapshot.blocks) {
    snapshot.dimension.getBlock(entry.location)?.setPermutation(entry.permutation);
  }
  return true;
}
