export const CATEGORIES = [
  { id: "core", name: "Core Base", icon: "§7■" },
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
      id: "guard_post",
      name: "Guard Post",
      description: "Compact modern security post with furnished duty interior, lighting and integrated foundation.",
      size: { x: 8, y: 9, z: 8 },
      foundationDepth: 2
    },
    {
      id: "main_security_gate",
      name: "Main Security Gate",
      description: "Large twin-booth vehicle checkpoint with a 13-block driving corridor, pedestrian doors, lighting and high overhead security gantry.",
      size: { x: 25, y: 10, z: 9 },
      foundationDepth: 2
    },
    {
      id: "base_headquarters",
      name: "Base Headquarters",
      description: "Two-storey furnished command headquarters with reception, briefing, operations, communications and office spaces.",
      size: { x: 21, y: 11, z: 17 },
      foundationDepth: 2
    },
    {
      id: "large_aircraft_hangar",
      name: "Large Aircraft Hangar",
      description: "Curved-roof military aircraft hangar with a fully unobstructed 29-block entrance, workshops and illuminated maintenance floor.",
      size: { x: 31, y: 18, z: 25 },
      foundationDepth: 2
    }
  ],
  army: [
    {
      id: "army_barracks",
      name: "Army Barracks",
      description: "Furnished military accommodation block with two bunk rooms, lockers, washrooms, a duty office and communal mess area.",
      size: { x: 25, y: 10, z: 19 },
      foundationDepth: 2
    },
    {
      id: "army_armoury",
      name: "Army Armoury",
      description: "Reinforced military armoury with secure issue counter, equipment racks, ammunition storage, maintenance area and internal vault.",
      size: { x: 21, y: 10, z: 17 },
      foundationDepth: 2
    },
    {
      id: "army_vehicle_depot",
      name: "Army Vehicle Depot",
      description: "Large three-bay vehicle depot with open access, service pits, workshops, equipment stores and illuminated maintenance floor.",
      size: { x: 29, y: 12, z: 23 },
      foundationDepth: 2
    },
    {
      id: "army_medical_facility",
      name: "Army Medical Facility",
      description: "Furnished field medical centre with reception, treatment ward, examination rooms, pharmacy stores and staff station.",
      size: { x: 23, y: 10, z: 19 },
      foundationDepth: 2
    },
    {
      id: "army_command_bunker",
      name: "Army Command Bunker",
      description: "Low-profile reinforced command bunker with operations room, briefing area, communications bank and secure records room.",
      size: { x: 21, y: 8, z: 17 },
      foundationDepth: 3
    },
    {
      id: "army_defensive_checkpoint",
      name: "Defensive Checkpoint",
      description: "Compact hardened checkpoint with vehicle lane, protected inspection booth, overhead barrier and defensive positions.",
      size: { x: 19, y: 9, z: 13 },
      foundationDepth: 2
    },
    {
      id: "army_perimeter_wall",
      name: "Perimeter Wall Module",
      description: "Twenty-one-block modular reinforced perimeter wall with patrol ledge, lighting and protected firing positions.",
      size: { x: 21, y: 8, z: 5 },
      foundationDepth: 2
    }
  ],
  air_force: [
    {
      id: "watch_tower",
      name: "Airbase Watch Tower",
      description: "Sixty-two-block-tall layered airbase watch tower based on the reference build, with ladder shaft, observation cab, stepped roof and beacon.",
      size: { x: 23, y: 64, z: 23 },
      foundationDepth: 2
    }
  ],
  navy: [],
  strategic: [],
  logistics: [],
  modular: [
    {
      id: "runway_threshold",
      name: "Runway Threshold",
      description: "Wide illuminated runway threshold module with edge lighting, centreline and threshold bars.",
      size: { x: 21, y: 3, z: 21 },
      foundationDepth: 1
    },
    {
      id: "runway_straight",
      name: "Runway Straight",
      description: "Forty-one-block runway extension with centreline and edge lighting.",
      size: { x: 21, y: 3, z: 41 },
      foundationDepth: 1
    },
    {
      id: "taxiway_straight",
      name: "Taxiway Straight",
      description: "Illuminated taxiway module with continuous yellow centreline.",
      size: { x: 13, y: 3, z: 31 },
      foundationDepth: 1
    },
    {
      id: "taxiway_corner",
      name: "Taxiway Corner",
      description: "Ninety-degree taxiway corner for modular airfield routing.",
      size: { x: 21, y: 3, z: 21 },
      foundationDepth: 1
    },
    {
      id: "aircraft_apron",
      name: "Aircraft Parking Apron",
      description: "Large illuminated aircraft apron with three parking guide lanes.",
      size: { x: 31, y: 3, z: 31 },
      foundationDepth: 1
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
