import { describe, it, expect } from 'vitest'
import { computeVisibleFaces } from './chunkMesh.js'
import { BLOCKS } from '../constants/blocks.js'

describe('computeVisibleFaces', () => {
  it('returns no faces for an entirely empty region', () => {
    const getBlock = () => BLOCKS.AIR
    const faces = computeVisibleFaces({ minX: 0, maxX: 2, minY: 0, maxY: 2, minZ: 0, maxZ: 2 }, getBlock)
    expect(faces).toEqual([])
  })

  it('returns 6 faces for a single isolated solid block', () => {
    const getBlock = (x, y, z) => (x === 1 && y === 1 && z === 1 ? BLOCKS.STONE : BLOCKS.AIR)
    const faces = computeVisibleFaces({ minX: 0, maxX: 2, minY: 0, maxY: 2, minZ: 0, maxZ: 2 }, getBlock)
    expect(faces.length).toBe(6)
    const directions = faces.map((f) => f.direction).sort()
    expect(directions).toEqual(['+x', '+y', '+z', '-x', '-y', '-z'])
  })

  it('hides the shared face between two adjacent solid blocks', () => {
    const getBlock = (x, y, z) => ((x === 1 || x === 2) && y === 1 && z === 1 ? BLOCKS.STONE : BLOCKS.AIR)
    const faces = computeVisibleFaces({ minX: 0, maxX: 3, minY: 0, maxY: 2, minZ: 0, maxZ: 2 }, getBlock)
    const blockAtOneFaces = faces.filter((f) => f.x === 1 && f.y === 1 && f.z === 1)
    const plusXFace = blockAtOneFaces.find((f) => f.direction === '+x')
    expect(plusXFace).toBeUndefined()
  })

  it('includes blockId on each face', () => {
    const getBlock = (x, y, z) => (x === 1 && y === 1 && z === 1 ? BLOCKS.GRASS : BLOCKS.AIR)
    const faces = computeVisibleFaces({ minX: 0, maxX: 2, minY: 0, maxY: 2, minZ: 0, maxZ: 2 }, getBlock)
    expect(faces.every((f) => f.blockId === BLOCKS.GRASS)).toBe(true)
  })

  it('does not produce faces for non-solid blocks like WATER', () => {
    const getBlock = (x, y, z) => (x === 1 && y === 1 && z === 1 ? BLOCKS.WATER : BLOCKS.AIR)
    const faces = computeVisibleFaces({ minX: 0, maxX: 2, minY: 0, maxY: 2, minZ: 0, maxZ: 2 }, getBlock)
    expect(faces).toEqual([])
  })
})
