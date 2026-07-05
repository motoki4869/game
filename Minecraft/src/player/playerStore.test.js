import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from './playerStore.js'

describe('playerStore', () => {
  beforeEach(() => {
    usePlayerStore.getState().respawn({ x: 32, y: 20, z: 32 })
  })

  it('starts with full health and hunger after respawn', () => {
    const state = usePlayerStore.getState()
    expect(state.health).toBe(20)
    expect(state.hunger).toBe(20)
    expect(state.isDead).toBe(false)
  })

  it('setPosition updates position', () => {
    usePlayerStore.getState().setPosition({ x: 1, y: 2, z: 3 })
    expect(usePlayerStore.getState().position).toEqual({ x: 1, y: 2, z: 3 })
  })

  it('damage reduces health and clamps at 0, setting isDead', () => {
    usePlayerStore.getState().damage(25)
    const state = usePlayerStore.getState()
    expect(state.health).toBe(0)
    expect(state.isDead).toBe(true)
  })

  it('heal increases health but clamps at 20', () => {
    usePlayerStore.getState().damage(15)
    usePlayerStore.getState().heal(100)
    expect(usePlayerStore.getState().health).toBe(20)
  })

  it('setHunger clamps between 0 and 20', () => {
    usePlayerStore.getState().setHunger(-5)
    expect(usePlayerStore.getState().hunger).toBe(0)
    usePlayerStore.getState().setHunger(50)
    expect(usePlayerStore.getState().hunger).toBe(20)
  })

  it('respawn resets health, hunger, isDead and position', () => {
    usePlayerStore.getState().damage(20)
    expect(usePlayerStore.getState().isDead).toBe(true)
    usePlayerStore.getState().respawn({ x: 0, y: 15, z: 0 })
    const state = usePlayerStore.getState()
    expect(state.isDead).toBe(false)
    expect(state.health).toBe(20)
    expect(state.hunger).toBe(20)
    expect(state.position).toEqual({ x: 0, y: 15, z: 0 })
  })
})
