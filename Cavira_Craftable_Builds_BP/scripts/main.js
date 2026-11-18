import { system, world } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import {
  CATEGORIES,
  getCategory,
  getStructure,
  getStructures
} from "./registry.js";
import {
  clearStartY,
  clearVolume,
  getCardinalRotation,
  getPlacementOrigin,
  restorePreview,
  showFootprintPreview,
  validatePlacement
} from "./placement.js";
import { constructStaged, restoreStaged, worldBounds } from "./construction_engine.js";
import { sectionPlan, sectionBounds } from "./sections.js";
import { accessPass, lightPass } from "./postprocess.js";
import { installPreviewGuard, registerPreview, unregisterPreview } from "./preview_guard.js";
import { ensureLoaded, lastLoadError, release, cleanupLeftovers } from "./chunk_loader.js";
import { VARIANTS, getVariant } from "./variants.js";
import { worldDir } from "./kit.js";
import { rotateXZ, toWorldLocation } from "./placement.js";
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
import { buildSuperHeavyAircraftHangar } from "./structures/super_hangar.js";
import {
  buildArmyBarracksV2,
  buildOfficersQuartersV2,
  buildArmyArmouryV2,
  buildArmyVehicleDepotV2,
  buildArmyMedicalFacilityV2,
  buildArmyCommandBunkerV2,
  buildAirfieldOperationsBuildingV2,
  buildAirTrafficControlTowerV2,
  buildNavalOperationsCentreV2,
  buildSailorsBarracksV2,
  buildDockyardLogisticsWarehouseV2,
  buildShipMaintenanceWorkshopV2,
  buildNavalAmmunitionBunkerV2,
  buildHarbourControlTowerV2,
  buildNavalHeadquartersV2,
  buildHQAdministrationWingV2,
  buildLogisticsHallV2
} from "./structures/facilities.js";
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
  buildRadarRadomeFacility
} from "./structures/airforce_expansion.js";
import { buildHelicopterApron } from "./structures/airforce_expansion.js";
import {
  buildRunwayStraightV2,
  buildRunwayTouchdownZone,
  buildRunwayThresholdV2,
  buildRunwayTaxiwayJunction,
  buildTaxiwayStraightV2,
  buildTaxiwayHoldingPoint,
  buildTaxiwayCornerV2,
  buildAircraftApronV2,
  normaliseDesignator
} from "./structures/airfield.js";
import { buildRunwayFullShort, buildRunwayFullMedium, buildRunwayFullLong } from "./structures/full_runways.js";
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
} from "./structures/bunkers.js";
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
} from "./structures/strategic_v2.js";

const TABLET_ID = "cavira_builds:construction_tablet";
const LAST_BUILDS = new Map();
const ACTIVE_PREVIEWS = new Map();
const BUSY = new Map();
const LAST_PIECE = new Map(); // playerId -> last snappable piece
const TRIALS = new Map(); // playerId -> session of a full-size "Try It" build awaiting Keep / Remove // playerId -> { label, fraction } while a staged job runs

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

function clearPreviewById(playerId, keepArea = false) {
  const session = ACTIVE_PREVIEWS.get(playerId);
  if (!session) return;
  removePreviewBlocks(playerId, session);
  ACTIVE_PREVIEWS.delete(playerId);
  if (!keepArea) release(session.dimension, playerId);
}

function clearActivePreview(player) {
  clearPreviewById(player.id);
}

/** Force-loads the session's build area (temporary ticking area) if needed. */
async function loadArea(player, dimension, origin, structure, rotation) {
  const plan = sectionPlan(structure);
  const bounds = plan ? sectionBounds(origin, structure.size, rotation, ...plan[0]) : worldBounds(origin, structure.size, rotation);
  const name = await ensureLoaded(dimension, bounds, player.id, () =>
    tell(player, "§7Large site — loading the whole build area, one moment…"));
  if (name === undefined) {
    tell(player, "§cCould not load the whole build area.§r Move a little closer to where it will stand and try again.");
    return false;
  }
  return true;
}

/** First local z the placement check samples: sectioned builds only need their near section loaded. */
function validateFromZ(structure) {
  const plan = sectionPlan(structure);
  return plan ? plan[0][0] : 0;
}

function drawPreview(player, session) {
  const plan = sectionPlan(session.structure);
  session.previewBlocks = showFootprintPreview(session.dimension, session.origin, session.structure.size, session.rotation, session.structure.foundationDepth ?? 1, session.structure.previewFloorY, Boolean(plan));
  if (plan && !session.sectionNoticeShown) {
    session.sectionNoticeShown = true;
    tell(player, `§b${session.structure.name}§r is ${session.structure.size.z} blocks long, so it is built in §e${plan.length} sections§r starting from your end. Only the nearby part of the green outline shows — the rest is in chunks that load as each section is built.`);
  }
  registerPreview(player.id, session.dimension, session.previewBlocks);
}

async function repositionPreview(player, session) {
  removePreviewBlocks(player.id, session);
  release(session.dimension, player.id);
  session.dimension = player.dimension;
  session.rotation = getCardinalRotation(player);
  session.origin = getPlacementOrigin(player, session.structure.size, session.rotation, session.structure.foundationDepth ?? 1, session.structure.previewFloorY);
  await loadArea(player, session.dimension, session.origin, session.structure, session.rotation);
  drawPreview(player, session);
}

async function rotatePreview(player, session, direction) {
  removePreviewBlocks(player.id, session);
  session.rotation = direction === "left" ? rotateLeft(session.rotation) : rotateRight(session.rotation);
  await loadArea(player, session.dimension, session.origin, session.structure, session.rotation);
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
  await performUndo(player, record);
}

/** Restores the terrain under `record` (no confirmation). Returns true on success. */
async function performUndo(player, record) {
  if (BUSY.has(player.id)) {
    tell(player, "§eWait for the current construction job to finish first.");
    return false;
  }
  TRIALS.delete(player.id);
  LAST_BUILDS.delete(player.id);
  LAST_PIECE.delete(player.id);
  BUSY.set(player.id, { label: "Restoring", fraction: 0 });
  const snapshots = record.snapshots ?? [record.snapshot];
  const snapDim = snapshots[0].dimension;
  try {
    let ok = true;
    // Newest section first, each with its own temporary loading area.
    for (let i = snapshots.length - 1; i >= 0; i--) {
      const snap = snapshots[i];
      const g = snap.compiled;
      await ensureLoaded(snapDim, { min: g.min, max: { x: g.min.x + g.W - 1, y: g.min.y + g.H - 1, z: g.min.z + g.D - 1 } }, player.id);
      const done = snapshots.length - 1 - i;
      ok = (await restoreStaged(snap, (label, fraction) => {
        const total = (done + fraction) / snapshots.length;
        BUSY.set(player.id, { label, fraction: total });
        try {
          player.onScreenDisplay.setActionBar(`§eRestoring terrain §7${Math.floor(total * 100)}%`);
        } catch {
          // ignore
        }
      })) && ok;
      release(snapDim, player.id);
    }
    tell(player, ok
      ? `§a${record.structureName} removed and the previous blocks restored.`
      : `§e${record.structureName} removed; some blocks were in unloaded chunks and could not be restored.`);
    return ok;
  } finally {
    BUSY.delete(player.id);
    release(snapDim, player.id);
  }
}

async function showMainMenu(player) {
  const form = new ActionFormData()
    .title("CAVIRA Construction Tablet")
    .body("Select an infrastructure category, or undo your most recent construction.");
  const resumable = LAST_BUILDS.get(player.id);
  const canResume = Boolean(resumable?.resume);
  if (canResume) form.button(`§e▶ Resume ${resumable.structureName}\n§7section ${resumable.snapshots.length + 1} of ${resumable.resume.plan.length}`);
  for (const category of CATEGORIES) form.button(`${category.icon} §f${category.name}`);
  form.button("§c↶ Undo Last Build");
  const response = await form.show(player);
  if (response.canceled || response.selection === undefined) return;
  let sel = response.selection;
  if (canResume) {
    if (sel === 0) return resumeSections(player);
    sel -= 1;
  }
  if (sel === CATEGORIES.length) return undoLastBuild(player);
  await showCategoryMenu(player, CATEGORIES[sel].id);
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
    .body("Select a structure (the picture shows the finished build). You will choose camouflage, then see a placement outline — or use §6Try It Full Size§r to see the real thing before you commit.");
  for (const structure of structures) form.button(`${structure.name}\n§7${structure.size.x}×${structure.size.z}×${structure.size.y}`, `textures/ui/cavira_builds/${structure.id}`);
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
  const variantId = VARIANTS[response.selection].id;
  let options = {};
  if (structure.options === "designator") {
    options = await askDesignator(player, 0, structureId.startsWith("runway_full_"));
    if (!options) return;
  }
  await beginFreeLookPreview(player, categoryId, structureId, variantId, options);
}

async function askDesignator(player, attempt = 0, both = false) {
  const label = both
    ? "Number for the end nearest you (1–99, optional L/C/R). The far end gets the reciprocal automatically — e.g. 09 → 27, 27L → 09R."
    : "Runway number (1–99) with optional L, C or R — e.g. 09, 27L, 38R";
  const form = new ModalFormData()
    .title("Runway Designator")
    .textField(label, "38R", { defaultValue: "09" });
  const response = await form.show(player);
  if (response.canceled) return undefined;
  const raw = response.formValues?.[0];
  const des = normaliseDesignator(raw);
  if (!des) {
    tell(player, `§c"${raw}" is not a valid designator.§r Use a number from 1 to 99, optionally followed by L, C or R.`);
    return attempt < 2 ? askDesignator(player, attempt + 1, both) : undefined;
  }
  return { designator: `${des.number}${des.side}` };
}

async function beginFreeLookPreview(player, categoryId, structureId, variantId, options = {}) {
  clearActivePreview(player);
  const structure = getStructure(categoryId, structureId);
  const variant = getVariant(variantId);
  if (!structure) return;
  const rotation = getCardinalRotation(player);
  const origin = getPlacementOrigin(player, structure.size, rotation, structure.foundationDepth ?? 1, structure.previewFloorY);
  if (!(await loadArea(player, player.dimension, origin, structure, rotation))) return;
  const validation = validatePlacement(player.dimension, origin, structure.size, rotation, validateFromZ(structure));
  if (!validation.ok) {
    tell(player, `§cCannot preview:§r ${validation.reason}`);
    return;
  }
  const session = { categoryId, structureId, variantId, structure, variant, origin, rotation, dimension: player.dimension, previewBlocks: [], options };
  drawPreview(player, session);
  ACTIVE_PREVIEWS.set(player.id, session);
  tell(player, `§aPreview active: ${structure.name} (${variant.name}). §rFly or walk around freely to inspect it. Use the Construction Tablet again for placement controls.`);
}

function snapTarget(player, session, connectorName) {
  return computeSnap(LAST_PIECE.get(player.id), session.structure, connectorName);
}

/** Pure snap maths: where `structure` must go so its `in` connector meets `last`'s connector. */
export function computeSnap(last, structure, connectorName) {
  const mine = structure.snap;
  if (!last || !mine) return undefined;
  const from = last.structure.snap?.[connectorName];
  if (!from) return undefined;
  // world cell just beyond the previous piece's connector, and the direction it faces
  const p = toWorldLocation(last.origin, { x: from.x, y: 0, z: from.z }, last.structure.size, last.rotation);
  const face = worldDir(from.dir, last.rotation);
  const step = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }[face];
  const target = { x: p.x + step[0], z: p.z + step[1] };
  const back = { north: "south", south: "north", east: "west", west: "east" }[face];
  for (const rot of ["south", "west", "north", "east"]) {
    if (worldDir(mine.in.dir, rot) !== back) continue;
    const off = rotateXZ(mine.in.x, mine.in.z, structure.size.x, structure.size.z, rot);
    const surfaceLast = last.structure.previewFloorY ?? Math.max(0, (last.structure.foundationDepth ?? 1) - 1);
    const surfaceMine = structure.previewFloorY ?? Math.max(0, (structure.foundationDepth ?? 1) - 1);
    return { rotation: rot, origin: { x: target.x - off.x, y: last.origin.y + surfaceLast - surfaceMine, z: target.z - off.z } };
  }
  return undefined;
}

async function applySnap(player, session, connectorName) {
  const snap = snapTarget(player, session, connectorName);
  if (!snap) {
    tell(player, "§eNothing to snap to — build a runway, taxiway or apron piece first.");
    return;
  }
  removePreviewBlocks(player.id, session);
  release(session.dimension, player.id);
  session.rotation = snap.rotation;
  session.origin = snap.origin;
  await loadArea(player, session.dimension, session.origin, session.structure, session.rotation);
  drawPreview(player, session);
  tell(player, "§aPreview snapped onto the end of your last piece. Inspect it, then use the tablet to construct.");
}

async function showTrialMenu(player) {
  const session = TRIALS.get(player.id);
  const record = LAST_BUILDS.get(player.id);
  if (!session || !record) {
    TRIALS.delete(player.id);
    return showMainMenu(player);
  }
  const form = new ActionFormData()
    .title(`Full-Size Preview: ${session.structure.name}`)
    .body(`This is the real ${session.structure.name} in ${session.variant.name}. Keep it, remove it, or remove it and choose a new position.`)
    .button("§aKeep It")
    .button("§cRemove It")
    .button("§bRemove & Move It")
    .button("§8Decide Later");
  const response = await form.show(player);
  if (response.canceled || response.selection === undefined || response.selection === 3) return;
  if (response.selection === 0) {
    TRIALS.delete(player.id);
    tell(player, `§a${session.structure.name} kept.§7 You can still undo it from the main menu.`);
    return;
  }
  const removed = await performUndo(player, record);
  if (removed && response.selection === 2) {
    // back into placement preview at the same spot with the same settings
    const again = { ...session, previewBlocks: [] };
    ACTIVE_PREVIEWS.set(player.id, again);
    if (await loadArea(player, again.dimension, again.origin, again.structure, again.rotation)) drawPreview(player, again);
    tell(player, "§bPreview restored at the same spot — reposition, rotate or snap it, then construct.");
  }
}

async function showPreviewControls(player) {
  const session = ACTIVE_PREVIEWS.get(player.id);
  if (!session) return showMainMenu(player);
  const last = LAST_PIECE.get(player.id);
  const canSnap = !!(session.structure.snap && last);
  const canBranch = !!(canSnap && last.structure.snap?.branch);
  const designator = session.options?.designator ? `\nRunway: ${session.options.designator}` : "";
  const form = new ActionFormData()
    .title(`Preview: ${session.structure.name}`)
    .body(`Finish: ${session.variant.name}${designator}\nFacing: ${session.rotation.toUpperCase()}\nSize: ${session.structure.size.x}×${session.structure.size.z}×${session.structure.size.y}\nFoundation depth: ${session.structure.foundationDepth ?? 1} blocks\n\nGreen marks the outer volume. Cyan cross-hatching marks the exact finished walkable floor/deck height. Yellow marks the entrance; orange marks the below-ground foundation.`);
  const actions = [];
  const add = (label, fn) => { form.button(label); actions.push(fn); };
  add("§aConstruct Here", () => constructPreview(player, session));
  add("§6Try It Full Size\n§7Build it for real, then keep or remove", () => constructPreview(player, session, true));
  if (canSnap) add(`§dSnap to End of ${last.structure.name}`, () => applySnap(player, session, "out"));
  if (canBranch) add(`§dSnap to Taxiway Exit of ${last.structure.name}`, () => applySnap(player, session, "branch"));
  add("§bReposition In Front Of Me", async () => {
    await repositionPreview(player, session);
    tell(player, "§aPreview repositioned in front of you. Inspect it again, then use the tablet when ready.");
  });
  add("§e↶ Rotate Left", async () => {
    await rotatePreview(player, session, "left");
    tell(player, "§aPreview rotated left. Inspect it again, then use the tablet when ready.");
  });
  add("§e↷ Rotate Right", async () => {
    await rotatePreview(player, session, "right");
    tell(player, "§aPreview rotated right. Inspect it again, then use the tablet when ready.");
  });
  add("§cCancel Preview", () => {
    clearActivePreview(player);
    tell(player, "§7Placement preview cancelled and the original blocks restored.");
  });
  const response = await form.show(player);
  if (response.canceled || response.selection === undefined) return;
  return actions[response.selection]?.();
}

/**
 * Builds a very large structure section by section, each with its own single
 * temporary ticking area, nearest section first.
 */
export async function constructSections(player, dimension, structure, origin, rotation, plan, buildFn, onProgress, start = 0, done = []) {
  const snapshots = [...done];
  const reports = {};
  let changed = 0;
  for (let i = start; i < plan.length; i++) {
    const [z1, z2] = plan[i];
    const bounds = sectionBounds(origin, structure.size, rotation, z1, z2);
    const name = await ensureLoaded(dimension, bounds, player.id);
    if (name === undefined) {
      return { ok: false, snapshots, reason: `section ${i + 1} could not be loaded (${lastLoadError() || "unknown error"}). If /tickingarea list shows 10 areas, remove some and try again.` };
    }
    const result = await constructStaged(dimension, buildFn([z1, z2]),
      (label, f) => onProgress(`${label} §7(section ${i + 1}/${plan.length})§b`, (i + f) / plan.length),
      bounds, postPassesFor(structure), true);
    release(dimension, player.id);
    if (!result.ok) return { ok: false, snapshots, reason: result.reason };
    snapshots.push(result.snapshot);
    changed += result.changed;
    for (const [k, v] of Object.entries(result.reports ?? {})) {
      reports[k] ??= {};
      for (const [field, n] of Object.entries(v ?? {})) if (typeof n === "number") reports[k][field] = (reports[k][field] ?? 0) + n;
    }
  }
  return { ok: true, snapshots, changed, reports };
}

/** Continues a sectioned build that stopped part-way (e.g. a section took too long to load). */
async function resumeSections(player) {
  const record = LAST_BUILDS.get(player.id);
  const job = record?.resume;
  if (!job) return;
  if (BUSY.has(player.id)) {
    tell(player, "§eWait for the current construction job to finish first.");
    return;
  }
  const { dimension, structure, origin, rotation, plan, buildFn, variant } = job;
  BUSY.set(player.id, { label: "Resuming", fraction: record.snapshots.length / plan.length });
  tell(player, `§7Resuming ${structure.name} from section ${record.snapshots.length + 1} of ${plan.length}…`);
  let lastShown = -1;
  const onProgress = (label, fraction) => {
    BUSY.set(player.id, { label, fraction });
    const pct = Math.floor(fraction * 100);
    if (pct === lastShown) return;
    lastShown = pct;
    try {
      player.onScreenDisplay.setActionBar(`§b${label}: §f${structure.name} §7${pct}%`);
    } catch {
      // ignore
    }
  };
  try {
    const result = await constructSections(player, dimension, structure, origin, rotation, plan, buildFn, onProgress, record.snapshots.length, record.snapshots);
    if (!result.ok) {
      LAST_BUILDS.set(player.id, { ...record, snapshots: result.snapshots });
      tell(player, `§eConstruction paused after ${result.snapshots.length} of ${plan.length} sections:§r ${result.reason} §7Choose §e▶ Resume§7 again, or Undo.`);
      return;
    }
    LAST_BUILDS.set(player.id, { snapshots: result.snapshots, structureName: structure.name, variantName: variant.name });
    if (structure.snap) LAST_PIECE.set(player.id, { structure, origin, rotation, dimensionId: dimension.id });
    tell(player, `§a${structure.name} completed (${plan.length} sections).`);
  } catch (error) {
    console.warn(`[CAVIRA] Resume error: ${error}`);
    tell(player, "§cResume failed. Check the content log.");
  } finally {
    BUSY.delete(player.id);
    release(dimension, player.id);
  }
}

async function constructPreview(player, session, trial = false) {
  const dimension = session.dimension;
  const validation = validatePlacement(dimension, session.origin, session.structure.size, session.rotation, validateFromZ(session.structure));
  if (!validation.ok) {
    tell(player, `§cCannot build:§r ${validation.reason}`);
    return;
  }
  // Remove the preview markers first so the snapshot records the real terrain.
  // The temporary chunk-loading area stays until construction finishes.
  clearPreviewById(player.id, true);
  if (!(await loadArea(player, dimension, session.origin, session.structure, session.rotation))) return;
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
    const buildFn = (zRange) => (recorder) => {
      if (structure.placementMode !== "overlay" && structure.placementMode !== "excavation") {
        clearVolume(recorder, origin, structure.size, rotation, clearStartY(structure));
      }
      runBuilder(structure.id, recorder, origin, rotation, variantId, { ...(session.options ?? {}), zRange });
    };
    const plan = sectionPlan(structure);
    const result = plan
      ? await constructSections(player, dimension, structure, origin, rotation, plan, buildFn, onProgress)
      : await constructStaged(dimension, buildFn(undefined), onProgress, worldBounds(origin, structure.size, rotation), postPassesFor(structure));
    const snapshots = result.snapshots ?? (result.snapshot ? [result.snapshot] : []);
    if (!result.ok) {
      if (snapshots.length) {
        LAST_BUILDS.set(player.id, {
          snapshots, structureName: structure.name, variantName: variant.name,
          resume: { dimension, structure, origin, rotation, plan, buildFn, variant }
        });
        tell(player, `§eConstruction paused after ${snapshots.length} of ${plan.length} sections:§r ${result.reason} §7Open the tablet and choose §e▶ Resume§7 to carry on, or Undo to remove the part that was built.`);
      } else {
        tell(player, `§cConstruction cancelled:§r ${result.reason}`);
      }
      return;
    }
    LAST_BUILDS.set(player.id, { snapshots, structureName: structure.name, variantName: variant.name });
    if (structure.snap) LAST_PIECE.set(player.id, { structure, origin, rotation, dimensionId: dimension.id });
    const r = result.reports ?? {};
    const extras = [];
    if (r.access?.fixed) extras.push(`${r.access.fixed} access route${r.access.fixed === 1 ? "" : "s"} opened`);
    if (r.light?.added) extras.push(`${r.light.added} lights added`);
    if (trial) {
      TRIALS.set(player.id, session);
      tell(player, `§6Full-size preview of ${structure.name} placed.§r Walk around and inside it, then use the tablet to §aKeep It§r, §cRemove It§r or §bRemove & Move It§r.`);
    } else {
      tell(player, `§a${structure.name} deployed in ${variant.name}. §7(${result.changed} blocks placed${extras.length ? "; " + extras.join(", ") : ""} — use the tablet to undo it if needed.)`);
    }
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
    release(dimension, player.id);
  }
}

/** Access + lighting passes for a structure (bunkers keep their verified shafts; overlays are skipped). */
export function postPassesFor(structure) {
  if (structure.placementMode === "overlay") return [];
  if (structure.placementMode === "excavation") return [["light", lightPass]];
  return [["access", accessPass], ["light", lightPass]];
}

export function runBuilder(structureId, dimension, origin, rotation, variantId, options = {}) {
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
      buildHQAdministrationWingV2(dimension, origin, rotation, variantId);
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
      buildArmyBarracksV2(dimension, origin, rotation, variantId);
      break;
    case "army_armoury":
      buildArmyArmouryV2(dimension, origin, rotation, variantId);
      break;
    case "army_vehicle_depot":
      buildArmyVehicleDepotV2(dimension, origin, rotation, variantId);
      break;
    case "army_medical_facility":
      buildArmyMedicalFacilityV2(dimension, origin, rotation, variantId);
      break;
    case "army_command_bunker":
      buildArmyCommandBunkerV2(dimension, origin, rotation, variantId);
      break;
    case "army_defensive_checkpoint":
      buildArmyDefensiveCheckpoint(dimension, origin, rotation, variantId);
      break;
    case "army_perimeter_wall":
      buildArmyPerimeterWall(dimension, origin, rotation, variantId);
      break;
    case "officers_quarters":
      buildOfficersQuartersV2(dimension, origin, rotation, variantId);
      break;
    case "heavy_vehicle_maintenance_hangar":
      buildHeavyVehicleMaintenanceHangar(dimension, origin, rotation, variantId);
      break;
    case "super_heavy_aircraft_hangar":
      buildSuperHeavyAircraftHangar(dimension, origin, rotation, variantId);
      break;
    case "watch_tower":
      buildWatchTower(dimension, origin, rotation, variantId);
      break;
    case "air_traffic_control_tower":
      buildAirTrafficControlTowerV2(dimension, origin, rotation, variantId);
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
      buildAirfieldOperationsBuildingV2(dimension, origin, rotation, variantId);
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
      buildLogisticsHallV2(dimension, origin, rotation, variantId);
      break;
    case "fuel_tank_farm":
      buildFuelTankFarm(dimension, origin, rotation, variantId);
      break;
    case "runway_full_short":
      buildRunwayFullShort(dimension, origin, rotation, variantId, options);
      break;
    case "runway_full_medium":
      buildRunwayFullMedium(dimension, origin, rotation, variantId, options);
      break;
    case "runway_full_long":
      buildRunwayFullLong(dimension, origin, rotation, variantId, options);
      break;
    case "runway_threshold":
      buildRunwayThresholdV2(dimension, origin, rotation, variantId, options);
      break;
    case "runway_straight":
      buildRunwayStraightV2(dimension, origin, rotation, variantId);
      break;
    case "runway_touchdown_zone":
      buildRunwayTouchdownZone(dimension, origin, rotation, variantId);
      break;
    case "runway_taxiway_junction":
      buildRunwayTaxiwayJunction(dimension, origin, rotation, variantId);
      break;
    case "taxiway_holding_point":
      buildTaxiwayHoldingPoint(dimension, origin, rotation, variantId);
      break;
    case "taxiway_straight":
      buildTaxiwayStraightV2(dimension, origin, rotation, variantId);
      break;
    case "taxiway_corner":
      buildTaxiwayCornerV2(dimension, origin, rotation, variantId);
      break;
    case "aircraft_apron":
      buildAircraftApronV2(dimension, origin, rotation, variantId);
      break;
    case "helicopter_apron":
      buildHelicopterApron(dimension, origin, rotation, variantId);
      break;
    case "naval_headquarters":
      buildNavalHeadquartersV2(dimension, origin, rotation, variantId);
      break;
    case "naval_operations_centre":
      buildNavalOperationsCentreV2(dimension, origin, rotation, variantId);
      break;
    case "harbour_control_tower":
      buildHarbourControlTowerV2(dimension, origin, rotation, variantId);
      break;
    case "sailors_barracks":
      buildSailorsBarracksV2(dimension, origin, rotation, variantId);
      break;
    case "dockyard_logistics_warehouse":
      buildDockyardLogisticsWarehouseV2(dimension, origin, rotation, variantId);
      break;
    case "ship_maintenance_workshop":
      buildShipMaintenanceWorkshopV2(dimension, origin, rotation, variantId);
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
      buildNavalAmmunitionBunkerV2(dimension, origin, rotation, variantId);
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
    const task = TRIALS.has(player.id) && !ACTIVE_PREVIEWS.has(player.id)
      ? showTrialMenu(player)
      : ACTIVE_PREVIEWS.has(player.id) ? showPreviewControls(player) : showMainMenu(player);
    task.catch((error) => {
      console.warn(`[CAVIRA] Construction UI error: ${error}`);
      tell(player, "§cThe Construction Tablet encountered an error. Check the content log.");
    });
  });
});

world.afterEvents.worldLoad.subscribe(() => cleanupLeftovers());

installPreviewGuard((playerId) => {
  TRIALS.delete(playerId);
  clearPreviewById(playerId);
  LAST_BUILDS.delete(playerId);
});
