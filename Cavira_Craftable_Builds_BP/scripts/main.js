import { system, world } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import {
  CATEGORIES,
  getCategory,
  getStructure,
  getStructures
} from "./registry.js";
import {
  captureVolume,
  clearVolume,
  getCardinalRotation,
  getPlacementOrigin,
  restorePreview,
  restoreVolume,
  showFootprintPreview,
  validatePlacement
} from "./placement.js";
import { VARIANTS, getVariant } from "./variants.js";
import { buildGuardPost } from "./structures/guard_post.js";
import { buildMainSecurityGate } from "./structures/main_security_gate.js";
import { buildBaseHeadquarters } from "./structures/base_headquarters.js";
import { buildLargeAircraftHangar } from "./structures/large_aircraft_hangar.js";
import { buildArmyBarracks } from "./structures/army_barracks.js";
import { buildArmyArmoury } from "./structures/army_armoury.js";
import { buildWatchTower } from "./structures/watch_tower.js";
import {
  buildRunwayStraight,
  buildRunwayThreshold,
  buildTaxiwayStraight,
  buildTaxiwayCorner,
  buildAircraftApron
} from "./structures/runway_modules.js";

const TABLET_ID = "cavira_builds:construction_tablet";
const LAST_BUILDS = new Map();
const ACTIVE_PREVIEWS = new Map();

function tell(player, message) {
  player.sendMessage(`§8[§bCAVIRA§8]§r ${message}`);
}

function rotateLeft(rotation) {
  return { north: "west", west: "south", south: "east", east: "north" }[rotation] ?? "north";
}

function rotateRight(rotation) {
  return { north: "east", east: "south", south: "west", west: "north" }[rotation] ?? "north";
}

function clearActivePreview(player) {
  const session = ACTIVE_PREVIEWS.get(player.id);
  if (!session) return;
  restorePreview(player.dimension, session.previewBlocks);
  ACTIVE_PREVIEWS.delete(player.id);
}

function drawPreview(player, session) {
  session.previewBlocks = showFootprintPreview(player.dimension, session.origin, session.structure.size, session.rotation, session.structure.foundationDepth ?? 1);
}

function repositionPreview(player, session) {
  restorePreview(player.dimension, session.previewBlocks);
  session.rotation = getCardinalRotation(player);
  session.origin = getPlacementOrigin(player, session.structure.size, session.rotation, session.structure.foundationDepth ?? 1);
  drawPreview(player, session);
}

function rotatePreview(player, session, direction) {
  restorePreview(player.dimension, session.previewBlocks);
  session.rotation = direction === "left" ? rotateLeft(session.rotation) : rotateRight(session.rotation);
  drawPreview(player, session);
}

async function undoLastBuild(player) {
  const record = LAST_BUILDS.get(player.id);
  if (!record) {
    tell(player, "§7There is no build to undo in this play session.");
    return;
  }
  const form = new MessageFormData()
    .title("Undo Last Build?")
    .body(`Restore the area used by your last ${record.structureName} (${record.variantName}) to exactly how it was before construction?`)
    .button1("Undo Build")
    .button2("Cancel");
  const response = await form.show(player);
  if (response.canceled || response.selection !== 0) return;
  if (restoreVolume(record.snapshot)) {
    LAST_BUILDS.delete(player.id);
    tell(player, `§a${record.structureName} removed and the previous blocks restored.`);
  }
}

async function showMainMenu(player) {
  const form = new ActionFormData()
    .title("CAVIRA Construction Tablet")
    .body("Select an infrastructure category, or undo your most recent construction.");
  for (const category of CATEGORIES) form.button(`${category.icon} §f${category.name}`);
  form.button("§c↶ Undo Last Build");
  const response = await form.show(player);
  if (response.canceled || response.selection === undefined) return;
  if (response.selection === CATEGORIES.length) return undoLastBuild(player);
  await showCategoryMenu(player, CATEGORIES[response.selection].id);
}

async function showCategoryMenu(player, categoryId) {
  const category = getCategory(categoryId);
  const structures = getStructures(categoryId);
  if (!category) return;
  if (structures.length === 0) {
    const form = new MessageFormData()
      .title(category.name)
      .body("This pack is registered in the construction system but has no deployable structures yet.")
      .button1("Back")
      .button2("Close");
    const response = await form.show(player);
    if (!response.canceled && response.selection === 0) await showMainMenu(player);
    return;
  }
  const form = new ActionFormData()
    .title(`${category.name} Structures`)
    .body("Select a structure. You will choose camouflage, then enter free-look placement preview mode.");
  for (const structure of structures) form.button(`${structure.name}\n§7${structure.size.x}×${structure.size.z}×${structure.size.y}`);
  form.button("§8← Back");
  const response = await form.show(player);
  if (response.canceled || response.selection === undefined) return;
  if (response.selection === structures.length) return showMainMenu(player);
  await showVariantMenu(player, categoryId, structures[response.selection].id);
}

async function showVariantMenu(player, categoryId, structureId) {
  const structure = getStructure(categoryId, structureId);
  if (!structure) return;
  const form = new ActionFormData()
    .title(`${structure.name} — Finish`)
    .body("Choose a military colour/camouflage palette. These palettes are shared by the whole construction system.");
  for (const variant of VARIANTS) form.button(`${variant.name}\n§7${variant.description}`);
  form.button("§8← Back");
  const response = await form.show(player);
  if (response.canceled || response.selection === undefined) return;
  if (response.selection === VARIANTS.length) return showCategoryMenu(player, categoryId);
  beginFreeLookPreview(player, categoryId, structureId, VARIANTS[response.selection].id);
}

function beginFreeLookPreview(player, categoryId, structureId, variantId) {
  clearActivePreview(player);
  const structure = getStructure(categoryId, structureId);
  const variant = getVariant(variantId);
  if (!structure) return;
  const rotation = getCardinalRotation(player);
  const origin = getPlacementOrigin(player, structure.size, rotation, structure.foundationDepth ?? 1);
  const validation = validatePlacement(player.dimension, origin, structure.size, rotation);
  if (!validation.ok) {
    tell(player, `§cCannot preview:§r ${validation.reason}`);
    return;
  }
  const session = { categoryId, structureId, variantId, structure, variant, origin, rotation, previewBlocks: [] };
  drawPreview(player, session);
  ACTIVE_PREVIEWS.set(player.id, session);
  tell(player, `§aPreview active: ${structure.name} (${variant.name}). §rFly or walk around freely to inspect it. Use the Construction Tablet again for placement controls.`);
}

async function showPreviewControls(player) {
  const session = ACTIVE_PREVIEWS.get(player.id);
  if (!session) return showMainMenu(player);
  const form = new ActionFormData()
    .title(`Preview: ${session.structure.name}`)
    .body(`Finish: ${session.variant.name}\nFacing: ${session.rotation.toUpperCase()}\nSize: ${session.structure.size.x}×${session.structure.size.z}×${session.structure.size.y}\nFoundation depth: ${session.structure.foundationDepth ?? 1} blocks\n\nThe green 3D outline stays in the world while you inspect the site. Yellow marks the entrance/ground reference; orange marks the below-ground foundation.`)
    .button("§aConstruct Here")
    .button("§bReposition In Front Of Me")
    .button("§e↶ Rotate Left")
    .button("§e↷ Rotate Right")
    .button("§cCancel Preview");
  const response = await form.show(player);
  if (response.canceled || response.selection === undefined) return;
  if (response.selection === 0) return constructPreview(player, session);
  if (response.selection === 1) {
    repositionPreview(player, session);
    tell(player, "§aPreview repositioned in front of you. Inspect it again, then use the tablet when ready.");
    return;
  }
  if (response.selection === 2) {
    rotatePreview(player, session, "left");
    tell(player, "§aPreview rotated left. Inspect it again, then use the tablet when ready.");
    return;
  }
  if (response.selection === 3) {
    rotatePreview(player, session, "right");
    tell(player, "§aPreview rotated right. Inspect it again, then use the tablet when ready.");
    return;
  }
  clearActivePreview(player);
  tell(player, "§7Placement preview cancelled and the original blocks restored.");
}

async function constructPreview(player, session) {
  const validation = validatePlacement(player.dimension, session.origin, session.structure.size, session.rotation);
  if (!validation.ok) {
    tell(player, `§cCannot build:§r ${validation.reason}`);
    return;
  }
  restorePreview(player.dimension, session.previewBlocks);
  ACTIVE_PREVIEWS.delete(player.id);
  const snapshot = captureVolume(player.dimension, session.origin, session.structure.size, session.rotation);
  try {
    clearVolume(player.dimension, session.origin, session.structure.size, session.rotation);
    switch (session.structure.id) {
      case "guard_post":
        buildGuardPost(player.dimension, session.origin, session.rotation, session.variantId);
        break;
      case "main_security_gate":
        buildMainSecurityGate(player.dimension, session.origin, session.rotation, session.variantId);
        break;
      case "base_headquarters":
        buildBaseHeadquarters(player.dimension, session.origin, session.rotation, session.variantId);
        break;
      case "large_aircraft_hangar":
        buildLargeAircraftHangar(player.dimension, session.origin, session.rotation, session.variantId);
        break;
      case "army_barracks":
        buildArmyBarracks(player.dimension, session.origin, session.rotation, session.variantId);
        break;
      case "army_armoury":
        buildArmyArmoury(player.dimension, session.origin, session.rotation, session.variantId);
        break;
      case "watch_tower":
        buildWatchTower(player.dimension, session.origin, session.rotation, session.variantId);
        break;
      case "runway_threshold":
        buildRunwayThreshold(player.dimension, session.origin, session.rotation, session.variantId);
        break;
      case "runway_straight":
        buildRunwayStraight(player.dimension, session.origin, session.rotation, session.variantId);
        break;
      case "taxiway_straight":
        buildTaxiwayStraight(player.dimension, session.origin, session.rotation, session.variantId);
        break;
      case "taxiway_corner":
        buildTaxiwayCorner(player.dimension, session.origin, session.rotation, session.variantId);
        break;
      case "aircraft_apron":
        buildAircraftApron(player.dimension, session.origin, session.rotation, session.variantId);
        break;
      default:
        throw new Error(`No builder registered for ${session.structure.id}`);
    }
    LAST_BUILDS.set(player.id, { snapshot, structureName: session.structure.name, variantName: session.variant.name });
    tell(player, `§a${session.structure.name} deployed in ${session.variant.name}. §7Use the tablet to undo it if needed.`);
  } catch (error) {
    restoreVolume(snapshot);
    console.warn(`[CAVIRA] Construction error: ${error}`);
    tell(player, "§cConstruction failed and the area was restored. Check the content log.");
  }
}

world.afterEvents.itemUse.subscribe((event) => {
  if (event.itemStack?.typeId !== TABLET_ID) return;
  const player = event.source;
  system.run(() => {
    const task = ACTIVE_PREVIEWS.has(player.id) ? showPreviewControls(player) : showMainMenu(player);
    task.catch((error) => {
      console.warn(`[CAVIRA] Construction UI error: ${error}`);
      tell(player, "§cThe Construction Tablet encountered an error. Check the content log.");
    });
  });
});
