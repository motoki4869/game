import { create } from 'zustand'
import { generateTerrain, keyFor } from './terrainGenerator.js'
import { BLOCKS } from '../constants/blocks.js'

export const useWorldStore = create((set, get) => ({
  seed: 1,
  baseTerrain: generateTerrain(1),
  overrides: new Map(),

  getBlock(x, y, z) {
    const key = keyFor(x, y, z)
    const { overrides, baseTerrain } = get()
    if (overrides.has(key)) return overrides.get(key)
    return baseTerrain.get(key) ?? BLOCKS.AIR
  },

  setBlock(x, y, z, blockId) {
    const key = keyFor(x, y, z)
    set((state) => {
      const next = new Map(state.overrides)
      next.set(key, blockId)
      return { overrides: next }
    })
  },

  removeBlock(x, y, z) {
    get().setBlock(x, y, z, BLOCKS.AIR)
  },

  resetWorld(seed) {
    set({ seed, baseTerrain: generateTerrain(seed), overrides: new Map() })
  },

  loadOverrides(entries) {
    set({ overrides: new Map(entries) })
  },

  getOverridesEntries() {
    return Array.from(get().overrides.entries())
  },
}))
