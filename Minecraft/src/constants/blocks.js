export const BLOCKS = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WATER: 5,
  WOOD: 6,
  LEAVES: 7,
  PLANKS: 8,
  COAL_ORE: 9,
  IRON_ORE: 10,
}

export const BLOCK_DATA = {
  [BLOCKS.GRASS]: { name: 'grass', color: '#4caf50', hardness: 1, drops: BLOCKS.DIRT, solid: true, minTier: null },
  [BLOCKS.DIRT]: { name: 'dirt', color: '#8d6e63', hardness: 1, drops: BLOCKS.DIRT, solid: true, minTier: null },
  [BLOCKS.STONE]: { name: 'stone', color: '#9e9e9e', hardness: 3, drops: BLOCKS.STONE, solid: true, minTier: 'wood' },
  [BLOCKS.SAND]: { name: 'sand', color: '#e0c68c', hardness: 1, drops: BLOCKS.SAND, solid: true, minTier: null },
  [BLOCKS.WATER]: { name: 'water', color: '#2196f3', hardness: 0, drops: null, solid: false, minTier: null },
  [BLOCKS.WOOD]: { name: 'wood', color: '#6d4c31', hardness: 2, drops: BLOCKS.WOOD, solid: true, minTier: null },
  [BLOCKS.LEAVES]: { name: 'leaves', color: '#388e3c', hardness: 0.5, drops: null, solid: true, minTier: null },
  [BLOCKS.PLANKS]: { name: 'planks', color: '#a1887f', hardness: 2, drops: BLOCKS.PLANKS, solid: true, minTier: null },
  [BLOCKS.COAL_ORE]: { name: 'coal_ore', color: '#37474f', hardness: 3, drops: 'coal', solid: true, minTier: 'wood' },
  [BLOCKS.IRON_ORE]: { name: 'iron_ore', color: '#d7ccc8', hardness: 4, drops: 'iron_ore', solid: true, minTier: 'stone' },
}

export function isSolid(blockId) {
  if (blockId === BLOCKS.AIR) return false
  return BLOCK_DATA[blockId]?.solid ?? false
}

export function getDrop(blockId) {
  if (blockId === BLOCKS.AIR) return null
  return BLOCK_DATA[blockId]?.drops ?? null
}
