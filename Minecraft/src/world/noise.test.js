import { describe, it, expect } from 'vitest'
import { createNoise2D } from './noise.js'

describe('createNoise2D', () => {
  it('returns a function', () => {
    const noise = createNoise2D(1)
    expect(typeof noise).toBe('function')
  })

  it('is deterministic for the same seed and coordinates', () => {
    const a = createNoise2D(42)
    const b = createNoise2D(42)
    expect(a(3.5, 7.2)).toBeCloseTo(b(3.5, 7.2), 10)
  })

  it('differs for different seeds', () => {
    const a = createNoise2D(1)(3.5, 7.2)
    const b = createNoise2D(2)(3.5, 7.2)
    expect(a).not.toBeCloseTo(b, 5)
  })

  it('stays within [-1, 1] across a sample grid', () => {
    const noise = createNoise2D(7)
    for (let x = 0; x < 20; x += 0.37) {
      for (let y = 0; y < 20; y += 0.53) {
        const v = noise(x, y)
        expect(v).toBeGreaterThanOrEqual(-1)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
  })
})
