export const VARIANTS = [
  { id: "standard", name: "Standard", description: "Neutral modern military grey." },
  { id: "grey", name: "Grey", description: "Urban and industrial grey camouflage." },
  { id: "black", name: "Black / Night Ops", description: "Dark low-visibility finish." },
  { id: "arctic", name: "Arctic", description: "Snow and ice camouflage." },
  { id: "plains", name: "Plains", description: "Grassland and temperate field camouflage." },
  { id: "forest", name: "Forest", description: "Temperate woodland camouflage." },
  { id: "jungle", name: "Jungle", description: "Dense green jungle camouflage." },
  { id: "desert", name: "Desert", description: "Sand and dry-biome camouflage." },
  { id: "badlands", name: "Badlands", description: "Red/orange mesa camouflage." },
  { id: "savanna", name: "Savanna", description: "Dry grass and acacia camouflage." },
  { id: "swamp", name: "Swamp / Mangrove", description: "Mud, moss and mangrove camouflage." },
  { id: "taiga", name: "Taiga", description: "Cold conifer forest camouflage." },
  { id: "mountain", name: "Mountain / Stone", description: "Rock and highland camouflage." },
  { id: "cherry", name: "Cherry Grove", description: "Pale stone with muted cherry accents." },
  { id: "coastal", name: "Coastal / Ocean", description: "Dark teal and stone coastal camouflage." },
  { id: "deep_dark", name: "Deep Dark", description: "Deepslate low-light camouflage." },
  { id: "nether", name: "Nether", description: "Blackstone, basalt and dark red camouflage." },
  { id: "end", name: "End", description: "End-stone and muted purpur camouflage." }
];

const PALETTES = {
  standard: {
    floor: "minecraft:smooth_stone",
    frame: "minecraft:polished_andesite",
    wall: "minecraft:light_gray_concrete",
    camoA: "minecraft:gray_concrete",
    camoB: "minecraft:polished_andesite",
    accent: "minecraft:gray_concrete"
  },
  grey: {
    floor: "minecraft:smooth_stone",
    frame: "minecraft:polished_andesite",
    wall: "minecraft:gray_concrete",
    camoA: "minecraft:light_gray_concrete",
    camoB: "minecraft:deepslate_tiles",
    accent: "minecraft:black_concrete"
  },
  black: {
    floor: "minecraft:polished_deepslate",
    frame: "minecraft:polished_blackstone_bricks",
    wall: "minecraft:black_concrete",
    camoA: "minecraft:gray_concrete",
    camoB: "minecraft:deepslate_tiles",
    accent: "minecraft:polished_blackstone"
  },
  arctic: {
    floor: "minecraft:smooth_stone",
    frame: "minecraft:quartz_bricks",
    wall: "minecraft:white_concrete",
    camoA: "minecraft:light_gray_concrete",
    camoB: "minecraft:cyan_terracotta",
    accent: "minecraft:light_gray_concrete"
  },
  plains: {
    floor: "minecraft:stone_bricks",
    frame: "minecraft:polished_andesite",
    wall: "minecraft:green_terracotta",
    camoA: "minecraft:brown_terracotta",
    camoB: "minecraft:moss_block",
    accent: "minecraft:gray_concrete"
  },
  forest: {
    floor: "minecraft:stone_bricks",
    frame: "minecraft:dark_oak_planks",
    wall: "minecraft:green_terracotta",
    camoA: "minecraft:brown_terracotta",
    camoB: "minecraft:dark_oak_planks",
    accent: "minecraft:gray_concrete"
  },
  jungle: {
    floor: "minecraft:mud_bricks",
    frame: "minecraft:dark_oak_planks",
    wall: "minecraft:green_terracotta",
    camoA: "minecraft:moss_block",
    camoB: "minecraft:mud_bricks",
    accent: "minecraft:dark_oak_planks"
  },
  desert: {
    floor: "minecraft:smooth_sandstone",
    frame: "minecraft:cut_sandstone",
    wall: "minecraft:sandstone",
    camoA: "minecraft:smooth_sandstone",
    camoB: "minecraft:light_gray_terracotta",
    accent: "minecraft:brown_terracotta"
  },
  badlands: {
    floor: "minecraft:terracotta",
    frame: "minecraft:brown_terracotta",
    wall: "minecraft:orange_terracotta",
    camoA: "minecraft:red_terracotta",
    camoB: "minecraft:yellow_terracotta",
    accent: "minecraft:brown_terracotta"
  },
  savanna: {
    floor: "minecraft:stone_bricks",
    frame: "minecraft:acacia_planks",
    wall: "minecraft:yellow_terracotta",
    camoA: "minecraft:brown_terracotta",
    camoB: "minecraft:orange_terracotta",
    accent: "minecraft:gray_concrete"
  },
  swamp: {
    floor: "minecraft:mud_bricks",
    frame: "minecraft:mangrove_planks",
    wall: "minecraft:green_terracotta",
    camoA: "minecraft:mud_bricks",
    camoB: "minecraft:brown_terracotta",
    accent: "minecraft:dark_prismarine"
  },
  taiga: {
    floor: "minecraft:stone_bricks",
    frame: "minecraft:spruce_planks",
    wall: "minecraft:gray_concrete",
    camoA: "minecraft:spruce_planks",
    camoB: "minecraft:green_terracotta",
    accent: "minecraft:deepslate_tiles"
  },
  mountain: {
    floor: "minecraft:stone_bricks",
    frame: "minecraft:polished_andesite",
    wall: "minecraft:stone",
    camoA: "minecraft:andesite",
    camoB: "minecraft:cobbled_deepslate",
    accent: "minecraft:deepslate_tiles"
  },
  cherry: {
    floor: "minecraft:smooth_stone",
    frame: "minecraft:polished_andesite",
    wall: "minecraft:light_gray_concrete",
    camoA: "minecraft:pink_terracotta",
    camoB: "minecraft:cherry_planks",
    accent: "minecraft:gray_concrete"
  },
  coastal: {
    floor: "minecraft:stone_bricks",
    frame: "minecraft:polished_andesite",
    wall: "minecraft:cyan_concrete",
    camoA: "minecraft:dark_prismarine",
    camoB: "minecraft:gray_concrete",
    accent: "minecraft:deepslate_tiles"
  },
  deep_dark: {
    floor: "minecraft:deepslate_tiles",
    frame: "minecraft:polished_deepslate",
    wall: "minecraft:black_concrete",
    camoA: "minecraft:deepslate_bricks",
    camoB: "minecraft:cyan_terracotta",
    accent: "minecraft:polished_blackstone"
  },
  nether: {
    floor: "minecraft:polished_blackstone_bricks",
    frame: "minecraft:polished_blackstone",
    wall: "minecraft:blackstone",
    camoA: "minecraft:basalt",
    camoB: "minecraft:red_nether_brick",
    accent: "minecraft:polished_blackstone_bricks"
  },
  end: {
    floor: "minecraft:end_bricks",
    frame: "minecraft:purpur_block",
    wall: "minecraft:end_bricks",
    camoA: "minecraft:calcite",
    camoB: "minecraft:purpur_block",
    accent: "minecraft:gray_concrete"
  }
};

const COMMON = {
  glass: "minecraft:tinted_glass",
  light: "minecraft:sea_lantern",
  bars: "minecraft:iron_bars",
  air: "minecraft:air"
};

export function getVariant(variantId) {
  return VARIANTS.find((variant) => variant.id === variantId) ?? VARIANTS[0];
}

export function getPalette(variantId) {
  return { ...PALETTES.standard, ...(PALETTES[variantId] ?? {}), ...COMMON };
}
