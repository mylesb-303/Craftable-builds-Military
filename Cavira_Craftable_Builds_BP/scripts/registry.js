export const CATEGORIES = [
  { id: "core", name: "Core Base & HQ", icon: "§7■" },
  { id: "army", name: "Army", icon: "§2★" },
  { id: "air_force", name: "Air Force", icon: "§b✈" },
  { id: "navy", name: "Navy", icon: "§9⚓" },
  { id: "bunkers", name: "Bunkers", icon: "§5⬛" },
  { id: "strategic", name: "Strategic / Joint", icon: "§6◆" },
  { id: "logistics", name: "Logistics & Support", icon: "§e▣" },
  { id: "modular", name: "Modular Base", icon: "§8▦" }
];

export const STRUCTURES = {
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
      size: { x: 27, y: 11, z: 17 }, foundationDepth: 2
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
      size: { x: 23, y: 9, z: 41 }, foundationDepth: 2
    },
    {
      id: "officers_quarters", name: "Officers' Quarters",
      description: "Eight private furnished rooms arranged around a central corridor, based on the smaller reference accommodation.",
      size: { x: 19, y: 10, z: 25 }, foundationDepth: 2
    },
    {
      id: "army_armoury", name: "Army Armoury",
      description: "Reinforced armoury with secure issue counter, racks, ammunition stores, maintenance area and vault.",
      size: { x: 21, y: 10, z: 17 }, foundationDepth: 2
    },
    {
      id: "army_vehicle_depot", name: "Multi-Bay Vehicle Depot",
      description: "Reference-style open-front three-bay depot with servicing pits, tools, stores and marked lanes.",
      size: { x: 29, y: 12, z: 23 }, foundationDepth: 2
    },
    {
      id: "heavy_vehicle_maintenance_hangar", name: "Heavy Vehicle Maintenance Hangar",
      description: "Tall three-portal maintenance hall with inspection pits, red columns and a full-width overhead crane.",
      size: { x: 35, y: 15, z: 27 }, foundationDepth: 2
    },
    {
      id: "army_medical_facility", name: "Army Medical Facility",
      description: "Furnished field medical centre with reception, ward, examination rooms, pharmacy and staff station.",
      size: { x: 23, y: 10, z: 19 }, foundationDepth: 2
    },
    {
      id: "army_command_bunker", name: "Army Command Bunker",
      description: "Low-profile reinforced bunker with operations room, briefing space, communications and secure records.",
      size: { x: 21, y: 8, z: 17 }, foundationDepth: 3
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
      size: { x: 25, y: 10, z: 19 }, foundationDepth: 2
    },
    {
      id: "air_traffic_control_tower", name: "Air Traffic Control Tower",
      description: "Compact furnished ATC tower with access core, operations cab, glazing and roof equipment.",
      size: { x: 13, y: 24, z: 13 }, foundationDepth: 2
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
      size: { x: 27, y: 12, z: 21 }, foundationDepth: 2
    },
    {
      id: "naval_operations_centre", name: "Naval Operations Centre",
      description: "Secure maritime operations, briefing and monitoring facility based on the proven airfield operations layout.",
      size: { x: 25, y: 10, z: 19 }, foundationDepth: 2
    },
    {
      id: "harbour_control_tower", name: "Harbour Control Tower",
      description: "Tall glazed harbour-control cab with access core, navigation consoles and roof equipment.",
      size: { x: 15, y: 26, z: 15 }, foundationDepth: 2
    },
    {
      id: "sailors_barracks", name: "Sailors' Barracks",
      description: "Thirty-two-person naval accommodation hall with privacy bays, service rooms and central aisle.",
      size: { x: 23, y: 9, z: 41 }, foundationDepth: 2
    },
    {
      id: "dockyard_logistics_warehouse", name: "Dockyard Logistics Warehouse",
      description: "High-capacity dockside warehouse with secure racks, handling lane and inventory control.",
      size: { x: 31, y: 12, z: 25 }, foundationDepth: 2
    },
    {
      id: "ship_maintenance_workshop", name: "Ship Maintenance Workshop",
      description: "Tall multi-bay naval engineering hall with service pits, tools and overhead crane.",
      size: { x: 35, y: 15, z: 27 }, foundationDepth: 2
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
      size: { x: 21, y: 10, z: 17 }, foundationDepth: 2
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
      size: { x: 23, y: 20, z: 19 }, foundationDepth: 18, placementMode: "excavation"
    },
    {
      id: "medium_nuclear_bunker", name: "Medium Nuclear Bunker",
      description: "Deep twelve-person operational bunker with medical, barracks, command, storage, utilities and redundant escape access.",
      size: { x: 31, y: 25, z: 25 }, foundationDepth: 23, placementMode: "excavation"
    },
    {
      id: "large_nuclear_bunker", name: "Large Nuclear Bunker",
      description: "Multi-level hardened bunker for roughly thirty occupants with operations, accommodation, medical and engineering floors.",
      size: { x: 41, y: 31, z: 33 }, foundationDepth: 29, placementMode: "excavation"
    },
    {
      id: "strategic_operations_bunker", name: "Strategic Underground Operations Centre",
      description: "Vast three-level joint command complex with situation room, coordination consoles, servers, medical, accommodation and redundant utilities.",
      size: { x: 51, y: 37, z: 41 }, foundationDepth: 35, placementMode: "excavation"
    }
  ],
  strategic: [
    {
      id: "small_tactical_radar_post", name: "Small Tactical Radar Post",
      description: "Compact forward radar post with an elevated upward-facing circular array, operations consoles and perimeter lighting.",
      size: { x: 19, y: 20, z: 19 }, foundationDepth: 2
    },
    {
      id: "medium_radar_station", name: "Medium Radar Station",
      description: "Hardened radar station with a large elevated sky-facing array, divided operations floor, servers and service lighting.",
      size: { x: 31, y: 27, z: 27 }, foundationDepth: 2
    },
    {
      id: "large_early_warning_radar_complex", name: "Large Early-Warning Radar Complex",
      description: "Two-level strategic surveillance complex with a massive upward-facing circular early-warning array and support towers.",
      size: { x: 45, y: 38, z: 39 }, foundationDepth: 2
    },
    {
      id: "radar_radome_facility", name: "Radar & Radome Facility",
      description: "Large stepped operations base with elevated white radome and four strategic-service cylinders.",
      size: { x: 33, y: 22, z: 33 }, foundationDepth: 2
    },
    {
      id: "small_communications_dish_station", name: "Small Communications Dish Station",
      description: "Compact communications building carrying a roof-mounted parabolic dish and a furnished control room.",
      size: { x: 17, y: 20, z: 17 }, foundationDepth: 2
    },
    {
      id: "medium_satellite_dish_station", name: "Medium Satellite Dish Station",
      description: "Operational satellite ground station with a large dish, divided control floor and communications servers.",
      size: { x: 29, y: 30, z: 29 }, foundationDepth: 2
    },
    {
      id: "large_strategic_satellite_array", name: "Large Strategic Satellite Array",
      description: "Two-storey joint communications centre supporting one principal dish and two auxiliary tracking dishes.",
      size: { x: 45, y: 44, z: 45 }, foundationDepth: 2
    },
    {
      id: "standalone_small_satellite_dish", name: "Standalone Small Satellite Dish",
      description: "Small freestanding parabolic communications dish on an illuminated equipment pedestal.",
      size: { x: 13, y: 17, z: 13 }, foundationDepth: 2
    },
    {
      id: "standalone_medium_satellite_dish", name: "Standalone Medium Satellite Dish",
      description: "Medium freestanding satellite dish with a reinforced pedestal and corner service lights.",
      size: { x: 21, y: 23, z: 21 }, foundationDepth: 2
    },
    {
      id: "standalone_large_satellite_dish", name: "Standalone Large Satellite Dish",
      description: "Large freestanding strategic dish with a tall pedestal, maintenance ring and illuminated service perimeter.",
      size: { x: 31, y: 33, z: 31 }, foundationDepth: 2
    }
  ],
  logistics: [
    {
      id: "logistics_hall", name: "Logistics & Armory Hall",
      description: "High-capacity secure warehouse with tall storage racks, handling lane and inventory control desk.",
      size: { x: 31, y: 12, z: 25 }, foundationDepth: 2
    },
    {
      id: "fuel_tank_farm", name: "Airbase Fuel Tank Farm",
      description: "Contained four-tank fuel installation with service gate, warning markers and perimeter lighting.",
      size: { x: 29, y: 14, z: 23 }, foundationDepth: 2
    }
  ],
  modular: [
    {
      id: "runway_threshold", name: "Runway Threshold",
      description: "Wide illuminated runway threshold module with centreline and threshold bars.",
      size: { x: 21, y: 3, z: 21 }, foundationDepth: 1
    },
    {
      id: "runway_straight", name: "Runway Straight",
      description: "Forty-one-block runway extension with centreline and edge lighting.",
      size: { x: 21, y: 3, z: 41 }, foundationDepth: 1
    },
    {
      id: "taxiway_straight", name: "Taxiway Straight",
      description: "Illuminated taxiway module with a continuous yellow centreline.",
      size: { x: 13, y: 3, z: 31 }, foundationDepth: 1
    },
    {
      id: "taxiway_corner", name: "Taxiway Corner",
      description: "Ninety-degree taxiway corner for modular airfield routing.",
      size: { x: 21, y: 3, z: 21 }, foundationDepth: 1
    },
    {
      id: "aircraft_apron", name: "Aircraft Parking Apron",
      description: "Large illuminated fixed-wing apron with three parking guide lanes.",
      size: { x: 31, y: 3, z: 31 }, foundationDepth: 1
    },
    {
      id: "helicopter_apron", name: "Four-Pad Helicopter Apron",
      description: "Large flight-line apron with four illuminated helicopter landing and parking positions.",
      size: { x: 41, y: 3, z: 41 }, foundationDepth: 1
    }
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
