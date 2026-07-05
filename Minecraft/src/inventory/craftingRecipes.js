import { BLOCKS } from '../constants/blocks.js'

export const RECIPES = [
  { id: 'planks', inputs: { [BLOCKS.WOOD]: 1 }, output: { itemId: BLOCKS.PLANKS, count: 4 } },
  { id: 'stick', inputs: { [BLOCKS.PLANKS]: 2 }, output: { itemId: 'stick', count: 4 } },
  { id: 'wood_pickaxe', inputs: { [BLOCKS.PLANKS]: 3, stick: 2 }, output: { itemId: 'wood_pickaxe', count: 1 } },
  { id: 'wood_axe', inputs: { [BLOCKS.PLANKS]: 3, stick: 2 }, output: { itemId: 'wood_axe', count: 1 } },
  { id: 'stone_pickaxe', inputs: { [BLOCKS.STONE]: 3, stick: 2 }, output: { itemId: 'stone_pickaxe', count: 1 } },
  { id: 'stone_axe', inputs: { [BLOCKS.STONE]: 3, stick: 2 }, output: { itemId: 'stone_axe', count: 1 } },
]

function countItems(grid) {
  const counts = {}
  for (const item of grid) {
    if (item === null || item === undefined) continue
    counts[item] = (counts[item] ?? 0) + 1
  }
  return counts
}

function countsEqual(a, b) {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  return keysA.every((key) => a[key] === b[key])
}

export function matchRecipe(grid) {
  const counts = countItems(grid)
  if (Object.keys(counts).length === 0) return null

  for (const recipe of RECIPES) {
    if (countsEqual(counts, recipe.inputs)) {
      return { ...recipe.output }
    }
  }
  return null
}

// Note: `wood_axe` and `wood_pickaxe` (and the stone equivalents) share identical `inputs`, so in practice only the first-declared recipe (`wood_pickaxe` / `stone_pickaxe`) will ever match via `matchRecipe`. This is a known MVP simplification (no distinct shapes) — the axe recipes are kept for documentation of intended items but are effectively unreachable through crafting. This is acceptable because the design's crafting UI (Task 20) will only expose the pickaxe recipes as craftable via a simple recipe-list button rather than free-form grid placement, and axes are not required by the survival loop (nothing in the spec depends on wood/stone axes: chopping trees works with bare hands like any other block per `blockActions.js`).
