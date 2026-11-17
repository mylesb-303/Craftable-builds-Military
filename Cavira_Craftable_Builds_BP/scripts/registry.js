import { FACILITY_SIZES } from "./structures/facilities.js";
import { AIRFIELD_SIZES, AIRFIELD_SNAP } from "./structures/airfield.js";
import { FULL_RUNWAY_SIZES, FULL_RUNWAY_SNAP } from "./structures/full_runways.js";
import { SUPER_HANGAR_SIZE } from "./structures/super_hangar.js";
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
      id: "helicopter_apron", name: "Four-Pad Helicopter Apron",
      description: "Large flight-line apron with four illuminated helicopter landing and parking positions.",
      size: { x: 41, y: 3, z: 41 }, foundationDepth: 1
    }
  ],
  core: [
    {
      id: "guard_post", name: "Guard Post",
      description: "Compact furnished security post with lighting and integrated foundation.",
      size: { x: 8, y: 9, z: 8 }, foundationDepth: 2
    },
    {
      id: "main_security_gate", name: "Main Security Gate",
      description: "Twin-booth vehicle checkpoint with a wide driving corridor, pedestrian access and overhead gantry.",
      size: { x: 25, y: 10, z: 9 }, foundationDepth: 2
    },
    {
      id: "base_headquarters", name: "Base Headquarters",
      description: "Furnished two-storey standalone command headquarters with reception, briefing and operations rooms.",
      size: { x: 21, y: 11, z: 17 }, foundationDepth: 2
    },
    {
      id: "hq_administration_wing", name: "HQ Administration Wing",
      description: "Formal two-storey office wing with colonnaded frontage, shared offices and monitoring stations.",
      size: FACILITY_SIZES.hq_administration_wing, foundationDepth: 2
    },
    {
      id: "hq_command_rotunda", name: "HQ Command Rotunda",
      description: "Circular command centre inspired by the reference headquarters campus, with a full operations floor.",
      size: { x: 25, y: 14, z: 25 }, foundationDepth: 2
    },
    {
      id: "ceremonial_fountain_plaza", name: "Ceremonial Fountain Plaza",
      description: "Formal headquarters approach plaza with circular illuminated fountain and perimeter lighting.",
      size: { x: 31, y: 6, z: 31 }, foundationDepth: 2
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
      description: "Tall three-portal maintenance hall with inspection pits, red columns and a full-width overhead crane.",
      size: { x: 35, y: 15, z: 27 }, foundationDepth: 2
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
      description: "Compact hardened checkpoint with vehicle lane, inspection booths, barrier and defensive positions.",
      size: { x: 19, y: 9, z: 13 }, foundationDepth: 2
    },
    {
      id: "army_perimeter_wall", name: "Perimeter Wall Module",
      description: "Repeatable reinforced perimeter section with patrol ledge, lighting and protected firing positions.",
      size: { x: 21, y: 8, z: 5 }, foundationDepth: 2
    }
  ],
  air_force: [
    {
      id: "super_heavy_aircraft_hangar", name: "Super-Heavy Aircraft Hangar",
      description: "81 × 101 × 37 strategic bomber hangar with arched roof, 65-wide door, two-storey maintenance bays, raised control room and apron. Fits a B-52 or B-2.",
      size: SUPER_HANGAR_SIZE, foundationDepth: 2
    },
    {
      id: "large_aircraft_hangar", name: "Heavy Aircraft Hangar",
      description: "Large curved-roof hangar with a 29-block clear entrance, workshops and parking clearance for Airforce aircraft.",
      size: { x: 31, y: 18, z: 25 }, foundationDepth: 2
    },
    {
      id: "hardened_fighter_shelter", name: "Hardened Fighter Shelter",
      description: "Single arched aircraft shelter with protected walls, maintenance points and illuminated guide line.",
      size: { x: 21, y: 12, z: 25 }, foundationDepth: 2
    },
    {
      id: "fighter_shelter_row", name: "Three-Shelter Fighter Row",
      description: "Connected row of three hardened fighter shelters sized for current and future aircraft entities.",
      size: { x: 49, y: 12, z: 25 }, foundationDepth: 2
    },
    {
      id: "helicopter_hangar", name: "Helicopter Hangar",
      description: "Long glass-fronted three-bay hangar with generous rotor clearance, guide lines and service stores.",
      size: { x: 41, y: 14, z: 27 }, foundationDepth: 2
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
      description: "Tall layered reference watchtower with ladder shaft, observation cab, stepped roof and beacon.",
      size: { x: 23, y: 64, z: 23 }, foundationDepth: 2
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
      description: "Water-preserving straight pier with deep supports, navigation lighting and mooring points.",
      size: { x: 15, y: 7, z: 31 }, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "pier_corner", name: "Pier Corner",
      description: "Water-preserving ninety-degree pier corner for modular harbour routing.",
      size: { x: 21, y: 7, z: 21 }, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "pier_t_junction", name: "Pier T-Junction",
      description: "Water-preserving T-shaped pier junction joining three modular dock directions.",
      size: { x: 31, y: 7, z: 21 }, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "heavy_ship_berth", name: "Heavy Ship Berth",
      description: "Wide protected berth for large naval vessels with twin service walks and heavy fenders.",
      size: { x: 21, y: 8, z: 41 }, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "submarine_service_berth", name: "Submarine Service Berth",
      description: "Extra-wide submarine water-channel berth with twin service walks and engineering stations.",
      size: { x: 31, y: 8, z: 41 }, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "naval_fueling_pier", name: "Naval Fueling Pier",
      description: "Reinforced fueling pier with protected pumping stations and marked service trunk.",
      size: { x: 17, y: 9, z: 31 }, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "dry_dock_side", name: "Dry-Dock Side Module",
      description: "Repeatable hardened dry-dock wall and illuminated upper service deck.",
      size: { x: 11, y: 12, z: 41 }, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "dry_dock_gate_end", name: "Dry-Dock Gate & End",
      description: "Heavy modular dry-dock closure with side piers, gate structure and service gantry.",
      size: { x: 31, y: 12, z: 13 }, foundationDepth: 3, previewFloorY: 8, placementMode: "overlay"
    },
    {
      id: "nuclear_submarine_pen", name: "Nuclear Submarine Pen",
      description: "Extra-wide covered submarine water channel with a high hardened arch and protected engineering walks.",
      size: { x: 39, y: 24, z: 45 }, foundationDepth: 3, previewFloorY: 4, placementMode: "overlay"
    },
    {
      id: "dockside_loading_crane", name: "Dockside Loading Crane",
      description: "Tall portal crane with working deck, trolley beam, suspended hook and warning lighting.",
      size: { x: 15, y: 26, z: 17 }, foundationDepth: 2
    },
    {
      id: "naval_ammunition_bunker", name: "Naval Ammunition Bunker",
      description: "Reinforced naval magazine with secure issue point, storage racks, maintenance area and vault.",
      size: FACILITY_SIZES.naval_ammunition_bunker, foundationDepth: 2
    },
    {
      id: "coastal_defence_bunker", name: "Coastal Defence Bunker",
      description: "Hardened coastal observation and defence post with protected stations and command room.",
      size: { x: 25, y: 10, z: 19 }, foundationDepth: 2
    },
    {
      id: "seawall_module", name: "Seawall Module",
      description: "Repeatable deep-founded harbour wall with service walk and navigation lights.",
      size: { x: 21, y: 9, z: 7 }, foundationDepth: 3, previewFloorY: 5, placementMode: "overlay"
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
      description: "Large stepped operations base with elevated white radome and four strategic-service cylinders.",
      size: { x: 33, y: 22, z: 33 }, foundationDepth: 2
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
      description: "Contained four-tank fuel installation with service gate, warning markers and perimeter lighting.",
      size: { x: 29, y: 14, z: 23 }, foundationDepth: 2
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
