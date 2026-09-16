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
      description: "Compact 8×8 modern security post built entirely from vanilla blocks.",
      size: { x: 8, y: 8, z: 8 }
    },
    {
      id: "main_security_gate",
      name: "Main Security Gate",
      description: "Twin checkpoint buildings with a protected vehicle lane and overhead security gantry.",
      size: { x: 15, y: 7, z: 5 }
    },
    {
      id: "base_headquarters",
      name: "Base Headquarters",
      description: "Two-storey command headquarters with reception, operations core and rooftop communications detail.",
      size: { x: 21, y: 10, z: 17 }
    },
    {
      id: "large_aircraft_hangar",
      name: "Large Aircraft Hangar",
      description: "Large military aircraft hangar with a 23-block-wide open door, maintenance lanes and service bays.",
      size: { x: 31, y: 13, z: 25 }
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
