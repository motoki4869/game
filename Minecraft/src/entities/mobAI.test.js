import { describe, it, expect } from 'vitest'
import { computeMobStep, MOB_SPEED, MOB_AGGRO_RANGE, MOB_ATTACK_RANGE } from './mobAI.js'

describe('computeMobStep', () => {
  it('does not move when the player is outside aggro range', () => {
    const mob = { position: { x: 0, y: 10, z: 0 } }
    const result = computeMobStep(mob, { x: MOB_AGGRO_RANGE + 5, y: 10, z: 0 }, 1)
    expect(result.position).toEqual({ x: 0, y: 10, z: 0 })
    expect(result.isAttacking).toBe(false)
  })

  it('moves toward the player when within aggro range', () => {
    const mob = { position: { x: 0, y: 10, z: 0 } }
    const result = computeMobStep(mob, { x: 5, y: 10, z: 0 }, 1)
    expect(result.position.x).toBeGreaterThan(0)
    expect(result.position.x).toBeLessThanOrEqual(MOB_SPEED)
  })

  it('does not overshoot the player position', () => {
    const mob = { position: { x: 0, y: 10, z: 0 } }
    const result = computeMobStep(mob, { x: 0.5, y: 10, z: 0 }, 10)
    expect(result.position.x).toBeCloseTo(0.5, 5)
  })

  it('reports isAttacking true when within attack range after moving', () => {
    const mob = { position: { x: 0, y: 10, z: 0 } }
    const result = computeMobStep(mob, { x: MOB_ATTACK_RANGE - 0.1, y: 10, z: 0 }, 5)
    expect(result.isAttacking).toBe(true)
  })
})
