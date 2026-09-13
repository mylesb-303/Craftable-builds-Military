import { system, world } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import {
  CATEGORIES,
  getCategory,
  getStructure,
  getStructures
} from "./registry.js";
import {
  getCardinalRotation,
  getPlacementOrigin,
  validatePlacement
} from "./placement.js";
import { buildGuardPost } from "./structures/guard_post.js";

const TABLET_ID = "cavira_builds:construction_tablet";

function tell(player, message) {
  player.sendMessage(`§8[§bCAVIRA§8]§r ${message}`);
}

async function showMainMenu(player) {
  const form = new ActionFormData()
    .title("CAVIRA Construction Tablet")
    .body("Select an infrastructure category.");

  for (const category of CATEGORIES) {
    form.button(`${category.icon} §f${category.name}`);
  }

  const response = await form.show(player);
  if (response.canceled || response.selection === undefined) return;

  const category = CATEGORIES[response.selection];
  await showCategoryMenu(player, category.id);
}

async function showCategoryMenu(player, categoryId) {
  const category = getCategory(categoryId);
  const structures = getStructures(categoryId);

  if (!category) return;

  if (structures.length === 0) {
    const form = new MessageFormData()
      .title(category.name)
      .body("This pack is registered in the construction system but has no deployable structures in prototype v0.1.1.")
      .button1("Back")
      .button2("Close");

    const response = await form.show(player);
    if (!response.canceled && response.selection === 0) {
      await showMainMenu(player);
    }
    return;
  }

  const form = new ActionFormData()
    .title(`${category.name} Structures`)
    .body("Prototype structures available in this category:");

  for (const structure of structures) {
    form.button(`${structure.name}\n§7${structure.size.x}×${structure.size.z}×${structure.size.y}`);
  }
  form.button("§8← Back");

  const response = await form.show(player);
  if (response.canceled || response.selection === undefined) return;

  if (response.selection === structures.length) {
    await showMainMenu(player);
    return;
  }

  await prepareStructure(player, categoryId, structures[response.selection].id);
}

async function prepareStructure(player, categoryId, structureId) {
  const structure = getStructure(categoryId, structureId);
  if (!structure) return;

  const origin = getPlacementOrigin(player);
  if (!origin) {
    tell(player, "Look at the ground within 12 blocks, then use the tablet again.");
    return;
  }

  const rotation = getCardinalRotation(player);
  const validation = validatePlacement(
    player.dimension,
    origin,
    structure.size,
    rotation
  );

  if (!validation.ok) {
    tell(player, `§cCannot build:§r ${validation.reason}`);
    return;
  }

  const form = new MessageFormData()
    .title(`Construct ${structure.name}?`)
    .body(
      `${structure.description}\n\n` +
      `Location: ${origin.x}, ${origin.y}, ${origin.z}\n` +
      `Facing: ${rotation.toUpperCase()}\n` +
      `Footprint: ${structure.size.x}×${structure.size.z}\n\n` +
      "The prototype places vanilla blocks only."
    )
    .button1("Construct")
    .button2("Cancel");

  const response = await form.show(player);
  if (response.canceled || response.selection !== 0) return;

  // Re-check immediately before placement in case the area changed while the form was open.
  const finalValidation = validatePlacement(
    player.dimension,
    origin,
    structure.size,
    rotation
  );

  if (!finalValidation.ok) {
    tell(player, `§cPlacement changed:§r ${finalValidation.reason}`);
    return;
  }

  if (structure.id === "guard_post") {
    buildGuardPost(player.dimension, origin, rotation);
    tell(player, `§aGuard Post constructed facing ${rotation}.`);
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
