import { describe, it, expect } from 'vitest'
import { resolveAxisMovement, PLAYER_WIDTH, PLAYER_HEIGHT } from './collision.js'
import { BLOCKS } from '../constants/blocks.js'

function makeGetBlock(solidCoords) {
  const set = new Set(solidCoords.map(([x, y, z]) => `${x},${y},${z}`))
  return (x, y, z) => (set.has(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`) ? BLOCKS.STONE : BLOCKS.AIR)
}

describe('resolveAxisMovement', () => {
  it('moves freely through empty space', () => {
    const getBlock = makeGetBlock([])
    const result = resolveAxisMovement({ x: 0, y: 10, z: 0 }, { x: 1, y: 0, z: 1 }, getBlock)
    expect(result).toEqual({ x: 1, y: 10, z: 1 })
  })

  it('stops X movement when a solid block blocks the path', () => {
    const getBlock = makeGetBlock([[2, 10, 0]])
    const result = resolveAxisMovement({ x: 0.9, y: 10, z: 0 }, { x: 1, y: 0, z: 0 }, getBlock)
    expect(result.x).toBeLessThan(1.9)
  })

  it('stops downward Y movement on solid ground (gravity resolution)', () => {
    const getBlock = makeGetBlock([[0, 5, 0]])
    const result = resolveAxisMovement({ x: 0, y: 6.05, z: 0 }, { x: 0, y: -1, z: 0 }, getBlock)
    expect(result.y).toBeGreaterThanOrEqual(6)
  })

  it('does not move Z when a solid block blocks that axis, but still allows X', () => {
    const getBlock = makeGetBlock([[0, 10, 2]])
    const result = resolveAxisMovement({ x: 0, y: 10, z: 0.9 }, { x: 1, y: 0, z: 1 }, getBlock)
    expect(result.x).toBe(1)
    expect(result.z).toBeLessThan(1.9)
  })
})
