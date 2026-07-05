import { create } from 'zustand'

const MAX_HEALTH = 20
const MAX_HUNGER = 20

export const DEFAULT_SPAWN_POSITION = { x: 32, y: 20, z: 32 }

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export const usePlayerStore = create((set, get) => ({
  position: DEFAULT_SPAWN_POSITION,
  yaw: 0,
  pitch: 0,
  velocityY: 0,
  health: MAX_HEALTH,
  hunger: MAX_HUNGER,
  isDead: false,

  setPosition(position) {
    set({ position })
  },

  setLook(yaw, pitch) {
    set({ yaw, pitch })
  },

  setVelocityY(v) {
    set({ velocityY: v })
  },

  damage(amount) {
    const health = clamp(get().health - amount, 0, MAX_HEALTH)
    set({ health, isDead: health <= 0 })
  },

  heal(amount) {
    set({ health: clamp(get().health + amount, 0, MAX_HEALTH) })
  },

  setHunger(value) {
    set({ hunger: clamp(value, 0, MAX_HUNGER) })
  },

  respawn(spawnPos) {
    set({
      position: spawnPos,
      velocityY: 0,
      health: MAX_HEALTH,
      hunger: MAX_HUNGER,
      isDead: false,
    })
  },
}))
