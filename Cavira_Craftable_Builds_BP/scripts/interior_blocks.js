import { BlockPermutation } from "@minecraft/server";

export function getInteriorBlocks() {
  return {
    counter: BlockPermutation.resolve("minecraft:smooth_stone"),
    monitor: BlockPermutation.resolve("minecraft:black_stained_glass_pane"),
    keyboard: BlockPermutation.resolve("minecraft:light_weighted_pressure_plate"),
    console: BlockPermutation.resolve("minecraft:daylight_detector"),
    storage: BlockPermutation.resolve("minecraft:barrel"),
    filing: BlockPermutation.resolve("minecraft:chiseled_bookshelf"),
    server: BlockPermutation.resolve("minecraft:blast_furnace"),
    equipment: BlockPermutation.resolve("minecraft:loom"),
    workbench: BlockPermutation.resolve("minecraft:smithing_table"),
    machine: BlockPermutation.resolve("minecraft:stonecutter_block"),
    locker: BlockPermutation.resolve("minecraft:iron_block"),
    lectern: BlockPermutation.resolve("minecraft:lectern"),
    rail: BlockPermutation.resolve("minecraft:iron_bars")
  };
}
