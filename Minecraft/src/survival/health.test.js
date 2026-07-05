import { describe, it, expect } from 'vitest'
import { applyHungerTick, applyStarvationDamage, applyRegeneration } from './health.js'

describe('applyHungerTick', () => {
  it('decreases hunger by 1 per 30 seconds elapsed', () => {
    expect(applyHungerTick(20, 30)).toBe(19)
  })

  it('does not go below 0', () => {
    expect(applyHungerTick(0, 30)).toBe(0)
  })

  it('handles fractional seconds proportionally', () => {
    expect(applyHungerTick(20, 15)).toBeCloseTo(19.5, 5)
  })
})

describe('applyStarvationDamage', () => {
  it('does nothing when hunger is above 0', () => {
    expect(applyStarvationDamage(20, 5, 10)).toBe(20)
  })

  it('reduces health by 1 per 10 seconds when hunger is 0', () => {
    expect(applyStarvationDamage(20, 0, 10)).toBe(19)
  })

  it('does not go below 0', () => {
    expect(applyStarvationDamage(0, 0, 10)).toBe(0)
  })
})

describe('applyRegeneration', () => {
  it('does nothing when hunger is below 18', () => {
    expect(applyRegeneration(10, 17, 8)).toBe(10)
  })

  it('regenerates 1 health per 8 seconds when hunger is 18+', () => {
    expect(applyRegeneration(10, 18, 8)).toBe(11)
  })

  it('does not exceed 20', () => {
    expect(applyRegeneration(20, 20, 8)).toBe(20)
  })
})
