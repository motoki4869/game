import { describe, it, expect } from 'vitest'
import { matchRecipe } from './craftingRecipes.js'
import { BLOCKS } from '../constants/blocks.js'

function grid(items) {
  const g = new Array(9).fill(null)
  items.forEach((item, i) => { g[i] = item })
  return g
}

describe('matchRecipe', () => {
  it('returns null for an empty grid', () => {
    expect(matchRecipe(grid([]))).toBe(null)
  })

  it('matches 1 wood -> 4 planks regardless of position', () => {
    const result = matchRecipe(grid([BLOCKS.WOOD]))
    expect(result).toEqual({ itemId: BLOCKS.PLANKS, count: 4 })
  })

  it('matches 1 wood placed in a different slot', () => {
    const result = matchRecipe(grid([null, null, null, null, BLOCKS.WOOD]))
    expect(result).toEqual({ itemId: BLOCKS.PLANKS, count: 4 })
  })

  it('matches 2 planks -> 4 sticks', () => {
    const result = matchRecipe(grid([BLOCKS.PLANKS, BLOCKS.PLANKS]))
    expect(result).toEqual({ itemId: 'stick', count: 4 })
  })

  it('matches 3 planks + 2 sticks -> wood_pickaxe', () => {
    const result = matchRecipe(grid([BLOCKS.PLANKS, BLOCKS.PLANKS, BLOCKS.PLANKS, 'stick', 'stick']))
    expect(result).toEqual({ itemId: 'wood_pickaxe', count: 1 })
  })

  it('matches 3 stone + 2 sticks -> stone_pickaxe', () => {
    const result = matchRecipe(grid([BLOCKS.STONE, BLOCKS.STONE, BLOCKS.STONE, 'stick', 'stick']))
    expect(result).toEqual({ itemId: 'stone_pickaxe', count: 1 })
  })

  it('returns null for an unrecognized combination', () => {
    const result = matchRecipe(grid([BLOCKS.DIRT, BLOCKS.SAND]))
    expect(result).toBe(null)
  })

  it('does not match when there are extra unrelated items in the grid', () => {
    const result = matchRecipe(grid([BLOCKS.WOOD, BLOCKS.DIRT]))
    expect(result).toBe(null)
  })
})
