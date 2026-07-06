import { create } from 'zustand'
import { generateTerrain, keyFor } from './terrainGenerator.js'
import { BLOCKS } from '../constants/blocks.js'

export const CHUNK_SIZE = 16

export function chunkKeyFor(x, z) {
  return `${Math.floor(x / CHUNK_SIZE)},${Math.floor(z / CHUNK_SIZE)}`
}

// Chunks whose mesh depends on the block at (x,z): its own chunk, plus the
// adjacent chunk when the block sits on a chunk border (face culling reads
// the neighbor's cells).
function affectedChunkKeys(x, z) {
  const keys = new Set([chunkKeyFor(x, z)])
  const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
  const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
  if (lx === 0) keys.add(chunkKeyFor(x - 1, z))
  if (lx === CHUNK_SIZE - 1) keys.add(chunkKeyFor(x + 1, z))
  if (lz === 0) keys.add(chunkKeyFor(x, z - 1))
  if (lz === CHUNK_SIZE - 1) keys.add(chunkKeyFor(x, z + 1))
  return keys
}

export const useWorldStore = create((set, get) => ({
  seed: 1,
  baseTerrain: generateTerrain(1),
  overrides: new Map(),
  chunkVersions: new Map(),

  getBlock(x, y, z) {
    const key = keyFor(x, y, z)
    const { overrides, baseTerrain } = get()
    if (overrides.has(key)) return overrides.get(key)
    return baseTerrain.get(key) ?? BLOCKS.AIR
  },

  getChunkVersion(chunkKey) {
    return get().chunkVersions.get(chunkKey) ?? 0
  },

  setBlock(x, y, z, blockId) {
    const key = keyFor(x, y, z)
    set((state) => {
      const next = new Map(state.overrides)
      next.set(key, blockId)
      const versions = new Map(state.chunkVersions)
      for (const chunkKey of affectedChunkKeys(x, z)) {
        versions.set(chunkKey, (versions.get(chunkKey) ?? 0) + 1)
      }
      return { overrides: next, chunkVersions: versions }
    })
  },

  removeBlock(x, y, z) {
    get().setBlock(x, y, z, BLOCKS.AIR)
  },

  resetWorld(seed) {
    set({ seed, baseTerrain: generateTerrain(seed), overrides: new Map(), chunkVersions: new Map() })
  },

  loadOverrides(entries) {
    set({ overrides: new Map(entries), chunkVersions: new Map() })
  },

  getOverridesEntries() {
    return Array.from(get().overrides.entries())
  },
}))
