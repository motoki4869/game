import { describe, it, expect } from 'vitest'
import { advanceTime, isNight, lightIntensityFor, DAY_LENGTH_SECONDS } from './dayNight.js'

describe('advanceTime', () => {
  it('adds elapsed seconds', () => {
    expect(advanceTime(0, 10)).toBe(10)
  })

  it('wraps around at DAY_LENGTH_SECONDS', () => {
    expect(advanceTime(DAY_LENGTH_SECONDS - 5, 10)).toBe(5)
  })
})

describe('isNight', () => {
  it('is false at the start of the day', () => {
    expect(isNight(0)).toBe(false)
  })

  it('is false just before the night threshold (60%)', () => {
    expect(isNight(DAY_LENGTH_SECONDS * 0.6 - 1)).toBe(false)
  })

  it('is true at and after the night threshold (60%)', () => {
    expect(isNight(DAY_LENGTH_SECONDS * 0.6)).toBe(true)
    expect(isNight(DAY_LENGTH_SECONDS * 0.9)).toBe(true)
  })
})

describe('lightIntensityFor', () => {
  it('is at its maximum (1) at midday', () => {
    expect(lightIntensityFor(DAY_LENGTH_SECONDS / 2)).toBeCloseTo(1, 1)
  })

  it('is at its minimum (0.15) at midnight (time 0)', () => {
    expect(lightIntensityFor(0)).toBeCloseTo(0.15, 1)
  })

  it('stays within [0.15, 1] across the full cycle', () => {
    for (let t = 0; t < DAY_LENGTH_SECONDS; t += 13) {
      const v = lightIntensityFor(t)
      expect(v).toBeGreaterThanOrEqual(0.15)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})
