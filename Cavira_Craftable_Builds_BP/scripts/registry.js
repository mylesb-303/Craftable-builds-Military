export const CATEGORIES = [
  { id: "core", name: "Core Base & HQ", icon: "§7■" },
  { id: "army", name: "Army", icon: "§2★" },
  { id: "air_force", name: "Air Force", icon: "§b✈" },
  { id: "navy", name: "Navy", icon: "§9⚓" },
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
  navy: [],
  strategic: [
    {
      id: "radar_radome_facility", name: "Radar & Radome Facility",
      description: "Large stepped operations base with elevated white radome and four strategic-service cylinders.",
      size: { x: 33, y: 22, z: 33 }, foundationDepth: 2
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
