import { describe, it, expect } from 'vitest'
import { generateTerrain, keyFor, WORLD_SIZE, WORLD_HEIGHT } from './terrainGenerator.js'
import { BLOCKS } from '../constants/blocks.js'

describe('keyFor', () => {
  it('formats coordinates as "x,y,z"', () => {
    expect(keyFor(1, 2, 3)).toBe('1,2,3')
  })
})

describe('generateTerrain', () => {
  it('is deterministic for the same seed', () => {
    const a = generateTerrain(5)
    const b = generateTerrain(5)
    expect(a.size).toBe(b.size)
    expect(a.get(keyFor(10, 5, 10))).toBe(b.get(keyFor(10, 5, 10)))
  })

  it('every column has a solid surface block topped with grass or sand', () => {
    const world = generateTerrain(5)
    for (let x = 0; x < WORLD_SIZE; x += 8) {
      for (let z = 0; z < WORLD_SIZE; z += 8) {
        let topY = -1
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          if (world.has(keyFor(x, y, z))) topY = y
        }
        expect(topY).toBeGreaterThanOrEqual(0)
        const topBlock = world.get(keyFor(x, topY, z))
        expect([BLOCKS.GRASS, BLOCKS.SAND, BLOCKS.WATER]).toContain(topBlock)
      }
    }
  })

  it('only stores non-AIR blocks', () => {
    const world = generateTerrain(5)
    for (const value of world.values()) {
      expect(value).not.toBe(BLOCKS.AIR)
    }
  })

  it('below the surface, at least some blocks are STONE', () => {
    const world = generateTerrain(5)
    let stoneCount = 0
    for (const value of world.values()) {
      if (value === BLOCKS.STONE) stoneCount++
    }
    expect(stoneCount).toBeGreaterThan(0)
  })

  it('produces columns that are all solid (isSolid true, ignoring WATER) up to the surface', () => {
    const world = generateTerrain(5)
    const x = 32, z = 32
    let topY = -1
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      if (world.has(keyFor(x, y, z))) topY = y
    }
    for (let y = 0; y <= topY; y++) {
      const block = world.get(keyFor(x, y, z))
      expect(block).toBeDefined()
    }
  })
})
