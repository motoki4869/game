import { describe, it, expect } from 'vitest'
import { canBreak, computeBreakResult, computePlaceResult, TOOL_TIERS } from './blockActions.js'
import { BLOCKS } from '../constants/blocks.js'

describe('canBreak', () => {
  it('allows breaking blocks with no tier requirement with bare hands', () => {
    expect(canBreak(BLOCKS.DIRT, 'none')).toBe(true)
  })

  it('disallows breaking STONE (minTier wood) with bare hands', () => {
    expect(canBreak(BLOCKS.STONE, 'none')).toBe(false)
  })

  it('allows breaking STONE with a wood tool', () => {
    expect(canBreak(BLOCKS.STONE, 'wood')).toBe(true)
  })

  it('disallows breaking IRON_ORE (minTier stone) with a wood tool', () => {
    expect(canBreak(BLOCKS.IRON_ORE, 'wood')).toBe(false)
  })

  it('allows breaking IRON_ORE with a stone tool', () => {
    expect(canBreak(BLOCKS.IRON_ORE, 'stone')).toBe(true)
  })
})

describe('computeBreakResult', () => {
  it('succeeds and returns the drop when the tool tier is sufficient', () => {
    const result = computeBreakResult(BLOCKS.GRASS, 'none')
    expect(result).toEqual({ success: true, drop: BLOCKS.DIRT })
  })

  it('fails and returns no drop when the tool tier is insufficient', () => {
    const result = computeBreakResult(BLOCKS.STONE, 'none')
    expect(result).toEqual({ success: false, drop: null })
  })

  it('succeeds with null drop for blocks that drop nothing (LEAVES)', () => {
    const result = computeBreakResult(BLOCKS.LEAVES, 'none')
    expect(result).toEqual({ success: true, drop: null })
  })
})

describe('computePlaceResult', () => {
  it('allows placing a block far from the player', () => {
    const result = computePlaceResult({ x: 10, y: 10, z: 10 }, { x: 0, y: 0, z: 0 })
    expect(result.allowed).toBe(true)
  })

  it('disallows placing a block inside the player position', () => {
    const result = computePlaceResult({ x: 5, y: 10, z: 5 }, { x: 5, y: 10, z: 5 })
    expect(result.allowed).toBe(false)
  })

  it('disallows placing at a block cell the player physically occupies even when straddling a grid boundary', () => {
    // PLAYER_WIDTH = 0.6, half-width 0.3. Player z=5.05 spans z in [4.75, 5.35],
    // so it overlaps both the z=4 and z=5 block cells.
    const playerPos = { x: 5, y: 10, z: 5.05 }
    const straddledCell = computePlaceResult({ x: 5, y: 10, z: 4 }, playerPos)
    expect(straddledCell.allowed).toBe(false)
  })
})
