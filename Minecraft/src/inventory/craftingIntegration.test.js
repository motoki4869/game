import { describe, it, expect, beforeEach } from 'vitest'
import { useInventoryStore, HOTBAR_SIZE, INVENTORY_SIZE } from './inventoryStore.js'
import { matchRecipe } from './craftingRecipes.js'
import { BLOCKS } from '../constants/blocks.js'

function craftFromGrid(grid) {
  const result = matchRecipe(grid)
  if (!result) return null

  const requirements = {}
  for (const item of grid) {
    if (item === null) continue
    requirements[item] = (requirements[item] ?? 0) + 1
  }

  const store = useInventoryStore.getState()
  if (!store.hasItems(requirements)) return null
  store.consumeItems(requirements)
  store.addItem(result.itemId, result.count)
  return result
}

describe('crafting integration (break -> inventory -> craft -> consume)', () => {
  beforeEach(() => {
    useInventoryStore.getState().loadInventoryState({
      hotbar: new Array(HOTBAR_SIZE).fill(null),
      inventory: new Array(INVENTORY_SIZE).fill(null),
      selectedHotbarIndex: 0,
    })
  })

  it('crafts PLANKS from a numeric-itemId WOOD block obtained like a real block break would add it', () => {
    // Simulates what useBlockRaycast.js does on a successful break: addItem(outcome.drop, 1)
    // where outcome.drop is a numeric block id (BLOCKS.WOOD), not a string.
    useInventoryStore.getState().addItem(BLOCKS.WOOD, 1)

    const grid = new Array(9).fill(null)
    grid[0] = BLOCKS.WOOD
    const result = craftFromGrid(grid)

    expect(result).toEqual({ itemId: BLOCKS.PLANKS, count: 4 })

    const state = useInventoryStore.getState()
    // The WOOD must have been consumed (no longer present)
    expect(state.hasItems({ [BLOCKS.WOOD]: 1 })).toBe(false)
    // The PLANKS must have been added
    expect(state.hasItems({ [BLOCKS.PLANKS]: 4 })).toBe(true)
  })

  it('crafts wood_pickaxe from numeric PLANKS plus string stick items', () => {
    useInventoryStore.getState().addItem(BLOCKS.PLANKS, 3)
    useInventoryStore.getState().addItem('stick', 2)

    const grid = new Array(9).fill(null)
    grid[0] = BLOCKS.PLANKS
    grid[1] = BLOCKS.PLANKS
    grid[2] = BLOCKS.PLANKS
    grid[3] = 'stick'
    grid[4] = 'stick'
    const result = craftFromGrid(grid)

    expect(result).toEqual({ itemId: 'wood_pickaxe', count: 1 })

    const state = useInventoryStore.getState()
    expect(state.hasItems({ [BLOCKS.PLANKS]: 1 })).toBe(false)
    expect(state.hasItems({ stick: 1 })).toBe(false)
    expect(state.hasItems({ wood_pickaxe: 1 })).toBe(true)
  })

  it('returns null and does not mutate inventory when materials are insufficient', () => {
    useInventoryStore.getState().addItem(BLOCKS.PLANKS, 1) // need 2 for stick recipe

    const grid = new Array(9).fill(null)
    grid[0] = BLOCKS.PLANKS
    const result = craftFromGrid(grid)

    expect(result).toBe(null)
    const state = useInventoryStore.getState()
    expect(state.hasItems({ [BLOCKS.PLANKS]: 1 })).toBe(true) // untouched
  })
})
