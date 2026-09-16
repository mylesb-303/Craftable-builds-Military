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

const TABLET_ID = "cavira_builds:construction_tablet";
const LAST_BUILDS = new Map();

function tell(player, message) {
  player.sendMessage(`§8[§bCAVIRA§8]§r ${message}`);
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

  if (response.selection === CATEGORIES.length) {
    await undoLastBuild(player);
    return;
  }

  await showCategoryMenu(player, CATEGORIES[response.selection].id);
}

async function showCategoryMenu(player, categoryId) {
  const category = getCategory(categoryId);
  const structures = getStructures(categoryId);
  if (!category) return;

  if (structures.length === 0) {
    const form = new MessageFormData()
      .title(category.name)
      .body("This pack is registered in the construction system but has no deployable structures in prototype v0.2.1.")
      .button1("Back")
      .button2("Close");
    const response = await form.show(player);
    if (!response.canceled && response.selection === 0) await showMainMenu(player);
    return;
  }

  const form = new ActionFormData()
    .title(`${category.name} Structures`)
    .body("Select a structure. You will choose camouflage and preview its footprint next.");
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
  await prepareStructure(player, categoryId, structureId, VARIANTS[response.selection].id);
}

async function prepareStructure(player, categoryId, structureId, variantId) {
  const structure = getStructure(categoryId, structureId);
  const variant = getVariant(variantId);
  if (!structure) return;

  const rotation = getCardinalRotation(player);
  const origin = getPlacementOrigin(player, structure.size, rotation);
  const validation = validatePlacement(player.dimension, origin, structure.size, rotation);
  if (!validation.ok) {
    tell(player, `§cCannot build:§r ${validation.reason}`);
    return;
  }

  const preview = showFootprintPreview(player.dimension, origin, structure.size, rotation);
  let response;
  try {
    const form = new MessageFormData()
      .title(`Preview: ${structure.name}`)
      .body(
        `${structure.description}\n\n` +
        `Finish: ${variant.name}\n` +
        `Footprint: ${structure.size.x}×${structure.size.z}\n\n` +
        "§aGreen outline§r = build volume\n" +
        "§eYellow blocks§r = front-door centre\n\n" +
        "The structure will deploy a few blocks in front of you. Existing blocks inside the build volume will be replaced, and floating placement is allowed."
      )
      .button1("Construct")
      .button2("Cancel");
    response = await form.show(player);
  } finally {
    restorePreview(player.dimension, preview);
  }

  if (!response || response.canceled || response.selection !== 0) return;

  const finalValidation = validatePlacement(player.dimension, origin, structure.size, rotation);
  if (!finalValidation.ok) {
    tell(player, `§cPlacement changed:§r ${finalValidation.reason}`);
    return;
  }

  const snapshot = captureVolume(player.dimension, origin, structure.size, rotation);

  try {
    clearVolume(player.dimension, origin, structure.size, rotation);
    if (structure.id === "guard_post") buildGuardPost(player.dimension, origin, rotation, variantId);

    LAST_BUILDS.set(player.id, {
      snapshot,
      structureName: structure.name,
      variantName: variant.name
    });

    tell(player, `§a${structure.name} deployed in ${variant.name}. §7Use the tablet to undo it if needed.`);
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
    showMainMenu(player).catch((error) => {
      console.warn(`[CAVIRA] Construction UI error: ${error}`);
      tell(player, "§cThe Construction Tablet encountered an error. Check the content log.");
    });
  });
});
