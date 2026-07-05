import { describe, it, expect } from 'vitest'
import { BLOCKS, BLOCK_DATA, isSolid, getDrop } from './blocks.js'

describe('blocks', () => {
  it('AIR is 0 and not solid', () => {
    expect(BLOCKS.AIR).toBe(0)
    expect(isSolid(BLOCKS.AIR)).toBe(false)
  })

  it('GRASS is solid and drops DIRT', () => {
    expect(isSolid(BLOCKS.GRASS)).toBe(true)
    expect(getDrop(BLOCKS.GRASS)).toBe(BLOCKS.DIRT)
  })

  it('WATER is not solid and drops nothing', () => {
    expect(isSolid(BLOCKS.WATER)).toBe(false)
    expect(getDrop(BLOCKS.WATER)).toBe(null)
  })

  it('LEAVES is solid but drops nothing', () => {
    expect(isSolid(BLOCKS.LEAVES)).toBe(true)
    expect(getDrop(BLOCKS.LEAVES)).toBe(null)
  })

  it('COAL_ORE drops "coal" item, IRON_ORE drops "iron_ore" item', () => {
    expect(getDrop(BLOCKS.COAL_ORE)).toBe('coal')
    expect(getDrop(BLOCKS.IRON_ORE)).toBe('iron_ore')
  })

  it('every non-AIR block has a BLOCK_DATA entry with a color and hardness', () => {
    for (const [name, id] of Object.entries(BLOCKS)) {
      if (name === 'AIR') continue
      expect(BLOCK_DATA[id]).toBeDefined()
      expect(typeof BLOCK_DATA[id].color).toBe('string')
      expect(typeof BLOCK_DATA[id].hardness).toBe('number')
    }
  })
})
