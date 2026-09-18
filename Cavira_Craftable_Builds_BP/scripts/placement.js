import { BlockPermutation } from "@minecraft/server";

function normalizeYaw(yaw) {
  return ((yaw % 360) + 360) % 360;
}

function getPlayerFacing(player) {
  const yaw = normalizeYaw(player.getRotation().y);
  if (yaw >= 315 || yaw < 45) return "south";
  if (yaw >= 45 && yaw < 135) return "west";
  if (yaw >= 135 && yaw < 225) return "north";
  return "east";
}

export function getCardinalRotation(player) {
  const facing = getPlayerFacing(player);
  if (facing === "south") return "north";
  if (facing === "north") return "south";
  if (facing === "west") return "east";
  return "west";
}

export function rotateXZ(x, z, sizeX, sizeZ, rotation) {
  switch (rotation) {
    case "west": return { x: sizeZ - 1 - z, z: x };
    case "north": return { x: sizeX - 1 - x, z: sizeZ - 1 - z };
    case "east": return { x: z, z: sizeX - 1 - x };
    case "south":
    default: return { x, z };
  }
}

export function toWorldLocation(origin, local, size, rotation) {
  const rotated = rotateXZ(local.x, local.z, size.x, size.z, rotation);
  return { x: origin.x + rotated.x, y: origin.y + local.y, z: origin.z + rotated.z };
}

function getGroundAnchor(player) {
  try {
    const hit = player.getBlockFromViewDirection({ maxDistance: 32 });
    if (hit?.block) {
      return {
        x: hit.block.location.x,
        y: hit.block.location.y,
        z: hit.block.location.z
      };
    }
  } catch {
    // Fall back to a point in front of the player if ray casting is unavailable.
  }

  const facing = getPlayerFacing(player);
  const forward = {
    south: { x: 0, z: 1 },
    north: { x: 0, z: -1 },
    west: { x: -1, z: 0 },
    east: { x: 1, z: 0 }
  }[facing];
  const gap = 5;
  return {
    x: Math.floor(player.location.x) + forward.x * gap,
    y: Math.floor(player.location.y) - 1,
    z: Math.floor(player.location.z) + forward.z * gap
  };
}

export function getPlacementOrigin(player, size, rotation, foundationDepth = 1) {
  const anchorWorld = getGroundAnchor(player);
  const anchorLocal = {
    x: Math.floor((size.x - 1) / 2),
    y: Math.max(0, foundationDepth - 1),
    z: size.z - 1
  };
  const anchorOffset = rotateXZ(anchorLocal.x, anchorLocal.z, size.x, size.z, rotation);

  return {
    x: anchorWorld.x - anchorOffset.x,
    y: anchorWorld.y - anchorLocal.y,
    z: anchorWorld.z - anchorOffset.z
  };
}

export function validatePlacement(dimension, origin, size, rotation) {
  for (let x = 0; x < size.x; x++) {
    for (let y = 0; y < size.y; y++) {
      for (let z = 0; z < size.z; z++) {
        const loc = toWorldLocation(origin, { x, y, z }, size, rotation);
        if (!dimension.getBlock(loc)) {
          return { ok: false, reason: "Part of the build volume is outside loaded or valid world space." };
        }
      }
    }
  }
  return { ok: true };
}

export function clearVolume(dimension, origin, size, rotation) {
  const air = BlockPermutation.resolve("minecraft:air");
  for (let x = 0; x < size.x; x++) {
    for (let y = 0; y < size.y; y++) {
      for (let z = 0; z < size.z; z++) {
        const loc = toWorldLocation(origin, { x, y, z }, size, rotation);
        dimension.getBlock(loc)?.setPermutation(air);
      }
    }
  }
}

export function showFootprintPreview(dimension, origin, size, rotation, foundationDepth = 1) {
  const outline = BlockPermutation.resolve("minecraft:lime_concrete");
  const ground = BlockPermutation.resolve("minecraft:yellow_concrete");
  const foundation = BlockPermutation.resolve("minecraft:orange_concrete");
  const changed = [];
  const seen = new Set();
  const groundY = Math.max(0, foundationDepth - 1);

  const mark = (local, permutation) => {
    const loc = toWorldLocation(origin, local, size, rotation);
    const key = `${loc.x},${loc.y},${loc.z}`;
    if (seen.has(key)) return;
    const block = dimension.getBlock(loc);
    if (!block) return;
    seen.add(key);
    changed.push({ location: loc, permutation: block.permutation });
    block.setPermutation(permutation);
  };

  for (let x = 0; x < size.x; x++) {
    for (let z = 0; z < size.z; z++) {
      const perimeter = x === 0 || z === 0 || x === size.x - 1 || z === size.z - 1;
      if (!perimeter) continue;
      const isDoor = z === size.z - 1 &&
        (x === Math.floor((size.x - 1) / 2) || x === Math.ceil((size.x - 1) / 2));
      mark({ x, y: groundY, z }, isDoor ? ground : outline);
      mark({ x, y: size.y - 1, z }, isDoor ? ground : outline);
    }
  }

  for (const [x, z] of [[0,0],[size.x-1,0],[0,size.z-1],[size.x-1,size.z-1]]) {
    for (let y = groundY + 1; y < size.y - 1; y++) mark({ x, y, z }, outline);
    for (let y = 0; y < groundY; y++) mark({ x, y, z }, foundation);
  }

  return changed;
}

export function restorePreview(dimension, changed) {
  for (const entry of changed) dimension.getBlock(entry.location)?.setPermutation(entry.permutation);
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
  for (const entry of snapshot.blocks) snapshot.dimension.getBlock(entry.location)?.setPermutation(entry.permutation);
  return true;
}
