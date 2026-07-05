import { describe, it, expect } from 'vitest'
import { isBelowVoid, VOID_Y_THRESHOLD } from './void.js'

describe('isBelowVoid', () => {
  it('returns false when y is within the normal world height range', () => {
    expect(isBelowVoid(20)).toBe(false)
    expect(isBelowVoid(0)).toBe(false)
  })

  it('returns false exactly at the threshold', () => {
    expect(isBelowVoid(VOID_Y_THRESHOLD)).toBe(false)
  })

  it('returns true when y has fallen below the threshold', () => {
    expect(isBelowVoid(VOID_Y_THRESHOLD - 0.01)).toBe(true)
    expect(isBelowVoid(-100)).toBe(true)
  })
})
