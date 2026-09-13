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

export function getPlacementOrigin(player) {
  const hit = player.getBlockFromViewDirection({ maxDistance: 12 });
  if (!hit?.block) return undefined;

  const { x, y, z } = hit.block.location;
  return { x, y: y + 1, z };
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

function worldLocation(origin, local, size, rotation) {
  const rotated = rotateXZ(local.x, local.z, size.x, size.z, rotation);
  return {
    x: origin.x + rotated.x,
    y: origin.y + local.y,
    z: origin.z + rotated.z
  };
}

export function validatePlacement(dimension, origin, size, rotation) {
  for (let x = 0; x < size.x; x++) {
    for (let z = 0; z < size.z; z++) {
      const supportLoc = worldLocation(
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
        const loc = worldLocation(origin, { x, y, z }, size, rotation);
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

export function toWorldLocation(origin, local, size, rotation) {
  return worldLocation(origin, local, size, rotation);
}
