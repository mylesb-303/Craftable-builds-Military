import { FACILITY_SIZES } from "./structures/facilities.js";
import { AIRFIELD_SIZES, AIRFIELD_SNAP } from "./structures/airfield.js";
import { FULL_RUNWAY_SIZES, FULL_RUNWAY_SNAP } from "./structures/full_runways.js";
import { CORE_SIZES } from "./structures/core_v2.js";
import { ARMY_SIZES, HEAVY_HANGAR_ENVELOPE } from "./structures/army_v2.js";
import { AIR_SIZES, AIR_ENVELOPES } from "./structures/air_v2.js";
import { NAVY_SIZES } from "./structures/navy_v2.js";
import { SUPER_HANGAR_SIZE, SUPER_HANGAR_ENVELOPE } from "./structures/super_hangar.js";
import { STRATEGIC_SIZES } from "./structures/strategic_v2.js";
import { BUNKER_SPECS, bunkerSize } from "./structures/bunkers.js";

export const CATEGORIES = [
  { id: "core", name: "Core Base & HQ", icon: "§7■" },
  { id: "army", name: "Army", icon: "§2★" },
  { id: "air_force", name: "Air Force", icon: "§b✈" },
  { id: "airfield", name: "Runways & Taxiways", icon: "§e═" },
  { id: "navy", name: "Navy", icon: "§9⚓" },
  { id: "bunkers", name: "Bunkers", icon: "§5⬛" },
  { id: "strategic", name: "Strategic / Joint", icon: "§6◆" },
  { id: "logistics", name: "Logistics & Support", icon: "§e▣" },
  { id: "modular", name: "Modular Base", icon: "§8▦" }
];

export const STRUCTURES = {
  airfield: [
    {
      id: "runway_full_short", name: "Full Runway — Fighter (Short)",
      description: "Complete 289-block fighter runway (31 m paved): both thresholds with reciprocal numbers, blast pads, lit centreline, parallel taxiway, entry holding points, rapid exits, holding bays and an apron link. For F-22, F-35, F/A-18, Typhoon, F-15E, A-10, MQ-9 and helicopters.",
      size: FULL_RUNWAY_SIZES.runway_full_short, foundationDepth: 2, snap: FULL_RUNWAY_SNAP.runway_full_short, options: "designator"
    },
    {
      id: "runway_full_medium", name: "Full Runway — Tactical & Transport (Medium)",
      description: "Complete 449-block runway (45 m paved, same cross-section as the modular pieces) with parallel taxiway, holding points, rapid exits, holding bays and apron link. Adds KC-135, C-130/AC-130, A400M and B-1B.",
      size: FULL_RUNWAY_SIZES.runway_full_medium, foundationDepth: 2, snap: FULL_RUNWAY_SNAP.runway_full_medium, options: "designator"
    },
    {
      id: "runway_full_long", name: "Full Runway — Strategic Heavy (Long)",
      description: "Complete 641-block heavy runway (61 m paved + 7 m shoulders) for every aircraft including the C-5M, B-52H, C-17 and B-2, with wingtip-safe taxiway separation, holding points, rapid exits, large holding bays and apron link.",
      size: FULL_RUNWAY_SIZES.runway_full_long, foundationDepth: 2, snap: FULL_RUNWAY_SNAP.runway_full_long, options: "designator"
    },
    {
      id: "runway_threshold", name: "Runway Threshold & Designator",
      description: "Blast pad with yellow chevrons and approach lights, green threshold bar, piano keys and your runway number (e.g. 38R).",
      size: AIRFIELD_SIZES.runway_threshold, foundationDepth: 2, snap: AIRFIELD_SNAP.runway_threshold, options: "designator"
    },
    {
      id: "runway_touchdown_zone", name: "Runway Touchdown Zone",
      description: "64-block runway section with touchdown bars, aiming-point blocks, centreline lights and edge lamps.",
      size: AIRFIELD_SIZES.runway_touchdown_zone, foundationDepth: 2, snap: AIRFIELD_SNAP.runway_touchdown_zone
    },
    {
      id: "runway_straight", name: "Runway Straight",
      description: "64-block runway section: speckled asphalt, white edge lines, shoulders with edge lamps, lit centreline.",
      size: AIRFIELD_SIZES.runway_straight, foundationDepth: 2, snap: AIRFIELD_SNAP.runway_straight
    },
    {
      id: "runway_taxiway_junction", name: "Runway / Taxiway Junction",
      description: "Runway section with a taxiway exit, widened fillet, curved yellow lead-off lines both ways and a holding point.",
      size: AIRFIELD_SIZES.runway_taxiway_junction, foundationDepth: 2, snap: AIRFIELD_SNAP.runway_taxiway_junction
    },
    {
      id: "taxiway_straight", name: "Taxiway Straight",
      description: "32-block taxiway with yellow centreline lights, white edges and shoulders.",
      size: AIRFIELD_SIZES.taxiway_straight, foundationDepth: 2, snap: AIRFIELD_SNAP.taxiway_straight
    },
    {
      id: "taxiway_holding_point", name: "Taxiway Holding Point",
      description: "Taxiway section with runway-holding markings, a red stop bar and a sign board.",
      size: AIRFIELD_SIZES.taxiway_holding_point, foundationDepth: 2, snap: AIRFIELD_SNAP.taxiway_holding_point
    },
    {
      id: "taxiway_corner", name: "Taxiway Curve (90°)",
      description: "Smooth 90° taxiway curve with lit yellow centreline. Snaps onto straights; place it facing the other way for a left turn.",
      size: AIRFIELD_SIZES.taxiway_corner, foundationDepth: 2, snap: AIRFIELD_SNAP.taxiway_corner
    },
    {
      id: "aircraft_apron", name: "Aircraft Parking Apron",
      description: "Three-stand apron with lit taxilane, curved lead-in lines, stop bars, safety boxes and floodlights.",
      size: AIRFIELD_SIZES.aircraft_apron, foundationDepth: 2, snap: AIRFIELD_SNAP.aircraft_apron
    },
    {
      id: "helicopter_apron", name: "Helicopter Apron (Heliport)",
      description: "Heliport with a 23 x 23 touchdown pad and H, FATO markings, aiming circle, green perimeter lights, windsock and refuelling point.",
      size: AIR_SIZES.helicopter_apron, foundationDepth: 2
    }
  ],
  core: [
    {
      id: "guard_post", name: "Guard Post",
      description: "Hardened sentry booth: all-round ballistic glazing, transaction window, console desk, roof canopy with lights set into the soffit and CCTV.",
      size: CORE_SIZES.guard_post, foundationDepth: 2
    },
    {
      id: "main_security_gate", name: "Main Security Gate",
      description: "Two-lane entry control point: gatehouse island with ID windows on both lanes, lit canopy, wedge barriers, speed tables, rooftop overwatch and pedestrian turnstile.",
      size: CORE_SIZES.main_security_gate, foundationDepth: 2
    },
    {
      id: "base_headquarters", name: "Base Headquarters",
      description: "Two-storey headquarters with a columned portico, lobby, offices, conference room and command suite, internal stairs and three flagpoles.",
      size: CORE_SIZES.base_headquarters, foundationDepth: 2
    },
    {
      id: "hq_administration_wing", name: "HQ Administration Wing",
      description: "Formal two-storey office wing with colonnaded frontage, shared offices and monitoring stations.",
      size: FACILITY_SIZES.hq_administration_wing, foundationDepth: 2
    },
    {
      id: "hq_command_rotunda", name: "HQ Command Rotunda",
      description: "Domed circular command centre: situation room with a lit plot table and ring of consoles, screen wall, and ring offices behind tall windows.",
      size: CORE_SIZES.hq_command_rotunda, foundationDepth: 2
    },
    {
      id: "ceremonial_fountain_plaza", name: "Ceremonial Fountain Plaza",
      description: "Parade plaza with a tiered working fountain, flag circle, benches, lit bollards, hedged gardens and a memorial plinth.",
      size: CORE_SIZES.ceremonial_fountain_plaza, foundationDepth: 2
    }
  ],
  army: [
    {
      id: "army_barracks", name: "Army Barracks",
      description: "Reference-base 32-person accommodation hall with cyan privacy bays, central aisle and service rooms.",
      size: FACILITY_SIZES.army_barracks, foundationDepth: 2
    },
    {
      id: "officers_quarters", name: "Officers' Quarters",
      description: "Eight private furnished rooms arranged around a central corridor, based on the smaller reference accommodation.",
      size: FACILITY_SIZES.officers_quarters, foundationDepth: 2
    },
    {
      id: "army_armoury", name: "Army Armoury",
      description: "Reinforced armoury with secure issue counter, racks, ammunition stores, maintenance area and vault.",
      size: FACILITY_SIZES.army_armoury, foundationDepth: 2
    },
    {
      id: "army_vehicle_depot", name: "Multi-Bay Vehicle Depot",
      description: "Reference-style open-front three-bay depot with servicing pits, tools, stores and marked lanes.",
      size: FACILITY_SIZES.army_vehicle_depot, foundationDepth: 2
    },
    {
      id: "heavy_vehicle_maintenance_hangar", name: "Heavy Vehicle Maintenance Hangar",
      description: "Three drive-through bays (clear 7 x 7 lanes) with two inspection pits, a wash bay, overhead gantry crane, tool benches and parts racks.",
      size: ARMY_SIZES.heavy_vehicle_maintenance_hangar, foundationDepth: 2, envelope: HEAVY_HANGAR_ENVELOPE
    },
    {
      id: "army_medical_facility", name: "Army Medical Facility",
      description: "Furnished field medical centre with reception, ward, examination rooms, pharmacy and staff station.",
      size: FACILITY_SIZES.army_medical_facility, foundationDepth: 2
    },
    {
      id: "army_command_bunker", name: "Army Command Bunker",
      description: "Low-profile reinforced bunker with operations room, briefing space, communications and secure records.",
      size: FACILITY_SIZES.army_command_bunker, foundationDepth: 2
    },
    {
      id: "army_defensive_checkpoint", name: "Defensive Checkpoint",
      description: "Road checkpoint with a serpentine chicane, covered search bay, boom barrier, two sandbag sangars with bunks and radios, and wire obstacles.",
      size: ARMY_SIZES.army_defensive_checkpoint, foundationDepth: 2
    },
    {
      id: "army_perimeter_wall", name: "Perimeter Wall Module",
      description: "Modular precast T-wall section with a patrol step, buttress fins, razor wire, floodlights built into the coping and CCTV.",
      size: ARMY_SIZES.army_perimeter_wall, foundationDepth: 2
    }
  ],
  air_force: [
    {
      id: "super_heavy_aircraft_hangar", name: "Super-Heavy Aircraft Hangar",
      description: "81 × 101 × 37 strategic bomber hangar with arched roof, 65-wide door, two-storey maintenance bays, raised control room and apron. Fits a B-52 or B-2.",
      size: SUPER_HANGAR_SIZE, foundationDepth: 2, envelope: SUPER_HANGAR_ENVELOPE
    },
    {
      id: "large_aircraft_hangar", name: "Heavy Aircraft Hangar",
      description: "Clear-span transport hangar: 45-wide x 16-tall door for C-130J, KC-135 and A400M, rear workshops and a glazed mezzanine. Nothing stands in the aircraft area.",
      size: AIR_SIZES.large_aircraft_hangar, foundationDepth: 2, envelope: AIR_ENVELOPES.large_aircraft_hangar
    },
    {
      id: "hardened_fighter_shelter", name: "Hardened Fighter Shelter",
      description: "TAB-VEE style hardened shelter: steel-lined concrete arch for one fighter (up to A-10 span), lights built into the liner, rear exhaust port.",
      size: AIR_SIZES.hardened_fighter_shelter, foundationDepth: 2, envelope: AIR_ENVELOPES.hardened_fighter_shelter
    },
    {
      id: "fighter_shelter_row", name: "Three-Shelter Fighter Row",
      description: "Two hardened fighter shelters with an earth-covered ready room (briefing room and bunks) between them.",
      size: AIR_SIZES.fighter_shelter_row, foundationDepth: 2, envelope: AIR_ENVELOPES.fighter_shelter_row
    },
    {
      id: "helicopter_hangar", name: "Helicopter Hangar",
      description: "Two-helicopter hangar with a 37-wide clear door (Chinook, Apache, Osprey), rear workshop/avionics/crew rooms and a mezzanine store.",
      size: AIR_SIZES.helicopter_hangar, foundationDepth: 2, envelope: AIR_ENVELOPES.helicopter_hangar
    },
    {
      id: "airfield_operations_building", name: "Airfield Operations Building",
      description: "Flight-line dispatch, briefing and monitoring facility with server and console spaces.",
      size: FACILITY_SIZES.airfield_operations_building, foundationDepth: 2
    },
    {
      id: "air_traffic_control_tower", name: "Air Traffic Control Tower",
      description: "Compact furnished ATC tower with access core, operations cab, glazing and roof equipment.",
      size: FACILITY_SIZES.air_traffic_control_tower, foundationDepth: 2
    },
    {
      id: "watch_tower", name: "Airbase Watch Tower",
      description: "Airfield observation tower: spiral stair inside a concrete shaft to a glazed 360-degree cab with consoles, balcony, beacon and a guard-room base.",
      size: AIR_SIZES.watch_tower, foundationDepth: 2
    }
  ],
  navy: [
    {
      id: "naval_headquarters", name: "Naval Headquarters",
      description: "Two-zone fleet headquarters with command floor, administration offices and operational consoles.",
      size: FACILITY_SIZES.naval_headquarters, foundationDepth: 2
    },
    {
      id: "naval_operations_centre", name: "Naval Operations Centre",
      description: "Secure maritime operations, briefing and monitoring facility based on the proven airfield operations layout.",
      size: FACILITY_SIZES.naval_operations_centre, foundationDepth: 2
    },
    {
      id: "harbour_control_tower", name: "Harbour Control Tower",
      description: "Tall glazed harbour-control cab with access core, navigation consoles and roof equipment.",
      size: FACILITY_SIZES.harbour_control_tower, foundationDepth: 2
    },
    {
      id: "sailors_barracks", name: "Sailors' Barracks",
      description: "Thirty-two-person naval accommodation hall with privacy bays, service rooms and central aisle.",
      size: FACILITY_SIZES.sailors_barracks, foundationDepth: 2
    },
    {
      id: "dockyard_logistics_warehouse", name: "Dockyard Logistics Warehouse",
      description: "High-capacity dockside warehouse with secure racks, handling lane and inventory control.",
      size: FACILITY_SIZES.dockyard_logistics_warehouse, foundationDepth: 2
    },
    {
      id: "ship_maintenance_workshop", name: "Ship Maintenance Workshop",
      description: "Tall multi-bay naval engineering hall with service pits, tools and overhead crane.",
      size: FACILITY_SIZES.ship_maintenance_workshop, foundationDepth: 2
    },
    {
      id: "pier_straight", name: "Pier Straight",
      description: "Pile-supported pier with timber fender piles and rubber fenders, bollards and bitts, flush utility trench, shore-power pedestals, crane rails and deck lights.",
      size: NAVY_SIZES.pier_straight, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "pier_corner", name: "Pier Corner",
      description: "Pier corner with fendered faces, bollards, utility trenches and flush deck lights.",
      size: NAVY_SIZES.pier_corner, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "pier_t_junction", name: "Pier T-Junction",
      description: "Pier T-junction with fendered faces, bollards, cross utility trench and flush deck lights.",
      size: NAVY_SIZES.pier_t_junction, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "heavy_ship_berth", name: "Heavy Ship Berth",
      description: "Twin-wharf berth with fender piles, log camels, double bitts, utility trenches, a brow tower with gangway and head-pier crane rail.",
      size: NAVY_SIZES.heavy_ship_berth, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "submarine_service_berth", name: "Submarine Service Berth",
      description: "19-wide submarine berth with low camels, shore-power trays, security boom with buoy lights and a glazed guard booth.",
      size: NAVY_SIZES.submarine_service_berth, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "naval_fueling_pier", name: "Naval Fueling Pier",
      description: "Fuelling pier with a central pipe rack, two manifold platforms per side with loading arms and hose reels, fire monitors and spill kit.",
      size: NAVY_SIZES.naval_fueling_pier, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "dry_dock_side", name: "Dry-Dock Side Module",
      description: "Graving-dock wall with stepped altars, keel blocks, crane rail, bollards, safety rail, ladders through the altars and lights in each riser.",
      size: NAVY_SIZES.dry_dock_side, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "dry_dock_gate_end", name: "Dry-Dock Gate & End",
      description: "Caisson gate across the dock entrance with a railed walkway, abutments, bollards and a pump house.",
      size: NAVY_SIZES.dry_dock_gate_end, foundationDepth: 3, previewFloorY: 8, placementMode: "overlay"
    },
    {
      id: "nuclear_submarine_pen", name: "Nuclear Submarine Pen",
      description: "Reinforced pen over a 23-wide channel: thick walls, burster-slab roof with built-in lights, fendered galleries, travelling crane, workshops and blast-door pockets.",
      size: NAVY_SIZES.nuclear_submarine_pen, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "dockside_loading_crane", name: "Dockside Loading Crane",
      description: "Rail-mounted portal crane: braced legs on bogies, slewing platform, glazed cab, machinery house, jib with hoist and hook, counterweight and ladder.",
      size: NAVY_SIZES.dockside_loading_crane, foundationDepth: 2
    },
    {
      id: "naval_ammunition_bunker", name: "Naval Ammunition Bunker",
      description: "Reinforced naval magazine with secure issue point, storage racks, maintenance area and vault.",
      size: FACILITY_SIZES.naval_ammunition_bunker, foundationDepth: 2
    },
    {
      id: "coastal_defence_bunker", name: "Coastal Defence Bunker",
      description: "Earth-covered casemate with two gun embrasures, observation slit, magazine, crew room and a baffled rear entrance.",
      size: NAVY_SIZES.coastal_defence_bunker, foundationDepth: 2
    },
    {
      id: "seawall_module", name: "Seawall Module",
      description: "Stepped seawall with a wave-return lip, promenade, railings, lights built into the wall, benches and a ladder to the water (modular).",
      size: NAVY_SIZES.seawall_module, foundationDepth: 3, previewFloorY: 5, placementMode: "overlay"
    }
  ],
  bunkers: [
    {
      id: "small_nuclear_bunker", name: "Small Nuclear Bunker",
      description: "Deep compact four-person survival bunker with command post, stores, power, filtration and escape shaft inside an obsidian outer frame.",
      ...bunkerSize(BUNKER_SPECS.small_nuclear_bunker), placementMode: "excavation"
    },
    {
      id: "medium_nuclear_bunker", name: "Medium Nuclear Bunker",
      description: "Deep twelve-person operational bunker with medical, barracks, command, storage, utilities and redundant escape access.",
      ...bunkerSize(BUNKER_SPECS.medium_nuclear_bunker), placementMode: "excavation"
    },
    {
      id: "large_nuclear_bunker", name: "Large Nuclear Bunker",
      description: "Multi-level hardened bunker for roughly thirty occupants with operations, accommodation, medical and engineering floors.",
      ...bunkerSize(BUNKER_SPECS.large_nuclear_bunker), placementMode: "excavation"
    },
    {
      id: "strategic_operations_bunker", name: "Strategic Underground Operations Centre",
      description: "Vast three-level joint command complex with situation room, coordination consoles, servers, medical, accommodation and redundant utilities.",
      ...bunkerSize(BUNKER_SPECS.strategic_operations_bunker), placementMode: "excavation"
    }
  ],
  strategic: [
    {
      id: "small_tactical_radar_post", name: "Small Tactical Radar Post",
      description: "Compact forward radar post with an elevated upward-facing circular array, operations consoles and perimeter lighting.",
      size: STRATEGIC_SIZES.small_tactical_radar_post, foundationDepth: 2
    },
    {
      id: "medium_radar_station", name: "Medium Radar Station",
      description: "Hardened radar station with a large elevated sky-facing array, divided operations floor, servers and service lighting.",
      size: STRATEGIC_SIZES.medium_radar_station, foundationDepth: 2
    },
    {
      id: "large_early_warning_radar_complex", name: "Large Early-Warning Radar Complex",
      description: "Two-level strategic surveillance complex with a massive upward-facing circular early-warning array and support towers.",
      size: STRATEGIC_SIZES.large_early_warning_radar_complex, foundationDepth: 2
    },
    {
      id: "radar_radome_facility", name: "Radar & Radome Facility",
      description: "Geodesic radome on a two-storey equipment building: generators, comms, radar processing and operations rooms, roof deck, fence.",
      size: AIR_SIZES.radar_radome_facility, foundationDepth: 2
    },
    {
      id: "small_communications_dish_station", name: "Small Communications Dish Station",
      description: "Compact communications building carrying a roof-mounted parabolic dish and a furnished control room.",
      size: STRATEGIC_SIZES.small_communications_dish_station, foundationDepth: 2
    },
    {
      id: "medium_satellite_dish_station", name: "Medium Satellite Dish Station",
      description: "Operational satellite ground station with a large dish, divided control floor and communications servers.",
      size: STRATEGIC_SIZES.medium_satellite_dish_station, foundationDepth: 2
    },
    {
      id: "large_strategic_satellite_array", name: "Large Strategic Satellite Array",
      description: "Two-storey joint communications centre supporting one principal dish and two auxiliary tracking dishes.",
      size: STRATEGIC_SIZES.large_strategic_satellite_array, foundationDepth: 2
    },
    {
      id: "standalone_small_satellite_dish", name: "Standalone Small Satellite Dish",
      description: "Small freestanding parabolic communications dish on an illuminated equipment pedestal.",
      size: STRATEGIC_SIZES.standalone_small_satellite_dish, foundationDepth: 2
    },
    {
      id: "standalone_medium_satellite_dish", name: "Standalone Medium Satellite Dish",
      description: "Medium freestanding satellite dish with a reinforced pedestal and corner service lights.",
      size: STRATEGIC_SIZES.standalone_medium_satellite_dish, foundationDepth: 2
    },
    {
      id: "standalone_large_satellite_dish", name: "Standalone Large Satellite Dish",
      description: "Large freestanding strategic dish with a tall pedestal, maintenance ring and illuminated service perimeter.",
      size: STRATEGIC_SIZES.standalone_large_satellite_dish, foundationDepth: 2
    }
  ],
  logistics: [
    {
      id: "logistics_hall", name: "Logistics & Armory Hall",
      description: "High-capacity secure warehouse with tall storage racks, handling lane and inventory control desk.",
      size: FACILITY_SIZES.logistics_hall, foundationDepth: 2
    },
    {
      id: "fuel_tank_farm", name: "Airbase Fuel Tank Farm",
      description: "Two aboveground fuel tanks inside a containment bund, pipe rack, pump house, covered truck fill stand with loading arm and fire monitor.",
      size: AIR_SIZES.fuel_tank_farm, foundationDepth: 2
    }
  ],
  modular: [
  ]
};

export function getCategory(categoryId) {
  return CATEGORIES.find((category) => category.id === categoryId);
}

export function getStructures(categoryId) {
  return STRUCTURES[categoryId] ?? [];
}

export function getStructure(categoryId, structureId) {
  return getStructures(categoryId).find((structure) => structure.id === structureId);
}
