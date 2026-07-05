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

  return world
}
