import { createNoise2D } from './noise.js'
import { BLOCKS } from '../constants/blocks.js'

export const WORLD_SIZE = 64
export const WORLD_HEIGHT = 32
const SEA_LEVEL = 10
const BASE_HEIGHT = 12
const HEIGHT_VARIANCE = 6

export function keyFor(x, y, z) {
  return `${x},${y},${z}`
}

export function generateTerrain(seed = 0) {
  const noise = createNoise2D(seed)
  const oreNoise = createNoise2D(seed + 1000)
  const world = new Map()

  for (let x = 0; x < WORLD_SIZE; x++) {
    for (let z = 0; z < WORLD_SIZE; z++) {
      const n = noise(x / 16, z / 16)
      const height = Math.round(BASE_HEIGHT + n * HEIGHT_VARIANCE)

      for (let y = 0; y <= height; y++) {
        let block
        if (y === height) {
          block = height <= SEA_LEVEL ? BLOCKS.SAND : BLOCKS.GRASS
        } else if (y >= height - 3) {
          block = BLOCKS.DIRT
        } else {
          const oreVal = oreNoise(x / 4, (y * 3 + z) / 4)
          if (oreVal > 0.7) block = BLOCKS.IRON_ORE
          else if (oreVal > 0.45) block = BLOCKS.COAL_ORE
          else block = BLOCKS.STONE
        }
        world.set(keyFor(x, y, z), block)
      }

      if (height < SEA_LEVEL) {
        for (let y = height + 1; y <= SEA_LEVEL; y++) {
          world.set(keyFor(x, y, z), BLOCKS.WATER)
        }
      }
    }
  }

  plantTrees(world, seed)

  return world
}

// Deterministic per-cell hash for tree placement (independent of noise so
// density is easy to tune).
function treeChance(x, z, seed) {
  let h = (x * 73856093) ^ (z * 19349663) ^ (seed * 83492791)
  h = (h ^ (h >>> 13)) * 1274126177
  h = h ^ (h >>> 16)
  return (((h % 1000) + 1000) % 1000) / 1000
}

const TRUNK_HEIGHT = 4
const TREE_DENSITY = 0.02

function plantTrees(world, seed) {
  const margin = 2
  for (let x = margin; x < WORLD_SIZE - margin; x++) {
    for (let z = margin; z < WORLD_SIZE - margin; z++) {
      if (treeChance(x, z, seed) >= TREE_DENSITY) continue

      let surfaceY = -1
      for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
        const block = world.get(keyFor(x, y, z))
        if (block !== undefined && block !== BLOCKS.WATER) {
          surfaceY = y
          break
        }
      }
      if (surfaceY < 0) continue
      if (world.get(keyFor(x, surfaceY, z)) !== BLOCKS.GRASS) continue
      if (surfaceY + TRUNK_HEIGHT + 2 >= WORLD_HEIGHT) continue
      // Skip if another tree's trunk/canopy already occupies the trunk space
      if (world.has(keyFor(x, surfaceY + 1, z))) continue

      for (let dy = 1; dy <= TRUNK_HEIGHT; dy++) {
        world.set(keyFor(x, surfaceY + dy, z), BLOCKS.WOOD)
      }

      const canopyBase = surfaceY + TRUNK_HEIGHT - 1
      for (let dy = 0; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            const key = keyFor(x + dx, canopyBase + dy, z + dz)
            if (!world.has(key)) world.set(key, BLOCKS.LEAVES)
          }
        }
      }
      const topY = surfaceY + TRUNK_HEIGHT + 1
      for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const key = keyFor(x + dx, topY, z + dz)
        if (!world.has(key)) world.set(key, BLOCKS.LEAVES)
      }
    }
  }
}
