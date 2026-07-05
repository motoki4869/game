import { create } from 'zustand'

let nextId = 1

export const useMobStore = create((set) => ({
  mobs: [],

  spawnMob(position) {
    set((state) => ({ mobs: [...state.mobs, { id: nextId++, position }] }))
  },

  removeMob(id) {
    set((state) => ({ mobs: state.mobs.filter((m) => m.id !== id) }))
  },

  updateMobPosition(id, position) {
    set((state) => ({
      mobs: state.mobs.map((m) => (m.id === id ? { ...m, position } : m)),
    }))
  },

  setMobs(mobs) {
    set({ mobs })
  },
}))
