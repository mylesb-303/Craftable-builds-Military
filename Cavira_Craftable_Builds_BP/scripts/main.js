import { system, world } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import {
  CATEGORIES,
  getCategory,
  getStructure,
  getStructures
} from "./registry.js";
import {
  clearVolume,
  getCardinalRotation,
  getPlacementOrigin,
  restorePreview,
  showFootprintPreview,
  validatePlacement
} from "./placement.js";
import { constructStaged, restoreStaged } from "./construction_engine.js";
import { installPreviewGuard, registerPreview, unregisterPreview } from "./preview_guard.js";
import { VARIANTS, getVariant } from "./variants.js";
import { buildGuardPost } from "./structures/guard_post.js";
import { buildMainSecurityGate } from "./structures/main_security_gate.js";
import { buildBaseHeadquarters } from "./structures/base_headquarters.js";
import { buildLargeAircraftHangar } from "./structures/large_aircraft_hangar.js";
import { buildArmyBarracks } from "./structures/army_barracks.js";
import { buildArmyArmoury } from "./structures/army_armoury.js";
import {
  buildArmyVehicleDepot,
  buildArmyMedicalFacility,
  buildArmyCommandBunker,
  buildArmyDefensiveCheckpoint,
  buildArmyPerimeterWall
} from "./structures/army_expansion.js";
import { buildWatchTower } from "./structures/watch_tower.js";
import { buildAirTrafficControlTower } from "./structures/air_traffic_control_tower.js";
import {
  buildHQAdministrationWing,
  buildHQCommandRotunda,
  buildCeremonialFountainPlaza,
  buildOfficersQuarters,
  buildLogisticsHall,
  buildHeavyVehicleMaintenanceHangar
} from "./structures/base_expansion.js";
import {
  buildHardenedFighterShelter,
  buildFighterShelterRow,
  buildHelicopterHangar,
  buildAirfieldOperationsBuilding,
  buildFuelTankFarm,
  buildRadarRadomeFacility,
  buildHelicopterApron
} from "./structures/airforce_expansion.js";
import {
  buildRunwayStraight,
  buildRunwayThreshold,
  buildTaxiwayStraight,
  buildTaxiwayCorner,
  buildAircraftApron
} from "./structures/runway_modules.js";
import {
  buildNavalHeadquarters,
  buildHarbourControlTower,
  buildPierStraight,
  buildPierCorner,
  buildPierTJunction,
  buildHeavyShipBerth,
  buildSubmarineServiceBerth,
  buildNavalFuelingPier,
  buildDryDockSide,
  buildDryDockGateEnd,
  buildNuclearSubmarinePen,
  buildDocksideLoadingCrane,
  buildCoastalDefenceBunker,
  buildSeawallModule
} from "./structures/navy_expansion.js";
import {
  buildSmallNuclearBunker,
  buildMediumNuclearBunker,
  buildLargeNuclearBunker,
  buildStrategicOperationsBunker
} from "./structures/bunker_expansion.js";
import {
  buildSmallTacticalRadarPost,
  buildMediumRadarStation,
  buildLargeEarlyWarningRadarComplex,
  buildSmallCommunicationsDishStation,
  buildMediumSatelliteDishStation,
  buildLargeStrategicSatelliteArray,
  buildStandaloneSmallSatelliteDish,
  buildStandaloneMediumSatelliteDish,
  buildStandaloneLargeSatelliteDish
} from "./structures/strategic_expansion.js";

const TABLET_ID = "cavira_builds:construction_tablet";
const LAST_BUILDS = new Map();
const ACTIVE_PREVIEWS = new Map();
const BUSY = new Map(); // playerId -> { label, fraction } while a staged job runs

function tell(player, message) {
  player.sendMessage(`§8[§bCAVIRA§8]§r ${message}`);
}

function rotateLeft(rotation) {
  return { north: "west", west: "south", south: "east", east: "north" }[rotation] ?? "north";
}

function rotateRight(rotation) {
  return { north: "east", east: "south", south: "west", west: "north" }[rotation] ?? "north";
}

function removePreviewBlocks(playerId, session) {
  unregisterPreview(playerId, session.dimension, session.previewBlocks);
  restorePreview(session.dimension, session.previewBlocks);
  session.previewBlocks = [];
}

function clearPreviewById(playerId) {
  const session = ACTIVE_PREVIEWS.get(playerId);
  if (!session) return;
  removePreviewBlocks(playerId, session);
  ACTIVE_PREVIEWS.delete(playerId);
}

function clearActivePreview(player) {
  clearPreviewById(player.id);
}

function drawPreview(player, session) {
  session.previewBlocks = showFootprintPreview(session.dimension, session.origin, session.structure.size, session.rotation, session.structure.foundationDepth ?? 1, session.structure.previewFloorY);
  registerPreview(player.id, session.dimension, session.previewBlocks);
}

function repositionPreview(player, session) {
  removePreviewBlocks(player.id, session);
  session.dimension = player.dimension;
  session.rotation = getCardinalRotation(player);
  session.origin = getPlacementOrigin(player, session.structure.size, session.rotation, session.structure.foundationDepth ?? 1, session.structure.previewFloorY);
  drawPreview(player, session);
}

function rotatePreview(player, session, direction) {
  removePreviewBlocks(player.id, session);
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
  if (BUSY.has(player.id)) {
    tell(player, "§eWait for the current construction job to finish first.");
    return;
  }
  LAST_BUILDS.delete(player.id);
  BUSY.set(player.id, { label: "Restoring", fraction: 0 });
  try {
    const ok = await restoreStaged(record.snapshot, (label, fraction) => {
      BUSY.set(player.id, { label, fraction });
      try {
        player.onScreenDisplay.setActionBar(`§eRestoring terrain §7${Math.floor(fraction * 100)}%`);
      } catch {
        // ignore
      }
    });
    tell(player, ok
      ? `§a${record.structureName} removed and the previous blocks restored.`
      : `§e${record.structureName} removed; some blocks were in unloaded chunks and could not be restored.`);
  } finally {
    BUSY.delete(player.id);
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
  const origin = getPlacementOrigin(player, structure.size, rotation, structure.foundationDepth ?? 1, structure.previewFloorY);
  const validation = validatePlacement(player.dimension, origin, structure.size, rotation);
  if (!validation.ok) {
    tell(player, `§cCannot preview:§r ${validation.reason}`);
    return;
  }
  const session = { categoryId, structureId, variantId, structure, variant, origin, rotation, dimension: player.dimension, previewBlocks: [] };
  drawPreview(player, session);
  ACTIVE_PREVIEWS.set(player.id, session);
  tell(player, `§aPreview active: ${structure.name} (${variant.name}). §rFly or walk around freely to inspect it. Use the Construction Tablet again for placement controls.`);
}

async function showPreviewControls(player) {
  const session = ACTIVE_PREVIEWS.get(player.id);
  if (!session) return showMainMenu(player);
  const form = new ActionFormData()
    .title(`Preview: ${session.structure.name}`)
    .body(`Finish: ${session.variant.name}\nFacing: ${session.rotation.toUpperCase()}\nSize: ${session.structure.size.x}×${session.structure.size.z}×${session.structure.size.y}\nFoundation depth: ${session.structure.foundationDepth ?? 1} blocks\n\nGreen marks the outer volume. Cyan cross-hatching marks the exact finished walkable floor/deck height. Yellow marks the entrance; orange marks the below-ground foundation.`)
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
  const dimension = session.dimension;
  const validation = validatePlacement(dimension, session.origin, session.structure.size, session.rotation);
  if (!validation.ok) {
    tell(player, `§cCannot build:§r ${validation.reason}`);
    return;
  }
  // Remove the preview markers first so the snapshot records the real terrain.
  clearActivePreview(player);
  const { structure, origin, rotation, variantId, variant } = session;
  BUSY.set(player.id, { label: "Preparing", fraction: 0 });
  tell(player, `§7Constructing ${structure.name}… large builds are spread over several seconds to keep the game smooth.`);
  let lastShown = -1;
  const onProgress = (label, fraction) => {
    BUSY.set(player.id, { label, fraction });
    const pct = Math.floor(fraction * 100);
    if (pct === lastShown) return;
    lastShown = pct;
    try {
      player.onScreenDisplay.setActionBar(`§b${label}: §f${structure.name} §7${pct}%`);
    } catch {
      // Player may have left; construction continues.
    }
  };
  try {
    const result = await constructStaged(dimension, (recorder) => {
      if (structure.placementMode !== "overlay" && structure.placementMode !== "excavation") {
        clearVolume(recorder, origin, structure.size, rotation);
      }
      runBuilder(structure.id, recorder, origin, rotation, variantId);
    }, onProgress);
    if (!result.ok) {
      tell(player, `§cConstruction cancelled:§r ${result.reason}`);
      return;
    }
    LAST_BUILDS.set(player.id, { snapshot: result.snapshot, structureName: structure.name, variantName: variant.name });
    tell(player, `§a${structure.name} deployed in ${variant.name}. §7(${result.changed} blocks placed — use the tablet to undo it if needed.)`);
    try {
      player.onScreenDisplay.setActionBar(`§a${structure.name} complete`);
    } catch {
      // ignore
    }
  } catch (error) {
    console.warn(`[CAVIRA] Construction error: ${error}`);
    tell(player, "§cConstruction failed. Check the content log.");
  } finally {
    BUSY.delete(player.id);
  }
}

export function runBuilder(structureId, dimension, origin, rotation, variantId) {
  switch (structureId) {
    case "guard_post":
      buildGuardPost(dimension, origin, rotation, variantId);
      break;
    case "main_security_gate":
      buildMainSecurityGate(dimension, origin, rotation, variantId);
      break;
    case "base_headquarters":
      buildBaseHeadquarters(dimension, origin, rotation, variantId);
      break;
    case "hq_administration_wing":
      buildHQAdministrationWing(dimension, origin, rotation, variantId);
      break;
    case "hq_command_rotunda":
      buildHQCommandRotunda(dimension, origin, rotation, variantId);
      break;
    case "ceremonial_fountain_plaza":
      buildCeremonialFountainPlaza(dimension, origin, rotation, variantId);
      break;
    case "large_aircraft_hangar":
      buildLargeAircraftHangar(dimension, origin, rotation, variantId);
      break;
    case "army_barracks":
      buildArmyBarracks(dimension, origin, rotation, variantId);
      break;
    case "army_armoury":
      buildArmyArmoury(dimension, origin, rotation, variantId);
      break;
    case "army_vehicle_depot":
      buildArmyVehicleDepot(dimension, origin, rotation, variantId);
      break;
    case "army_medical_facility":
      buildArmyMedicalFacility(dimension, origin, rotation, variantId);
      break;
    case "army_command_bunker":
      buildArmyCommandBunker(dimension, origin, rotation, variantId);
      break;
    case "army_defensive_checkpoint":
      buildArmyDefensiveCheckpoint(dimension, origin, rotation, variantId);
      break;
    case "army_perimeter_wall":
      buildArmyPerimeterWall(dimension, origin, rotation, variantId);
      break;
    case "officers_quarters":
      buildOfficersQuarters(dimension, origin, rotation, variantId);
      break;
    case "heavy_vehicle_maintenance_hangar":
      buildHeavyVehicleMaintenanceHangar(dimension, origin, rotation, variantId);
      break;
    case "watch_tower":
      buildWatchTower(dimension, origin, rotation, variantId);
      break;
    case "air_traffic_control_tower":
      buildAirTrafficControlTower(dimension, origin, rotation, variantId);
      break;
    case "hardened_fighter_shelter":
      buildHardenedFighterShelter(dimension, origin, rotation, variantId);
      break;
    case "fighter_shelter_row":
      buildFighterShelterRow(dimension, origin, rotation, variantId);
      break;
    case "helicopter_hangar":
      buildHelicopterHangar(dimension, origin, rotation, variantId);
      break;
    case "airfield_operations_building":
      buildAirfieldOperationsBuilding(dimension, origin, rotation, variantId);
      break;
    case "radar_radome_facility":
      buildRadarRadomeFacility(dimension, origin, rotation, variantId);
      break;
    case "small_tactical_radar_post":
      buildSmallTacticalRadarPost(dimension, origin, rotation, variantId);
      break;
    case "medium_radar_station":
      buildMediumRadarStation(dimension, origin, rotation, variantId);
      break;
    case "large_early_warning_radar_complex":
      buildLargeEarlyWarningRadarComplex(dimension, origin, rotation, variantId);
      break;
    case "small_communications_dish_station":
      buildSmallCommunicationsDishStation(dimension, origin, rotation, variantId);
      break;
    case "medium_satellite_dish_station":
      buildMediumSatelliteDishStation(dimension, origin, rotation, variantId);
      break;
    case "large_strategic_satellite_array":
      buildLargeStrategicSatelliteArray(dimension, origin, rotation, variantId);
      break;
    case "standalone_small_satellite_dish":
      buildStandaloneSmallSatelliteDish(dimension, origin, rotation, variantId);
      break;
    case "standalone_medium_satellite_dish":
      buildStandaloneMediumSatelliteDish(dimension, origin, rotation, variantId);
      break;
    case "standalone_large_satellite_dish":
      buildStandaloneLargeSatelliteDish(dimension, origin, rotation, variantId);
      break;
    case "logistics_hall":
      buildLogisticsHall(dimension, origin, rotation, variantId);
      break;
    case "fuel_tank_farm":
      buildFuelTankFarm(dimension, origin, rotation, variantId);
      break;
    case "runway_threshold":
      buildRunwayThreshold(dimension, origin, rotation, variantId);
      break;
    case "runway_straight":
      buildRunwayStraight(dimension, origin, rotation, variantId);
      break;
    case "taxiway_straight":
      buildTaxiwayStraight(dimension, origin, rotation, variantId);
      break;
    case "taxiway_corner":
      buildTaxiwayCorner(dimension, origin, rotation, variantId);
      break;
    case "aircraft_apron":
      buildAircraftApron(dimension, origin, rotation, variantId);
      break;
    case "helicopter_apron":
      buildHelicopterApron(dimension, origin, rotation, variantId);
      break;
    case "naval_headquarters":
      buildNavalHeadquarters(dimension, origin, rotation, variantId);
      break;
    case "naval_operations_centre":
      buildAirfieldOperationsBuilding(dimension, origin, rotation, variantId);
      break;
    case "harbour_control_tower":
      buildHarbourControlTower(dimension, origin, rotation, variantId);
      break;
    case "sailors_barracks":
      buildArmyBarracks(dimension, origin, rotation, variantId);
      break;
    case "dockyard_logistics_warehouse":
      buildLogisticsHall(dimension, origin, rotation, variantId);
      break;
    case "ship_maintenance_workshop":
      buildHeavyVehicleMaintenanceHangar(dimension, origin, rotation, variantId);
      break;
    case "pier_straight":
      buildPierStraight(dimension, origin, rotation, variantId);
      break;
    case "pier_corner":
      buildPierCorner(dimension, origin, rotation, variantId);
      break;
    case "pier_t_junction":
      buildPierTJunction(dimension, origin, rotation, variantId);
      break;
    case "heavy_ship_berth":
      buildHeavyShipBerth(dimension, origin, rotation, variantId);
      break;
    case "submarine_service_berth":
      buildSubmarineServiceBerth(dimension, origin, rotation, variantId);
      break;
    case "naval_fueling_pier":
      buildNavalFuelingPier(dimension, origin, rotation, variantId);
      break;
    case "dry_dock_side":
      buildDryDockSide(dimension, origin, rotation, variantId);
      break;
    case "dry_dock_gate_end":
      buildDryDockGateEnd(dimension, origin, rotation, variantId);
      break;
    case "nuclear_submarine_pen":
      buildNuclearSubmarinePen(dimension, origin, rotation, variantId);
      break;
    case "dockside_loading_crane":
      buildDocksideLoadingCrane(dimension, origin, rotation, variantId);
      break;
    case "naval_ammunition_bunker":
      buildArmyArmoury(dimension, origin, rotation, variantId);
      break;
    case "coastal_defence_bunker":
      buildCoastalDefenceBunker(dimension, origin, rotation, variantId);
      break;
    case "seawall_module":
      buildSeawallModule(dimension, origin, rotation, variantId);
      break;
    case "small_nuclear_bunker":
      buildSmallNuclearBunker(dimension, origin, rotation, variantId);
      break;
    case "medium_nuclear_bunker":
      buildMediumNuclearBunker(dimension, origin, rotation, variantId);
      break;
    case "large_nuclear_bunker":
      buildLargeNuclearBunker(dimension, origin, rotation, variantId);
      break;
    case "strategic_operations_bunker":
      buildStrategicOperationsBunker(dimension, origin, rotation, variantId);
      break;
    default:
      throw new Error(`No builder registered for ${structureId}`);
    }
}

world.afterEvents.itemUse.subscribe((event) => {
  if (event.itemStack?.typeId !== TABLET_ID) return;
  const player = event.source;
  system.run(() => {
    const busy = BUSY.get(player.id);
    if (busy) {
      tell(player, `§eConstruction job in progress — ${busy.label} ${Math.floor(busy.fraction * 100)}%. Please wait.`);
      return;
    }
    const task = ACTIVE_PREVIEWS.has(player.id) ? showPreviewControls(player) : showMainMenu(player);
    task.catch((error) => {
      console.warn(`[CAVIRA] Construction UI error: ${error}`);
      tell(player, "§cThe Construction Tablet encountered an error. Check the content log.");
    });
  });
});

installPreviewGuard((playerId) => {
  clearPreviewById(playerId);
  LAST_BUILDS.delete(playerId);
});
