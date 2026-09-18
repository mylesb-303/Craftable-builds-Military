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
  army: [],
  air_force: [],
  navy: [],
  strategic: [],
  logistics: [],
  modular: []
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
